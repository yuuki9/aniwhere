export type MaskedAuthorizationCode = {
  present: boolean
  length: number
  prefix?: string
  suffix?: string
}

export function toMaskedAuthorizationCode(value: string | null | undefined): MaskedAuthorizationCode {
  const normalized = value?.trim() ?? ''

  if (normalized === '') {
    return {
      present: false,
      length: 0,
    }
  }

  if (normalized.length <= 8) {
    return {
      present: true,
      length: normalized.length,
    }
  }

  return {
    present: true,
    length: normalized.length,
    prefix: normalized.slice(0, 4),
    suffix: normalized.slice(-4),
  }
}

export function normalizeTossLoginReferrerForServer(value: string): string {
  const normalized = value.trim()
  return normalized.toUpperCase() === 'SANDBOX' ? 'sandbox' : normalized
}
