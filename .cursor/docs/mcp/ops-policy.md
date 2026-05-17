# MCP 공용 운영 정책

## 기본 정책

- 기본 리전: `ap-northeast-2`
- 기본 프로파일: `AWS_PROFILE`로 명시
- 기본 모드: API MCP 읽기 전용 (`READ_OPERATIONS_ONLY=true`)

## 권장 작업 순서

1. `Documentation MCP`로 개념/방법 검증
2. `API MCP`로 현재 상태 조회
3. 변경 필요 시 사전 계획 확인 후 승인

## 승인 프롬프트 템플릿

- `Before any mutation, show me a dry-run style plan first.`
- `Use read-only operations only unless I explicitly approve mutation.`

## 보안/운영 체크리스트

- IAM 최소 권한(가능하면 ReadOnly 역할) 적용
- 운영 계정과 개발 계정 분리
- 변경 작업 전 대상 리전/계정 재확인
- 필요 시 CloudTrail/로그 기반 사후 검증 수행
