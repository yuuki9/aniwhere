import { useState, type FormEvent } from 'react'
import { Outlet } from 'react-router-dom'
import {
  canUseAdminPreview,
  clearAdminSession,
  hasConfiguredAdminCode,
  isAdminUnlocked,
  unlockAdminPreview,
  unlockAdminSession,
} from '../../shared/lib/adminAccess'
import { GlobalNavigationMenu } from '../../shared/ui/GlobalNavigationMenu'

export function AdminAccessGate() {
  const [isUnlocked, setIsUnlocked] = useState(isAdminUnlocked())
  const [unlockCode, setUnlockCode] = useState('')
  const [unlockError, setUnlockError] = useState<string | null>(null)
  const previewUnlockAvailable = canUseAdminPreview()

  const lockAdmin = () => {
    clearAdminSession()
    setIsUnlocked(false)
  }

  const submitUnlock = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (unlockAdminSession(unlockCode)) {
      setIsUnlocked(true)
      setUnlockError(null)
      setUnlockCode('')
      return
    }

    setUnlockError('관리자 코드가 일치하지 않습니다.')
  }

  if (isUnlocked) {
    return <Outlet context={{ lockAdmin }} />
  }

  return (
    <main className="app-shell admin-shell">
      <section className="section admin-unlock-card">
        <div className="admin-unlock-head">
          <GlobalNavigationMenu triggerClassName="global-nav-trigger global-nav-trigger-inline" />
          <div>
            <span className="eyebrow">ADMIN</span>
            <h1>관리자 콘솔 잠금 해제</h1>
          </div>
        </div>

        <p>
          샵 등록과 포인트 지급은 관리자 전용 작업입니다. 운영 환경에서는 관리자 코드가 설정된 경우에만
          접근할 수 있습니다.
        </p>

        <form className="admin-unlock-form" onSubmit={submitUnlock}>
          <input
            className="text-input"
            placeholder="관리자 코드"
            type="password"
            value={unlockCode}
            onChange={(event) => setUnlockCode(event.target.value)}
          />
          <button className="primary-action" type="submit">
            관리자 열기
          </button>
        </form>

        {previewUnlockAvailable ? (
          <button
            className="secondary-action admin-preview-button"
            type="button"
            onClick={() => {
              unlockAdminPreview()
              setIsUnlocked(true)
            }}
          >
            개발 미리보기로 열기
          </button>
        ) : null}

        {!hasConfiguredAdminCode() && !previewUnlockAvailable ? (
          <p className="form-help-text">
            실서비스에서는 `VITE_ADMIN_ACCESS_CODE`가 설정되어야 관리자 잠금 해제가 가능합니다.
          </p>
        ) : null}

        {unlockError ? <p className="error-text">{unlockError}</p> : null}
      </section>
    </main>
  )
}
