import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { listMyReviews } from '../shared/api/shopReviews'
import { checkNicknameAvailability, getMyProfile, listMyFavoriteShops, updateMyNickname } from '../shared/api/users'
import type { Shop, ShopReview, UserSummary } from '../shared/api/types'
import { readAuthSession, updateAuthSessionUser } from '../shared/lib/authSession'
import {
  createProfileEmojiPage,
  emojiFromFilename,
  profileEmojiUrl,
  type ProfileEmojiOption,
} from '../shared/lib/profileEmojiOptions'
import { AppTopNavigation } from '../shared/ui/AppTopNavigation'
import { Asset, BottomSheet, Button, TextField } from '@aniwhere/tds-mobile'

const EMPTY_PROFILE_VALUE = '없음'
const NICKNAME_REQUIRED_MESSAGE = '닉네임을 입력해 주세요.'
const NICKNAME_TOO_LONG_MESSAGE = '닉네임은 50자 이내로 입력해 주세요.'
const PROFILE_LIST_INITIAL_COUNT = 3
const PROFILE_EMOJI_FRAME = { width: 58, height: 58, radius: 29 }
const PROFILE_EMOJI_RAIL_FRAME = { width: 34, height: 34, radius: 17 }

type ProfileInfoItem = {
  label: string
  value: string
}

function textOrEmpty(value: string | number | null | undefined) {
  if (value == null) {
    return EMPTY_PROFILE_VALUE
  }

  const text = String(value).trim()
  return text === '' ? EMPTY_PROFILE_VALUE : text
}

function normalizeNickname(value: string) {
  return value.trim()
}

function validateNickname(value: string) {
  const nickname = normalizeNickname(value)
  if (nickname === '') {
    throw new Error(NICKNAME_REQUIRED_MESSAGE)
  }
  if (nickname.length > 50) {
    throw new Error(NICKNAME_TOO_LONG_MESSAGE)
  }
  return nickname
}

