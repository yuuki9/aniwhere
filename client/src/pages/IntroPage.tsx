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
import { Asset, Button, Modal, TextField, Top } from '@aniwhere/tds-mobile'

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
  }

const CONFETTI_LOTTIE_SRC = 'https://static.toss.im/lotties-common/confetti-spot.json'
const NICKNAME_REQUIRED_MESSAGE = '닉네임을 한 글자 이상 입력해 주세요.'

type NicknameStep = 'input' | 'welcome'

type NicknameOnboardingModalProps = {
  error: string | null
  input: string
  isSaving: boolean
  onChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onWelcomeHome: () => void
  open: boolean
  savedNickname: string
  step: NicknameStep
  touched: boolean
}

function NicknameOnboardingModal({
  error,
  input,
  isSaving,
  onChange,
  onSubmit,
  onWelcomeHome,
  open,
  savedNickname,
  step,
  touched,
}: NicknameOnboardingModalProps) {
  const hasLengthError = touched && input.trim().length < 1
  const fieldHelp = error ?? (hasLengthError ? NICKNAME_REQUIRED_MESSAGE : '후기와 댓글에 표시되는 이름이에요.')
  const hasError = error != null || hasLengthError

  return (
    <Modal open={open}>
      <Modal.Overlay />
      <Modal.Content
        aria-describedby={step === 'input' ? 'intro-nickname-help' : 'intro-welcome-description'}
        aria-labelledby={step === 'input' ? 'intro-nickname-title' : 'intro-welcome-title'}
        className="intro-nickname-modal"
      >
        {step === 'input' ? (
          <form className="intro-nickname-card" onSubmit={onSubmit}>
            <div className="intro-nickname-modal-head">
              <h2 id="intro-nickname-title">애니웨어에서 사용할 닉네임을 정해 주세요</h2>
              <p>토스 로그인은 완료됐어요. 이제 애니웨어 안에서 보일 이름만 설정하면 돼요.</p>
            </div>
            <TextField
              hasError={hasError}
              help={fieldHelp}
              id="intro-nickname"
              inputMode="text"
              label="애니웨어에서 사용할 닉네임"
              labelOption="sustain"
              maxLength={50}
              onChange={(event) => onChange(event.target.value)}
              placeholder="예: 굿즈탐험가"
              type="text"
              value={input}
              variant="box"
            />
            <p className="intro-nickname-help" id="intro-nickname-help">
              저장 전에 닉네임 중복 여부를 확인해요.
            </p>
            <Button
              color="primary"
              display="block"
              disabled={isSaving}
              size="xlarge"
              type="submit"
              variant="fill"
            >
              {isSaving ? '확인 중이에요' : '닉네임 저장하기'}
            </Button>
          </form>
        ) : (
          <div className="intro-welcome-panel">
            <Top
              className="intro-welcome-top"
              right={
                <Top.RightAssetContent
                  content={
                    <Asset.Lottie
                      aria-hidden={true}
                      frameShape={Asset.frameShape.CleanW60}
                      loop={true}
                      src={CONFETTI_LOTTIE_SRC}
                    />
                  }
                />
              }
              subtitleBottom={
                <Top.SubtitleParagraph id="intro-welcome-description">
                  이제 저장된 닉네임으로 후기와 댓글을 남길 수 있어요.
                </Top.SubtitleParagraph>
              }
              title={
                <Top.TitleParagraph id="intro-welcome-title">
                  환영합니다
                  <br />
                  {savedNickname}님
                </Top.TitleParagraph>
              }
            />
            <Button color="primary" display="block" onClick={onWelcomeHome} size="xlarge" variant="fill">
              홈으로 가기
            </Button>
          </div>
        )}
      </Modal.Content>
    </Modal>
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
  const [nicknameStep, setNicknameStep] = useState<NicknameStep>('input')
  const [savedNickname, setSavedNickname] = useState('')
  const isNicknameModalOpen = pendingNicknameSession != null || isMockNicknameOnboardingOpen

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
      const state: EntryRouteState = { entryMode: 'toss' }
      if (result.mode === 'needsNickname') {
        setPendingNicknameSession(result.session)
        setIsMockNicknameOnboardingOpen(false)
        setNicknameInput(result.user.nickname ?? '')
        setNicknameTouched(false)
        setNicknameError(null)
        setNicknameStep('input')
        setSavedNickname('')
        return
      }
      navigate('/home', { state })
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
    setNicknameStep('input')
    setSavedNickname('')
    setEntryError(null)
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
      setSavedNickname(nickname)
      setNicknameStep('welcome')
      return
    }

    setIsSavingNickname(true)
    setNicknameError(null)
    setEntryError(null)

    try {
      const user = await saveAniwhereNickname(nickname, pendingNicknameSession.accessToken)
      setSavedNickname(user.nickname ?? nickname)
      setNicknameStep('welcome')
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

  const handleWelcomeHome = () => {
    navigate('/home', {
      state: { entryMode: pendingNicknameSession == null ? 'mock' : 'toss' } satisfies EntryRouteState,
    })
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
            disabled={isEntering || isNicknameModalOpen}
            onClick={handleStart}
            size="xlarge"
            variant="fill"
          >
            {isEntering ? '로그인 중이에요' : '로그인하고 입장하기'}
          </Button>
          {!isNicknameModalOpen ? (
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
      <NicknameOnboardingModal
        error={nicknameError}
        input={nicknameInput}
        isSaving={isSavingNickname}
        onChange={handleNicknameChange}
        onSubmit={handleNicknameSubmit}
        onWelcomeHome={handleWelcomeHome}
        open={isNicknameModalOpen}
        savedNickname={savedNickname}
        step={nicknameStep}
        touched={nicknameTouched}
      />
    </main>
  )
}
