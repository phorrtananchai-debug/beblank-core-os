import { useState } from 'react'
import type { ActionRequest, OsData, StudioBillingGate, StudioInspection, StudioMilestone, StudioMobileTab, StudioProject, StudioRisk, StudioTask } from '../../../types/models'
import {
  EmptyState,
  FilterBar,
  MetricLine,
  ProjectCard,
  ReferenceLabel,
  SectionHeader,
  StatusBadge,
  WorkspacePanel,
} from '../../shared/workspace'
import {
  gateStatusToWorkspaceStatus,
  inspectionStatusToWorkspaceStatus,
  milestoneStatusToWorkspaceStatus,
  projectHealthToWorkspaceStatus,
  riskStatusToWorkspaceStatus,
  taskStatusToWorkspaceStatus,
} from '../../shared/workspace'
import {
  STUDIO_SAMPLE_DATE,
  formatStudioDate,
  formatStudioDateTime,
  isStudioThisWeekDate,
  isStudioTodayDate,
  isStudioTodayTask,
  projectById,
} from '../studioHelpers'

type CreateActionRequest = (input: Omit<ActionRequest, 'id' | 'requestedAt' | 'requestedBy' | 'requiresApproval'>) => void

type MobileTabKey = StudioMobileTab['key']

interface MobileStudioAppProps {
  data: OsData
  createActionRequest: CreateActionRequest
}

const navLabel: Record<MobileTabKey, string> = {
  home: 'Home',
  calendar: 'Calendar',
  'quick-add': '+',
  projects: 'Projects',
  more: 'More',
}

const tabIcon: Record<MobileTabKey, string> = {
  home: 'H',
  calendar: 'C',
  'quick-add': '+',
  projects: 'P',
  more: 'M',
}

export const MobileStudioApp = ({ data, createActionRequest }: MobileStudioAppProps) => {
  const tabs = data.studioMobileTabs.length > 0 ? data.studioMobileTabs : defaultTabs
  const [activeTab, setActiveTab] = useState<MobileTabKey>('home')
  const [selectedProjectId, setSelectedProjectId] = useState(data.studioProjects[0]?.id ?? '')

  const selectedProject = projectById(data.studioProjects, selectedProjectId) ?? data.studioProjects[0] ?? null
  const urgentTasks = [...data.studioTasks]
    .filter((task) => task.status !== 'done' && isStudioTodayTask(task))
    .sort((a, b) => (a.priority === b.priority ? a.endDate.localeCompare(b.endDate) : priorityOrder(b.priority) - priorityOrder(a.priority)))
    .slice(0, 4)

  const todayInspection = [...data.studioInspections]
    .filter((inspection) => isStudioTodayDate(inspection.scheduledAt))
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0]

  return (
    <section className="mx-auto grid min-h-[calc(100vh-1.5rem)] w-full max-w-[460px] gap-4 rounded-[34px] border border-[color:var(--bbh-border)] bg-[color:var(--bbh-canvas)] p-3 shadow-[0_24px_70px_rgba(25,19,14,0.08)]">
      <MobileDashboard
        activeTab={activeTab}
        selectedProject={selectedProject}
        urgentTasks={urgentTasks}
        onTabChange={setActiveTab}
        tabs={tabs}
        todayInspection={todayInspection}
      />

      <div className="grid gap-4 pb-2">
        {activeTab === 'home' ? (
          <MobileHome
            createActionRequest={createActionRequest}
            onProjectSelect={setSelectedProjectId}
            projects={data.studioProjects}
            selectedProject={selectedProject}
            tasks={urgentTasks}
            todayInspection={todayInspection}
          />
        ) : null}

        {activeTab === 'calendar' ? (
          <MobileCalendar inspections={data.studioInspections} milestones={data.studioMilestones} projects={data.studioProjects} />
        ) : null}

        {activeTab === 'quick-add' ? <MobileQuickAdd createActionRequest={createActionRequest} projects={data.studioProjects} /> : null}

        {activeTab === 'projects' ? (
          <MobileProjects onProjectSelect={setSelectedProjectId} projects={data.studioProjects} selectedProjectId={selectedProjectId} />
        ) : null}

        {activeTab === 'more' ? (
          <MobileMore approvals={data.approvals.length} inspections={data.studioInspections} projects={data.studioProjects} />
        ) : null}
      </div>

      {selectedProject ? (
        <MobileTaskSheet
          gates={gatesByProject(data.studioBillingGates, selectedProject.id)}
          inspections={inspectionsByProject(data.studioInspections, selectedProject.id)}
          milestones={milestonesByProject(data.studioMilestones, selectedProject.id)}
          project={selectedProject}
          risks={risksByProject(data.studioRisks, selectedProject.id)}
          tasks={tasksByProject(data.studioTasks, selectedProject.id)}
        />
      ) : null}
    </section>
  )
}

