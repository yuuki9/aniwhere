import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getMyProfile } from '../../shared/api/users'
import { listMyReviews } from '../../shared/api/shopReviews'
import { formatDateTime } from '../../shared/lib/format'
import { AppTopNavigation } from '../../shared/ui/AppTopNavigation'

export function AdminAccountPage() {
  const navigate = useNavigate()
  const profileQuery = useQuery({
    queryKey: ['users', 'me', 'admin-account'],
    queryFn: () => getMyProfile(),
  })
  const myReviewsQuery = useQuery({
    queryKey: ['shop-reviews', 'me', 'admin-account'],
    queryFn: () => listMyReviews({ page: 0, size: 5, sort: 'NEWEST' }),
  })
  const profile = profileQuery.data
  const reviews = myReviewsQuery.data?.content ?? []

  return (
    <main className="app-shell admin-shell admin-shop-crud-shell admin-branch-page-shell">
      <AppTopNavigation
        className="route-navigation"
        showBack
        title="계정 정보"
        showLogo={false}
        onBack={() => navigate('/admin', { replace: true })}
      />

      <section className="admin-branch-page">
        <header className="admin-branch-page-head">
          <h1>계정 정보</h1>
          <p>현재 운영자 프로필과 최근 작성 리뷰를 확인해요.</p>
        </header>

        <section className="admin-branch-panel" aria-label="내 계정">
          <div className="admin-branch-panel-head">
            <strong>프로필</strong>
            <span>{profile?.role ?? '확인 중'}</span>
          </div>
          {profileQuery.isLoading ? <p className="admin-shop-manage-state">프로필을 불러오고 있어요.</p> : null}
          {profileQuery.isError ? (
            <p className="admin-shop-manage-state error-text">{(profileQuery.error as Error).message}</p>
          ) : null}
          {profile ? (
            <dl className="admin-account-definition">
              <div>
                <dt>닉네임</dt>
                <dd>{profile.nickname ?? '닉네임 없음'}</dd>
              </div>
              <div>
                <dt>userKey</dt>
                <dd>{profile.userKey}</dd>
              </div>
              <div>
                <dt>상태</dt>
                <dd>{profile.status}</dd>
              </div>
              <div>
                <dt>lastLoginAt</dt>
                <dd>{profile.lastLoginAt ? formatDateTime(profile.lastLoginAt) : '기록 없음'}</dd>
              </div>
            </dl>
          ) : null}
        </section>

        <section className="admin-branch-panel" aria-label="내 최근 리뷰">
          <div className="admin-branch-panel-head">
            <strong>내 최근 리뷰</strong>
            <span>{myReviewsQuery.data?.totalElements ?? 0}건</span>
          </div>
          <div className="admin-branch-list">
            {reviews.map((review) => (
              <article className="admin-branch-row" key={review.id}>
                <div className="admin-branch-row-copy">
                  <div className="admin-branch-row-head">
                    <strong>{review.rating.toFixed(1)}점</strong>
                    <span>{review.status}</span>
                  </div>
                  <p>{review.content}</p>
                  <small>{formatDateTime(review.createdAt)}</small>
                </div>
              </article>
            ))}
            {!myReviewsQuery.isLoading && reviews.length === 0 ? (
              <p className="admin-shop-manage-state">작성한 리뷰가 없어요.</p>
            ) : null}
          </div>
        </section>
      </section>
    </main>
  )
}