function formatProfileDate(value: string | null | undefined) {
  if (value == null || value.trim() === '') {
    return EMPTY_PROFILE_VALUE
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return EMPTY_PROFILE_VALUE
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(date)
    .replace(/\.\s/g, '.')
    .replace(/\.$/, '')
}

function ProfileAvatar({
  onEdit,
  profile,
}: {
  onEdit: () => void
  profile: UserSummary | null
}) {
  const displayName = profile?.nickname?.trim() || '나'
  const avatarUrl = profileEmojiUrl(profile?.emojiIconFilename)
  const avatarFallback = emojiFromFilename(profile?.emojiIconFilename) ?? displayName.slice(0, 1) ?? '나'

  return (
    <section className="my-profile-avatar-stage" aria-label="프로필 이미지">
      <button className="my-profile-avatar-button" type="button" onClick={onEdit}>
        <span className="my-profile-avatar" aria-hidden="true">
          {avatarUrl != null ? <img src={avatarUrl} alt="" /> : avatarFallback}
        </span>
        <span className="my-profile-avatar-edit-button" aria-label="프로필 이미지 수정">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 17.5V20h2.5L17.1 9.4l-2.5-2.5L4 17.5Zm14-9 1.2-1.2a1.8 1.8 0 0 0 0-2.5 1.8 1.8 0 0 0-2.5 0L15.5 6 18 8.5Z" />
          </svg>
        </span>
      </button>
    </section>
  )
}

function ProfileInfoRow({ item }: { item: ProfileInfoItem }) {
  const isEmpty = item.value === EMPTY_PROFILE_VALUE

  return (
    <div className="my-profile-info-row">
      <dt className="my-profile-info-label">{item.label}</dt>
      <dd className="my-profile-info-value" data-empty={isEmpty ? 'true' : undefined}>
        {item.value}
      </dd>
    </div>
  )
}

function ProfileInfoActionRow({
  label,
  onClick,
  value,
}: {
  label: string
  onClick: () => void
  value: string
}) {
  return (
    <button className="my-profile-info-row my-profile-info-action-row" type="button" onClick={onClick}>
      <span className="my-profile-info-label">{label}</span>
      <span className="my-profile-info-value">
        {value}
        <span className="my-profile-row-chevron" aria-hidden="true">
          ›
        </span>
      </span>
    </button>
  )
}

function ProfileInfoSection({
  actionRow,
  items,
  primary = false,
  title,
}: {
  actionRow?: ReactNode
  items: ProfileInfoItem[]
  primary?: boolean
  title?: string
}) {
  return (
    <section
      className={`my-profile-info-section${primary ? ' my-profile-info-section-primary' : ''}`}
      aria-label={title ?? '기본 정보'}
    >
      {title != null ? (
        <header className="my-profile-info-heading">
          <strong>{title}</strong>
        </header>
      ) : null}
      <dl className="my-profile-info-list">
        {actionRow}
        {items.map((item) => (
          <ProfileInfoRow key={item.label} item={item} />
        ))}
      </dl>
    </section>
  )
}

function ProfileEditSheet({
  disabled,
  error,
  isSaving,
  onClose,
  onSave,
  profile,
}: {
  disabled: boolean
  error: string | null
  isSaving: boolean
  onClose: () => void
  onSave: (nickname: string, emojiIconFilename: string | null) => Promise<void>
  profile: UserSummary | null
}) {
  const selectedEmojiButtonRef = useRef<HTMLButtonElement | null>(null)
  const [nicknameInput, setNicknameInput] = useState(profile?.nickname ?? '')
  const [profileEmojiOptions] = useState<ProfileEmojiOption[]>(() =>
    createProfileEmojiPage({ leadingFilename: profile?.emojiIconFilename }),
  )
  const [selectedFilename, setSelectedFilename] = useState<string | null>(
    () => profile?.emojiIconFilename ?? profileEmojiOptions[0]?.emojiIconFilename ?? null,
  )
  const [validationError, setValidationError] = useState<string | null>(null)
  const help = validationError ?? error ?? '저장 전에 닉네임 중복 여부를 확인할게요.'

  useEffect(() => {
    selectedEmojiButtonRef.current?.scrollIntoView?.({ block: 'nearest', inline: 'center' })
  }, [selectedFilename])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setValidationError(null)

    try {
      await onSave(validateNickname(nicknameInput), selectedFilename)
    } catch (submitError) {
      setValidationError(submitError instanceof Error ? submitError.message : '프로필 정보를 저장하지 못했어요.')
    }
  }

  return (
    <BottomSheet
      ariaLabelledBy="my-profile-edit-title"
      className="intro-nickname-sheet my-profile-edit-sheet"
      header={
        <BottomSheet.Header className="intro-nickname-sheet-title">
          <span id="my-profile-edit-title">프로필 정보 수정</span>
        </BottomSheet.Header>
      }
      maxHeight="72vh"
      onClose={onClose}
      open
    >
      <form className="intro-nickname-card my-profile-nickname-form" onSubmit={handleSubmit}>
        <div className="intro-profile-emoji-panel" aria-label="프로필 이모지 선택">
          <div className="intro-profile-emoji-options" role="radiogroup" aria-label="프로필 이모지">
            {profileEmojiOptions.map((option) => {
              const isSelected = selectedFilename === option.emojiIconFilename

              return (
                <button
                  aria-checked={isSelected}
                  aria-label={isSelected ? `${option.label}, 선택됨` : option.label}
                  className="intro-profile-emoji-option"
                  data-selected={isSelected ? 'true' : undefined}
                  key={option.id}
                  onClick={() => setSelectedFilename(option.emojiIconFilename)}
                  ref={isSelected ? selectedEmojiButtonRef : undefined}
                  role="radio"
                  style={{ '--intro-profile-emoji-tone': option.tone } as CSSProperties}
                  type="button"
                >
                  <Asset.Image
                    alt=""
                    className="intro-profile-emoji-image"
                    frameShape={isSelected ? PROFILE_EMOJI_FRAME : PROFILE_EMOJI_RAIL_FRAME}
                    src={option.src}
                  />
                </button>
              )
            })}
          </div>
        </div>
        <TextField
          hasError={validationError != null || error != null}
          help={help}
          id="my-profile-nickname"
          inputMode="text"
          label="닉네임"
          labelOption="sustain"
          maxLength={50}
          onChange={(event) => {
            setNicknameInput(event.target.value)
            setValidationError(null)
          }}
          placeholder="닉네임"
          type="text"
          value={nicknameInput}
          variant="box"
        />
        <div className="intro-nickname-sheet-cta my-profile-edit-sheet-cta">
          <Button color="primary" display="block" disabled={disabled || isSaving} size="xlarge" type="submit" variant="fill">
            {isSaving ? '저장 중이에요' : '저장'}
          </Button>
        </div>
      </form>
    </BottomSheet>
  )
}

