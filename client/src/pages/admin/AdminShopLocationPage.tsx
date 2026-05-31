import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { getRegions } from '../../shared/api/regions'
import type { RegionListItem } from '../../shared/api/types'
import { geocodeShopAddress, type ShopLocationCandidate } from '../../shared/lib/naverGeocoder'
import { AppTopNavigation } from '../../shared/ui/AppTopNavigation'
import {
  readAdminShopDraft,
  writeAdminShopDraft,
  writeAdminShopSelectedLocation,
} from './AdminShopDraftStore'

function isLocationNoticeError(message: string) {
  return message.includes('실패') || message.includes('인증') || message.includes('필요')
}

function normalizeRegionText(value: string | null | undefined) {
  return (value ?? '').replace(/\s+/g, '').toLocaleLowerCase()
}

function matchRegionIdForLocation({
  candidate,
  query,
  regions,
}: {
  candidate: ShopLocationCandidate
  query: string
  regions: RegionListItem[]
}) {
  const locationText = [
    query,
    candidate.address,
    candidate.roadAddress,
    candidate.jibunAddress,
  ]
    .map(normalizeRegionText)
    .filter(Boolean)
    .join(' ')

  const matchedRegion = [...regions].sort((left, right) => {
    const leftLength = normalizeRegionText(`${left.city ?? ''}${left.name}`).length
    const rightLength = normalizeRegionText(`${right.city ?? ''}${right.name}`).length

    return rightLength - leftLength
  }).find((region) => {
    const regionName = normalizeRegionText(region.name)
    const cityRegionName = normalizeRegionText(`${region.city ?? ''}${region.name}`)

    return (
      (regionName.length > 0 && locationText.includes(regionName)) ||
      (cityRegionName.length > 0 && locationText.includes(cityRegionName))
    )
  })

  return matchedRegion?.id ?? null
}

export function AdminShopLocationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state as { returnTo?: string; shopManageReturnTo?: string } | null
  const draft = readAdminShopDraft()
  const [query, setQuery] = useState(draft?.addressQuery || draft?.address || '')
  const [candidates, setCandidates] = useState<ShopLocationCandidate[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const returnTo = locationState?.returnTo ?? '/admin/shops/new'
  const returnState = locationState?.shopManageReturnTo
    ? { returnTo: locationState.shopManageReturnTo }
    : undefined
  const regionsQuery = useQuery({
    queryKey: ['regions', 'admin-shop-location'],
    queryFn: getRegions,
    staleTime: 5 * 60 * 1000,
  })

  const returnToShopForm = () => {
    navigate(returnTo, { replace: true, state: returnState })
  }

  const searchLocation = async () => {
    const keyword = query.trim()

    if (!keyword) {
      setNotice('검색어를 입력해주세요.')
      return
    }

    setIsSearching(true)
    setNotice('주소를 검색하고 있습니다.')

    try {
      const results = await geocodeShopAddress(keyword)
      setCandidates(results)
      setNotice(results.length > 0 ? '검색 결과에서 위치를 선택해주세요.' : '검색 결과가 없습니다.')
    } catch (error) {
      setCandidates([])
      setNotice(error instanceof Error ? error.message : '주소 검색에 실패했습니다.')
    } finally {
      setIsSearching(false)
    }
  }

  const selectLocation = (candidate: ShopLocationCandidate) => {
    const nextDraft = readAdminShopDraft()
    const matchedRegionId =
      matchRegionIdForLocation({
        candidate,
        query,
        regions: regionsQuery.data ?? [],
      }) ?? nextDraft?.regionId ?? null
    const selectedLocation = {
      address: candidate.address,
      px: candidate.px,
      py: candidate.py,
      regionId: matchedRegionId,
    }

    if (nextDraft) {
      writeAdminShopDraft({
        ...nextDraft,
        addressQuery: candidate.address,
        address: candidate.address,
        px: candidate.px,
        py: candidate.py,
        regionId: matchedRegionId,
      })
    }

    writeAdminShopSelectedLocation(selectedLocation)
    returnToShopForm()
  }

  return (
    <main className="app-shell admin-shell admin-shop-crud-shell admin-shop-location-shell">
      <AppTopNavigation
        className="route-navigation"
        showBack
        title="주소 검색"
        showLogo={false}
        onBack={returnToShopForm}
      />

      <section className="admin-shop-location-layout">
        <div className="admin-shop-location-title">
          <h1>주소 검색</h1>
          <p>도로명, 지번, 건물명을 조합해서 매장 위치를 찾아주세요.</p>
        </div>

        <form
          className="admin-shop-location-search-page"
          onSubmit={(event) => {
            event.preventDefault()
            searchLocation()
          }}
        >
          <input
            autoFocus
            className="text-input"
            placeholder="예: 판교역로 235, 분당 주공"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button className="admin-shop-location-submit" disabled={isSearching} type="submit" aria-label="주소 검색">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
          </button>
        </form>

        {notice ? <p className={isLocationNoticeError(notice) ? 'error-text' : 'meta-text'}>{notice}</p> : null}

        {candidates.length > 0 ? (
          <div className="admin-shop-location-results" aria-label="검색된 주소 선택">
            {candidates.map((candidate) => (
              <button
                className="admin-shop-location-result"
                key={candidate.id}
                type="button"
                onClick={() => selectLocation(candidate)}
              >
                <strong>{candidate.roadAddress || candidate.address}</strong>
                {candidate.jibunAddress ? <small>{candidate.jibunAddress}</small> : null}
              </button>
            ))}
          </div>
        ) : (
          <section className="admin-shop-location-tip" aria-label="주소 검색 팁">
            <strong>tip</strong>
            <p>아래와 같은 조합으로 검색하면 더 정확한 결과가 검색됩니다.</p>
            <dl>
              <div>
                <dt>도로명 + 건물번호</dt>
                <dd>예) 판교역로 235, 제주 첨단로 242</dd>
              </div>
              <div>
                <dt>지역명(동/리) + 번지</dt>
                <dd>예) 삼평동 681, 제주 영평동 2181</dd>
              </div>
              <div>
                <dt>지역명(동/리) + 건물명</dt>
                <dd>예) 분당 주공, 연수동 주공3차</dd>
              </div>
              <div>
                <dt>사서함명 + 번호</dt>
                <dd>예) 분당우체국사서함 1~100</dd>
              </div>
            </dl>
          </section>
        )}
      </section>
    </main>
  )
}
