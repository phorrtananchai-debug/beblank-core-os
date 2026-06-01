import { SourceStatusBadge } from './SourceStatusBadge'
import type { SourceStatus } from '../../types/models'

export const MockSheetSyncStatus = ({ statuses }: { statuses: SourceStatus[] }) => {
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>Mock Sheet Sync Status</h3>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {statuses.map((status) => (
          <SourceStatusBadge key={status.sourceName} status={status} />
        ))}
      </div>
    </section>
  )
}

