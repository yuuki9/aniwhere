import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import introFeatureCurationIcon from '../assets/icons/intro-feature-curation.webp'
import introFeatureMapIcon from '../assets/icons/intro-feature-map.webp'
import introFeatureReviewIcon from '../assets/icons/intro-feature-review.webp'
import aniwhereIcon from '../assets/aniwhere_icon.png'
import introStoreGuide from '../assets/intro-store-guide.webp'
import { isAppsInTossRuntime, startServiceEntry, TOSS_LOGIN_UNAVAILABLE_MESSAGE } from '../shared/lib/auth'
import { completeServiceEntry, saveAniwhereNickname } from '../shared/lib/authEntryFlow'
import type { AuthSession } from '../shared/lib/authSession'
import { Asset, BottomSheet, Button, TextField } from '@aniwhere/tds-mobile'

type IntroFeatureIconType = 'curation' | 'map' | 'review'
type IntroFeatureIconName = 'icon-star-mono' | 'icon-pin-mono' | 'icon-pencil-mono'

const featureItems = [
  {
    icon: 'curation',
    iconName: 'icon-star-mono',
    title: '관심 있는 작품이 생겼나요?',
    body: '관련 굿즈샵을 추천해드려요',
  },
  {
    icon: 'map',
    iconName: 'icon-pin-mono',
    title: '지도에서 한눈에 확인해요',
    body: '필터로 원하는 매장을 찾아봐요',
  },
  {
    icon: 'review',
    iconName: 'icon-pencil-mono',
    title: '방문후기를 남겨요',
    body: '채택되면 포인트도 받을 수 있어요',
  },
] as const

function IntroFeatureIcon({ name, type }: { name: IntroFeatureIconName; type: IntroFeatureIconType }) {
  const iconSrc = {
    curation: introFeatureCurationIcon,
    map: introFeatureMapIcon,
    review: introFeatureReviewIcon,
  }[type]

  return (
    <span
      className={`intro-feature-icon intro-feature-icon-${type}`}
      data-tds-asset-shape="squircle-background"
      data-tds-asset-size="medium"
      data-tds-icon-name={name}
      aria-hidden="true"
    >
      <img alt="" className="intro-feature-icon-image" src={iconSrc} />
    </span>
  )
}

function IntroNavigation() {
  if (isAppsInTossRuntime()) {
    return null
  }

  return (
    <header className="intro-navigation">
      <div className="intro-navigation-brand" aria-label="애니웨어">
        <img className="intro-navigation-logo" src={aniwhereIcon} alt="" aria-hidden="true" />
        <span>애니웨어</span>
      </div>
    </header>
  )
}

type EntryRouteState =
  {
    entryMode: 'mock' | 'toss'
    welcomeEmoji?: string
    welcomeNickname?: string
  }

const NICKNAME_REQUIRED_MESSAGE = '닉네임을 한 글자 이상 입력해 주세요.'
const DEFAULT_PROFILE_EMOJI_ID = 'alien'
const PROFILE_EMOJI_FRAME = { width: 72, height: 72, radius: 36 }
const PROFILE_EMOJI_RAIL_FRAME = { width: 40, height: 40, radius: 20 }

const profileEmojiOptions = [
  {
    id: 'fire',
    label: '파란 불꽃',
    src: 'https://static.toss.im/2d-emojis/png/4x/u1F525.png',
    symbol: '🔥',
  },
  {
    id: 'skull',
    label: '해골',
    src: 'https://static.toss.im/2d-emojis/png/4x/u1F480.png',
    symbol: '💀',
  },
  {
    id: 'alien',
    label: '초록 외계인',
    src: 'https://static.toss.im/2d-emojis/png/4x/u1F47D.png',
    symbol: '👽',
  },
  {
    id: 'bomb',
    label: '폭탄',
    src: 'https://static.toss.im/2d-emojis/png/4x/u1F4A3.png',
    symbol: '💣',
  },
  {
    id: 'seedling',
    label: '새싹',
    src: 'https://static.toss.im/2d-emojis/png/4x/u1F331.png',
    symbol: '🌱',
  },
  {
    id: 'sunglasses',
    label: '선글라스 얼굴',
    src: 'https://static.toss.im/2d-emojis/png/4x/u1F60E.png',
    symbol: '😎',
  },
  {
    id: 'sparkles',
    label: '반짝이',
    src: 'https://static.toss.im/2d-emojis/png/4x/u2728.png',
    symbol: '✨',
  },
  {
    id: 'rocket',
    label: '로켓',
    src: 'https://static.toss.im/2d-emojis/png/4x/u1F680.png',
    symbol: '🚀',
  },
  {
    id: 'game',
    label: '게임 패드',
    src: 'https://static.toss.im/2d-emojis/png/4x/u1F3AE.png',
    symbol: '🎮',
  },
] as const

type ProfileEmojiOption = (typeof profileEmojiOptions)[number]

