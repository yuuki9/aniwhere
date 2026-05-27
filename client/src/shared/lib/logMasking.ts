export function maskSecretForLog(value: string): string {
  const trimmed = value.trim()
  if (trimmed.length <= 8) return '***'
  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}(len=${trimmed.length})`
}
