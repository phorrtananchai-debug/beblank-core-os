import { Link } from 'react-router-dom'
import { useOs } from '../../core/os/useOs'
import {
  STUDIO_SAMPLE_DATE,
  formatStudioDate,
  formatStudioDateTime,
  isStudioThisWeekDate,
  isStudioThisWeekTask,
  isStudioTodayTask,
  isStudioUpcomingInspection,
} from '../../components/studio/studioHelpers'
import {
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
  inspectionStatusToWorkspaceStatus,
  projectHealthToWorkspaceStatus,
  riskStatusToWorkspaceStatus,
  taskStatusToWorkspaceStatus,
} from '../../components/shared/workspace'

export const StudioWorkspacePage = () => {
  const { data, createActionRequest, changeLogs, snapshots, pendingApprovals } = useOs()

  const activeProjects = [...data.studioProjects].filter((project) => project.status !== 'paused')
  const featuredProject = activeProjects[0] ?? null
  const projectQueue = activeProjects.slice(0, 3)

  const todayTasks = [...data.studioTasks]
    .filter((task) => task.status !== 'done' && isStudioTodayTask(task))
    .sort((a, b) => priorityOrder(b.priority) - priorityOrder(a.priority) || a.endDate.localeCompare(b.endDate))
    .slice(0, 4)

  const weekTasks = [...data.studioTasks]
    .filter((task) => task.status !== 'done' && isStudioThisWeekTask(task) && !isStudioTodayTask(task))
    .sort((a, b) => priorityOrder(b.priority) - priorityOrder(a.priority) || a.endDate.localeCompare(b.endDate))
    .slice(0, 3)

  const criticalRisks = [...data.studioRisks]
    .filter((risk) => (risk.severity === 'high' || risk.processState === 'blocked') && isStudioThisWeekDate(risk.dueDate))
    .slice(0, 3)

  const upcomingInspections = [...data.studioInspections]
    .filter((inspection) => isStudioUpcomingInspection(inspection))
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
  const nextInspection = upcomingInspections[0] ?? null

  const pendingDecisionEntries = [...pendingApprovals]
    .filter((approval) => approval.requestedAt.slice(0, 10) >= STUDIO_SAMPLE_DATE && approval.requestedAt.slice(0, 10) <= '2026-06-30')
    .sort((a, b) => a.requestedAt.localeCompare(b.requestedAt))
    .slice(0, 4)
    .map((approval, index) => ({
      code: `APR-${String(index + 1).padStart(3, '0')}`,
      date: formatStudioDateTime(approval.requestedAt),
      detail: approval.actionType,
      owner: approval.requestedBy,
      reason: approval.description,
      status: 'ACTIVE' as const,
      title: 'Pending approval',
    }))

  if (pendingDecisionEntries.length === 0 && featuredProject) {
    pendingDecisionEntries.push({
      code: 'DEC-001',
      date: formatStudioDateTime(new Date().toISOString()),
      detail: 'Studio command surface',
      owner: featuredProject.owner,
      reason: featuredProject.blocker ?? featuredProject.notes ?? 'Confirm the next site move for the active project',
      status: 'ACTIVE' as const,
      title: 'Project call pending',
    })
  }

  const decisionLogEntries = [
    ...changeLogs.slice(0, 4).map((entry, index) => ({
      code: `REV-${String(index + 1).padStart(3, '0')}`,
      date: formatStudioDateTime(entry.changedAt),
      detail: entry.actionType,
      owner: entry.changedBy,
      reason: entry.summary,
      status: 'COMPLETE' as const,
      title: 'Change log entry',
    })),
    ...snapshots.slice(0, 2).map((snapshot, index) => ({
      code: `SNAP-${String(index + 1).padStart(3, '0')}`,
      date: formatStudioDateTime(snapshot.createdAt),
      detail: 'Workspace snapshot captured for review',
      owner: 'System',
      reason: snapshot.reason,
      status: 'WATCH' as const,
      title: 'Workspace snapshot',
    })),
  ]

  return (
    <section className="grid gap-8">
      <PageHeader
        eyebrow="Studio / Workspace"
        title="Karun Central Khon Kaen"
        summary="Studio now opens as a project operating system. The first read is the active project, the current site move, and the next decision."
        actions={
          <>
            <Link className="studio-button-primary" to="/os/studio/projects/karun-central-khon-kaen-campus">
              Open Karun CKK workspace
            </Link>
            {featuredProject ? (
              <Link className="studio-button-secondary" to={`/os/studio/projects/${featuredProject.slug}`}>
                Open primary project
              </Link>
            ) : null}
            <Link className="studio-button-secondary" to="/os/studio/mobile">
              Launch mobile workspace
            </Link>
          </>
        }
        meta={
          <>
            <ReferenceLabel label="Project" value={featuredProject?.id ?? 'studio'} />
            <ReferenceLabel label="Source" value={data.studioProjects.length > 0 ? 'Mock sheet' : 'Empty'} />
            <ReferenceLabel label="Approvals" value={pendingApprovals.length} />
          </>
        }
      />

      {featuredProject ? (
        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <WorkspacePanel
            highlight
            eyebrow="Project command surface"
            title={featuredProject.name}
            summary="Enter Studio here. The project card stays primary and the actions stay close to the active job."
            actions={
              <Link className="studio-button-secondary" to={`/os/studio/projects/${featuredProject.slug}`}>
                Open project detail
              </Link>
            }
          >
            <ProjectCard
              code={featuredProject.id}
              status={projectHealthToWorkspaceStatus(featuredProject.projectHealth)}
              title={featuredProject.name}
              owner={featuredProject.owner}
              trade={featuredProject.trade}
              phase={featuredProject.phase}
              progress={featuredProject.progress}
              summary={featuredProject.notes}
              blocker={featuredProject.blocker}
              detail={
                <div className="grid gap-2 md:grid-cols-3">
                  <MetricLine
                    label="Timeline"
                    value={`${formatStudioDate(featuredProject.startDate)} - ${formatStudioDate(featuredProject.endDate)}`}
                    detail={featuredProject.taskTimeline}
                  />
                  <MetricLine
                    label="Site check"
                    value={featuredProject.siteCheck}
                    detail={featuredProject.siteInspectionPlan}
                  />
                  <MetricLine
                    label="Billing"
                    value={featuredProject.paymentLink ? 'Ready' : 'Pending'}
                    status={featuredProject.paymentLink ? 'ACTIVE' : 'WATCH'}
                    detail={`${featuredProject.progressBillingGateIds.length} progress gates attached`}
                  />
                </div>
              }
              actions={
                <>
                  <Link className="studio-button-primary" to={`/os/studio/projects/${featuredProject.slug}`}>
                    Work inside project
                  </Link>
                  <button
                    className="studio-button-secondary"
                    type="button"
                    onClick={() =>
                      createActionRequest({
                        module: 'studio',
                        actionType: 'studio.addTask',
                        description: `Queue follow-up task for ${featuredProject.name}`,
                        payload: {
                          projectId: featuredProject.id,
                          title: `Follow-up for ${featuredProject.name}`,
                          owner: featuredProject.owner,
                          trade: featuredProject.trade,
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
                    className="studio-button-ghost"
                    type="button"
                    onClick={() =>
                      createActionRequest({
                        module: 'studio',
                        actionType: 'studio.addInspectionNote',
                        description: `Queue inspection note for ${featuredProject.name}`,
                        payload: {
                          projectId: featuredProject.id,
                          title: `${featuredProject.name} site walk`,
                          inspector: featuredProject.owner,
                          trade: featuredProject.trade,
                          type: 'site-walk',
                          status: 'scheduled',
                          scheduledAt: new Date().toISOString(),
                          checklist: ['Photo log', 'Snag log'],
                          plan: featuredProject.siteInspectionPlan ?? '',
                          notes: featuredProject.blocker ?? '',
                        },
                      })
                    }
                  >
                    Queue inspection
                  </button>
                </>
              }
            />
          </WorkspacePanel>

          <div className="grid gap-6">
            <WorkspacePanel
              eyebrow="Today"
              title="What needs attention now?"
              summary="The working lane for the day. Urgent tasks and blockers stay at the top."
            >
              {todayTasks.length > 0 ? (
                <div className="grid gap-3">
                  {todayTasks.map((task) => (
                    <TimelineRow
                      key={task.id}
                      date={task.timelineSlot}
                      title={task.title}
                      detail={`${task.owner} / ${task.trade}${task.blocker ? ` / ${task.blocker}` : ''}`}
                      status={taskStatusToWorkspaceStatus(task.status)}
                      meta={
                        <>
                          <ReferenceLabel label="Priority" value={task.priority} />
                          <ReferenceLabel label="Site check" value={task.siteCheck} />
                        </>
                      }
                    />
                  ))}
                </div>
              ) : (
                <EmptyState title="No urgent work" body="Today is quiet across the active project queue." />
              )}
            </WorkspacePanel>

            <WorkspacePanel
              eyebrow="This week"
              title="Upcoming work"
              summary="The next movement should be visible, but not compete with the current day."
            >
              {weekTasks.length > 0 ? (
                <div className="grid gap-3">
                  {weekTasks.map((task) => (
                    <TimelineRow
                      key={task.id}
                      date={task.timelineSlot}
                      title={task.title}
                      detail={`${task.endDate} / ${task.processState}`}
                      status={taskStatusToWorkspaceStatus(task.status)}
                      meta={
                        <>
                          <ReferenceLabel label="Owner" value={task.owner} />
                          <ReferenceLabel label="Trade" value={task.trade} />
                        </>
                      }
                    />
                  ))}
                </div>
              ) : (
                <EmptyState title="No upcoming work" body="The weekly lane is clear." />
              )}
            </WorkspacePanel>
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <WorkspacePanel
          eyebrow="Next inspection"
          title={nextInspection ? nextInspection.title : 'Next inspection'}
          summary="Inspection timing stays visible beside the project rather than hiding in a separate calendar board."
        >
          {nextInspection ? (
            <TimelineRow
              date={formatStudioDateTime(nextInspection.scheduledAt)}
              title={nextInspection.title}
              detail={nextInspection.notes ?? nextInspection.plan}
              status={inspectionStatusToWorkspaceStatus(nextInspection.status)}
              meta={
                <>
                  <ReferenceLabel label="Inspector" value={nextInspection.inspector} />
                  <ReferenceLabel label="Trade" value={nextInspection.trade} />
                </>
              }
            />
          ) : (
            <EmptyState title="No inspection due" body="There are no scheduled site checks right now." />
          )}
        </WorkspacePanel>

        <WorkspacePanel
          eyebrow="Critical risks"
          title="What is blocked?"
          summary="Only the issues that can slow the job stay on the surface."
        >
          {criticalRisks.length > 0 ? (
            <div className="grid gap-3">
              {criticalRisks.map((risk) => (
                <TimelineRow
                  key={risk.id}
                  date={formatStudioDate(risk.dueDate)}
                  title={risk.title}
                  detail={risk.blocker}
                  status={riskStatusToWorkspaceStatus(risk.severity === 'high' ? 'high' : risk.processState)}
                  meta={
                    <>
                      <ReferenceLabel label="Owner" value={risk.owner} />
                      <ReferenceLabel label="Trade" value={risk.trade} />
                    </>
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState title="No critical blockers" body="The risk queue is quiet." />
          )}
        </WorkspacePanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <WorkspacePanel
          eyebrow="Pending decisions"
          title="What needs a call?"
          summary="Pending approvals stay visible before the longer decision log."
        >
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
            <EmptyState title="No pending decisions" body="Nothing is waiting on approval." />
          )}
        </WorkspacePanel>

        <WorkspacePanel
          eyebrow="Active projects"
          title="Project entry points"
          summary="Users should step into a project immediately rather than stay on the workspace surface."
        >
          <div className="grid gap-3">
            {projectQueue.map((project) => (
              <ProjectCard
                key={project.id}
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
                  <ReferenceLabel
                    label="Site"
                    value={`${project.location ?? 'Khon Kaen'} / ${project.processState}`}
                  />
                }
                actions={
                  <>
                    <Link className="studio-button-secondary" to={`/os/studio/projects/${project.slug}`}>
                      Open project
                    </Link>
                    <button
                      className="studio-button-ghost"
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
                      Queue check
                    </button>
                  </>
                }
              />
            ))}
          </div>
        </WorkspacePanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <WorkspacePanel
          eyebrow="Decision log"
          title="Revision trail"
          summary="Completed changes and snapshots stay readable, but lower than the current signals."
        >
          {decisionLogEntries.length > 0 ? (
            <div className="grid gap-3">
              {decisionLogEntries.map((entry) => (
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
            <EmptyState title="No decisions logged" body="Decision history will appear here when the sheet fills." />
          )}
        </WorkspacePanel>

        <WorkspacePanel
          eyebrow="Launch"
          title="Mobile workspace"
          summary="The mobile view is a command surface, not a preview card."
          actions={
            <Link className="studio-button-primary" to="/os/studio/mobile">
              Launch mobile workspace
            </Link>
          }
        >
          <div className="grid gap-2 md:grid-cols-3">
            <MetricLine label="Focus" value="Today" detail="Urgent tasks and site checks" />
            <MetricLine label="Shape" value="Field notebook" detail="Low density, high signal" />
            <MetricLine label="Action" value="Launch" status="ACTIVE" detail="Open the mobile-first flow" />
          </div>
        </WorkspacePanel>
      </section>
    </section>
  )
}

const TimelineRow = ({
  date,
  detail,
  meta,
  status,
  title,
}: {
  date: string
  detail?: string
  meta?: React.ReactNode
  status?: string
  title: string
}) => (
  <div className="rounded-[24px] border border-[color:var(--bbh-border)]/55 bg-[color:var(--bbh-surface-muted)] p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="grid gap-1">
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--bbh-text-muted)]"
          style={{ fontFamily: '"Geist Mono", "Intel One Mono", "JetBrains Mono", ui-monospace, monospace' }}
        >
          {date}
        </p>
        <p
          className="text-sm font-semibold tracking-tight text-[color:var(--bbh-text)]"
          style={{ fontFamily: '"Space Grotesk", "Inter", system-ui, sans-serif' }}
        >
          {title}
        </p>
        {detail ? <p className="text-sm leading-6 text-[color:var(--bbh-text-soft)]">{detail}</p> : null}
      </div>
      {status ? <StatusBadge status={status} /> : null}
    </div>
    {meta ? <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div> : null}
  </div>
)

const priorityOrder = (priority: 'low' | 'medium' | 'high') => (priority === 'high' ? 3 : priority === 'medium' ? 2 : 1)
