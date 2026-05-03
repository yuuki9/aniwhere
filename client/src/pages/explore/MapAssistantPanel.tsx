import type { RefObject } from 'react'
import type { MapAssistantRecommendation, Shop } from '../../shared/api/types'
import { MapAssistantIcon } from '../../shared/ui/mapDetailIcons'

export type MapAssistantMessage = {
  id: string
  role: 'assistant' | 'user'
  content: string
  recommendations?: MapAssistantRecommendation[]
}

type MapAssistantPanelProps = {
  visible: boolean
  open: boolean
  showReturn: boolean
  hasConversation: boolean
  showSuggestions: boolean
  messages: MapAssistantMessage[]
  messagesRef: RefObject<HTMLDivElement | null>
  suggestions: string[]
  input: string
  isPending: boolean
  shops: Pick<Shop, 'id' | 'name'>[]
  onToggle: () => void
  onOpen: () => void
  onClose: () => void
  onInputChange: (value: string) => void
  onSubmitQuestion: (question: string) => void
  onSelectRecommendation: (shopId: number) => void
}

export function MapAssistantPanel({
  visible,
  open,
  showReturn,
  hasConversation,
  showSuggestions,
  messages,
  messagesRef,
  suggestions,
  input,
  isPending,
  shops,
  onToggle,
  onOpen,
  onClose,
  onInputChange,
  onSubmitQuestion,
  onSelectRecommendation,
}: MapAssistantPanelProps) {
  if (!visible) {
    return null
  }

  return (
    <>
      <button
        aria-expanded={open}
        aria-label="AI 탐색 열기"
        className="map-llm-fab"
        type="button"
        onClick={onToggle}
      >
        <MapAssistantIcon />
      </button>

      {showReturn ? (
        <button className="map-llm-return" type="button" onClick={onOpen}>
          AI로 돌아가기
        </button>
      ) : null}

      {open ? (
        <aside className="map-llm-panel" aria-label="AI 탐색 대화창">
          <div className="map-llm-panel-head">
            <strong>AI 챗봇</strong>
            <button className="map-llm-close" type="button" onClick={onClose}>
              닫기
            </button>
          </div>

          {!hasConversation ? (
            <div className="map-llm-start-screen">
              <div className="map-llm-start-copy">
                <span className="map-llm-start-badge">
                  <MapAssistantIcon />
                  AI 탐색
                </span>
                <strong>궁금한 것이 있으신가요?</strong>
                <p>AI에게 질문해 보세요.</p>
              </div>

              <div className="map-llm-start-list">
                {suggestions.map((suggestion, index) => (
                  <button
                    className="map-llm-start-card"
                    key={suggestion}
                    type="button"
                    onClick={() => onSubmitQuestion(suggestion)}
                  >
                    <span>{index === 0 ? '추천 질문' : index === 1 ? '많이 찾는 질문' : '처음 시작 질문'}</span>
                    <strong>{suggestion}</strong>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="map-llm-message-list" ref={messagesRef}>
              {messages.map((message) => (
                <article className={`map-llm-message map-llm-message-${message.role}`} key={message.id}>
                  <p>{message.content}</p>
                  {message.recommendations && message.recommendations.length > 0 ? (
                    <div className="map-llm-recommend-list">
                      {message.recommendations.map((recommendation) => {
                        const recommendedShop = shops.find((shop) => shop.id === recommendation.shopId)

                        if (!recommendedShop) {
                          return null
                        }

                        return (
                          <button
                            className="map-llm-recommend-card"
                            key={`${message.id}-${recommendation.shopId}`}
                            type="button"
                            onClick={() => onSelectRecommendation(recommendedShop.id)}
                          >
                            <strong>{recommendedShop.name}</strong>
                            <span>{recommendation.reason}</span>
                          </button>
                        )
                      })}
                    </div>
                  ) : null}
                </article>
              ))}

              {isPending ? (
                <article className="map-llm-message map-llm-message-assistant">
                  <p>조건에 맞는 매장을 정리하는 중입니다...</p>
                </article>
              ) : null}

              {showSuggestions ? (
                <article className="map-llm-message map-llm-message-suggestion">
                  <strong>이런 질문으로 다시 이어가보세요.</strong>
                  <div className="map-llm-suggestion-row">
                    {suggestions.map((suggestion) => (
                      <button
                        className="map-llm-suggestion"
                        key={suggestion}
                        type="button"
                        onClick={() => onSubmitQuestion(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </article>
              ) : null}
            </div>
          )}

          <form
            className="map-llm-input-row"
            onSubmit={(event) => {
              event.preventDefault()
              onSubmitQuestion(input)
            }}
          >
            <input
              className="map-llm-input"
              placeholder="작품명, 지역, 운영 상태를 물어보세요"
              value={input}
              onChange={(event) => onInputChange(event.target.value)}
            />
            <button className="map-llm-send" type="submit">
              전송
            </button>
          </form>
        </aside>
      ) : null}
    </>
  )
}
