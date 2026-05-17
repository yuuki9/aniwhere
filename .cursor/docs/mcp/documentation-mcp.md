# AWS Documentation MCP

대상 서버: `awslabs.aws-documentation-mcp-server`

## 목적

- 최신 AWS 공식 문서/레퍼런스를 근거로 답변 품질을 높입니다.
- 모델 지식 컷오프 이후 기능도 문서 기반으로 보완합니다.

## 주 사용 시점

- 서비스 비교, 제약사항 확인, 아키텍처 탐색
- Terraform/CDK 샘플 초안 생성
- 운영 변경 없이 안전하게 조사

## 프롬프트 예시

- `Using the AWS Documentation MCP Server, explain EventBridge Scheduler with best practices.`
- `Using the AWS Documentation MCP Server, compare ECS Fargate vs EKS for small teams.`
- `Using the AWS Documentation MCP Server, create a Terraform example for API Gateway + Lambda.`

## 기대 효과

- 최신 스펙 반영으로 답변 정확도 향상
- 문서 검색 시간 단축
- 설계 의사결정 속도 향상

## 한계

- 내 AWS 계정 리소스를 직접 조회/변경하지 않습니다.