export const MobileDashboard = ({
  activeTab,
  onTabChange,
  selectedProject,
  tabs,
  urgentTasks,
  todayInspection,
}: {
  activeTab: MobileTabKey
  onTabChange: (tab: MobileTabKey) => void
  selectedProject: StudioProject | null
  tabs: StudioMobileTab[]
  urgentTasks: StudioTask[]
  todayInspection?: StudioInspection
}) => {
  const health = selectedProject?.projectHealth ?? 'healthy'
  return (
    <header className="grid gap-3 rounded-[28px] bg-[color:var(--bbh-surface)] p-4 shadow-[0_18px_50px_rgba(25,19,14,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--bbh-text-muted)]" style={{ fontFamily: '"Geist Mono", "Intel One Mono", "JetBrains Mono", ui-monospace, monospace' }}>
            Studio OS / Khon Kaen
          </p>
          <h1 className="text-[1.6rem] font-semibold tracking-tight text-[color:var(--bbh-text)]" style={{ fontFamily: '"Space Grotesk", "Inter", system-ui, sans-serif' }}>
            Control room
          </h1>
        </div>
        <StatusBadge status={projectHealthToWorkspaceStatus(health)} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MetricLine label="Urgent" value={urgentTasks.length} detail="Open work" />
        <MetricLine
          label="Today"
          value={todayInspection ? formatMobileInspectionTime(todayInspection.scheduledAt) : 'No inspect'}
          detail={todayInspection?.title ?? 'Clear'}
        />
      </div>

      <nav className="grid grid-cols-5 gap-2 rounded-[24px] border border-[color:var(--bbh-border)]/70 bg-[color:var(--bbh-surface-muted)] p-2" aria-label="Studio navigation">
        {tabs.map((tab) => {
          const key = tab.key as MobileTabKey
          const active = activeTab === key
          return (
            <button
              key={tab.id}
              className={`flex flex-col items-center justify-center gap-1 rounded-[18px] px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] transition ${
                key === 'quick-add'
                  ? 'bg-[color:var(--bbh-accent)] text-white'
                  : active
                    ? 'bg-[color:var(--bbh-accent-soft)] text-[color:var(--bbh-text)]'
                    : 'text-[color:var(--bbh-text-muted)] hover:bg-white'
              }`}
              type="button"
              onClick={() => onTabChange(key)}
            >
              <span style={{ fontFamily: '"Geist Mono", "Intel One Mono", "JetBrains Mono", ui-monospace, monospace' }}>{tabIcon[key]}</span>
              <span>{navLabel[key]}</span>
            </button>
          )
        })}
      </nav>
    </header>
  )
}

