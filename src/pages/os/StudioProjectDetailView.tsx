import { Link, useParams } from 'react-router-dom'
import { useOs } from '../../core/os/useOs'
import {
  STUDIO_SAMPLE_DATE,
  formatStudioDate,
  formatStudioDateTime,
  isStudioThisWeekDate,
  isStudioUpcomingInspection,
} from '../../components/studio/studioHelpers'
import {
  DataTable,
  DecisionCard,
  EmptyState,
  MetricLine,
  PageHeader,
  ProjectCard,
  ReferenceLabel,
  StatusBadge,
  WorkspacePanel,
} from '../../components/shared/workspace'
import {
  gateStatusToWorkspaceStatus,
  inspectionStatusToWorkspaceStatus,
  milestoneStatusToWorkspaceStatus,
  projectHealthToWorkspaceStatus,
  riskStatusToWorkspaceStatus,
  taskStatusToWorkspaceStatus,
} from '../../components/shared/workspace'
import type { StudioInspection, StudioMilestone, StudioRisk, StudioTask, StudioTimelinePhase } from '../../types/models'

export const StudioProjectDetailPage = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const { data, createActionRequest, changeLogs, snapshots, pendingApprovals } = useOs()

  const project = data.studioProjects.find((item) => item.id === projectId || item.slug === projectId)

  if (!project) {
    return (
      <section className="grid gap-4">
        <Link className="studio-button-secondary w-fit" to="/os/studio">
          Back to studio
        </Link>
        <EmptyState
          title="Project not found"
          body="The requested project does not exist in the Karun Central Khon Kaen mock data set."
        />
      </section>
    )
  }

  const tasks = data.studioTasks.filter((task) => task.projectId === project.id)
  const milestones = data.studioMilestones.filter((item) => item.projectId === project.id)
  const gates = data.studioBillingGates.filter((gate) => gate.projectId === project.id)
  const inspections = data.studioInspections.filter((inspection) => inspection.projectId === project.id)
  const risks = data.studioRisks.filter((risk) => risk.projectId === project.id)
  const phases = data.studioTimelinePhases.filter((phase) => phase.projectId === project.id)
  const documents = data.documents.filter((document) => document.projectId === project.id)

  const blockedTasks = tasks.filter((task) => task.status === 'blocked' || task.processState === 'blocked')
  const pendingDecisionEntries = pendingApprovals
    .filter((entry) => (entry.description.includes(project.name) || entry.actionType.includes('studio')) && entry.requestedAt.slice(0, 10) >= STUDIO_SAMPLE_DATE)
    .slice(0, 3)
    .map((approval, index) => ({
      code: `APR-${String(index + 1).padStart(3, '0')}`,
      date: formatStudioDateTime(approval.requestedAt),
      detail: approval.actionType,
      owner: approval.requestedBy,
      reason: approval.description,
      status: 'ACTIVE' as const,
      title: 'Pending approval',
    }))

  if (pendingDecisionEntries.length === 0) {
    pendingDecisionEntries.push({
      code: 'DEC-001',
      date: formatStudioDateTime(new Date().toISOString()),
      detail: 'Project decision surface',
      owner: project.owner,
      reason: project.blocker ?? project.notes ?? 'Confirm the next site move for this project',
      status: 'ACTIVE' as const,
      title: 'Project call pending',
    })
  }

  const decisionHistory = [
    ...changeLogs
      .filter((entry) => entry.summary.includes(project.name) || entry.actionType.includes('studio'))
      .slice(0, 3)
      .map((entry, index) => ({
        code: `REV-${String(index + 1).padStart(3, '0')}`,
        date: formatStudioDateTime(entry.changedAt),
        detail: entry.actionType,
        owner: entry.changedBy,
        reason: entry.summary,
        status: 'COMPLETE' as const,
        title: 'Change log entry',
      })),
    ...snapshots
      .filter((entry) => entry.reason.includes(project.name))
      .slice(0, 2)
      .map((snapshot, index) => ({
        code: `SNAP-${String(index + 1).padStart(3, '0')}`,
        date: formatStudioDateTime(snapshot.createdAt),
        detail: 'Snapshot captured from Studio',
        owner: 'System',
        reason: snapshot.reason,
        status: 'WATCH' as const,
        title: 'Workspace snapshot',
      })),
  ]

  const nextInspection = [...inspections].filter(isStudioUpcomingInspection).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0] ?? null
  const criticalRisk = [...risks].filter((risk) => isStudioThisWeekDate(risk.dueDate)).sort((a, b) => riskPriority(b) - riskPriority(a) || a.dueDate.localeCompare(b.dueDate))[0] ?? null

  return (
    <section className="grid gap-8">
      <PageHeader
        eyebrow="Studio / Project detail"
        title={project.name}
        summary={project.notes ?? 'Project operating system with tasks, timeline, inspections, billing gates, risks, decisions, and documents.'}
        actions={
          <>
            <Link className="studio-button-secondary" to="/os/studio">
              Back to studio
            </Link>
            <Link className="studio-button-primary" to="/os/studio/mobile">
              Launch mobile
            </Link>
          </>
        }
        meta={
          <>
            <ReferenceLabel label="Project" value={project.id} />
            <ReferenceLabel label="Site" value={project.location ?? 'Khon Kaen'} />
            <ReferenceLabel label="State" value={project.processState} />
          </>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <WorkspacePanel
          highlight
          eyebrow="Project command surface"
          title="Attention first"
          summary="The project detail opens with the next move, the current blockage, the pending call, and the next inspection."
        >
          <ProjectCard
            code={project.id}
            status={projectHealthToWorkspaceStatus(project.projectHealth)}
            title={project.name}
            owner={project.owner}
            trade={project.trade}
            phase={project.phase}
            progress={project.progress}
            summary={project.notes}
            blocker={project.blocker}
            detail={
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                <MetricLine label="What needs attention now?" value={blockedTasks.length > 0 ? blockedTasks[0].title : 'Clear'} detail={blockedTasks[0]?.blocker ?? 'No task is blocked right now'} />
                <MetricLine label="What is blocked?" value={criticalRisk ? criticalRisk.title : 'Clear'} detail={criticalRisk?.blocker ?? 'No critical risk is holding the project'} />
                <MetricLine label="What decision is pending?" value={pendingDecisionEntries.length > 0 ? pendingDecisionEntries[0].title : 'None'} detail={pendingDecisionEntries[0]?.reason ?? 'Nothing is waiting on approval'} />
                <MetricLine label="What inspection is next?" value={nextInspection ? formatStudioDateTime(nextInspection.scheduledAt) : 'None'} detail={nextInspection?.title ?? 'No inspection due'} />
              </div>
            }
            actions={
              <>
                <button
                  className="studio-button-primary"
                  type="button"
                  onClick={() =>
                    createActionRequest({
                      module: 'studio',
                      actionType: 'studio.addTask',
                      description: `Queue follow-up task for ${project.name}`,
                      payload: {
                        projectId: project.id,
                        title: `Follow-up for ${project.name}`,
                        owner: project.owner,
                        trade: project.trade,
                        priority: 'high',
                        processState: 'planned',
                        siteCheck: 'required',
                        timelineSlot: 'Today / 11:00',
                      },
                    })
                  }
                >
                  Queue task
                </button>
                <button
                  className="studio-button-secondary"
                  type="button"
                  onClick={() =>
                    createActionRequest({
                      module: 'studio',
                      actionType: 'studio.addInspectionNote',
                      description: `Queue inspection note for ${project.name}`,
                      payload: {
                        projectId: project.id,
                        title: `${project.name} site walk`,
                        inspector: project.owner,
                        trade: project.trade,
                        type: 'site-walk',
                        status: 'scheduled',
                        scheduledAt: new Date().toISOString(),
                        checklist: ['Photo log', 'Snag log'],
                        plan: project.siteInspectionPlan ?? '',
                        notes: project.blocker ?? '',
                      },
                    })
                  }
                >
                  Queue inspection
                </button>
                <button
                  className="studio-button-ghost"
                  type="button"
                  onClick={() =>
                    createActionRequest({
                      module: 'studio',
                      actionType: 'studio.requestDecision',
                      description: `Request decision log entry for ${project.name}`,
                      payload: {
                        projectId: project.id,
                        title: `Decision for ${project.name}`,
                        owner: project.owner,
                        reason: project.blocker ?? project.notes ?? 'Project call pending',
                        priority: project.priority,
                      },
                    })
                  }
                >
                  Request decision
                </button>
              </>
            }
          />
        </WorkspacePanel>

        <div className="grid gap-6">
          <WorkspacePanel eyebrow="Attention now" title="Urgent tasks" summary="The first read should tell the team what needs action today.">
            {tasks.length > 0 ? (
              <div className="grid gap-3">
                {tasks
                  .filter((task) => task.timelineSlot === 'Today' || task.status !== 'done')
                  .slice(0, 3)
                  .map((task) => (
                    <TaskRow key={task.id} task={task} />
                  ))}
              </div>
            ) : (
              <EmptyState title="No tasks" body="Tasks for this project will appear here when the sheet populates." />
            )}
          </WorkspacePanel>

          <WorkspacePanel eyebrow="Pending decision" title="Decision surface" summary="Open approvals stay close to the top of the project view.">
            {pendingDecisionEntries.length > 0 ? (
              <div className="grid gap-3">
                {pendingDecisionEntries.map((entry) => (
                  <DecisionCard
                    key={`${entry.code}-${entry.date}`}
                    code={entry.code}
                    title={entry.title}
                    reason={entry.reason}
                    owner={entry.owner}
                    date={entry.date}
                    detail={entry.detail}
                    status={entry.status}
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="No pending decisions" body="Nothing is waiting on approval right now." />
            )}
          </WorkspacePanel>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <WorkspacePanel eyebrow="Next inspection" title="Inspection timing" summary="Keep the next site visit visible before the supporting schedule comes in.">
          {nextInspection ? <InspectionRow inspection={nextInspection} /> : <EmptyState title="No inspections" body="Site visits will appear here once the inspection schedule is set." />}
        </WorkspacePanel>

        <WorkspacePanel eyebrow="What is blocked?" title="Critical risks" summary="Only blockers that can slow the job should occupy the top of the page.">
          <div className="grid gap-3">
            {criticalRisk ? (
              <RiskRow risk={criticalRisk} />
            ) : (
              <EmptyState title="No critical risks" body="The risk queue is clear for this project." />
            )}
            {blockedTasks.length > 0 ? blockedTasks.slice(0, 2).map((task) => <TaskRow key={task.id} task={task} />) : null}
          </div>
        </WorkspacePanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <WorkspacePanel eyebrow="This week" title="Milestones and phases" summary="The supporting schedule still matters, but it sits below the urgent surface.">
          <div className="grid gap-4">
            <div className="grid gap-3">
              {milestones.length > 0 ? (
                milestones.map((milestone) => <MilestoneRow key={milestone.id} milestone={milestone} />)
              ) : (
                <EmptyState title="No milestones" body="Milestone rows will appear when the mock data expands." />
              )}
            </div>
            <div className="grid gap-3">
              {phases.length > 0 ? (
                phases.map((phase) => <PhaseRow key={phase.id} phase={phase} />)
              ) : (
                <EmptyState title="No phases" body="Timeline phases are not available for this project yet." />
              )}
            </div>
          </div>
        </WorkspacePanel>

        <WorkspacePanel eyebrow="Progress billing" title="Payment gates" summary="Release only when the site evidence and approval path are clear.">
          {gates.length > 0 ? (
            <DataTable
              columns={[
                { key: 'gate', label: 'Gate' },
                { key: 'amount', label: 'Amount' },
                { key: 'status', label: 'Status' },
              ]}
              rows={gates.map((gate) => ({
                id: gate.id,
                cells: [
                  <div className="grid gap-1" key={`${gate.id}-label`}>
                    <span className="font-semibold text-[color:var(--bbh-text)]">{gate.label}</span>
                    <span>
                      {formatStudioDate(gate.dueDate)} / {gate.owner}
                    </span>
                  </div>,
                  <span key={`${gate.id}-amount`}>THB {gate.amountTHB.toLocaleString('en-US')}</span>,
                  <div className="flex items-center justify-end gap-2" key={`${gate.id}-status`}>
                    <StatusBadge status={gateStatusToWorkspaceStatus(gate.status)} />
                    <a className="studio-button-ghost" href={gate.paymentLink ?? project.paymentLink} target="_blank" rel="noreferrer">
                      Payment link
                    </a>
                  </div>,
                ],
              }))}
            />
          ) : (
            <EmptyState title="No billing gates" body="Payment milestones will show here when linked." />
          )}
        </WorkspacePanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <WorkspacePanel eyebrow="Decision log" title="Revision trail" summary="Completed changes stay visible after the pending decision lane.">
          <div className="grid gap-3">
            {decisionHistory.length > 0 ? (
              decisionHistory.map((entry) => (
                <DecisionCard
                  key={`${entry.code}-${entry.date}`}
                  code={entry.code}
                  title={entry.title}
                  reason={entry.reason}
                  owner={entry.owner}
                  date={entry.date}
                  detail={entry.detail}
                  status={entry.status}
                />
              ))
            ) : (
              <EmptyState title="No decisions" body="Decision log entries will appear here when changes are recorded." />
            )}
          </div>
        </WorkspacePanel>

        <WorkspacePanel eyebrow="Documents" title="Project files" summary="Supporting information remains lower in the hierarchy, after the control surface.">
          {documents.length > 0 ? (
            <DataTable
              columns={[
                { key: 'title', label: 'Title' },
                { key: 'version', label: 'Version' },
                { key: 'updated', label: 'Updated' },
              ]}
              rows={documents.map((document) => ({
                id: document.id,
                cells: [
                  <div className="grid gap-1" key={`${document.id}-title`}>
                    <span className="font-semibold text-[color:var(--bbh-text)]">{document.title}</span>
                    <span>{document.packageType ?? 'Project file'}</span>
                  </div>,
                  <span key={`${document.id}-version`}>{document.version}</span>,
                  <span key={`${document.id}-updated`}>{formatStudioDateTime(document.updatedAt)}</span>,
                ],
              }))}
            />
          ) : (
            <EmptyState title="No project documents" body="The document section is ready for the next import from the sheet." />
          )}
        </WorkspacePanel>
      </section>
    </section>
  )
}

const TaskRow = ({ task }: { task: StudioTask }) => (
  <div className="flex items-start justify-between gap-3 rounded-[24px] border border-[color:var(--bbh-border)]/55 bg-[color:var(--bbh-surface-muted)] p-4">
    <div className="grid gap-1">
      <p
        className="text-sm font-semibold tracking-tight text-[color:var(--bbh-text)]"
        style={{ fontFamily: '"Space Grotesk", "Inter", system-ui, sans-serif' }}
      >
        {task.title}
      </p>
      <p className="text-sm leading-6 text-[color:var(--bbh-text-soft)]">
        {task.owner} / {task.trade}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <ReferenceLabel label="Timeline" value={task.timelineSlot} />
        <ReferenceLabel label="Site" value={task.siteCheck} />
      </div>
    </div>
    <StatusBadge status={taskStatusToWorkspaceStatus(task.status)} />
  </div>
)

const MilestoneRow = ({ milestone }: { milestone: StudioMilestone }) => (
  <div className="flex items-start justify-between gap-3 rounded-[24px] border border-[color:var(--bbh-border)]/55 bg-[color:var(--bbh-surface-muted)] p-4">
    <div className="grid gap-1">
      <p
        className="text-sm font-semibold tracking-tight text-[color:var(--bbh-text)]"
        style={{ fontFamily: '"Space Grotesk", "Inter", system-ui, sans-serif' }}
      >
        {milestone.label}
      </p>
      <p className="text-sm leading-6 text-[color:var(--bbh-text-soft)]">
        {milestone.phase} / {milestone.owner}
      </p>
      <ReferenceLabel label="Due" value={formatStudioDate(milestone.dueDate)} />
    </div>
    <StatusBadge status={milestoneStatusToWorkspaceStatus(milestone.status)} />
  </div>
)

const PhaseRow = ({ phase }: { phase: StudioTimelinePhase }) => (
  <div className="flex items-start justify-between gap-3 rounded-[24px] border border-[color:var(--bbh-border)]/55 bg-[color:var(--bbh-surface-muted)] p-4">
    <div className="grid gap-1">
      <p
        className="text-sm font-semibold tracking-tight text-[color:var(--bbh-text)]"
        style={{ fontFamily: '"Space Grotesk", "Inter", system-ui, sans-serif' }}
      >
        {phase.phase}
      </p>
      <p className="text-sm leading-6 text-[color:var(--bbh-text-soft)]">{phase.notes}</p>
      <div className="flex flex-wrap items-center gap-2">
        <ReferenceLabel label="Window" value={`${formatStudioDate(phase.startDate)} - ${formatStudioDate(phase.endDate)}`} />
      </div>
    </div>
    <StatusBadge status={phase.status} />
  </div>
)

const InspectionRow = ({ inspection }: { inspection: StudioInspection }) => (
  <div className="flex items-start justify-between gap-3 rounded-[24px] border border-[color:var(--bbh-border)]/55 bg-[color:var(--bbh-surface-muted)] p-4">
    <div className="grid gap-1">
      <p
        className="text-sm font-semibold tracking-tight text-[color:var(--bbh-text)]"
        style={{ fontFamily: '"Space Grotesk", "Inter", system-ui, sans-serif' }}
      >
        {inspection.title}
      </p>
      <p className="text-sm leading-6 text-[color:var(--bbh-text-soft)]">
        {inspection.trade} / {inspection.inspector}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <ReferenceLabel label="Scheduled" value={formatStudioDateTime(inspection.scheduledAt)} />
        <ReferenceLabel label="Type" value={inspection.type} />
      </div>
    </div>
    <StatusBadge status={inspectionStatusToWorkspaceStatus(inspection.status)} />
  </div>
)

const RiskRow = ({ risk }: { risk: StudioRisk }) => (
  <div className="flex items-start justify-between gap-3 rounded-[24px] border border-[color:var(--bbh-border)]/55 bg-[color:var(--bbh-surface-muted)] p-4">
    <div className="grid gap-1">
      <p
        className="text-sm font-semibold tracking-tight text-[color:var(--bbh-text)]"
        style={{ fontFamily: '"Space Grotesk", "Inter", system-ui, sans-serif' }}
      >
        {risk.title}
      </p>
      <p className="text-sm leading-6 text-[color:var(--bbh-text-soft)]">{risk.blocker}</p>
      <div className="flex flex-wrap items-center gap-2">
        <ReferenceLabel label="Owner" value={risk.owner} />
        <ReferenceLabel label="Due" value={formatStudioDate(risk.dueDate)} />
      </div>
    </div>
    <StatusBadge status={riskStatusToWorkspaceStatus(risk.severity === 'high' ? 'high' : risk.processState)} />
  </div>
)

const riskPriority = (risk: StudioRisk) => (risk.severity === 'high' ? 3 : risk.processState === 'blocked' ? 2 : 1)
