# authgate-account

자체 호스팅 [authgate](https://github.com/cagojeiger/authgate) 신원에 대한 1인용 계정 페이지. 로그인한 사용자가 authgate DB에 자기 계정으로 무엇이 저장돼 있는지 확인하고, 앱별 refresh token을 회수할 수 있게 해줍니다.

관리자 콘솔, 운영 대시보드, 사용자 관리 화면이 **아닙니다**. 스코프 가드레일(negative wireframe + 5-게이트 admission rule)은 [`docs/PURPOSE.md`](docs/PURPOSE.md)에 있고, 아키텍처와 BFF 흐름은 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)에 있습니다.

## 스택

- Next.js 16 (App Router, Turbopack, `output: standalone`)
- React 19, Tailwind v4
- `iron-session` 8 (HttpOnly 쿠키 기반 BFF), `jose` 6 (JWKS 검증)
- Node 24 런타임, Docker / GHCR 릴리즈

## 로컬 실행

```bash
npm ci
# 아래 환경변수로 .env.local 생성
npm run dev   # http://localhost:3000
```

### 필수 환경변수

| 변수 | 예시 | 설명 |
|---|---|---|
| `AUTHGATE_ISSUER` | `https://authgate.project-jelly.io` | OIDC issuer base URL |
| `AUTHGATE_CLIENT_ID` | `authgate-account` | authgate에 등록된 OIDC client |
| `AUTHGATE_REDIRECT_URI` | `http://localhost:3000/api/auth/callback` | client 등록값과 정확히 일치해야 함 |
| `SESSION_SECRET` | 32자 이상 랜덤 문자열 | iron-session 암호화 키 |
| `APP_URL` | `http://localhost:3000` | 서버가 발급하는 모든 redirect의 베이스 URL |

`AUTHGATE_*`와 `SESSION_SECRET`은 lazy하게 읽기 때문에 환경변수 없이도 `npm run build`가 통과합니다. 실제 요청 시점에만 필요합니다.

## Docker 실행

```bash
docker build -t authgate-account .
docker run --rm -p 3000:3000 --env-file .env.local authgate-account
```

태그 릴리즈 시 `.github/workflows/`가 GHCR로 프로덕션 이미지를 발행합니다.

## 디렉터리 구조

```
app/
  page.tsx                로그인 (Sign in with Google)
  account/page.tsx        SSR 셸 + 탭 (Overview / Services / Activity)
  api/auth/*              login → callback → logout (PKCE + iron-session)
  api/account/*           connections, audit-log용 BFF
lib/
  auth/                   session, oidc(jose+JWKS), pkce, authgate(401→refresh→retry)
  api/authgate-client.ts  authgate /console/me/* 엔드포인트 얇은 래퍼
  env.ts                  lazy required() env 설정
proxy.ts                  Next 16 미들웨어: /account/:path* 인증 게이트
docs/                     PURPOSE.md, ARCHITECTURE.md
```

## 라이선스

[`LICENSE`](LICENSE) 참조.