export const MobileHome = ({
  createActionRequest,
  onProjectSelect,
  projects,
  selectedProject,
  tasks,
  todayInspection,
}: {
  createActionRequest: CreateActionRequest
  onProjectSelect: (projectId: string) => void
  projects: StudioProject[]
  selectedProject: StudioProject | null
  tasks: StudioTask[]
  todayInspection?: StudioInspection
}) => {
  const heroTask = tasks[0]
  const projectLoad = projects.reduce((sum, project) => sum + project.progress, 0) / Math.max(projects.length, 1)
  const gateCount = projects.reduce((sum, project) => sum + project.progressBillingGateIds.length, 0)

  return (
    <div className="grid gap-4">
      <WorkspacePanel
        eyebrow="Today focus"
        title={selectedProject?.name ?? 'Karun Central Khon Kaen'}
        summary={selectedProject?.taskTimeline ?? 'Daily site checks, owner sign-off, and billing gates stay in one calm lane.'}
      >
        <div className="grid gap-2 md:grid-cols-3">
          <MetricLine label="Avg progress" value={`${Math.round(projectLoad)}%`} detail="Across active projects" />
          <MetricLine label="Billing gates" value={gateCount} detail="Progress checkpoints" />
          <MetricLine label="Inspection" value={todayInspection ? 'Today' : 'None'} detail={todayInspection?.title ?? 'No inspection due'} />
        </div>
      </WorkspacePanel>

      <WorkspacePanel eyebrow="Urgent tasks" title="Open work" summary="Only the items that need a decision or a site move are shown here.">
        <div className="grid gap-3">
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <button
                key={task.id}
                className="flex items-start justify-between gap-3 rounded-[24px] border border-[color:var(--bbh-border)]/55 bg-[color:var(--bbh-surface-muted)] p-4 text-left"
                type="button"
                onClick={() => onProjectSelect(task.projectId)}
              >
                <div className="grid gap-1">
                  <p className="text-sm font-semibold tracking-tight text-[color:var(--bbh-text)]" style={{ fontFamily: '"Space Grotesk", "Inter", system-ui, sans-serif' }}>
                    {task.title}
                  </p>
                  <p className="text-sm leading-6 text-[color:var(--bbh-text-soft)]">
                    {task.owner} / {task.trade} / {task.timelineSlot}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <ReferenceLabel label="Site" value={task.siteCheck} />
                    <ReferenceLabel label="State" value={task.processState} />
                  </div>
                </div>
                <StatusBadge status={taskStatusToWorkspaceStatus(task.status)} label={task.priority.toUpperCase()} />
              </button>
            ))
          ) : (
            <EmptyState title="No urgent tasks" body="The mobile home is clear." />
          )}
        </div>
      </WorkspacePanel>

      <WorkspacePanel eyebrow="Next step" title="Site move" summary={heroTask?.blocker ?? 'Open the next job and keep the schedule moving one check at a time.'}>
        <button
          className="studio-mobile-action"
          type="button"
          onClick={() =>
            createActionRequest({
              module: 'studio',
              actionType: 'studio.addTask',
              description: 'Create a quick follow-up task from mobile home',
              payload: {
                projectId: selectedProject?.id ?? projects[0]?.id ?? '',
                title: 'Mobile follow-up task',
                priority: 'high',
                owner: selectedProject?.owner ?? 'Operator',
                trade: selectedProject?.trade ?? 'General',
                processState: 'planned',
                siteCheck: 'required',
                timelineSlot: 'Today',
              },
            })
          }
        >
          Queue follow-up task
        </button>
      </WorkspacePanel>
    </div>
  )
}

