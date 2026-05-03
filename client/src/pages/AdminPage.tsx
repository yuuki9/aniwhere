import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getShopPhotos,
  listPointGrantRequests,
  queuePointGrantRequest,
  recordSdkPointGrant,
  removeShopPhoto,
  uploadShopPhotos,
} from '../shared/api/admin'
import { createShop, deleteShop, getShops, updateShop } from '../shared/api/shops'
import type { Shop, ShopRequest, ShopStatus } from '../shared/api/types'
import {
  canUseAdminPreview,
  clearAdminSession,
  hasConfiguredAdminCode,
  isAdminUnlocked,
  unlockAdminPreview,
  unlockAdminSession,
} from '../shared/lib/adminAccess'
import { formatDateTime } from '../shared/lib/format'
import { grantPromotionRewardForCurrentUser } from '../shared/lib/tossPromotion'
import { GlobalNavigationMenu } from '../shared/ui/GlobalNavigationMenu'
import { StatusPill } from '../shared/ui/StatusPill'

const EMPTY_SHOPS: Shop[] = []
type AdminMobileSection = 'shops' | 'editor' | 'points' | 'history'

type AdminPageProps = {
  initialSection?: AdminMobileSection
  skipUnlock?: boolean
}

type ShopFormState = {
  name: string
  address: string
  px: string
  py: string
  floor: string
  regionId: string
  status: ShopStatus
  sellsIchibanKuji: boolean
  visitTip: string
}

const EMPTY_SHOP_FORM: ShopFormState = {
  name: '',
  address: '',
  px: '',
  py: '',
  floor: '',
  regionId: '',
  status: 'UNVERIFIED',
  sellsIchibanKuji: false,
  visitTip: '',
}

function toShopFormState(shop?: Shop | null): ShopFormState {
  if (!shop) {
    return EMPTY_SHOP_FORM
  }

  return {
    name: shop.name,
    address: shop.address,
    px: String(shop.px),
    py: String(shop.py),
    floor: shop.floor ?? '',
    regionId: shop.regionId != null ? String(shop.regionId) : '',
    status: shop.status,
    sellsIchibanKuji: Boolean(shop.sellsIchibanKuji),
    visitTip: shop.visitTip ?? '',
  }
}

