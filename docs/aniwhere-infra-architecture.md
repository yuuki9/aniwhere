# Aniwhere 전체 서비스 인프라 구조 모식도 (AWS CLI 기반)

이 문서는 `aws configure`로 설정된 현재 계정 컨텍스트에서 AWS CLI로 수집한 결과를 기준으로, Aniwhere 서비스의 인프라 구조를 한눈에 정리한 문서입니다.

## 1) 점검 기준 (실행 시점)

- 점검 일시: 2026-04-14
- 계정: `arn:aws:iam::757836579265:user/aniwhere-dev`
- 리전: `ap-northeast-2`
- 기준 명령:
  - `aws sts get-caller-identity`
  - `aws configure get region`
  - `aws ec2/elbv2/s3` 조회 명령

## 2) 인프라 요약

- 네트워크: `aniwhere-vpc (10.0.0.0/16)`
- 컴퓨트:
  - Bastion EC2: `aniwhere-bastion` (public IP `3.39.150.248`)
  - App EC2: `aniwhere-private-ec2` (private only)
- 로드밸런서:
  - ALB: `aniwhere-alb` (80/443 수신)
  - Target Group: `aniwhere-api-tg` -> private EC2 `:61783`
- 스토리지:
  - S3 배포 버킷: `aniwhere-s3-docker-bucket`
  - 릴리스 오브젝트 경로: `aniwhere/releases/<git-sha>.tar`
- 프라이빗 아웃바운드:
  - S3 Gateway VPC Endpoint: `vpce-0c1c04a81e6432b3d`
  - 프라이빗 라우트 테이블이 S3 Prefix List를 Endpoint로 라우팅
- CI/CD:
  - GitHub Actions에서 서버 이미지 빌드 -> S3 업로드 -> Bastion 경유로 private EC2 배포

## 3) 전체 서비스 모식도

```mermaid
flowchart LR
  USER[사용자 / Toss WebView 사용자]
  WEBVIEW[Aniwhere Client\nApps in Toss WebView]
  GH[GitHub Actions]

  subgraph AWS[AWS ap-northeast-2]
    subgraph VPC[aniwhere-vpc 10.0.0.0/16]
      subgraph PUB[Public Subnets]
        BASTION[EC2: aniwhere-bastion\n10.0.3.107 / 3.39.150.248]
      end

      subgraph PRI[Private Subnets]
        APP[EC2: aniwhere-private-ec2\n10.0.133.224\nDocker: aniwhere-server:latest]
        RTB1[Private RTB (2a)]
        RTB2[Private RTB (2b)]
      end

      ALB[ALB: aniwhere-alb\n:80, :443]
      TG[Target Group: aniwhere-api-tg\nHTTP 61783]
      VPCE[S3 Gateway Endpoint\nvpce-0c1c04a81e6432b3d]
      IGW[Internet Gateway]
    end

    S3[(S3: aniwhere-s3-docker-bucket)]
    DB[(MySQL DB\nDB_HOST secret 기반)]
  end

  USER --> WEBVIEW
  WEBVIEW -->|API 호출| ALB
  ALB --> TG --> APP
  APP -->|DB_* env| DB

  GH -->|docker build + save| S3
  GH -->|SSH 22 (ProxyJump)| BASTION
  BASTION -->|SSH 22| APP
  APP --> RTB1
  APP --> RTB2
  RTB1 -->|S3 Prefix List| VPCE
  RTB2 -->|S3 Prefix List| VPCE
  VPCE --> S3

  ALB --> IGW
  BASTION --> IGW
```

## 4) 트래픽/배포 흐름

- 런타임 요청 경로
  - 사용자 -> WebView 클라이언트 -> ALB(`80/443`) -> private EC2(`61783`) -> DB
- 배포 경로
  - GitHub Actions -> Docker 이미지 tar 생성 -> S3 업로드 + presigned URL 생성
  - GitHub Actions -> Bastion SSH -> private EC2 SSH
  - private EC2가 presigned URL로 이미지 다운로드 후 `docker load` 및 `docker compose up -d`

## 5) 보안그룹 핵심 규칙

- `aniwhere-alb-sg`
  - Inbound: `443/tcp` from `0.0.0.0/0`
- `aniwhere-private-sg`
  - Inbound: `61783/tcp` from `aniwhere-alb-sg`
  - Inbound: `22/tcp` from `aniwhere-bastion-sg`
  - Inbound: `25431/tcp` from `aniwhere-bastion-sg`
- `aniwhere-bastion-sg`
  - Inbound: `22/tcp`, `25431/tcp` from `118.37.79.185/32`

## 6) 서비스 관점 구성 메모

- 클라이언트는 `@apps-in-toss/web-framework` 기반이며 서버 API를 호출합니다.
- 서버는 private EC2의 Docker 컨테이너로 동작하며, 외부 진입은 ALB를 통해서만 허용되는 구조입니다.
- 프라이빗 서브넷의 S3 접근은 NAT 없이도 Gateway Endpoint로 처리됩니다.

## 7) 확인 제한(권한 이슈)

아래 항목은 현재 IAM 권한으로 상세 조회가 불가했습니다.

- `rds:DescribeDBInstances` (DB 위치/스펙 상세 미확인)
- `route53:ListHostedZones` (도메인 레코드 상세 미확인)
- `acm:DescribeCertificate` (ALB 인증서 도메인 상세 미확인)

따라서 DB/도메인/인증서 일부는 배포 스크립트와 기존 설정(`DB_*`, `APP_PUBLIC_URL`)을 근거로 문서화했습니다.