function getProfileEmojiOption(id: string) {
  return (
    profileEmojiOptions.find((option) => option.id === id) ??
    profileEmojiOptions.find((option) => option.id === DEFAULT_PROFILE_EMOJI_ID) ??
    profileEmojiOptions[0]
  )
}

type NicknameOnboardingSheetProps = {
  error: string | null
  input: string
  isSaving: boolean
  onChange: (value: string) => void
  onClose: () => void
  onEmojiChange: (id: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  open: boolean
  selectedEmoji: ProfileEmojiOption
  touched: boolean
}

function NicknameOnboardingSheet({
  error,
  input,
  isSaving,
  onChange,
  onClose,
  onEmojiChange,
  onSubmit,
  open,
  selectedEmoji,
  touched,
}: NicknameOnboardingSheetProps) {
  const hasLengthError = touched && input.trim().length < 1
  const fieldHelp = error ?? (hasLengthError ? NICKNAME_REQUIRED_MESSAGE : undefined)
  const hasError = error != null || hasLengthError

  return (
    <BottomSheet
      ariaLabelledBy="intro-nickname-title"
      className="intro-nickname-sheet"
      cta={
        <Button
          color="primary"
          display="block"
          disabled={isSaving}
          form="intro-nickname-form"
          size="xlarge"
          type="submit"
          variant="fill"
        >
          {isSaving ? '확인 중이에요' : '확인'}
        </Button>
      }
      header={
        <BottomSheet.Header className="intro-nickname-sheet-title">
          <span id="intro-nickname-title">애니웨어에서 사용할 닉네임이 필요해요</span>
        </BottomSheet.Header>
      }
      maxHeight="72vh"
      onClose={onClose}
      open={open}
    >
      <form className="intro-nickname-card" id="intro-nickname-form" onSubmit={onSubmit}>
        <div className="intro-profile-emoji-panel" aria-label="프로필 이모지 선택">
          <div className="intro-profile-emoji-options" role="radiogroup" aria-label="프로필 이모지">
            {profileEmojiOptions.map((option) => {
              const isSelected = option.id === selectedEmoji.id

              return (
                <button
                  aria-checked={isSelected}
                  aria-label={isSelected ? `${option.label}, 선택됨` : option.label}
                  className="intro-profile-emoji-option"
                  data-selected={isSelected ? 'true' : undefined}
                  key={option.id}
                  onClick={() => onEmojiChange(option.id)}
                  role="radio"
                  type="button"
                >
                  <Asset.Image
                    alt=""
                    frameShape={isSelected ? PROFILE_EMOJI_FRAME : PROFILE_EMOJI_RAIL_FRAME}
                    src={option.src}
                  />
                </button>
              )
            })}
          </div>
        </div>
        <TextField
          hasError={hasError}
          help={fieldHelp}
          id="intro-nickname"
          inputMode="text"
          label="닉네임"
          labelOption="sustain"
          maxLength={50}
          onChange={(event) => onChange(event.target.value)}
          placeholder="예: 굿즈탐험가"
          type="text"
          value={input}
          variant="box"
        />
      </form>
    </BottomSheet>
  )
}

export function IntroPage() {
  const navigate = useNavigate()
  const isEntryAttemptInFlightRef = useRef(false)
  const [isEntering, setIsEntering] = useState(false)
  const [isSavingNickname, setIsSavingNickname] = useState(false)
  const [entryError, setEntryError] = useState<string | null>(null)
  const [pendingNicknameSession, setPendingNicknameSession] = useState<AuthSession | null>(null)
  const [isMockNicknameOnboardingOpen, setIsMockNicknameOnboardingOpen] = useState(false)
  const [nicknameInput, setNicknameInput] = useState('')
  const [nicknameTouched, setNicknameTouched] = useState(false)
  const [nicknameError, setNicknameError] = useState<string | null>(null)
  const [selectedProfileEmojiId, setSelectedProfileEmojiId] = useState(DEFAULT_PROFILE_EMOJI_ID)
  const selectedProfileEmoji = getProfileEmojiOption(selectedProfileEmojiId)
  const isNicknameSheetOpen = pendingNicknameSession != null || isMockNicknameOnboardingOpen

  useEffect(() => {
    document.body.classList.add('intro-route-body')

    return () => {
      document.body.classList.remove('intro-route-body')
    }
  }, [])

  const handleStart = async () => {
    if (isEntryAttemptInFlightRef.current) {
      return
    }

    isEntryAttemptInFlightRef.current = true
    setIsEntering(true)
    setEntryError(null)

    try {
      const entry = await startServiceEntry()
      const result = await completeServiceEntry(entry)
      if (result.mode === 'needsNickname') {
        setPendingNicknameSession(result.session)
        setIsMockNicknameOnboardingOpen(false)
        setNicknameInput(result.user.nickname ?? '')
        setNicknameTouched(false)
        setNicknameError(null)
        return
      }
      navigate('/home', {
        state: { entryMode: 'toss', welcomeNickname: result.user.nickname ?? undefined } satisfies EntryRouteState,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : '로그인을 완료하지 못했어요. 다시 시도해 주세요.'
      if (message !== TOSS_LOGIN_UNAVAILABLE_MESSAGE) {
        console.error('[aniwhere:intro] service entry failed', error)
      }
      setEntryError(message)
    } finally {
      isEntryAttemptInFlightRef.current = false
      setIsEntering(false)
    }
  }

  const handleMockNicknameStart = () => {
    if (isEntryAttemptInFlightRef.current || isEntering) {
      return
    }

    setPendingNicknameSession(null)
    setIsMockNicknameOnboardingOpen(true)
    setNicknameInput('')
    setNicknameTouched(false)
    setNicknameError(null)
    setSelectedProfileEmojiId(DEFAULT_PROFILE_EMOJI_ID)
    setEntryError(null)
  }

  const handleNicknameSheetClose = () => {
    setPendingNicknameSession(null)
    setIsMockNicknameOnboardingOpen(false)
    setNicknameInput('')
    setNicknameTouched(false)
    setNicknameError(null)
    setSelectedProfileEmojiId(DEFAULT_PROFILE_EMOJI_ID)
  }

  const handleNicknameSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const isMockNicknameFlow = pendingNicknameSession == null && isMockNicknameOnboardingOpen
    if (pendingNicknameSession == null && !isMockNicknameFlow) {
      return
    }

    setNicknameTouched(true)
    const nickname = nicknameInput.trim()
    if (nickname.length < 1) {
      setNicknameError(NICKNAME_REQUIRED_MESSAGE)
      return
    }

    if (isMockNicknameFlow) {
      navigate('/home', {
        state: {
          entryMode: 'mock',
          welcomeEmoji: selectedProfileEmoji.symbol,
          welcomeNickname: nickname,
        } satisfies EntryRouteState,
      })
      return
    }

    setIsSavingNickname(true)
    setNicknameError(null)
    setEntryError(null)

    try {
      const user = await saveAniwhereNickname(nickname, pendingNicknameSession.accessToken)
      navigate('/home', {
        state: {
          entryMode: 'toss',
          welcomeEmoji: selectedProfileEmoji.symbol,
          welcomeNickname: user.nickname ?? nickname,
        } satisfies EntryRouteState,
      })
    } catch (error) {
      setNicknameError(error instanceof Error ? error.message : '닉네임을 저장하지 못했어요. 다시 시도해 주세요.')
    } finally {
      setIsSavingNickname(false)
    }
  }

  const handleNicknameChange = (value: string) => {
    setNicknameInput(value)
    if (nicknameTouched || nicknameError != null) {
      setNicknameTouched(true)
      setNicknameError(value.trim().length < 1 ? NICKNAME_REQUIRED_MESSAGE : null)
    }
  }

  return (
    <main className="app-shell intro-mobile-shell">
      <IntroNavigation />
      <section className="section intro-mobile-panel">
        <figure className="intro-guide-figure">
          <img
            alt="지도 위 굿즈샵 정보를 안내하는 애니웨어 마스코트"
            className="intro-guide-image"
            src={introStoreGuide}
          />
        </figure>

        <div className="intro-top">
          <h1 className="intro-top-title">
            흩어진 굿즈샵 정보,
            <br />
            <span className="intro-title-accent">애니웨어</span>에 모아뒀어요
          </h1>
        </div>

        <ul className="intro-feature-list" aria-label="Aniwhere 주요 기능">
          {featureItems.map((item) => (
            <li className={`intro-chain-row intro-chain-row-${item.icon}`} key={item.title}>
              <span className="intro-feature-asset">
                <IntroFeatureIcon name={item.iconName} type={item.icon} />
              </span>
              <span className="intro-feature-copy">
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="intro-mobile-actions">
          <Button
            color="primary"
            display="block"
            disabled={isEntering || isNicknameSheetOpen}
            onClick={handleStart}
            size="xlarge"
            variant="fill"
          >
            {isEntering ? '로그인 중이에요' : '로그인하고 입장하기'}
          </Button>
          {!isNicknameSheetOpen ? (
            <button
              className="intro-login-skip-button"
              disabled={isEntering}
              type="button"
              onClick={handleMockNicknameStart}
            >
              닉네임 설정하고 입장
            </button>
          ) : null}
          {entryError ? <p className="intro-entry-error">{entryError}</p> : null}
        </div>
      </section>
      <NicknameOnboardingSheet
        error={nicknameError}
        input={nicknameInput}
        isSaving={isSavingNickname}
        onChange={handleNicknameChange}
        onClose={handleNicknameSheetClose}
        onEmojiChange={setSelectedProfileEmojiId}
        onSubmit={handleNicknameSubmit}
        open={isNicknameSheetOpen}
        selectedEmoji={selectedProfileEmoji}
        touched={nicknameTouched}
      />
    </main>
  )
}
