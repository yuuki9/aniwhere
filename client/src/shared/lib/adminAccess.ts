const ADMIN_SESSION_KEY = 'aniwhere.admin.unlocked'

export function hasConfiguredAdminCode() {
  return Boolean(import.meta.env.VITE_ADMIN_ACCESS_CODE?.trim())
}

export function getRequiredAdminCode() {
  return import.meta.env.VITE_ADMIN_ACCESS_CODE?.trim() ?? null
}

export function canUseAdminPreview() {
  return import.meta.env.DEV && !hasConfiguredAdminCode()
}

export function isAdminUnlocked() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true'
}

export function unlockAdminSession(inputCode: string) {
  const normalizedCode = inputCode.trim()
  const requiredCode = getRequiredAdminCode()

  if (!requiredCode || !normalizedCode || normalizedCode !== requiredCode) {
    return false
  }

  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(ADMIN_SESSION_KEY, 'true')
  }

  return true
}

export function unlockAdminPreview() {
  if (!canUseAdminPreview()) {
    return
  }

  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(ADMIN_SESSION_KEY, 'true')
}

export function clearAdminSession() {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.removeItem(ADMIN_SESSION_KEY)
}
