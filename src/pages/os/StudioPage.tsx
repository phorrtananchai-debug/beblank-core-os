import { ModuleAISummaryPanel } from '../../components/shared/ModuleAISummaryPanel'
import { SourceStatusBadge } from '../../components/shared/SourceStatusBadge'
import { useOs } from '../../core/os/OsContext'

export const StudioPage = () => {
  const { data, sourceStatuses, createActionRequest } = useOs()

  return (
    <section className="space-y-5">
      <header>
        <h2 className="text-3xl font-semibold">สตูดิโอ</h2>
        <p className="text-sm text-[#615a50]">พื้นที่ทำงานโปรเจค WorkScope ไทม์ไลน์ ควบคุมเอกสาร ไซต์หน้างาน</p>
      </header>

      <SourceStatusBadge status={sourceStatuses.studio} />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel">
          <div className="panel-header">
            <h3>Timeline</h3>
            <button
              className="btn-primary"
              onClick={() =>
                createActionRequest({
                  module: 'studio',
                  actionType: 'studio.addTimeline',
                  description: 'Add timeline checkpoint from Studio page',
                  payload: { label: 'Mock milestone', dueDate: '2026-07-05' },
                })
              }
            >
              Queue Milestone
            </button>
          </div>
          <div className="space-y-2">
            {data.timeline.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[#e7e2d8] bg-white p-3 text-sm">
                <p className="font-medium">{item.label}</p>
                <p className="text-xs text-[#6f675d]">Due {item.dueDate} · {item.state}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h3>Task Queue</h3>
            <button
              className="btn-primary"
              onClick={() =>
                createActionRequest({
                  module: 'studio',
                  actionType: 'studio.addTask',
                  description: 'Add studio task from WorkScope board',
                  payload: { title: 'Mock: artwork brief pass' },
                })
              }
            >
              Queue Task
            </button>
          </div>
          <div className="space-y-2">
            {data.tasks.map((task) => (
              <div key={task.id} className="rounded-2xl border border-[#e7e2d8] bg-white p-3 text-sm">
                <p className="font-medium">{task.title}</p>
                <p className="text-xs text-[#6f675d]">Status: {task.status}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel">
        <h3 className="text-lg font-semibold">Document Control · Site Watch · Creative Brief</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-[#e6e0d5] bg-white p-3 text-sm">Documents: {data.documents.length}</div>
          <div className="rounded-2xl border border-[#e6e0d5] bg-white p-3 text-sm">Site issues: {data.siteIssues.length}</div>
          <div className="rounded-2xl border border-[#e6e0d5] bg-white p-3 text-sm">Artwork brief: placeholder</div>
        </div>
      </section>

      <ModuleAISummaryPanel moduleName="Studio" suggestions={data.aiSuggestions} />
    </section>
  )
}

