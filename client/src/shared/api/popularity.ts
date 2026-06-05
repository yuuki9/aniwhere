import { requestNoContent } from './client'
import type { RecordPopularityEventPayload } from './types'

export function recordPopularityEvent(payload: RecordPopularityEventPayload) {
  return requestNoContent('/api/v1/popularity/events', {
    method: 'POST',
    body: JSON.stringify({
      occurredAt: new Date().toISOString(),
      ...payload,
    }),
  })
}

export function recordPopularityEventSafely(payload: RecordPopularityEventPayload) {
  void recordPopularityEvent(payload).catch((error) => {
    if (import.meta.env.DEV) {
      console.warn('[aniwhere:popularity] record failed', error)
    }
  })
}
