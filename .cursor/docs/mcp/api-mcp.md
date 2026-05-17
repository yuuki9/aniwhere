# AWS API MCP

대상 서버: `awslabs.aws-api-mcp-server`

## 목적

- AWS 계정의 실제 리소스를 조회하고 운영 작업을 자동화합니다.
- AI가 AWS CLI 명령을 선택/검증하여 실행 가능한 결과를 제공합니다.

## 주 사용 시점

- 리소스 인벤토리 조회 (EC2, S3, CloudWatch 등)
- 장애 대응을 위한 현재 상태 점검
- 운영 자동화 및 반복 작업 단순화

## 프롬프트 예시

- `Using the AWS API MCP Server, list S3 buckets in ap-northeast-2.`
- `Using the AWS API MCP Server, show running EC2 instances and summarize cost optimization ideas.`
- `Using the AWS API MCP Server, check CloudWatch alarms related to API latency.`

## 기대 효과

- 실제 계정 상태 기반의 실무형 답변
- 조회/점검 자동화로 운영 속도 개선
- 수동 CLI 탐색 시간 감소

## 기본 안전 설정

- `READ_OPERATIONS_ONLY=true`로 읽기 전용 모드를 기본 적용합니다.
- 기본 리전을 `ap-northeast-2`로 고정합니다.

## 주의사항

- IAM 권한은 최종 보안 통제입니다. 최소 권한 원칙을 지켜야 합니다.
- 변경 작업이 필요한 경우 별도 승인 절차 후 정책을 조정합니다.
