import type { MapAssistantReply, Shop } from './types'

const LLM_SEARCH_ENDPOINT = import.meta.env.VITE_LLM_SEARCH_ENDPOINT

type MapAssistantRequest = {
  question: string
  shops: Shop[]
  selectedShop?: Shop | null
}

function buildLocalReason(shop: Shop, question: string) {
  const lowerQuestion = question.toLowerCase()

  if (shop.name.toLowerCase().includes(lowerQuestion)) {
    return '매장명이 질문과 직접 일치합니다.'
  }

  const matchedWork = shop.works.find((work) => lowerQuestion.includes(work.toLowerCase()))
  if (matchedWork) {
    return `${matchedWork} 관련 작품을 취급합니다.`
  }

  const matchedCategory = shop.categories.find((category) => lowerQuestion.includes(category.toLowerCase()))
  if (matchedCategory) {
    return `${matchedCategory} 카테고리와 맞는 매장입니다.`
  }

  if (shop.sellsIchibanKuji && /일번|쿠지/.test(question)) {
    return '일번쿠지를 취급하는 매장입니다.'
  }

  if (shop.visitTip && shop.visitTip.length > 0) {
    return `방문 팁: ${shop.visitTip}`
  }

  return `${shop.regionName ?? '선택 지역'}에서 탐색된 후보입니다.`
}

function searchLocalMatches(question: string, shops: Shop[]) {
  const normalizedQuestion = question.trim().toLowerCase()
  const tokens = normalizedQuestion
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)

  return shops
    .map((shop) => {
      const haystack = [
        shop.name,
        shop.address,
        shop.regionName ?? '',
        shop.description ?? '',
        shop.visitTip ?? '',
        ...shop.categories,
        ...shop.works,
      ]
        .join(' ')
        .toLowerCase()

      const score = tokens.reduce((acc, token) => {
        if (shop.name.toLowerCase().includes(token)) {
          return acc + 5
        }
        if (shop.works.some((work) => work.toLowerCase().includes(token))) {
          return acc + 4
        }
        if (shop.categories.some((category) => category.toLowerCase().includes(token))) {
          return acc + 3
        }
        if (haystack.includes(token)) {
          return acc + 1
        }
        return acc
      }, 0)

      return {
        shop,
        score,
      }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}

function buildLocalReply(question: string, shops: Shop[], selectedShop?: Shop | null): MapAssistantReply {
  const matches = searchLocalMatches(question, shops)

  if (selectedShop && matches.length === 0) {
    return {
      summary: `${selectedShop.name} 기준으로는 ${selectedShop.visitTip ?? '추가 방문 팁이 아직 없습니다.'}`,
      recommendations: [
        {
          shopId: selectedShop.id,
          reason: selectedShop.visitTip ?? '현재 선택된 매장을 다시 확인해보세요.',
        },
      ],
    }
  }

  if (matches.length === 0) {
    return {
      summary: '현재 데이터 기준으로 바로 맞는 후보를 찾지 못했어요. 작품명, 지역명, 매장명을 조금 더 구체적으로 입력해보세요.',
      recommendations: [],
    }
  }

  return {
    summary: `"${question}" 기준으로 ${matches.map((item) => item.shop.name).join(', ')} 순서로 보였어요.`,
    recommendations: matches.map(({ shop }) => ({
      shopId: shop.id,
      reason: buildLocalReason(shop, question),
    })),
  }
}

export async function askMapAssistant({
  question,
  shops,
  selectedShop = null,
}: MapAssistantRequest): Promise<MapAssistantReply> {
  if (LLM_SEARCH_ENDPOINT) {
    const response = await fetch(LLM_SEARCH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        selectedShopId: selectedShop?.id ?? null,
        shops: shops.map((shop) => ({
          id: shop.id,
          name: shop.name,
          regionName: shop.regionName,
          address: shop.address,
          categories: shop.categories,
          works: shop.works,
          status: shop.status,
          sellsIchibanKuji: shop.sellsIchibanKuji,
          visitTip: shop.visitTip,
          description: shop.description,
        })),
      }),
    })

    if (response.ok) {
      const payload = (await response.json()) as Partial<MapAssistantReply> & {
        answer?: string
      }

      return {
        summary: payload.summary ?? payload.answer ?? 'AI 탐색 결과를 받았습니다.',
        recommendations: payload.recommendations ?? [],
      }
    }
  }

  return buildLocalReply(question, shops, selectedShop)
}
