import type { ReactNode } from 'react'

export const EmptyState = ({
  action,
  body,
  title,
}: {
  action?: ReactNode
  body: string
  title: string
}) => (
  <section className="rounded-[28px] border border-dashed border-black/[0.12] bg-[#faf9f8] p-6 text-center">
    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Empty provider state</p>
    <h3 className="mt-3 text-2xl font-bold tracking-tight">{title}</h3>
    <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#666666]">{body}</p>
    {action ? <div className="mt-5">{action}</div> : null}
  </section>
)