function FavoriteShopRow({ shop }: { shop: Shop }) {
  const subtitle = [shop.regionName, shop.categories[0]?.name].filter(Boolean).join(' · ') || shop.address

  return (
    <Link className="my-profile-list-row" to={`/shops/${shop.id}`}>
      <span className="my-profile-list-copy">
        <strong>{shop.name}</strong>
        <small>{subtitle}</small>
      </span>
      <span className="my-profile-list-meta">{shop.reviewCount}개 리뷰</span>
    </Link>
  )
}

function MyReviewRow({ review }: { review: ShopReview }) {
  const reviewSearchParams = new URLSearchParams({
    shopId: String(review.shopId),
    sheet: 'expanded',
    tab: 'review',
    focus: 'review',
    reviewId: String(review.id),
  })

  return (
    <Link
      className="my-profile-list-row"
      state={{ returnTo: '/my' }}
      to={{ pathname: '/explore', search: `?${reviewSearchParams.toString()}` }}
    >
      <span className="my-profile-list-copy">
        <strong>{review.rating.toFixed(1)}점 리뷰</strong>
        <small>{review.content}</small>
      </span>
      <span className="my-profile-list-meta">{formatProfileDate(review.createdAt)}</span>
    </Link>
  )
}

function ProfileListSection({
  children,
  count,
  emptyText,
  hasMore,
  isLoading,
  onMore,
  title,
}: {
  children: ReactNode
  count: number
  emptyText: string
  hasMore: boolean
  isLoading: boolean
  onMore: () => void
  title: string
}) {
  return (
    <section className="my-profile-info-section" aria-label={title}>
      <header className="my-profile-info-heading">
        <strong>{title}</strong>
        <span>{count}개</span>
      </header>
      <div className="my-profile-list">
        {children}
        {!isLoading && count === 0 ? <p className="my-profile-state">{emptyText}</p> : null}
        {isLoading ? <p className="my-profile-state">불러오는 중이에요.</p> : null}
        {hasMore ? (
          <button className="my-profile-list-more-button" type="button" onClick={onMore}>
            더보기
          </button>
        ) : null}
      </div>
    </section>
  )
}

function buildProfileInfo(profile: UserSummary | null): ProfileInfoItem[] {
  return [
    { label: '가입일', value: formatProfileDate(profile?.createdAt) },
    { label: '최근 로그인', value: formatProfileDate(profile?.lastLoginAt) },
  ]
}

