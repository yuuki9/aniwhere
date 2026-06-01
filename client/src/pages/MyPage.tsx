import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { listMyReviews } from '../shared/api/shopReviews'
import { getMyProfile, listMyFavoriteShops } from '../shared/api/users'
import type { Shop, ShopReview, UserSummary } from '../shared/api/types'
import { readAuthSession } from '../shared/lib/authSession'
import { formatDateTime } from '../shared/lib/format'
import { AppTopNavigation } from '../shared/ui/AppTopNavigation'

function emojiFromFilename(filename: string | null | undefined) {
  const match = filename?.match(/^u([0-9a-f]{4,6})\.png$/i)
  if (match == null) {
    return null
  }

  const codePoint = Number.parseInt(match[1], 16)
  if (Number.isNaN(codePoint)) {
    return null
  }

  return String.fromCodePoint(codePoint)
}

function roleToLabel(role: string | null | undefined) {
  const normalized = role?.trim().toUpperCase()
  if (normalized === 'ADMIN' || normalized === 'ROLE_ADMIN' || normalized?.endsWith('_ADMIN') === true) {
    return '운영자'
  }

  return '일반 사용자'
}

function statusToLabel(status: string | null | undefined) {
  if (status == null || status.trim() === '') {
    return '확인 중'
  }

  if (status.toUpperCase() === 'ACTIVE') {
    return '활성'
  }

  return status
}

function ProfileHero({ profile }: { profile: UserSummary | null }) {
  const displayName = profile?.nickname?.trim() || '닉네임 없음'
  const avatar = emojiFromFilename(profile?.emojiIconFilename) ?? displayName.slice(0, 1) ?? '나'

  return (
    <section className="my-profile-hero" aria-label="내 프로필 요약">
      <span className="my-profile-avatar" aria-hidden="true">
        {avatar}
      </span>
      <div className="my-profile-hero-copy">
        <strong>{displayName}</strong>
        <span>
          {roleToLabel(profile?.role)} · {statusToLabel(profile?.status)}
        </span>
      </div>
    </section>
  )
}

function ProfileSummary({ profile }: { profile: UserSummary | null }) {
  const items = [
    { label: '회원 번호', value: profile?.id != null ? String(profile.id) : '확인 중' },
    { label: '사용자 키', value: profile?.userKey != null ? String(profile.userKey) : '확인 중' },
    { label: '가입일', value: profile?.createdAt ? formatDateTime(profile.createdAt) : '기록 없음' },
    { label: '최근 로그인', value: profile?.lastLoginAt ? formatDateTime(profile.lastLoginAt) : '기록 없음' },
  ]

  return (
    <section className="my-profile-section" aria-label="회원 정보">
      <div className="my-profile-section-head">
        <strong>회원 정보</strong>
      </div>
      <dl className="my-profile-summary-grid">
        {items.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function SessionCard({ hasSession, expiresIn }: { hasSession: boolean; expiresIn: number | null }) {
  return (
    <section className="my-profile-session-card" aria-label="세션 상태">
      <div>
        <strong>세션 상태</strong>
        <span>{hasSession ? '로그인 토큰 보관 중' : '로그인 필요'}</span>
      </div>
      <small>{hasSession ? `만료값 ${expiresIn ?? 0}` : '앱 로그인 후 내 정보를 불러올 수 있어요.'}</small>
    </section>
  )
}

function FavoriteShopItem({ shop }: { shop: Shop }) {
  const subtitle = [shop.regionName, shop.categories[0]?.name].filter(Boolean).join(' · ') || shop.address

  return (
    <Link className="my-profile-list-row" to={`/shops/${shop.id}`}>
      <span className="my-profile-list-copy">
        <strong>{shop.name}</strong>
        <small>{subtitle}</small>
      </span>
      <span className="my-profile-list-badge" aria-label={`리뷰 ${shop.reviewCount}개`}>
        {shop.reviewCount}
      </span>
    </Link>
  )
}

function ReviewItem({ review }: { review: ShopReview }) {
  return (
    <Link className="my-profile-list-row" to={`/shops/${review.shopId}`}>
      <span className="my-profile-list-copy">
        <strong>{review.rating.toFixed(1)}점 리뷰</strong>
        <small>{review.content}</small>
      </span>
      <span className="my-profile-list-date">{formatDateTime(review.createdAt)}</span>
    </Link>
  )
}

export function MyPage() {
  const navigate = useNavigate()
  const session = useMemo(() => readAuthSession(), [])
  const hasSession = session != null
  const profileQuery = useQuery({
    queryKey: ['users', 'me', 'my-page'],
    queryFn: () => getMyProfile(),
    enabled: hasSession,
  })
  const favoriteShopsQuery = useQuery({
    queryKey: ['users', 'me', 'favorite-shops', 'my-page'],
    queryFn: () => listMyFavoriteShops(),
    enabled: hasSession,
  })
  const myReviewsQuery = useQuery({
    queryKey: ['shop-reviews', 'me', 'my-page'],
    queryFn: () => listMyReviews({ page: 0, size: 5, sort: 'NEWEST' }),
    enabled: hasSession,
  })
  const profile = profileQuery.data ?? session?.user ?? null
  const favoriteShops = favoriteShopsQuery.data ?? []
  const reviews = myReviewsQuery.data?.content ?? []

  return (
    <main className="app-shell discover-shell my-profile-shell">
      <AppTopNavigation
        className="route-navigation"
        showBack
        showLogo={false}
        title="내 정보"
        onBack={() => navigate('/home', { replace: true })}
      />
      <div className="my-profile-content">
        <header className="my-profile-head">
          <h1>내 정보</h1>
          <p>프로필과 저장한 매장, 내가 남긴 리뷰를 한곳에서 확인해요.</p>
        </header>

        {!hasSession ? (
          <section className="my-profile-empty-state" aria-label="로그인 필요">
            <strong>로그인 정보가 아직 없어요</strong>
            <p>Apps in Toss 로그인 후 프로필, 관심 매장, 최근 리뷰가 표시돼요.</p>
          </section>
        ) : null}

        {profileQuery.isError ? (
          <p className="my-profile-state error-text" role="alert">
            {(profileQuery.error as Error).message}
          </p>
        ) : null}

        <ProfileHero profile={profile} />
        <ProfileSummary profile={profile} />
        <SessionCard hasSession={hasSession} expiresIn={session?.accessTokenExpiresAt ?? null} />

        <section className="my-profile-section" aria-label="관심 매장">
          <div className="my-profile-section-head">
            <strong>관심 매장</strong>
            <span>{favoriteShops.length}곳</span>
          </div>
          <div className="my-profile-list">
            {favoriteShops.slice(0, 3).map((shop) => (
              <FavoriteShopItem key={shop.id} shop={shop} />
            ))}
            {!favoriteShopsQuery.isLoading && favoriteShops.length === 0 ? (
              <p className="my-profile-state">저장한 관심 매장이 없어요.</p>
            ) : null}
          </div>
        </section>

        <section className="my-profile-section" aria-label="최근 리뷰">
          <div className="my-profile-section-head">
            <strong>최근 리뷰</strong>
            <span>{myReviewsQuery.data?.totalElements ?? 0}개</span>
          </div>
          <div className="my-profile-list">
            {reviews.map((review) => (
              <ReviewItem key={review.id} review={review} />
            ))}
            {!myReviewsQuery.isLoading && reviews.length === 0 ? (
              <p className="my-profile-state">아직 작성한 리뷰가 없어요.</p>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  )
}