export const MobileCalendar = ({
  inspections,
  milestones,
  projects,
}: {
  inspections: StudioInspection[]
  milestones: StudioMilestone[]
  projects: StudioProject[]
}) => {
  const rows = [
    ...inspections.map((inspection) => ({
      kind: 'inspection' as const,
      date: inspection.scheduledAt.slice(0, 10),
      title: inspection.title,
      meta: `${projectById(projects, inspection.projectId)?.name ?? 'Project'} / ${inspection.trade}`,
      status: inspection.status,
      detail: inspection.notes ?? inspection.plan,
    })),
    ...milestones.map((milestone) => ({
      kind: 'milestone' as const,
      date: milestone.dueDate,
      title: milestone.label,
      meta: `${projectById(projects, milestone.projectId)?.name ?? 'Project'} / ${milestone.phase}`,
      status: milestone.status,
      detail: milestone.notes,
    })),
  ].filter((row) => isStudioThisWeekDate(row.date) || row.date === STUDIO_SAMPLE_DATE).sort((a, b) => byDateAsc(a.date, b.date))

  return (
    <div className="grid gap-4">
      <WorkspacePanel eyebrow="Timeline" title="Inspections and milestones" summary="A single list for the next control points.">
        <div className="grid gap-3">
          {rows.map((row, index) => (
            <div key={`${row.kind}-${row.date}-${index}`} className="rounded-[24px] border border-[color:var(--bbh-border)]/55 bg-[color:var(--bbh-surface-muted)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="grid gap-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--bbh-text-muted)]" style={{ fontFamily: '"Geist Mono", "Intel One Mono", "JetBrains Mono", ui-monospace, monospace' }}>
                    {formatStudioDate(row.date)}
                  </p>
                  <p className="text-sm font-semibold tracking-tight text-[color:var(--bbh-text)]" style={{ fontFamily: '"Space Grotesk", "Inter", system-ui, sans-serif' }}>
                    {row.title}
                  </p>
                  <p className="text-sm leading-6 text-[color:var(--bbh-text-soft)]">{row.meta}</p>
                </div>
                <StatusBadge status={row.kind === 'inspection' ? inspectionStatusToWorkspaceStatus(row.status as StudioInspection['status']) : milestoneStatusToWorkspaceStatus(row.status as StudioMilestone['status'])} />
              </div>
              {row.detail ? <p className="mt-3 text-sm leading-6 text-[color:var(--bbh-text-soft)]">{row.detail}</p> : null}
            </div>
          ))}
        </div>
      </WorkspacePanel>
    </div>
  )
}

