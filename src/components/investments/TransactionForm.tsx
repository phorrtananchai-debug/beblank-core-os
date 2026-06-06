import { useState } from 'react'

const TRANSACTION_TYPES = ['buy', 'sell', 'dividend', 'deposit', 'withdraw', 'fee'] as const

interface Props {
  holdings: Array<{ assetId: string; name?: string }>
  onCreateTransaction: (data: {
    assetId: string
    transactionType: string
    amountTHB: number
    quantity: number
    notes: string
  }) => void
}

export const TransactionForm = ({ holdings, onCreateTransaction }: Props) => {
  const [type, setType] = useState<string>('buy')
  const [assetId, setAssetId] = useState(holdings[0]?.assetId ?? '')
  const [amountTHB, setAmountTHB] = useState('')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = () => {
    if (!assetId || !amountTHB) return
    onCreateTransaction({
      assetId,
      transactionType: type,
      amountTHB: Number(amountTHB),
      quantity: Number(quantity) || 0,
      notes,
    })
    setAmountTHB('')
    setQuantity('')
    setNotes('')
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">Type</p>
          <select className="mt-1 w-full rounded-lg border border-black/[0.08] bg-white px-2 py-1.5 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
            {TRANSACTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">Asset</p>
          <select className="mt-1 w-full rounded-lg border border-black/[0.08] bg-white px-2 py-1.5 text-sm" value={assetId} onChange={(e) => setAssetId(e.target.value)}>
            {holdings.map((h) => <option key={h.assetId} value={h.assetId}>{h.assetId}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">Amount (THB)</p>
          <input className="mt-1 w-full rounded-lg border border-black/[0.08] bg-white px-2 py-1.5 text-sm" type="number" value={amountTHB} onChange={(e) => setAmountTHB(e.target.value)} placeholder="0" />
        </div>
        <div>
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">Quantity</p>
          <input className="mt-1 w-full rounded-lg border border-black/[0.08] bg-white px-2 py-1.5 text-sm" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" />
        </div>
      </div>
      <div>
        <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--bb-text-muted)]">Notes</p>
        <input className="mt-1 w-full rounded-lg border border-black/[0.08] bg-white px-2 py-1.5 text-sm" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional note" />
      </div>
      <button className="btn-primary w-full" type="button" onClick={handleSubmit} disabled={!assetId || !amountTHB}>Queue Transaction</button>
    </div>
  )
}
