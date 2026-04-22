import { grantPromotionReward } from '@apps-in-toss/web-framework'
import { isAppsInTossRuntime } from './auth'

type GrantPromotionRewardSuccess = {
  key: string
}

type GrantPromotionRewardFailure = {
  errorCode: string
  message: string
}

export type PromotionGrantResult =
  | { status: 'UNSUPPORTED'; message: string }
  | { status: 'ERROR'; message: string }
  | { status: 'FAILED'; message: string; errorCode: string }
  | { status: 'SUCCESS'; message: string; rewardKey: string }

export async function grantPromotionRewardForCurrentUser(params: {
  promotionCode: string
  amount: number
}): Promise<PromotionGrantResult> {
  if (!isAppsInTossRuntime()) {
    return {
      status: 'UNSUPPORTED',
      message: '토스 인앱 환경에서만 SDK 포인트 지급 테스트를 실행할 수 있습니다.',
    }
  }

  try {
    const result = (await grantPromotionReward({
      params: {
        promotionCode: params.promotionCode,
        amount: params.amount,
      },
    })) as GrantPromotionRewardSuccess | GrantPromotionRewardFailure | 'ERROR' | undefined

    if (!result) {
      return {
        status: 'UNSUPPORTED',
        message: '현재 토스 앱 버전에서는 프로모션 지급 SDK를 지원하지 않습니다.',
      }
    }

    if (result === 'ERROR') {
      return {
        status: 'ERROR',
        message: '포인트 지급 중 알 수 없는 오류가 발생했습니다.',
      }
    }

    if ('key' in result) {
      return {
        status: 'SUCCESS',
        message: '현재 로그인한 사용자에게 토스 포인트를 지급했습니다.',
        rewardKey: result.key,
      }
    }

    return {
      status: 'FAILED',
      errorCode: result.errorCode,
      message: result.message,
    }
  } catch (error) {
    return {
      status: 'ERROR',
      message: error instanceof Error ? error.message : '프로모션 지급 요청에 실패했습니다.',
    }
  }
}