export const MobileQuickAdd = ({
  createActionRequest,
  projects,
}: {
  createActionRequest: CreateActionRequest
  projects: StudioProject[]
}) => {
  const [mode, setMode] = useState<'task' | 'issue' | 'inspection'>('task')
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')

  const submit = () => {
    if (!projectId || !title.trim()) return

    if (mode === 'task') {
      createActionRequest({
        module: 'studio',
        actionType: 'studio.addTask',
        description: `Queue quick task: ${title}`,
        payload: {
          projectId,
          title,
          notes: detail,
          owner: projectById(projects, projectId)?.owner ?? 'Operator',
          trade: projectById(projects, projectId)?.trade ?? 'General',
          priority: 'high',
          processState: 'planned',
          siteCheck: 'required',
          timelineSlot: 'Today',
        },
      })
    } else if (mode === 'issue') {
      createActionRequest({
        module: 'studio',
        actionType: 'studio.addIssue',
        description: `Queue site issue: ${title}`,
        payload: {
          projectId,
          title,
          blocker: detail || 'Needs a site review',
          owner: projectById(projects, projectId)?.owner ?? 'Operator',
          trade: projectById(projects, projectId)?.trade ?? 'General',
          severity: 'medium',
          processState: 'watch',
          action: 'Inspect on the next visit.',
          notes: detail,
        },
      })
    } else {
      createActionRequest({
        module: 'studio',
        actionType: 'studio.addInspectionNote',
        description: `Queue inspection note: ${title}`,
        payload: {
          projectId,
          title,
          inspector: projectById(projects, projectId)?.owner ?? 'Operator',
          trade: projectById(projects, projectId)?.trade ?? 'General',
          type: 'site-walk',
          status: 'scheduled',
          scheduledAt: new Date().toISOString(),
          checklist: ['Photo log', 'Issue note'],
          plan: detail,
          notes: detail,
        },
      })
    }

    setTitle('')
    setDetail('')
  }

  return (
    <div className="grid gap-4">
      <WorkspacePanel eyebrow="Quick add" title="Create work" summary="Short writes stay behind approval.">
        <FilterBar
          filters={[
            { key: 'task', label: 'Task', active: mode === 'task' },
            { key: 'issue', label: 'Issue', active: mode === 'issue' },
            { key: 'inspection', label: 'Inspection', active: mode === 'inspection' },
          ]}
          onChange={(key) => setMode(key as typeof mode)}
        />
        <label className="grid gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--bbh-text-muted)]" style={{ fontFamily: '"Geist Mono", "Intel One Mono", "JetBrains Mono", ui-monospace, monospace' }}>
            Project
          </span>
          <select className="w-full rounded-[18px] border border-[color:var(--bbh-border)] bg-[color:var(--bbh-surface)] px-4 py-3 text-sm text-[color:var(--bbh-text)] outline-none" value={projectId} onChange={(event) => setProjectId(event.target.value)}>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--bbh-text-muted)]" style={{ fontFamily: '"Geist Mono", "Intel One Mono", "JetBrains Mono", ui-monospace, monospace' }}>
            Title
          </span>
          <input className="w-full rounded-[18px] border border-[color:var(--bbh-border)] bg-[color:var(--bbh-surface)] px-4 py-3 text-sm text-[color:var(--bbh-text)] outline-none" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Brief task or issue title" />
        </label>
        <label className="grid gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--bbh-text-muted)]" style={{ fontFamily: '"Geist Mono", "Intel One Mono", "JetBrains Mono", ui-monospace, monospace' }}>
            Notes
          </span>
          <textarea className="min-h-28 w-full rounded-[18px] border border-[color:var(--bbh-border)] bg-[color:var(--bbh-surface)] px-4 py-3 text-sm text-[color:var(--bbh-text)] outline-none" value={detail} onChange={(event) => setDetail(event.target.value)} rows={4} placeholder="Short note for the approval queue" />
        </label>
        <button className="studio-mobile-action" type="button" onClick={submit}>
          Queue for approval
        </button>
      </WorkspacePanel>
    </div>
  )
}

export const MobileProjects = ({
  onProjectSelect,
  projects,
  selectedProjectId,
}: {
  onProjectSelect: (projectId: string) => void
  projects: StudioProject[]
  selectedProjectId: string
}) => (
  <div className="grid gap-4">
    <WorkspacePanel eyebrow="Projects" title="Project cards" summary="This is the main entry point on mobile.">
      <div className="grid gap-3">
        {projects.map((project) => (
          <button
            key={project.id}
            className={`rounded-[28px] text-left ${selectedProjectId === project.id ? 'ring-1 ring-[color:var(--bbh-accent)]' : ''}`}
            type="button"
            onClick={() => onProjectSelect(project.id)}
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
                <div className="flex flex-wrap items-center gap-2">
                  <ReferenceLabel label="Site" value={project.location ?? 'Khon Kaen'} />
                  <ReferenceLabel label="State" value={project.processState} />
                </div>
              }
            />
          </button>
        ))}
      </div>
    </WorkspacePanel>
  </div>
)

