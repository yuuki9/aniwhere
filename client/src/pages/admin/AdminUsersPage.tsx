import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { BottomSheet, SegmentedControl, Toast } from '@aniwhere/tds-mobile'
import { getUserDetail, listUsers, updateUserRole } from '../../shared/api/users'
import type { UserAppRole, UserSummary } from '../../shared/api/types'
import { formatDateTime } from '../../shared/lib/format'
import { emojiFromFilename, profileEmojiUrl } from '../../shared/lib/profileEmojiOptions'
import { AppTopNavigation } from '../../shared/ui/AppTopNavigation'

const USER_TOAST_VISIBLE_MS = 3000
const USER_PAGE_SIZE = 20
const USER_ROLE_FILTERS = ['ALL', 'ADMIN', 'USER'] as const

type UserRoleFilter = (typeof USER_ROLE_FILTERS)[number]

function normalizeUserRole(role: string): UserAppRole {
  return role.toUpperCase().includes('ADMIN') ? 'ADMIN' : 'USER'
}

function normalizeUserStatus(status: string) {
  return status.trim().toUpperCase() || 'UNKNOWN'
}

function roleLabel(role: string) {
  return normalizeUserRole(role) === 'ADMIN' ? '관리자' : '사용자'
}

function statusLabel(status: string) {
  const normalized = normalizeUserStatus(status)
  if (normalized === 'ACTIVE') {
    return '활성'
  }
  if (normalized === 'UNLINKED') {
    return '탈퇴'
  }
  if (normalized === 'BLOCKED') {
    return '차단'
  }

  return normalized
}

function userDisplayName(user: UserSummary) {
  return user.nickname?.trim() || '닉네임 없음'
}

function userNoticeName(user: UserSummary) {
  return user.nickname?.trim() || '사용자'
}

function userMatchesKeyword(user: UserSummary, keyword: string) {
  if (!keyword) {
    return true
  }

  const normalizedKeyword = keyword.toLowerCase()
  return [user.nickname, String(user.userKey), user.status, user.role]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(normalizedKeyword))
}

