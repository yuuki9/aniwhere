import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Toast } from '@aniwhere/tds-mobile'
import { listUsers, updateUserRole } from '../../shared/api/users'
import type { UserAppRole, UserSummary } from '../../shared/api/types'
import { formatDateTime } from '../../shared/lib/format'
import { AppTopNavigation } from '../../shared/ui/AppTopNavigation'

const USER_TOAST_VISIBLE_MS = 3000
const USER_PAGE_SIZE = 20

function normalizeUserRole(role: string): UserAppRole {
  return role.toUpperCase().includes('ADMIN') ? 'ADMIN' : 'USER'
}

function roleLabel(role: string) {
  return normalizeUserRole(role) === 'ADMIN' ? '관리자' : '사용자'
}

function userDisplayName(user: UserSummary) {
  return user.nickname?.trim() || `user-${user.userKey}`
}

export function AdminUsersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(0)
  const [notice, setNotice] = useState<string | null>(null)

  const usersQuery = useQuery({
    queryKey: ['users', 'admin-users', currentPage],
    queryFn: () => listUsers({ page: currentPage, size: USER_PAGE_SIZE }),
  })
  const users = usersQuery.data?.content ?? []

  const roleMutation = useMutation({
    mutationFn: ({ role, user }: { role: UserAppRole; user: UserSummary }) => updateUserRole(user.id, { role }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users', 'admin-users'] })
      setNotice('사용자 권한을 변경했어요.')
    },
    onError: (error) => {
      setNotice(error instanceof Error ? error.message : '사용자 권한을 변경하지 못했어요.')
    },
  })

  const changeRole = (user: UserSummary, role: UserAppRole) => {
    if (normalizeUserRole(user.role) === role || roleMutation.isPending) {
      return
    }
    roleMutation.mutate({ user, role })
  }

  return (
    <main className="app-shell admin-shell admin-shop-crud-shell admin-branch-page-shell">
      <AppTopNavigation
        className="route-navigation"
        showBack
        title="사용자/권한"
        showLogo={false}
        onBack={() => navigate('/admin', { replace: true })}
      />

      <section className="admin-branch-page">
        <header className="admin-branch-page-head">
          <h1>사용자/권한</h1>
          <p>Swagger 회원 목록과 관리자 권한 변경 API 기준으로 운영 권한을 관리해요.</p>
        </header>

        <section className="admin-branch-panel" aria-label="사용자 목록">
          <div className="admin-branch-panel-head">
            <strong>사용자</strong>
            <span>{usersQuery.data?.totalElements ?? 0}명</span>
          </div>

          <div className="admin-branch-list">
            {usersQuery.isLoading ? <p className="admin-shop-manage-state">사용자 목록을 불러오고 있어요.</p> : null}
            {usersQuery.isError ? (
              <p className="admin-shop-manage-state error-text">{(usersQuery.error as Error).message}</p>
            ) : null}
            {!usersQuery.isLoading && users.length === 0 ? (
              <p className="admin-shop-manage-state">사용자가 없어요.</p>
            ) : null}
            {users.map((user) => (
              <article className="admin-branch-row" key={user.id}>
                <div className="admin-branch-row-copy">
                  <div className="admin-branch-row-head">
                    <strong>{userDisplayName(user)}</strong>
                    <span>{roleLabel(user.role)}</span>
                  </div>
                  <p>
                    userKey {user.userKey} · {user.status} · 가입 {formatDateTime(user.createdAt)}
                  </p>
                  <small>{user.lastLoginAt ? `최근 로그인 ${formatDateTime(user.lastLoginAt)}` : '최근 로그인 없음'}</small>
                </div>
                <div className="admin-branch-action-grid" role="group" aria-label="권한 변경">
                  {(['USER', 'ADMIN'] as UserAppRole[]).map((role) => (
                    <button
                      aria-pressed={normalizeUserRole(user.role) === role}
                      className="admin-branch-action"
                      disabled={roleMutation.isPending}
                      key={role}
                      type="button"
                      onClick={() => changeRole(user, role)}
                    >
                      {role === 'ADMIN' ? '관리자' : '사용자'}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <nav className="admin-shop-pagination" aria-label="사용자 목록 페이지">
            <button
              className="admin-shop-page-button"
              disabled={currentPage === 0 || usersQuery.isFetching}
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
            >
              이전
            </button>
            <span>
              {(usersQuery.data?.totalPages ?? 0) > 0 ? `${currentPage + 1} / ${usersQuery.data?.totalPages}` : '0 / 0'}
            </span>
            <button
              className="admin-shop-page-button"
              disabled={!usersQuery.data || usersQuery.data.last || usersQuery.isFetching}
              type="button"
              onClick={() => setCurrentPage((page) => page + 1)}
            >
              다음
            </button>
          </nav>
        </section>
      </section>

      <Toast
        aria-live="polite"
        duration={USER_TOAST_VISIBLE_MS}
        higherThanCTA
        open={notice != null}
        position="bottom"
        text={notice ?? ''}
        onClose={() => setNotice(null)}
      />
    </main>
  )
}