export function MyPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const session = useMemo(() => readAuthSession(), [])
  const hasSession = session != null
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false)
  const [favoriteVisibleCount, setFavoriteVisibleCount] = useState(PROFILE_LIST_INITIAL_COUNT)
  const [reviewVisibleCount, setReviewVisibleCount] = useState(PROFILE_LIST_INITIAL_COUNT)
  const [profileEditError, setProfileEditError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

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
    queryKey: ['shop-reviews', 'me', 'my-page', reviewVisibleCount],
    queryFn: () => listMyReviews({ page: 0, size: reviewVisibleCount, sort: 'NEWEST' }),
    enabled: hasSession,
  })
  const profile = profileQuery.data ?? session?.user ?? null
  const favoriteShops = favoriteShopsQuery.data ?? []
  const visibleFavoriteShops = favoriteShops.slice(0, favoriteVisibleCount)
  const reviews = myReviewsQuery.data?.content ?? []
  const reviewTotalCount = myReviewsQuery.data?.totalElements ?? reviews.length

  const applyProfileUpdate = (user: UserSummary) => {
    updateAuthSessionUser(user)
    queryClient.setQueryData(['users', 'me', 'my-page'], user)
  }

  const profileMutation = useMutation({
    mutationFn: async ({
      emojiIconFilename,
      nickname,
    }: {
      emojiIconFilename: string | null
      nickname: string
    }) => {
      const currentNickname = profile?.nickname?.trim() ?? ''
      if (nickname !== currentNickname) {
        const availability = await checkNicknameAvailability(nickname, session?.accessToken)
        if (!availability.available) {
          throw new Error('이미 사용 중인 닉네임이에요.')
        }
      }

      return updateMyNickname({ nickname, emojiIconFilename }, session?.accessToken)
    },
    onSuccess: (user) => {
      applyProfileUpdate(user)
      setProfileEditError(null)
      setIsProfileSheetOpen(false)
      setToastMessage('프로필 정보가 변경됐어요.')
    },
    onError: (error) => {
      setProfileEditError(error instanceof Error ? error.message : '프로필 정보를 저장하지 못했어요.')
    },
  })

  return (
    <main className="app-shell my-profile-shell">
      <AppTopNavigation
        className="route-navigation"
        showBack
        showLogo={false}
        title="내 정보"
        onBack={() => navigate('/home', { replace: true })}
      />
      <div className="my-profile-content">
        <ProfileAvatar
          profile={profile}
          onEdit={() => {
            setProfileEditError(null)
            setIsProfileSheetOpen(true)
          }}
        />

        {profileQuery.isError ? (
          <p className="my-profile-state error-text" role="alert">
            {(profileQuery.error as Error).message}
          </p>
        ) : null}

        <ProfileInfoSection
          primary
          actionRow={
            <ProfileInfoActionRow
              label="닉네임"
              value={textOrEmpty(profile?.nickname)}
              onClick={() => {
                setProfileEditError(null)
                setIsProfileSheetOpen(true)
              }}
            />
          }
          items={buildProfileInfo(profile)}
        />
        <ProfileListSection
          title="내 관심 매장"
          count={favoriteShops.length}
          emptyText="저장한 관심 매장이 없어요."
          isLoading={favoriteShopsQuery.isLoading}
          hasMore={favoriteShops.length > visibleFavoriteShops.length}
          onMore={() => setFavoriteVisibleCount((count) => count + PROFILE_LIST_INITIAL_COUNT)}
        >
          {visibleFavoriteShops.map((shop) => (
            <FavoriteShopRow key={shop.id} shop={shop} />
          ))}
        </ProfileListSection>
        <ProfileListSection
          title="내 리뷰"
          count={reviewTotalCount}
          emptyText="아직 작성한 리뷰가 없어요."
          isLoading={myReviewsQuery.isLoading}
          hasMore={reviewTotalCount > reviews.length}
          onMore={() => setReviewVisibleCount((count) => count + PROFILE_LIST_INITIAL_COUNT)}
        >
          {reviews.map((review) => (
            <MyReviewRow key={review.id} review={review} />
          ))}
        </ProfileListSection>

      </div>
      {toastMessage != null ? (
        <div className="my-profile-toast" role="status">
          {toastMessage}
        </div>
      ) : null}
      {isProfileSheetOpen ? (
        <ProfileEditSheet
          key={profile?.emojiIconFilename ?? 'empty-profile-image'}
          disabled={!hasSession}
          error={profileEditError}
          isSaving={profileMutation.isPending}
          profile={profile}
          onClose={() => setIsProfileSheetOpen(false)}
          onSave={(nickname, emojiIconFilename) =>
            profileMutation.mutateAsync({ nickname, emojiIconFilename }).then(() => undefined)
          }
        />
      ) : null}
    </main>
  )
}
