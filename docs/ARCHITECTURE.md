# 아키텍처

이 문서는 authgate-account의 런타임 구조를 설명합니다. 스코프와 금지 항목은 [`PURPOSE.md`](PURPOSE.md)를 참조하세요. 여기서는 동작 방식만 다룹니다.

## 한 줄 요약

authgate 앞단의 **BFF(Backend-for-Frontend)** 역할을 하는 Next.js App Router 앱.

- 토큰은 절대 서버 밖으로 나가지 않습니다. 브라우저는 iron-session HttpOnly 쿠키(`aa_session`)만 봅니다.
- 브라우저가 호출하는 API는 이 앱 자체 origin의 `/api/auth/*`와 `/api/account/*`뿐입니다. 브라우저는 authgate를 직접 호출하지 않습니다.
- 인증은 OIDC Authorization Code + PKCE. `id_token`은 authgate JWKS(`/keys`)로 검증합니다.
- `/account`는 초기 데이터를 SSR로 내려주고, 탭은 mount 시점과 mutation 후에 BFF로 재요청합니다.

## 컴포넌트 맵

```
browser ──► /api/auth/login        (302 → authgate/authorize)
            /api/auth/callback     (code → exchange → JWKS verify → iron-session 저장)
            /api/auth/logout       (authgate에서 RT revoke, 세션 파기)

browser ──► /account               (SSR: getSession + getAccountData 병렬)
browser ──► /api/account/*         (CSR: BFF → authgateFetch → authgate /console/me/*)

middleware: proxy.ts               (matcher /account/:path* — session.sub 없으면 / 로 redirect)
```

서버 전용 파일: `lib/auth/*`, `lib/api/authgate-client.ts`, 모든 `app/api/**`, 모든 `_queries/**`.
클라이언트 전용 파일: `app/account/_components/*` 아래 `"use client"` 붙은 것들.

## 쿠키

| 쿠키 | 수명 | 설정 위치 | 용도 |
|---|---|---|---|
| `aa_session` | iron-session 기본값 | `app/api/auth/callback/route.ts:57` | 암호화된 세션: `sub`, `email`, `name`, `accessToken`, `refreshToken` |
| `pkce_verifier` | 5분 | `app/api/auth/login/route.ts:12` | 시도별 PKCE 시크릿, callback에서 삭제 |
| `pkce_state` | 5분 | `app/api/auth/login/route.ts:19` | CSRF용 state, callback에서 비교 |

전부 HttpOnly, `sameSite=lax`, 프로덕션에선 `secure`.

## Login → callback 흐름

```
GET /api/auth/login                                 [app/api/auth/login/route.ts]
  ├─ pkce.ts: verifier (32B), challenge (S256), state (16B)
  ├─ pkce_verifier + pkce_state 쿠키 set (5분)
  └─ 302 → ${ISSUER}/authorize?
            client_id, response_type=code, redirect_uri,
            scope="openid profile email offline_access",
            code_challenge, code_challenge_method=S256, state

GET /api/auth/callback?code&state                   [app/api/auth/callback/route.ts]
  ├─ ?error 있으면        → / ?error=…
  ├─ !code | !state       → / ?error=missing_params
  ├─ state ≠ stored       → / ?error=state_mismatch
  ├─ pkce 쿠키 삭제
  ├─ exchangeCode(code, verifier)                   [lib/auth/oidc.ts:16]
  │     POST ${ISSUER}/oauth/token  grant_type=authorization_code
  ├─ verifyIdToken(id_token)                        [lib/auth/oidc.ts:37]
  │     ${ISSUER}/keys로 jose.jwtVerify, audience = client_id
  ├─ fetchUserinfo(access_token)                    [lib/auth/oidc.ts:49]
  │     authgate가 IDTokenUserinfoClaimsAssertion=false라
  │     id_token에 email/name이 없음 → /userinfo에서 가져옴.
  ├─ iron-session 저장 { sub, email, name, accessToken, refreshToken }
  └─ 302 → /account                                 (req.url 아니라 config.appUrl 사용)
```

## /account 렌더 흐름

```
GET /account                                        [app/account/page.tsx]
  ├─ getSession()                                   [lib/auth/session.ts]
  ├─ !session.sub → redirect("/")
  ├─ getAccountData(session)                        [app/account/_queries/get-account-data.ts]
  │     병렬: GET /console/me/connections, GET /console/me/audit-log?page=1&limit=20
  │     둘 중 하나라도 401 → redirect("/")
  └─ <AccountTabs initial={...} />                  client component, 기본 탭 = "services"

(client) 탭이 mount + mutation 후 fetch        [_components/connected-apps.tsx, recent-activity.tsx]
  GET /api/account/connections                     [app/api/account/connections/route.ts]
  GET /api/account/audit-log                       [app/api/account/audit-log/route.ts]
    ├─ requireUser() → 세션 없으면 401              [lib/auth/require-user.ts]
    └─ authgateClient.* → authgateFetch(...)
```

