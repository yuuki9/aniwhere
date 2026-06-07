import { requestNoContent } from './client'
import type { RecordPopularityEventPayload } from './types'

const POPULARITY_EVENTS_ENABLED = false

export function recordPopularityEvent(payload: RecordPopularityEventPayload) {
  if (!POPULARITY_EVENTS_ENABLED) {
    void payload
    return Promise.resolve()
  }

  return requestNoContent('/api/v1/popularity/events', {
    method: 'POST',
    body: JSON.stringify({
      occurredAt: new Date().toISOString(),
      ...payload,
    }),
  })
}

export function recordPopularityEventSafely(payload: RecordPopularityEventPayload) {
  void recordPopularityEvent(payload).catch(() => {})
}
