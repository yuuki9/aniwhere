import type { TdsRuntimeProviderProps } from './types'

// Public web builds must not import @toss/tds-mobile runtime code.
export function TdsRuntimeProvider({ children }: TdsRuntimeProviderProps) {
  return <>{children}</>
}
