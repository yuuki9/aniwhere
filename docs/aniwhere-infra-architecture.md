# Aniwhere 인프라 (실사용 기준)

- 리전: `ap-northeast-2`
- 기준: AWS MCP 조회 (2026-06-17) + 배포 워크플로
- DB: RDS MySQL

> 주 클라이언트는 **Apps in Toss WebView**. API는 `api.aniwhere.link`로 호출합니다.

## 도메인 (API)

| 호스트 | 용도 | TLS (ACM) | 라우팅 |
|--------|------|-----------|--------|
| `api.aniwhere.link` | Spring Boot API | `ap-northeast-2` · `*.aniwhere.link` | Route 53 → ALB `:443` → EC2 |

- ALB HTTPS 리스너(`443`)에 `ap-northeast-2` ACM 인증서가 연결되어 있습니다.
- Route 53 hosted zone 상세는 현재 IAM(`aniwhere-dev`)에 조회 권한이 없어, 레코드 타입·TTL은 콘솔 기준으로 유지합니다.

## 런타임 (분산 EC2)

[`docs/diagrams/aniwhere-runtime.mmd`](diagrams/aniwhere-runtime.mmd)

| 영역 | 구성 |
|------|------|
| DNS | Route 53 (`api.aniwhere.link` → ALB) |
| Public Subnet | ALB `:443` + ACM 인증서, EC2 × 2 (API 서버) |
| 데이터 | RDS MySQL, S3 이미지 버킷 |
| 외부 | Toss 로그인, Naver Map |

ALB가 healthy 인스턴스로만 요청을 나눠 보냅니다. 한 대가 내려가도 다른 한 대가 API를 처리합니다.

## 배포 (main merge)

[`docs/diagrams/aniwhere-deploy.mmd`](diagrams/aniwhere-deploy.mmd)

- 서버: `main` merge → S3 아티팩트 → EC2 SSH 배포 → `https://api.aniwhere.link`

## 관련 파일

- [`docs/diagrams/aniwhere-runtime.mmd`](diagrams/aniwhere-runtime.mmd) · [draw.io](diagrams/aniwhere-runtime.drawio)
- [`docs/diagrams/aniwhere-deploy.mmd`](diagrams/aniwhere-deploy.mmd) · [draw.io](diagrams/aniwhere-deploy.drawio)
- `.github/workflows/deploy-ec2.yml`
- `server/docker-compose.ec2.image.yml`
