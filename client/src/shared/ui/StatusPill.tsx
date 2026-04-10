type StatusPillProps = {
  status: 'ACTIVE' | 'CLOSED' | 'UNVERIFIED'
}

export function StatusPill({ status }: StatusPillProps) {
  const className =
    status === 'ACTIVE'
      ? 'status-pill status-open'
      : status === 'CLOSED'
        ? 'status-pill status-closed'
        : 'status-pill status-check'

  const label =
    status === 'ACTIVE' ? '운영 중' : status === 'CLOSED' ? '운영 종료' : '확인 필요'

  return <span className={className}>{label}</span>
}
