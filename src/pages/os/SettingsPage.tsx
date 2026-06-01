import { MockSheetSyncStatus } from '../../components/shared/MockSheetSyncStatus'
import { SourceStatusBadge } from '../../components/shared/SourceStatusBadge'
import { futureConnectors } from '../../data/mockData'
import { useOs } from '../../core/os/OsContext'

export const SettingsPage = () => {
  const { sourceStatuses } = useOs()

  return (
    <section className="space-y-5">
      <header>
        <h2 className="text-3xl font-semibold">Settings</h2>
        <p className="text-sm text-[#615a50]">Source status, module settings, snapshots, and future connectors.</p>
      </header>

      <SourceStatusBadge status={sourceStatuses.settings} />

      <section className="panel">
        <h3 className="text-lg font-semibold">Future Connector Placeholders</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {futureConnectors.map((item) => (
            <span key={item} className="rounded-full border border-[#ddcfbb] bg-[#fff8ed] px-3 py-1 text-xs font-medium">
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3 className="text-lg font-semibold">Safety Constraints</h3>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#5e584f]">
          <li>No auto email sending</li>
          <li>No auto LINE replies</li>
          <li>No real auto trading or broker execution</li>
          <li>No destructive writes</li>
          <li>All AI suggestions require manual preview and approval</li>
        </ul>
      </section>

      <MockSheetSyncStatus statuses={Object.values(sourceStatuses)} />
    </section>
  )
}

