export type SafeErrorSummary = {
  name?: string
  message: string
}

export function toSafeErrorSummary(error: unknown): SafeErrorSummary {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    }
  }

  return { message: 'unknown error' }
}
