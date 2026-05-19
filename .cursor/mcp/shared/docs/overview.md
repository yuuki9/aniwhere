# MCP 운영 개요 (aniwhere)

이 문서는 Cursor에서 AWS MCP를 공용으로 운영하기 위한 빠른 안내입니다.

## 사용 MCP

- `awslabs.aws-documentation-mcp-server`
- `awslabs.aws-api-mcp-server`
- `agentmemory`

## 운영 원칙

- 기본 리전은 `ap-northeast-2`(서울)로 고정합니다.
- 기본 모드는 읽기 중심이며, 변경 작업은 명시적 승인 후 수행합니다.
- 설계/학습은 Documentation MCP, 계정 조회는 API MCP를 사용합니다.

## 문서 맵

- `.cursor/mcp/aws-documentation/docs/guide.md`: 문서형 MCP 사용법/기대효과
- `.cursor/mcp/aws-api/docs/guide.md`: API MCP 사용법/기대효과/주의사항
- `.cursor/mcp/agentmemory/docs/guide.md`: 세션 간 맥락 저장/조회/거버넌스 기준
- `.cursor/mcp/shared/docs/ops-policy.md`: 공용 운영 정책(승인, 권한, 체크리스트)
- `.cursor/mcp/shared/docs/hook-governance.md`: 훅 네이밍/실패 정책/검증 규칙
- `.cursor/skills/README.md`: 팀 공용 스킬 발견/검증 인덱스
- `.cursor/mcp.json`: 실제 Cursor MCP 설정 파일