## 토큰 갱신

```
authgateFetch(path, session, init)                  [lib/auth/authgate.ts]
  ├─ ${ISSUER}${path}로 fetch, Bearer = session.accessToken
  ├─ 401 아니면 → 그대로 반환
  ├─ refreshAccessToken(session)
  │     POST /oauth/token grant_type=refresh_token, client_id, refresh_token
  │     ok면 → session.accessToken 교체, save()
  ├─ ok면 → 새 access token으로 1회 재시도
  └─ refresh 실패 → session.destroy() 후 원래 401 반환
```

페이지 핸들러(`get-account-data.ts`)와 API 라우트 모두 401을 "로 redirect"로 처리하기 때문에, 세션이 destroy된 직후 다음 요청은 항상 로그인 페이지로 떨어집니다.

## 로그아웃

```
POST /api/auth/logout                               [app/api/auth/logout/route.ts]
  ├─ session.refreshToken 있으면 → POST ${ISSUER}/oauth/revoke (best-effort, .catch로 무시)
  ├─ session.destroy()
  └─ 302 → /
```

best-effort revoke이기 때문에 authgate가 일시적으로 죽어도 사용자가 "로그아웃 못 하는" 루프에 갇히지 않습니다.

## 미들웨어

`proxy.ts` (Next 16 컨벤션상 `middleware.ts`가 아니라 `proxy.ts`):

```
matcher: /account/:path*
  aa_session 읽기
  !session.sub → 302 ${APP_URL}/
  아니면 next()
```

Edge 런타임에서는 `next/headers`의 `cookies()`를 못 쓰기 때문에, `proxy.ts`는 `getIronSession(req, res, options)`를 직접 구성합니다. 세션 옵션 필드(쿠키 이름, 패스워드, 옵션)가 `lib/auth/session.ts`와 중복되니 둘을 함께 유지하세요.

## env 설정 (`lib/env.ts`)

`config.authgate`와 `config.session`은 **lazy getter**로, 첫 접근 시 `Missing env var: X`를 던집니다. 이 덕분에 환경변수 없이 `next build`가 통과합니다(빌드 시점 import는 getter를 트리거하지 않음). 요청 시점에 실행되는 코드는 필수 env가 빠지면 즉시 throw — fail-fast가 의도입니다.

`config.appUrl`은 `http://localhost:3000` 폴백을 가진 eager getter로, 서버가 발급하는 모든 redirect에서 씁니다.

## Reference-consumer 매핑

PURPOSE.md는 authgate-account의 두 번째 목적이 "authgate가 client에 기대하는 계약을 코드로 보여주는 것"이라고 못박습니다. MUST 항목별 위치:

| MUST 보여줘야 할 것 | 위치 |
|---|---|
| Authorization Code + PKCE | `lib/auth/pkce.ts`, `app/api/auth/login/route.ts` |
| 서버사이드 BFF, HttpOnly 쿠키에만 토큰 보관 | `lib/auth/session.ts`, `proxy.ts` |
| `id_token` JWKS 검증 (RS256) | `lib/auth/oidc.ts:37` (`createRemoteJWKSet` + `jwtVerify`) |
| refresh_token용 `offline_access` scope | `app/api/auth/login/route.ts:31` |
| 클라이언트 fetch는 자기 BFF로만 | `app/account/_components/*`가 `/api/account/*`만 호출, `${ISSUER}/...`는 직접 호출 안 함 |
| 로그아웃 시 자기 refresh_token revoke | `app/api/auth/logout/route.ts:9` |

MUST NOT 항목들(localStorage 토큰 금지, `id_token`을 bearer로 쓰지 않기, DB 직접 읽기 금지, role/permission claim 의존 금지, session-revoke / revoke-all UI 금지, 프로필 편집 금지, admin API 금지)은 **부재(absence)** 로 강제됩니다 — 그런 코드 자체가 없습니다. PURPOSE.md의 negative wireframe이 정답지입니다.

## v1에서 의도적으로 빠진 것

- **Status 필드**가 `_components/overview.tsx`에서 `active`로 하드코딩되어 있습니다. PURPOSE에선 `users` row의 필드로 명시돼 있지만, authgate `/console/me` 엔드포인트가 아직 status를 노출하지 않습니다.
- **Revoke 에러 UX**가 401이 아닌 실패엔 silent입니다 (`_components/connected-apps.tsx:51`). 1인 도구라 v1 수준에선 허용.
- **탭은 클라이언트 state**, URL 라우팅 아님. `?tab=` 추가는 v2 변경 — PURPOSE에서 새 라우트 추가 자체가 scope-creep 신호로 명시돼 있습니다.
