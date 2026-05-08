import { TDSMobileAITProvider } from '@toss/tds-mobile-ait'
import type { TdsRuntimeProviderProps } from './types'

const ANIWHERE_BRAND_PRIMARY_COLOR = '#3182F6'

export function TdsRuntimeProvider({ children }: TdsRuntimeProviderProps) {
  return (
    <TDSMobileAITProvider brandPrimaryColor={ANIWHERE_BRAND_PRIMARY_COLOR} fontScaleAvailable={false}>
      {children}
    </TDSMobileAITProvider>
  )
}
