import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import introFeatureCurationIcon from '../assets/icons/intro-feature-curation.webp'
import introFeatureMapIcon from '../assets/icons/intro-feature-map.webp'
import introFeatureReviewIcon from '../assets/icons/intro-feature-review.webp'
import aniwhereIcon from '../assets/aniwhere_icon.png'
import introStoreGuide from '../assets/intro-store-guide.webp'
import { isAppsInTossRuntime, startServiceEntry, TOSS_LOGIN_UNAVAILABLE_MESSAGE } from '../shared/lib/auth'
import { completeServiceEntry, saveAniwhereNickname } from '../shared/lib/authEntryFlow'
import type { AuthSession } from '../shared/lib/authSession'
import {
  createRandomProfileEmojiSet,
  getProfileEmojiOption,
  getProfileEmojiSymbol,
  PROFILE_EMOJI_INTRO_COUNT,
  PROFILE_EMOJI_OPTIONS,
  type ProfileEmojiOption,
} from '../shared/lib/profileEmojiOptions'
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
const PROFILE_EMOJI_FRAME = { width: 58, height: 58, radius: 29 }
const PROFILE_EMOJI_RAIL_FRAME = { width: 34, height: 34, radius: 17 }

type NicknameOnboardingSheetProps = {
  error: string | null
  input: string
  isSaving: boolean
  onChange: (value: string) => void
  onClose: () => void
  onEmojiChange: (id: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  emojiOptions: readonly ProfileEmojiOption[]
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
  emojiOptions,
  open,
  selectedEmoji,
  touched,
}: NicknameOnboardingSheetProps) {
  const selectedEmojiButtonRef = useRef<HTMLButtonElement | null>(null)
  const hasLengthError = touched && input.trim().length < 1
  const fieldHelp = error ?? (hasLengthError ? NICKNAME_REQUIRED_MESSAGE : undefined)
  const hasError = error != null || hasLengthError

  useEffect(() => {
    if (!open) {
      return
    }

    selectedEmojiButtonRef.current?.scrollIntoView?.({ block: 'nearest', inline: 'center' })
  }, [open, selectedEmoji.id])

  return (
    <BottomSheet
      ariaLabelledBy="intro-nickname-title"
      className="intro-nickname-sheet"
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
            {emojiOptions.map((option) => {
              const isSelected = option.id === selectedEmoji.id

              return (
                <button
                  aria-checked={isSelected}
                  aria-label={isSelected ? `${option.label}, 선택됨` : option.label}
                  className="intro-profile-emoji-option"
                  data-selected={isSelected ? 'true' : undefined}
                  key={option.id}
                  onClick={() => onEmojiChange(option.id)}
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
        <div className="intro-nickname-sheet-cta">
          <Button color="primary" display="block" disabled={isSaving} size="xlarge" type="submit" variant="fill">
            {isSaving ? '확인 중이에요' : '확인'}
          </Button>
        </div>
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
  const [profileEmojiSet, setProfileEmojiSet] = useState<ProfileEmojiOption[]>(() =>
    createRandomProfileEmojiSet(PROFILE_EMOJI_INTRO_COUNT),
  )
  const [selectedProfileEmojiId, setSelectedProfileEmojiId] = useState(
    () => profileEmojiSet[0]?.id ?? PROFILE_EMOJI_OPTIONS[0].id,
  )
  const selectedProfileEmoji = getProfileEmojiOption(selectedProfileEmojiId)
  const isNicknameSheetOpen = pendingNicknameSession != null || isMockNicknameOnboardingOpen

  useEffect(() => {
    document.body.classList.add('intro-route-body')

    return () => {
      document.body.classList.remove('intro-route-body')
    }
  }, [])

  const openNicknameOnboardingSheet = (initialNickname: string) => {
    const emojiSet = createRandomProfileEmojiSet(PROFILE_EMOJI_INTRO_COUNT)
    setProfileEmojiSet(emojiSet)
    setSelectedProfileEmojiId(emojiSet[0]?.id ?? PROFILE_EMOJI_OPTIONS[0].id)
    setNicknameInput(initialNickname)
    setNicknameTouched(false)
    setNicknameError(null)
  }

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
        openNicknameOnboardingSheet(result.user.nickname ?? '')
        setPendingNicknameSession(result.session)
        setIsMockNicknameOnboardingOpen(false)
        return
      }
      navigate('/home', {
        state: {
          entryMode: 'toss',
          welcomeEmoji: getProfileEmojiSymbol(result.user.emojiIconFilename),
          welcomeNickname: result.user.nickname ?? undefined,
        } satisfies EntryRouteState,
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
    openNicknameOnboardingSheet('')
    setIsMockNicknameOnboardingOpen(true)
    setEntryError(null)
  }

  const handleNicknameSheetClose = () => {
    setPendingNicknameSession(null)
    setIsMockNicknameOnboardingOpen(false)
    setNicknameInput('')
    setNicknameTouched(false)
    setNicknameError(null)
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
      const user = await saveAniwhereNickname(nickname, pendingNicknameSession.accessToken, selectedProfileEmoji.emojiIconFilename)
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
        emojiOptions={profileEmojiSet}
        onSubmit={handleNicknameSubmit}
        open={isNicknameSheetOpen}
        selectedEmoji={selectedProfileEmoji}
        touched={nicknameTouched}
      />
    </main>
  )
}
