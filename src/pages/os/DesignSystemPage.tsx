import { colors, statusColorTokens } from '../../design-system/foundations/colors'
import { typography } from '../../design-system/foundations/typography'
import { spacing, radius } from '../../design-system/foundations/spacing'
import { components } from '../../design-system/registry/components'
import { primitives } from '../../design-system/registry/primitives'
import { symbols } from '../../design-system/registry/symbols'
import { templates } from '../../design-system/registry/templates'
import { patterns } from '../../design-system/registry/patterns'
import { workspaceComponents } from '../../design-system/registry/workspace'
import { validateRegistry, resolveComponent } from '../../design-system/index'
import { buildComponentUsageGraph } from '../../design-system/index'
import { pageManifests } from '../../design-system/index'

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
    {children}
  </div>
)

const TokenCard = ({ name, variable, value, usage }: { name: string; variable?: string; value: string; usage: string }) => (
  <div className="rounded-xl border border-black/[0.05] bg-white p-3">
    <div className="flex items-center gap-3">
      {variable && <div className="h-8 w-8 shrink-0 rounded-lg border border-black/[0.06]" style={{ backgroundColor: `var(${variable})` }} />}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{name}</p>
        {variable && <p className="text-[11px] font-mono text-[var(--bb-text-muted)]">{variable}</p>}
        <p className="text-[11px] font-mono text-[var(--bb-text-faint)]">{value}</p>
      </div>
    </div>
    <p className="mt-1.5 text-xs text-[var(--bb-text-muted)]">{usage}</p>
  </div>
)

const MetaCard = ({ id, name, status, description, usageRule, source }: { id: string; name: string; status: string; description: string; usageRule: string; source: string }) => (
  <div className="rounded-xl border border-black/[0.05] bg-white p-3">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">{name}</p>
          <span className={`text-[9px] font-mono uppercase tracking-wider rounded px-1.5 py-0.5 ${status === 'production' ? 'bg-[#16a36a]/10 text-[#16a36a]' : status === 'beta' ? 'bg-[var(--bb-amber)]/10 text-[var(--bb-amber)]' : 'bg-black/[0.05] text-[var(--bb-text-muted)]'}`}>{status}</span>
        </div>
        <p className="mt-1 text-xs text-[var(--bb-text-soft)]">{description}</p>
      </div>
      <code className="shrink-0 text-[9px] font-mono text-[var(--bb-text-faint)]">{id}</code>
    </div>
    <div className="mt-2 rounded-lg bg-[#faf9f8] p-2">
      <p className="text-[10px] text-[var(--bb-text-muted)]">{usageRule}</p>
    </div>
    <p className="mt-1.5 text-[9px] font-mono text-[var(--bb-text-faint)]">{source}</p>
  </div>
)