export const MobileTaskSheet = ({
  project,
  tasks,
  milestones,
  inspections,
  gates,
  risks,
}: {
  project: StudioProject
  tasks: StudioTask[]
  milestones: StudioMilestone[]
  inspections: StudioInspection[]
  gates: StudioBillingGate[]
  risks: StudioRisk[]
}) => (
  <WorkspacePanel eyebrow="Project detail" title={project.name} summary={project.notes ?? 'Project detail in the pocket.'}>
    <div className="grid gap-3">
      <div className="grid gap-2 md:grid-cols-2">
        <MetricLine label="Owner" value={project.owner} />
        <MetricLine label="Trade" value={project.trade} />
        <MetricLine label="Progress" value={`${project.progress}%`} />
        <MetricLine label="Site check" value={project.siteCheck} />
      </div>

      <section className="grid gap-2 rounded-[24px] bg-[color:var(--bbh-surface-muted)] p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--bbh-text-muted)]" style={{ fontFamily: '"Geist Mono", "Intel One Mono", "JetBrains Mono", ui-monospace, monospace' }}>
          Blocker
        </p>
        <p className="text-sm leading-6 text-[color:var(--bbh-text-soft)]">{project.blocker ?? 'None'}</p>
      </section>

      <section className="grid gap-2">
        <SectionHeader eyebrow="Tasks" title="Current tasks" />
        <div className="grid gap-2">
          {tasks.slice(0, 3).map((task) => (
            <div key={task.id} className="flex items-start justify-between gap-3 rounded-[24px] border border-[color:var(--bbh-border)]/55 bg-[color:var(--bbh-surface-muted)] p-4">
              <div className="grid gap-1">
                <p className="text-sm font-semibold tracking-tight text-[color:var(--bbh-text)]" style={{ fontFamily: '"Space Grotesk", "Inter", system-ui, sans-serif' }}>
                  {task.title}
                </p>
                <p className="text-sm leading-6 text-[color:var(--bbh-text-soft)]">
                  {task.owner} / {task.timelineSlot}
                </p>
              </div>
              <StatusBadge status={taskStatusToWorkspaceStatus(task.status)} label={task.priority.toUpperCase()} />
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-2">
        <SectionHeader eyebrow="Billing" title="Progress gates" />
        <div className="grid gap-2">
          {gates.slice(0, 3).map((gate) => (
            <div key={gate.id} className="flex items-start justify-between gap-3 rounded-[24px] border border-[color:var(--bbh-border)]/55 bg-[color:var(--bbh-surface-muted)] p-4">
              <div className="grid gap-1">
                <p className="text-sm font-semibold tracking-tight text-[color:var(--bbh-text)]" style={{ fontFamily: '"Space Grotesk", "Inter", system-ui, sans-serif' }}>
                  {gate.label}
                </p>
                <p className="text-sm leading-6 text-[color:var(--bbh-text-soft)]">
                  THB {gate.amountTHB.toLocaleString('en-US')} / {gate.owner}
                </p>
              </div>
              <StatusBadge status={gateStatusToWorkspaceStatus(gate.status)} />
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-2">
        <SectionHeader eyebrow="Inspections" title="Site visits" />
        <div className="grid gap-2">
          {inspections.slice(0, 2).map((inspection) => (
            <div key={inspection.id} className="flex items-start justify-between gap-3 rounded-[24px] border border-[color:var(--bbh-border)]/55 bg-[color:var(--bbh-surface-muted)] p-4">
              <div className="grid gap-1">
                <p className="text-sm font-semibold tracking-tight text-[color:var(--bbh-text)]" style={{ fontFamily: '"Space Grotesk", "Inter", system-ui, sans-serif' }}>
                  {inspection.title}
                </p>
                <p className="text-sm leading-6 text-[color:var(--bbh-text-soft)]">
                  {formatStudioDateTime(inspection.scheduledAt)} / {inspection.inspector}
                </p>
              </div>
              <StatusBadge status={inspectionStatusToWorkspaceStatus(inspection.status)} />
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-2">
        <SectionHeader eyebrow="Risks" title="Blockers" />
        <div className="grid gap-2">
          {risks.slice(0, 2).map((risk) => (
            <div key={risk.id} className="flex items-start justify-between gap-3 rounded-[24px] border border-[color:var(--bbh-border)]/55 bg-[color:var(--bbh-surface-muted)] p-4">
              <div className="grid gap-1">
                <p className="text-sm font-semibold tracking-tight text-[color:var(--bbh-text)]" style={{ fontFamily: '"Space Grotesk", "Inter", system-ui, sans-serif' }}>
                  {risk.title}
                </p>
                <p className="text-sm leading-6 text-[color:var(--bbh-text-soft)]">{risk.blocker}</p>
              </div>
              <StatusBadge status={riskStatusToWorkspaceStatus(risk.severity === 'high' ? 'high' : risk.processState)} />
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-2">
        <SectionHeader eyebrow="Timeline" title="Milestones" />
        <div className="grid gap-2">
          {milestones.slice(0, 2).map((milestone) => (
            <div key={milestone.id} className="flex items-start justify-between gap-3 rounded-[24px] border border-[color:var(--bbh-border)]/55 bg-[color:var(--bbh-surface-muted)] p-4">
              <div className="grid gap-1">
                <p className="text-sm font-semibold tracking-tight text-[color:var(--bbh-text)]" style={{ fontFamily: '"Space Grotesk", "Inter", system-ui, sans-serif' }}>
                  {milestone.label}
                </p>
                <p className="text-sm leading-6 text-[color:var(--bbh-text-soft)]">
                  {milestone.phase} / {formatStudioDate(milestone.dueDate)}
                </p>
              </div>
              <StatusBadge status={milestoneStatusToWorkspaceStatus(milestone.status)} />
            </div>
          ))}
        </div>
      </section>
    </div>
  </WorkspacePanel>
)

export const MobileMore = ({
  approvals,
  inspections,
  projects,
}: {
  approvals: number
  inspections: StudioInspection[]
  projects: StudioProject[]
}) => (
  <div className="grid gap-4">
    <WorkspacePanel eyebrow="More" title="Source and settings" summary="Sync status stays calm and readable.">
      <div className="grid gap-2">
        <MetricLine label="Source" value="Mock sheet" detail="Karun Central Khon Kaen" />
        <MetricLine label="Projects" value={projects.length} detail={`${inspections.length} inspections linked`} />
        <MetricLine label="Approvals" value={approvals} detail="Writes stay behind review" />
      </div>
      <div className="grid gap-2 rounded-[24px] bg-[color:var(--bbh-surface-muted)] p-4">
        <ReferenceLabel label="Mode" value="Mock" />
        <ReferenceLabel label="Sync" value="Pending" />
        <ReferenceLabel label="Authority" value="Sheet" />
      </div>
    </WorkspacePanel>
  </div>
)

const defaultTabs: StudioMobileTab[] = [
  { id: 'tab-home', key: 'home', label: 'Home', icon: 'H' },
  { id: 'tab-calendar', key: 'calendar', label: 'Calendar', icon: 'C' },
  { id: 'tab-quick-add', key: 'quick-add', label: '+', icon: '+' },
  { id: 'tab-projects', key: 'projects', label: 'Projects', icon: 'P' },
  { id: 'tab-more', key: 'more', label: 'More', icon: 'M' },
]

const priorityOrder = (priority: StudioTask['priority']) => (priority === 'high' ? 3 : priority === 'medium' ? 2 : 1)

const byDateAsc = (a: string, b: string) => a.localeCompare(b)

const gatesByProject = (gates: StudioBillingGate[], projectId: string) => gates.filter((gate) => gate.projectId === projectId)

const inspectionsByProject = (inspections: StudioInspection[], projectId: string) =>
  inspections.filter((inspection) => inspection.projectId === projectId)

const milestonesByProject = (milestones: StudioMilestone[], projectId: string) =>
  milestones.filter((milestone) => milestone.projectId === projectId)

const risksByProject = (risks: StudioRisk[], projectId: string) => risks.filter((risk) => risk.projectId === projectId)

const tasksByProject = (tasks: StudioTask[], projectId: string) => tasks.filter((task) => task.projectId === projectId)

const formatMobileInspectionTime = (value: string) =>
  new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
