import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Button, Toast } from '@aniwhere/tds-mobile'
import { listPointGrantRequests, queuePointGrantRequest } from '../../shared/api/admin'
import type { CreatePointGrantRequest } from '../../shared/api/types'
import { formatDateTime } from '../../shared/lib/format'
import { AppTopNavigation } from '../../shared/ui/AppTopNavigation'

const POINT_TOAST_VISIBLE_MS = 3000

const EMPTY_POINT_FORM: CreatePointGrantRequest = {
  recipientLabel: '',
  recipientUserKey: '',
  amount: 100,
  reason: '',
  promotionCode: '',
}

export function AdminPointsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<CreatePointGrantRequest>(EMPTY_POINT_FORM)
  const [notice, setNotice] = useState<string | null>(null)

  const grantsQuery = useQuery({
    queryKey: ['admin-point-grants'],
    queryFn: listPointGrantRequests,
  })

  const grantMutation = useMutation({
    mutationFn: queuePointGrantRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-point-grants'] })
      setForm(EMPTY_POINT_FORM)
      setNotice('포인트 지급 요청을 대기열에 넣었어요.')
    },
    onError: (error) => {
      setNotice(error instanceof Error ? error.message : '포인트 지급 요청을 저장하지 못했어요.')
    },
  })

  const submitGrant = () => {
    if (!form.recipientLabel.trim() || !form.recipientUserKey.trim() || !form.reason.trim() || !form.promotionCode.trim()) {
      setNotice('지급 대상, 사유, 프로모션 코드를 입력해주세요.')
      return
    }
    grantMutation.mutate({
      ...form,
      amount: Math.max(1, Number(form.amount) || 1),
      recipientLabel: form.recipientLabel.trim(),
      recipientUserKey: form.recipientUserKey.trim(),
      reason: form.reason.trim(),
      promotionCode: form.promotionCode.trim(),
    })
  }

  return (
    <main className="app-shell admin-shell admin-shop-crud-shell admin-branch-page-shell">
      <AppTopNavigation
        className="route-navigation"
        showBack
        title="포인트 지급"
        showLogo={false}
        onBack={() => navigate('/admin', { replace: true })}
      />

      <section className="admin-branch-page">
        <header className="admin-branch-page-head">
          <h1>포인트 지급</h1>
          <p>서버 포인트 엔드포인트가 있으면 전송하고, 없으면 SERVER_QUEUE 대기열에 저장해요.</p>
        </header>

        <section className="admin-branch-panel" aria-label="포인트 지급 요청">
          <div className="admin-branch-form-grid">
            <label className="admin-shop-field">
              <span>지급 대상</span>
              <input
                className="text-input"
                placeholder="닉네임 또는 사용자 표시명"
                value={form.recipientLabel}
                onChange={(event) => setForm((current) => ({ ...current, recipientLabel: event.target.value }))}
              />
            </label>
            <label className="admin-shop-field">
              <span>사용자 키</span>
              <input
                className="text-input"
                placeholder="userKey"
                value={form.recipientUserKey}
                onChange={(event) => setForm((current) => ({ ...current, recipientUserKey: event.target.value }))}
              />
            </label>
            <label className="admin-shop-field">
              <span>포인트</span>
              <input
                className="text-input"
                inputMode="numeric"
                type="number"
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: Number(event.target.value) }))}
              />
            </label>
            <label className="admin-shop-field">
              <span>promotionCode</span>
              <input
                className="text-input"
                value={form.promotionCode}
                onChange={(event) => setForm((current) => ({ ...current, promotionCode: event.target.value }))}
              />
            </label>
            <label className="admin-shop-field admin-shop-field-wide">
              <span>지급 사유</span>
              <textarea
                className="text-input textarea-input"
                value={form.reason}
                onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
              />
            </label>
          </div>
          <Button display="block" disabled={grantMutation.isPending} type="button" onClick={submitGrant}>
            지급 요청 저장
          </Button>
        </section>

        <section className="admin-branch-panel" aria-label="포인트 지급 대기열">
          <div className="admin-branch-panel-head">
            <strong>지급 대기열</strong>
            <span>{grantsQuery.data?.length ?? 0}건</span>
          </div>
          <div className="admin-branch-list">
            {(grantsQuery.data ?? []).map((grant) => (
              <article className="admin-branch-row" key={grant.id}>
                <div className="admin-branch-row-copy">
                  <div className="admin-branch-row-head">
                    <strong>{grant.recipientLabel}</strong>
                    <span>{grant.status}</span>
                  </div>
                  <p>
                    {grant.amount}P · {grant.promotionCode} · {grant.channel}
                  </p>
                  <small>{grant.resultMessage ?? formatDateTime(grant.createdAt)}</small>
                </div>
              </article>
            ))}
            {!grantsQuery.isLoading && (grantsQuery.data?.length ?? 0) === 0 ? (
              <p className="admin-shop-manage-state">지급 대기열이 비어 있어요.</p>
            ) : null}
          </div>
        </section>
      </section>

      <Toast
        aria-live="polite"
        duration={POINT_TOAST_VISIBLE_MS}
        higherThanCTA
        open={notice != null}
        position="bottom"
        text={notice ?? ''}
        onClose={() => setNotice(null)}
      />
    </main>
  )
}