export const DesignSystemPage = () => {
  return (
    <section className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--bb-text-muted)]">BBH Design System</p>
        <h1 className="text-2xl font-bold tracking-tight">Component Registry</h1>
        <p className="text-sm text-[var(--bb-text-soft)]">Canonical source of all design system metadata. {components.length + primitives.length + workspaceComponents.length} components, {colors.length + statusColorTokens.length} color tokens, {typography.length} type styles, {templates.length} page templates, {patterns.length} operating patterns.</p>
      </header>

      {/* Colors */}
      <Section title="Colors">
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {[...colors, ...statusColorTokens].map((c) => <TokenCard key={c.name} {...c} />)}
        </div>
      </Section>

      {/* Typography */}
      <Section title="Typography">
        <div className="grid gap-2 sm:grid-cols-2">
          {typography.map((t) => (
            <div key={t.name} className="rounded-xl border border-black/[0.05] bg-white p-3">
              <p className="text-sm font-semibold">{t.name}</p>
              <p className="text-[11px] font-mono text-[var(--bb-text-muted)]">{t.family} / {t.weight} / {t.size}</p>
              <p className="text-xs text-[var(--bb-text-soft)] mt-1">{t.usage}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Spacing & Radius */}
      <Section title="Spacing & Radius">
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {[...spacing, ...radius].map((s) => <TokenCard key={s.name} name={s.name} value={s.value} usage={s.usage} />)}
        </div>
      </Section>

      {/* Components */}
      <Section title="Components">
        <div className="grid gap-2">
          {[...components, ...primitives].map((c) => <MetaCard key={c.id} id={c.id} name={c.name} status={c.status} description={c.description} usageRule={c.usageRule} source={c.source} />)}
        </div>
      </Section>

      {/* Workspace Pages */}
      <Section title="Workspace Pages">
        <div className="grid gap-2">
          {workspaceComponents.map((c) => <MetaCard key={c.id} id={c.id} name={c.name} status={c.status} description={c.description} usageRule={c.usageRule} source={c.source} />)}
        </div>
      </Section>

      {/* Symbols */}
      <Section title="Symbols & Visual Language">
        <div className="grid gap-2 sm:grid-cols-2">
          {symbols.map((s) => (
            <div key={s.id} className="rounded-xl border border-black/[0.05] bg-white p-3">
              <p className="text-sm font-semibold">{s.label}</p>
              <p className="mt-1 text-xs text-[var(--bb-text-soft)]">{s.meaning}</p>
              <p className="mt-1 text-[10px] text-[var(--bb-text-muted)]">Usage: {s.usage}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Page Templates */}
      <Section title="Page Templates">
        <div className="grid gap-3">
          {templates.map((t) => (
            <div key={t.title} className="rounded-xl border border-black/[0.05] bg-white p-4">
              <p className="text-sm font-semibold">{t.title}</p>
              <p className="mt-1 text-xs text-[var(--bb-text-soft)]">{t.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {t.components.map((c) => <span key={c} className="rounded-md bg-black/[0.04] px-2 py-0.5 font-mono text-[9px] text-[var(--bb-text-muted)]">{c}</span>)}
              </div>
              {t.futurePages.length > 0 && <p className="mt-2 text-[10px] text-[var(--bb-text-faint)]">Future: {t.futurePages.join(', ')}</p>}
              <p className="mt-1 text-[10px] text-[var(--bb-text-faint)]">Layout: {t.layout}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Patterns */}
      <Section title="Operating Patterns">
        <div className="grid gap-3">
          {patterns.map((p, i) => (
            <div key={i} className="rounded-xl border border-black/[0.05] bg-white p-4">
              <p className="text-sm font-semibold">{p.workflow}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {p.recommendedComponents.map((c) => <span key={c} className="rounded-md bg-black/[0.04] px-2 py-0.5 font-mono text-[9px] text-[var(--bb-text-muted)]">{c}</span>)}
              </div>
              <ul className="mt-2 space-y-1">
                {p.rules.map((r, j) => <li key={j} className="text-xs text-[var(--bb-text-soft)]">{r}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* Design Engine */}
      <Section title="Design Engine">
        <div className="grid gap-3">
          <div className="rounded-xl border border-black/[0.05] bg-white p-4">
            <p className="text-sm font-semibold">Registry Health</p>
            {(() => {
              const health = validateRegistry()
              return (
                <div className="mt-2 flex flex-wrap gap-3 text-xs">
                  <span>Total: <strong>{health.total}</strong></span>
                  <span className="text-[#16a36a]">Valid: <strong>{health.valid}</strong></span>
                  {health.invalid > 0 && <span className="text-[#c2410c]">Issues: <strong>{health.invalid}</strong></span>}
                </div>
              )
            })()}
          </div>

          <div className="rounded-xl border border-black/[0.05] bg-white p-4">
            <p className="text-sm font-semibold">Resolver Example</p>
            <div className="mt-2 space-y-1 text-xs font-mono text-[var(--bb-text-muted)]">
              <p>resolveComponent(&apos;operational-status-chip&apos;) → <span className="text-[var(--bb-text)]">{resolveComponent('operational-status-chip')?.name ?? 'null'}</span></p>
              <p>resolveComponent(&apos;empty-state&apos;) → <span className="text-[var(--bb-text)]">{resolveComponent('empty-state')?.name ?? 'null'}</span></p>
              <p>resolveComponent(&apos;unknown-id&apos;) → <span className="text-[var(--bb-text)]">{resolveComponent('unknown-id') === null ? 'null' : 'found'}</span></p>
            </div>
          </div>

          <div className="rounded-xl border border-black/[0.05] bg-white p-4">
            <p className="text-sm font-semibold">Dependency Graph Summary</p>
            {(() => {
              const graph = buildComponentUsageGraph()
              return (
                <div className="mt-2 space-y-1 text-xs">
                  <p className="text-[var(--bb-text-muted)]">Nodes: <strong className="text-[var(--bb-text)]">{graph.nodes.length}</strong></p>
                  <p className="text-[var(--bb-text-muted)]">Edges: <strong className="text-[var(--bb-text)]">{graph.edges.length}</strong></p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {graph.nodes.filter((n) => n.type === 'component').slice(0, 10).map((n) => (
                      <span key={n.id} className="rounded bg-black/[0.04] px-1.5 py-0.5 font-mono text-[9px] text-[var(--bb-text-muted)]">{n.id}</span>
                    ))}
                    {graph.nodes.filter((n) => n.type === 'component').length > 10 && (
                      <span className="text-[9px] text-[var(--bb-text-faint)]">+{graph.nodes.filter((n) => n.type === 'component').length - 10} more</span>
                    )}
                  </div>
                </div>
              )
            })()}
          </div>

          <div className="rounded-xl border border-black/[0.05] bg-white p-4">
            <p className="text-sm font-semibold">Page Manifests</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {pageManifests.map((m) => (
                <div key={m.id} className="rounded-lg border border-black/[0.04] bg-[#faf9f8] p-2.5">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold">{m.name}</p>
                    <span className={`text-[8px] font-mono uppercase tracking-wider rounded px-1 py-0.5 ${m.migrationPriority === 'high' ? 'bg-[#c2410c]/10 text-[#c2410c]' : m.migrationPriority === 'medium' ? 'bg-[var(--bb-amber)]/10 text-[var(--bb-amber)]' : 'bg-black/[0.04] text-[var(--bb-text-muted)]'}`}>{m.migrationPriority}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-[var(--bb-text-muted)]">{m.components.length} components · {m.patterns.length} patterns</p>
                  <p className="text-[10px] text-[var(--bb-text-faint)]">{m.migrationNotes.slice(0, 60)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <footer className="border-t border-black/[0.05] pt-4 text-[10px] text-[var(--bb-text-faint)]">
        BBH Component Registry · Design Engine · src/design-system/
      </footer>
    </section>
  )
}