export function AdminUsersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [keywordInput, setKeywordInput] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [roleFilter, setRoleFilter] = useState<UserRoleFilter>('ALL')
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [roleSheetUserId, setRoleSheetUserId] = useState<number | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const usersQuery = useQuery({
    queryKey: ['users', 'admin-users', currentPage],
    queryFn: () => listUsers({ page: currentPage, size: USER_PAGE_SIZE, sort: ['createdAt,desc'] }),
  })
  const users = useMemo(() => usersQuery.data?.content ?? [], [usersQuery.data?.content])

  const selectedListUser = users.find((user) => user.id === selectedUserId) ?? null
  const userDetailQuery = useQuery({
    queryKey: ['users', 'admin-user-detail', selectedUserId],
    queryFn: () => getUserDetail(selectedUserId ?? 0),
    enabled: selectedUserId != null,
  })
  const selectedUser = userDetailQuery.data ?? selectedListUser
  const roleSheetUser = users.find((user) => user.id === roleSheetUserId) ?? null

  const visibleUsers = useMemo(
    () =>
      users.filter((user) => {
        const matchesRole = roleFilter === 'ALL' || normalizeUserRole(user.role) === roleFilter
        return matchesRole && userMatchesKeyword(user, appliedKeyword)
      }),
    [appliedKeyword, roleFilter, users],
  )

  const totalPages = usersQuery.data?.totalPages ?? 0
  const canGoPrevious = currentPage > 0 && !usersQuery.isFetching
  const canGoNext = !!usersQuery.data && !usersQuery.data.last && !usersQuery.isFetching
  const resultLabel = appliedKeyword || roleFilter !== 'ALL' ? '검색 결과' : '전체 목록'

  const roleMutation = useMutation({
    mutationFn: ({ role, user }: { role: UserAppRole; user: UserSummary }) => updateUserRole(user.id, { role }),
    onSuccess: async (updatedUser, variables) => {
      queryClient.setQueryData(['users', 'admin-user-detail', variables.user.id], updatedUser)
      await queryClient.invalidateQueries({ queryKey: ['users', 'admin-users'] })
      setRoleSheetUserId(null)
      setNotice(`${userNoticeName(updatedUser)} 권한을 ${roleLabel(updatedUser.role)}로 변경했어요.`)
    },
    onError: (error) => {
      setNotice(error instanceof Error ? error.message : '사용자 권한을 변경하지 못했어요.')
    },
  })

  const submitSearch = () => {
    setCurrentPage(0)
    setAppliedKeyword(keywordInput.trim())
  }

  const changeRoleFilter = (nextFilter: UserRoleFilter) => {
    setRoleFilter(nextFilter)
    setCurrentPage(0)
  }

  const changeRole = (user: UserSummary, role: UserAppRole) => {
    if (normalizeUserRole(user.role) === role || roleMutation.isPending) {
      return
    }

    roleMutation.mutate({ user, role })
  }

  const selectUser = (userId: number) => {
    setSelectedUserId((currentUserId) => (currentUserId === userId ? null : userId))
  }

  const renderRoleOptions = (user: UserSummary, label: string) => (
    <div className="admin-user-role-sheet-options" aria-label={label}>
      <SegmentedControl
        size="large"
        value={normalizeUserRole(user.role)}
        onChange={(nextRole) => changeRole(user, nextRole as UserAppRole)}
      >
        <SegmentedControl.Item value="USER">사용자</SegmentedControl.Item>
        <SegmentedControl.Item value="ADMIN">관리자</SegmentedControl.Item>
      </SegmentedControl>
    </div>
  )

  return (
    <main className="app-shell admin-shell admin-shop-crud-shell admin-shop-manage-shell admin-user-manage-shell">
      <AppTopNavigation
        className="route-navigation"
        showBack
        title="사용자 관리"
        showLogo={false}
        onBack={() => navigate('/admin', { replace: true })}
      />

      <section className="admin-shop-crud-layout admin-user-manage-layout">
        <header className="admin-manage-page-header">
          <h1>사용자 관리</h1>
        </header>

        <section className="admin-shop-manage-tools" aria-label="사용자 검색과 필터">
          <form
            className="admin-shop-manage-search"
            onSubmit={(event) => {
              event.preventDefault()
              submitSearch()
            }}
          >
            <input
              className="text-input"
              placeholder="닉네임 또는 사용자 키 검색"
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
            />
            <button className="admin-shop-manage-search-button" type="submit">
              검색
            </button>
          </form>

          <div className="admin-shop-status-filter admin-user-role-filter" role="tablist" aria-label="권한 필터">
            {USER_ROLE_FILTERS.map((value) => (
              <button
                aria-selected={roleFilter === value}
                className="admin-shop-status-filter-button"
                key={value}
                role="tab"
                type="button"
                onClick={() => changeRoleFilter(value)}
              >
                {value === 'ALL' ? '전체' : value === 'ADMIN' ? '관리자' : '사용자'}
              </button>
            ))}
          </div>
        </section>

        <section className="admin-shop-manage-list-shell" aria-label="사용자 목록">
          <div className="admin-shop-manage-list-head">
            <span>
              {resultLabel} {visibleUsers.length}명
            </span>
          </div>

          <div className="admin-shop-manage-list">
            {usersQuery.isLoading ? <p className="admin-shop-manage-state">사용자 목록을 불러오고 있어요.</p> : null}
            {usersQuery.isError ? (
              <p className="admin-shop-manage-state error-text">{(usersQuery.error as Error).message}</p>
            ) : null}
            {!usersQuery.isLoading && visibleUsers.length === 0 ? (
              <p className="admin-shop-manage-state">조건에 맞는 사용자가 없어요.</p>
            ) : null}

            {visibleUsers.map((user) => {
              const rowDetailUser = selectedUserId === user.id ? selectedUser ?? user : user
              const isSelected = selectedUserId === user.id
              const detailId = `admin-user-detail-${user.id}`
              const emojiUrl = profileEmojiUrl(user.emojiIconFilename)
              const emojiFallback = emojiFromFilename(user.emojiIconFilename) ?? userDisplayName(user).slice(0, 1)

              return (
                <article
                  className="admin-user-board-row"
                  data-selected={isSelected ? 'true' : undefined}
                  key={user.id}
                >
                  <button
                    aria-controls={detailId}
                    aria-expanded={isSelected}
                    className="admin-user-board-header"
                    type="button"
                    onClick={() => selectUser(user.id)}
                  >
                    <span className="admin-user-board-prefix">
                      {emojiUrl != null ? (
                        <img alt="" aria-hidden="true" src={emojiUrl} />
                      ) : (
                        <span>{emojiFallback}</span>
                      )}
                    </span>
                    <span className="admin-user-board-title">
                      <strong>{userDisplayName(user)}</strong>
                    </span>
                    <span className="admin-user-role-pill">{roleLabel(user.role)}</span>
                    <span className="admin-user-board-arrow" aria-hidden="true" />
                  </button>

                  {isSelected ? (
                    <div className="admin-user-board-content" id={detailId}>
                      <dl className="admin-account-definition admin-user-detail-definition">
                        <div>
                          <dt>닉네임</dt>
                          <dd>{userDisplayName(rowDetailUser)}</dd>
                        </div>
                        <div>
                          <dt>사용자 키</dt>
                          <dd>{rowDetailUser.userKey}</dd>
                        </div>
                        <div>
                          <dt>상태</dt>
                          <dd>{statusLabel(rowDetailUser.status)}</dd>
                        </div>
                      <div>
                        <dt>권한</dt>
                        <dd>
                          <button
                            className="admin-user-role-change-button"
                            type="button"
                            onClick={() => setRoleSheetUserId(rowDetailUser.id)}
                          >
                            <span>{roleLabel(rowDetailUser.role)}</span>
                            <svg className="admin-user-role-edit-icon" aria-hidden="true" viewBox="0 0 24 24">
                              <path
                                d="M15.4 5.6 18.4 8.6 8.7 18.3 5.2 19 5.9 15.5 15.4 5.6Z"
                                fill="none"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                              />
                              <path
                                d="m13.8 7.2 3 3"
                                fill="none"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                              />
                            </svg>
                          </button>
                        </dd>
                      </div>
                        <div>
                          <dt>가입일</dt>
                          <dd>{formatDateTime(rowDetailUser.createdAt)}</dd>
                        </div>
                        <div>
                          <dt>최근 로그인</dt>
                          <dd>{rowDetailUser.lastLoginAt ? formatDateTime(rowDetailUser.lastLoginAt) : '없음'}</dd>
                        </div>
                      </dl>

                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>
        </section>

        <nav className="admin-shop-pagination" aria-label="사용자 목록 페이지">
          <button
            className="admin-shop-page-button"
            disabled={!canGoPrevious}
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
          >
            이전
          </button>
          <span>{totalPages > 0 ? `${currentPage + 1} / ${totalPages}` : '0 / 0'}</span>
          <button
            className="admin-shop-page-button"
            disabled={!canGoNext}
            type="button"
            onClick={() => setCurrentPage((page) => page + 1)}
          >
            다음
          </button>
        </nav>
      </section>

      <BottomSheet
        ariaLabelledBy="admin-user-role-sheet-title"
        className="admin-user-role-sheet"
        header={
          <BottomSheet.Header className="admin-user-role-sheet-title">
            <span id="admin-user-role-sheet-title">권한 변경</span>
          </BottomSheet.Header>
        }
        onClose={() => setRoleSheetUserId(null)}
        open={roleSheetUser != null}
      >
        {roleSheetUser ? (
          <div className="admin-user-role-sheet-body">
            <p>
              <strong>{userDisplayName(roleSheetUser)}</strong>
              <span>에게 적용할 권한을 선택해요.</span>
            </p>
            {renderRoleOptions(roleSheetUser, '권한 변경')}
          </div>
        ) : null}
      </BottomSheet>

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
