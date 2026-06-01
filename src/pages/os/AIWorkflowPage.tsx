import { AIContextExportPanel } from '../../components/shared/AIContextExportPanel'
import { AISuggestionImportPanel } from '../../components/shared/AISuggestionImportPanel'
import { ModuleAISummaryPanel } from '../../components/shared/ModuleAISummaryPanel'
import { SourceStatusBadge } from '../../components/shared/SourceStatusBadge'
import { useOs } from '../../core/os/OsContext'

export const AIWorkflowPage = () => {
  const { data, sourceStatuses, queueSuggestionImport } = useOs()

  return (
    <section className="space-y-5">
      <header>
        <h2 className="text-3xl font-semibold">AI Workflow</h2>
        <p className="text-sm text-[#615a50]">
          Manual-first workflow: export context, send to Jarvis B, import suggestion, preview, approve, apply to mock adapter.
        </p>
      </header>

      <SourceStatusBadge status={sourceStatuses.aiWorkflow} />

      <div className="grid gap-4 xl:grid-cols-2">
        <AIContextExportPanel contexts={data.aiContexts} />
        <AISuggestionImportPanel onImport={queueSuggestionImport} />
      </div>

      <ModuleAISummaryPanel moduleName="" suggestions={data.aiSuggestions} />
    </section>
  )
}