function getPendingPreviewUrls(files: File[]) {
  return files.map((file) => ({
    id: `${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    url: URL.createObjectURL(file),
  }))
}

export function AdminPage({
  initialSection = 'shops',
  skipUnlock = false,
}: AdminPageProps = {}) {
  const queryClient = useQueryClient()
  const [isUnlocked, setIsUnlocked] = useState(skipUnlock || isAdminUnlocked())
  const [unlockCode, setUnlockCode] = useState('')
  const [unlockError, setUnlockError] = useState<string | null>(null)
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null)
  const [shopForm, setShopForm] = useState<ShopFormState>(EMPTY_SHOP_FORM)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [shopNotice, setShopNotice] = useState<string | null>(null)
  const [pointNotice, setPointNotice] = useState<string | null>(null)
  const [pointForm, setPointForm] = useState({
    recipientLabel: '',
    recipientUserKey: '',
    amount: '100',
    promotionCode: '',
    reason: '',
  })
  const [mobileSection, setMobileSection] = useState<AdminMobileSection>(initialSection)

  const shopsQuery = useQuery({
    queryKey: ['shops', 'admin-console'],
    queryFn: () => getShops({ page: 0, size: 200 }),
    enabled: isUnlocked,
  })

  const pointGrantQuery = useQuery({
    queryKey: ['admin-point-grants'],
    queryFn: listPointGrantRequests,
    enabled: isUnlocked,
  })

  const selectedShopPhotosQuery = useQuery({
    queryKey: ['admin-shop-photos', selectedShopId],
    queryFn: () => getShopPhotos(selectedShopId as number),
    enabled: isUnlocked && selectedShopId != null,
  })

  const shops = useMemo(() => shopsQuery.data?.content ?? EMPTY_SHOPS, [shopsQuery.data?.content])

  const pendingPreviewItems = useMemo(() => getPendingPreviewUrls(pendingFiles), [pendingFiles])

  useEffect(() => {
    return () => {
      pendingPreviewItems.forEach((item) => URL.revokeObjectURL(item.url))
    }
  }, [pendingPreviewItems])

  const saveShopMutation = useMutation({
    mutationFn: async () => {
      const px = Number(shopForm.px)
      const py = Number(shopForm.py)

      if (!shopForm.name.trim() || !shopForm.address.trim()) {
        throw new Error('매장명과 주소를 입력해주세요.')
      }

      if (!Number.isFinite(px) || !Number.isFinite(py)) {
        throw new Error('좌표(px, py)는 숫자로 입력해주세요.')
      }

      const payload: ShopRequest = {
        name: shopForm.name.trim(),
        address: shopForm.address.trim(),
        px,
        py,
        floor: shopForm.floor.trim() || null,
        regionId: shopForm.regionId ? Number(shopForm.regionId) : null,
        status: shopForm.status,
        sellsIchibanKuji: shopForm.sellsIchibanKuji,
        visitTip: shopForm.visitTip.trim() || null,
      }

      const savedShop = selectedShopId
        ? await updateShop(selectedShopId, payload)
        : await createShop(payload)

      if (pendingFiles.length > 0) {
        await uploadShopPhotos(savedShop.id, pendingFiles)
      }

      return savedShop
    },
    onSuccess: async (savedShop) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['shops'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-shop-photos', savedShop.id] }),
      ])

      setSelectedShopId(savedShop.id)
      setShopForm(toShopFormState(savedShop))
      setPendingFiles([])
      setMobileSection('editor')
      setShopNotice(selectedShopId ? '매장 정보를 수정했습니다.' : '새 매장을 등록했습니다.')
    },
    onError: (error) => {
      setShopNotice(error instanceof Error ? error.message : '매장 저장에 실패했습니다.')
    },
  })

  const deleteShopMutation = useMutation({
    mutationFn: async () => {
      if (selectedShopId == null) {
        throw new Error('삭제할 매장을 먼저 선택해주세요.')
      }

      await deleteShop(selectedShopId)
      return selectedShopId
    },
    onSuccess: async (deletedShopId) => {
      await queryClient.invalidateQueries({ queryKey: ['shops'] })
      setSelectedShopId(null)
      setShopForm(EMPTY_SHOP_FORM)
      setPendingFiles([])
      setShopNotice(`매장 #${deletedShopId}를 삭제했습니다.`)
    },
    onError: (error) => {
      setShopNotice(error instanceof Error ? error.message : '매장 삭제에 실패했습니다.')
    },
  })

  const removePhotoMutation = useMutation({
    mutationFn: ({ shopId, photoId }: { shopId: number; photoId: string }) => removeShopPhoto(shopId, photoId),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['admin-shop-photos', variables.shopId] })
      setShopNotice('사진을 제거했습니다.')
    },
  })

  const queuePointMutation = useMutation({
    mutationFn: () => {
      const amount = Number(pointForm.amount)

      if (!pointForm.recipientLabel.trim() || !pointForm.recipientUserKey.trim()) {
        throw new Error('대상자 표기명과 userKey를 입력해주세요.')
      }

      if (!pointForm.promotionCode.trim() || !pointForm.reason.trim()) {
        throw new Error('프로모션 코드와 지급 사유를 입력해주세요.')
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('포인트는 1 이상 숫자로 입력해주세요.')
      }

      return queuePointGrantRequest({
        recipientLabel: pointForm.recipientLabel.trim(),
        recipientUserKey: pointForm.recipientUserKey.trim(),
        amount,
        promotionCode: pointForm.promotionCode.trim(),
        reason: pointForm.reason.trim(),
      })
    },
    onSuccess: async (grant) => {
      await queryClient.invalidateQueries({ queryKey: ['admin-point-grants'] })
      setPointNotice(grant.resultMessage ?? '지급 대기열에 등록했습니다.')
    },
    onError: (error) => {
      setPointNotice(error instanceof Error ? error.message : '포인트 지급 대기열 등록에 실패했습니다.')
    },
  })

  const sdkGrantMutation = useMutation({
    mutationFn: async () => {
      const amount = Number(pointForm.amount)
      const promotionCode = pointForm.promotionCode.trim()

      if (!promotionCode) {
        throw new Error('SDK 테스트에는 프로모션 코드가 필요합니다.')
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('테스트 지급 포인트를 확인해주세요.')
      }

      const result = await grantPromotionRewardForCurrentUser({
        amount,
        promotionCode,
      })

      if (result.status === 'SUCCESS') {
        await recordSdkPointGrant({
          amount,
          promotionCode,
          recipientLabel: pointForm.recipientLabel.trim() || '현재 로그인 사용자',
          recipientUserKey: pointForm.recipientUserKey.trim() || 'current-user',
          resultMessage: result.message,
          status: 'SENT',
        })
      } else {
        await recordSdkPointGrant({
          amount,
          promotionCode,
          recipientLabel: pointForm.recipientLabel.trim() || '현재 로그인 사용자',
          recipientUserKey: pointForm.recipientUserKey.trim() || 'current-user',
          resultMessage: result.message,
          status: 'FAILED',
        })
      }

      return result
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['admin-point-grants'] })
      setPointNotice(result.message)
    },
    onError: (error) => {
      setPointNotice(error instanceof Error ? error.message : 'SDK 포인트 지급 테스트에 실패했습니다.')
    },
  })

  const queuedGrantCount = useMemo(
    () => (pointGrantQuery.data ?? []).filter((item) => item.status === 'QUEUED').length,
    [pointGrantQuery.data],
  )
  const previewUnlockAvailable = canUseAdminPreview()

  const activeShopCount = useMemo(
    () => shops.filter((shop) => shop.status === 'ACTIVE').length,
    [shops],
  )

  const unverifiedShopCount = useMemo(
    () => shops.filter((shop) => shop.status === 'UNVERIFIED').length,
    [shops],
  )

  const submitUnlock = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (unlockAdminSession(unlockCode)) {
      setIsUnlocked(true)
      setUnlockError(null)
      setUnlockCode('')
      return
    }

    setUnlockError('관리자 코드가 일치하지 않습니다.')
  }

  const resetShopComposer = () => {
    setSelectedShopId(null)
    setShopForm(EMPTY_SHOP_FORM)
    setPendingFiles([])
    setMobileSection('editor')
    setShopNotice('새 매장 등록 모드로 전환했습니다.')
  }

  const selectedShop = selectedShopId != null ? shops.find((shop) => shop.id === selectedShopId) ?? null : null

  if (!skipUnlock && !isUnlocked) {
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
            매장 등록, 수정, 사진 업로드, 포인트 지급은 관리자 전용 워크플로우로 분리했습니다.
            배포 환경에서는 관리자 코드를 설정한 뒤 접근하세요.
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
              개발 프리뷰로 열기
            </button>
          ) : null}

          {!hasConfiguredAdminCode() && !previewUnlockAvailable ? (
            <p className="form-help-text">실서비스에서는 `VITE_ADMIN_ACCESS_CODE`가 설정되어야 관리자 잠금 해제가 가능합니다.</p>
          ) : null}

          {unlockError ? <p className="error-text">{unlockError}</p> : null}
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell admin-shell">
      <section className="section admin-console-head">
        <div className="map-search-row admin-console-topbar">
          <GlobalNavigationMenu triggerClassName="global-nav-trigger global-nav-trigger-inline" />
          <div className="admin-console-title">
            <span className="eyebrow">ADMIN CONSOLE</span>
            <strong>매장 운영 / 포인트 지급</strong>
          </div>
          <button
            className="ghost-action compact-action"
            type="button"
            onClick={() => {
              clearAdminSession()
              setIsUnlocked(false)
            }}
          >
            잠금
          </button>
        </div>
      </section>

      <section className="section admin-summary-grid">
        <article className="admin-summary-card">
          <span>전체 매장</span>
          <strong>{shops.length}</strong>
        </article>
        <article className="admin-summary-card">
          <span>운영 중</span>
          <strong>{activeShopCount}</strong>
        </article>
        <article className="admin-summary-card">
          <span>검증 필요</span>
          <strong>{unverifiedShopCount}</strong>
        </article>
        <article className="admin-summary-card">
          <span>포인트 대기</span>
          <strong>{queuedGrantCount}</strong>
        </article>
      </section>

      <section className="section admin-mobile-tabs-shell" aria-label="관리자 작업 전환">
        <button
          className={`admin-mobile-tab ${mobileSection === 'shops' ? 'admin-mobile-tab-active' : ''}`}
          type="button"
          onClick={() => setMobileSection('shops')}
        >
          매장 목록
        </button>
        <button
          className={`admin-mobile-tab ${mobileSection === 'editor' ? 'admin-mobile-tab-active' : ''}`}
          type="button"
          onClick={() => setMobileSection('editor')}
        >
          {selectedShop ? '매장 편집' : '매장 등록'}
        </button>
        <button
          className={`admin-mobile-tab ${mobileSection === 'points' ? 'admin-mobile-tab-active' : ''}`}
          type="button"
          onClick={() => setMobileSection('points')}
        >
          포인트 지급
        </button>
        <button
          className={`admin-mobile-tab ${mobileSection === 'history' ? 'admin-mobile-tab-active' : ''}`}
          type="button"
          onClick={() => setMobileSection('history')}
        >
          지급 이력
        </button>
      </section>

      <section className="admin-workspace">
        <article
          className={`section admin-panel admin-panel-list ${mobileSection !== 'shops' ? 'admin-mobile-section-hidden' : ''}`}
        >
          <div className="section-header">
            <div>
              <h2>매장 목록</h2>
              <p className="meta-text">등록된 매장을 선택하면 오른쪽에서 바로 수정할 수 있습니다.</p>
            </div>
            <button className="secondary-action compact-action" type="button" onClick={resetShopComposer}>
              새 매장
            </button>
          </div>

          {shopsQuery.isLoading ? <p>매장 목록을 불러오는 중입니다.</p> : null}
          {shopsQuery.isError ? <p className="error-text">{(shopsQuery.error as Error).message}</p> : null}

          <div className="admin-shop-list">
            {shops.map((shop) => (
              <button
                className={`admin-shop-list-item ${selectedShopId === shop.id ? 'admin-shop-list-item-active' : ''}`}
                key={shop.id}
                type="button"
                onClick={() => {
                  setSelectedShopId(shop.id)
                  setShopForm(toShopFormState(shop))
                  setPendingFiles([])
                  setMobileSection('editor')
                }}
              >
                <div className="admin-shop-list-item-head">
                  <strong>{shop.name}</strong>
                  <StatusPill status={shop.status} />
                </div>
                <p>{shop.address}</p>
                <p className="meta-text">
                  {shop.regionName ?? `지역 ${shop.regionId ?? '-'}`}
                  {shop.sellsIchibanKuji ? ' · 일번쿠지' : ''}
                </p>
              </button>
            ))}
          </div>
        </article>

        <article
          className={`section admin-panel admin-panel-editor ${mobileSection !== 'editor' ? 'admin-mobile-section-hidden' : ''}`}
        >
          <div className="section-header">
            <div>
              <h2>{selectedShop ? '매장 수정' : '매장 등록'}</h2>
              <p className="meta-text">Swagger 기준으로 수정 가능한 필드와 사진 업로드를 함께 관리합니다.</p>
            </div>
            {selectedShop ? (
              <button
                className="ghost-action compact-action"
                type="button"
                onClick={() => deleteShopMutation.mutate()}
              >
                삭제
              </button>
            ) : null}
          </div>

          <div className="admin-form-grid">
            <label className="admin-field">
              <span>매장명</span>
              <input
                className="text-input"
                value={shopForm.name}
                onChange={(event) => setShopForm((current) => ({ ...current, name: event.target.value }))}
              />
            </label>

            <label className="admin-field admin-field-wide">
              <span>주소</span>
              <input
                className="text-input"
                value={shopForm.address}
                onChange={(event) => setShopForm((current) => ({ ...current, address: event.target.value }))}
              />
            </label>

            <label className="admin-field">
              <span>경도(px)</span>
              <input
                className="text-input"
                inputMode="decimal"
                value={shopForm.px}
                onChange={(event) => setShopForm((current) => ({ ...current, px: event.target.value }))}
              />
            </label>

            <label className="admin-field">
              <span>위도(py)</span>
              <input
                className="text-input"
                inputMode="decimal"
                value={shopForm.py}
                onChange={(event) => setShopForm((current) => ({ ...current, py: event.target.value }))}
              />
            </label>

            <label className="admin-field">
              <span>층수</span>
              <input
                className="text-input"
                value={shopForm.floor}
                onChange={(event) => setShopForm((current) => ({ ...current, floor: event.target.value }))}
              />
            </label>

            <label className="admin-field">
              <span>지역 ID</span>
              <input
                className="text-input"
                inputMode="numeric"
                value={shopForm.regionId}
                onChange={(event) => setShopForm((current) => ({ ...current, regionId: event.target.value }))}
              />
            </label>

            <label className="admin-field">
              <span>상태</span>
              <select
                className="text-input admin-select"
                value={shopForm.status}
                onChange={(event) =>
                  setShopForm((current) => ({ ...current, status: event.target.value as ShopStatus }))
                }
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="UNVERIFIED">UNVERIFIED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </label>

            <label className="admin-field admin-field-checkbox">
              <input
                checked={shopForm.sellsIchibanKuji}
                type="checkbox"
                onChange={(event) =>
                  setShopForm((current) => ({ ...current, sellsIchibanKuji: event.target.checked }))
                }
              />
              <span>일번쿠지 취급</span>
            </label>

            <label className="admin-field admin-field-wide">
              <span>방문 팁</span>
              <textarea
                className="text-input text-area"
                rows={4}
                value={shopForm.visitTip}
                onChange={(event) => setShopForm((current) => ({ ...current, visitTip: event.target.value }))}
              />
            </label>
          </div>

          <section className="admin-media-panel">
            <div className="section-header">
              <div>
                <h3>실제 사진 업로드</h3>
                <p className="meta-text">업로드 API가 없을 때는 브라우저 로컬 저장소에 임시 보관합니다.</p>
              </div>
            </div>

            <label className="admin-upload-dropzone">
              <input
                accept="image/*"
                multiple
                type="file"
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? [])
                  setPendingFiles(files)
                }}
              />
              <strong>사진 선택</strong>
              <span>매장 저장과 함께 실제 사진을 업로드합니다.</span>
            </label>

            {pendingPreviewItems.length > 0 ? (
              <div className="admin-photo-grid">
                {pendingPreviewItems.map((photo) => (
                  <article className="admin-photo-card admin-photo-card-pending" key={photo.id}>
                    <img alt={photo.name} src={photo.url} />
                    <div className="admin-photo-card-copy">
                      <strong>{photo.name}</strong>
                      <span>저장 대기</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}

            {selectedShopPhotosQuery.data && selectedShopPhotosQuery.data.length > 0 ? (
              <div className="admin-photo-grid">
                {selectedShopPhotosQuery.data.map((photo) => (
                  <article className="admin-photo-card" key={photo.id}>
                    <img alt={photo.name} src={photo.dataUrl} />
                    <div className="admin-photo-card-copy">
                      <strong>{photo.name}</strong>
                      <span>{formatDateTime(photo.createdAt)}</span>
                    </div>
                    <button
                      className="ghost-action compact-action"
                      type="button"
                      onClick={() => {
                        if (selectedShopId != null) {
                          removePhotoMutation.mutate({ shopId: selectedShopId, photoId: photo.id })
                        }
                      }}
                    >
                      제거
                    </button>
                  </article>
                ))}
              </div>
            ) : null}
          </section>

          <div className="admin-action-row">
            <button
              className="primary-action"
              type="button"
              onClick={() => saveShopMutation.mutate()}
            >
              {saveShopMutation.isPending ? '저장 중...' : selectedShop ? '매장 수정 저장' : '매장 등록'}
            </button>
            <button className="secondary-action" type="button" onClick={resetShopComposer}>
              초기화
            </button>
          </div>

          {shopNotice ? <p className="form-help-text">{shopNotice}</p> : null}
        </article>
      </section>

      <section className="admin-points-grid">
        <article className={`section admin-panel ${mobileSection !== 'points' ? 'admin-mobile-section-hidden' : ''}`}>
          <div className="section-header">
            <div>
              <h2>포인트 지급</h2>
              <p className="meta-text">
                토스 포인트 직접 지급은 프로모션 코드 기반으로 동작합니다. 현재 사용자 테스트와 관리자
                대기열을 함께 운영합니다.
              </p>
            </div>
          </div>

          <div className="admin-guidance">
            <p>현재 사용자 즉시 지급: Apps in Toss SDK `grantPromotionReward` 테스트</p>
            <p>다른 사용자 지급: 대상 `userKey`를 받아 관리자 대기열에 등록 후 백엔드에서 처리</p>
          </div>

          <div className="admin-form-grid">
            <label className="admin-field">
              <span>대상자 표기명</span>
              <input
                className="text-input"
                value={pointForm.recipientLabel}
                onChange={(event) => setPointForm((current) => ({ ...current, recipientLabel: event.target.value }))}
              />
            </label>

            <label className="admin-field">
              <span>대상 userKey</span>
              <input
                className="text-input"
                value={pointForm.recipientUserKey}
                onChange={(event) => setPointForm((current) => ({ ...current, recipientUserKey: event.target.value }))}
              />
            </label>

            <label className="admin-field">
              <span>프로모션 코드</span>
              <input
                className="text-input"
                value={pointForm.promotionCode}
                onChange={(event) => setPointForm((current) => ({ ...current, promotionCode: event.target.value }))}
              />
            </label>

            <label className="admin-field">
              <span>포인트</span>
              <input
                className="text-input"
                inputMode="numeric"
                value={pointForm.amount}
                onChange={(event) => setPointForm((current) => ({ ...current, amount: event.target.value }))}
              />
            </label>

            <label className="admin-field admin-field-wide">
              <span>지급 사유</span>
              <textarea
                className="text-input text-area"
                rows={3}
                value={pointForm.reason}
                onChange={(event) => setPointForm((current) => ({ ...current, reason: event.target.value }))}
              />
            </label>
          </div>

          <div className="admin-action-row">
            <button className="primary-action" type="button" onClick={() => queuePointMutation.mutate()}>
              {queuePointMutation.isPending ? '등록 중...' : '대상자 지급 대기열 등록'}
            </button>
            <button className="secondary-action" type="button" onClick={() => sdkGrantMutation.mutate()}>
              {sdkGrantMutation.isPending ? '지급 중...' : '현재 사용자 SDK 테스트'}
            </button>
          </div>

          {pointNotice ? <p className="form-help-text">{pointNotice}</p> : null}
        </article>

        <article className={`section admin-panel ${mobileSection !== 'history' ? 'admin-mobile-section-hidden' : ''}`}>
          <div className="section-header">
            <div>
              <h2>지급 이력 / 대기열</h2>
              <p className="meta-text">Swagger에 관리자 포인트 API가 생기면 이 목록을 서버 응답으로 대체하면 됩니다.</p>
            </div>
          </div>

          <div className="admin-grant-list">
            {(pointGrantQuery.data ?? []).map((grant) => (
              <article className="admin-grant-card" key={grant.id}>
                <div className="admin-grant-head">
                  <strong>{grant.recipientLabel || '대상 미지정'}</strong>
                  <span className={`admin-grant-status admin-grant-status-${grant.status.toLowerCase()}`}>
                    {grant.status}
                  </span>
                </div>
                <p>{grant.amount.toLocaleString()}P · {grant.promotionCode}</p>
                <p>{grant.recipientUserKey}</p>
                <p className="meta-text">{grant.reason}</p>
                <p className="meta-text">
                  {grant.channel} · {formatDateTime(grant.createdAt)}
                </p>
                {grant.resultMessage ? <p className="form-help-text">{grant.resultMessage}</p> : null}
              </article>
            ))}

            {pointGrantQuery.data && pointGrantQuery.data.length === 0 ? (
              <p className="meta-text">아직 등록된 포인트 지급 이력이 없습니다.</p>
            ) : null}
          </div>
        </article>
      </section>
    </main>
  )
}
