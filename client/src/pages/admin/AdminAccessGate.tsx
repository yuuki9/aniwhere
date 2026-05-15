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
import { AitNavigation } from '../../shared/ui/ait'

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

    setUnlockError('관리자 코드가 맞지 않아요.')
  }

  if (isUnlocked) {
    return <Outlet context={{ lockAdmin }} />
  }

  return (
    <main className="app-shell admin-shell">
      <AitNavigation />
      <section className="section admin-unlock-card">
        <div className="admin-unlock-head">
          <div>
            <span className="eyebrow">ADMIN</span>
            <h1>관리자 코드 입력</h1>
          </div>
        </div>

        <p>
          매장 등록과 포인트 지급은 관리자 전용 작업이에요. 관리자 코드가 있어야 접근할 수 있어요.
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
            관리자 화면 열기
          </button>
        </form>

        {previewUnlockAvailable ? (
          <button
            className="secondary-action admin-preview-button"
            type="button"
            onClick={() => {
              unlockAdminPreview()
              const unlocked = isAdminUnlocked()
              setIsUnlocked(unlocked)
              setUnlockError(unlocked ? null : '관리자 화면을 열지 못했어요.')
            }}
          >
            개발 모드로 열기
          </button>
        ) : null}

        {!hasConfiguredAdminCode() && !previewUnlockAvailable ? (
          <p className="form-help-text">
            관리자 코드가 설정되지 않았어요. 운영 환경에서는 접근할 수 없습니다.
          </p>
        ) : null}

        {unlockError ? <p className="error-text">{unlockError}</p> : null}
      </section>
    </main>
  )
}
