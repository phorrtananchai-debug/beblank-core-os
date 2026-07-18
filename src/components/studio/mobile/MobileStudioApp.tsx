import { useMemo, useState } from 'react'
import type { ActionRequest, OsData, StudioMobileTab, StudioProject, StudioTask } from '../../../types/models'
import type { PersistedProjectWorkspace, ProjectTask } from '../../../core/projectWorkspace/types'
import { getAssetsForEntity } from '../../../core/projectWorkspace/selectors'

type CreateActionRequest = (input: Omit<ActionRequest, 'id' | 'requestedAt' | 'requestedBy' | 'requiresApproval'>) => void
type MobileTabKey = StudioMobileTab['key']
type CalendarMode = 'Week' | 'Month' | 'Year'

interface MobileStudioAppProps {
  data: OsData
  createActionRequest: CreateActionRequest
  workspace: PersistedProjectWorkspace | null
  onUpdateWorkspaceTask: (taskId: string) => Promise<void>
}

type MobileProject = {
  id: string
  name: string
  phase: string
  status: 'IN PROGRESS' | 'PLANNED' | 'OVERDUE' | 'DONE'
  startDate: string
  endDate: string
  progress: number
  note: string
}

type MobileTask = {
  id: string
  projectId: string
  title: string
  detail: string
  phase: string
  date: string
  startDate: string
  endDate: string
  time?: string
  status: 'todo' | 'doing' | 'later' | 'done' | 'overdue'
  type?: 'phase' | 'task'
}

const navItems: Array<{ key: MobileTabKey; label: string }> = [
  { key: 'home', label: 'Home' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'quick-add', label: '+' },
  { key: 'projects', label: 'Projects' },
  { key: 'more', label: 'More' },
]

const focusDate = new Date()
const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const timeGroups = ['Morning', 'Afternoon', 'Evening', 'No time'] as const
const dayMs = 24 * 60 * 60 * 1000

export const MobileStudioApp = ({ data, workspace, onUpdateWorkspaceTask }: MobileStudioAppProps) => {
  const [activeTab, setActiveTab] = useState<MobileTabKey>('home')
  const [selectedDate, setSelectedDate] = useState(focusDate)
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('Month')
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const { projects, tasks } = useMemo(() => buildMobileData(data, workspace), [data, workspace])
  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null

  return (
    <main className="mobile-studio-app-shell relative mx-auto flex h-[100dvh] min-h-screen w-full max-w-[430px] flex-col overflow-hidden bg-[#F5F5FA] text-[#212121] shadow-[0_18px_60px_rgba(17,17,17,0.14)] sm:my-4 sm:h-[calc(100vh-2rem)] sm:min-h-0 sm:rounded-[34px]">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <MobileTopBar />
        <section className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-32 pt-5">
          {activeTab === 'home' ? (
            <TodayView
              projects={projects}
              selectedDate={selectedDate}
              tasks={tasks}
              onOpenProject={(projectId) => {
                setSelectedProjectId(projectId)
                setActiveTab('projects')
              }}
              onSelectDate={setSelectedDate}
            />
          ) : null}
          {activeTab === 'calendar' ? (
            <CalendarView
              mode={calendarMode}
              projects={projects}
              selectedDate={selectedDate}
              tasks={tasks}
              onModeChange={setCalendarMode}
              onSelectDate={setSelectedDate}
            />
          ) : null}
          {activeTab === 'quick-add' ? <QuickAddView projects={projects} /> : null}
          {activeTab === 'projects' ? (
            <ProjectsView
              projects={projects}
              selectedProject={selectedProject}
              tasks={tasks}
              workspace={workspace}
              onUpdateWorkspaceTask={onUpdateWorkspaceTask}
              onBack={() => setSelectedProjectId('')}
              onSelectProject={setSelectedProjectId}
            />
          ) : null}
          {activeTab === 'more' ? <MoreView projects={projects} tasks={tasks} /> : null}
        </section>
      </div>

      <nav className="absolute bottom-5 left-1/2 z-50 grid h-[64px] w-[calc(100%-2rem)] max-w-[398px] -translate-x-1/2 grid-cols-5 items-center rounded-full bg-[#212121] px-3 text-white/55 shadow-[0_18px_40px_rgba(17,17,17,0.18)]" aria-label="Studio mobile navigation">
        {navItems.map((item) => {
          const active = activeTab === item.key
          return (
            <button
              key={item.key}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-11 items-center justify-center rounded-[18px] text-[11px] font-semibold tracking-tight transition duration-150 active:scale-95 ${
                item.key === 'quick-add'
                  ? 'mx-auto size-12 rounded-full bg-[#FFF0A3] text-xl text-[#212121] shadow-[0_8px_22px_rgba(255,240,163,0.22)]'
                  : active
                    ? 'scale-105 text-[#FFF0A3]'
                    : 'text-white/55'
              }`}
              type="button"
              onClick={() => setActiveTab(item.key)}
            >
              {item.label}
            </button>
          )
        })}
      </nav>
    </main>
  )
}

const MobileTopBar = () => (
  <header className="flex h-16 w-full shrink-0 items-center justify-between bg-transparent px-4">
    <button className="grid size-10 place-items-center rounded-full bg-white text-[#212121] shadow-sm transition active:scale-95" type="button" aria-label="Open menu">
      <span className="grid gap-1">
        <span className="block h-px w-4 bg-[#212121]" />
        <span className="block h-px w-4 bg-[#212121]" />
      </span>
    </button>
    <h1 className="text-sm font-medium tracking-tight">Studio OS</h1>
    <button className="grid size-10 place-items-center rounded-full bg-[#212121] text-xs font-semibold text-white shadow-sm" type="button" aria-label="Profile">
      P
    </button>
  </header>
)

const TodayView = ({
  onOpenProject,
  onSelectDate,
  projects,
  selectedDate,
  tasks,
}: {
  onOpenProject: (projectId: string) => void
  onSelectDate: (date: Date) => void
  projects: MobileProject[]
  selectedDate: Date
  tasks: MobileTask[]
}) => {
  const weekDays = getWeekDays(selectedDate)
  const activeTasks = tasks.filter((task) => isSameDay(parseDate(task.date), selectedDate) && task.type !== 'phase' && task.status !== 'done')
  const rangeTasks = tasks.filter((task) => task.type === 'phase' && occursOn(task, selectedDate) && task.status !== 'done')
  const laterTasks = tasks.filter((task) => parseDate(task.date) > selectedDate && task.type !== 'phase').slice(0, 3)
  const doneTasks = tasks.filter((task) => task.status === 'done')
  const insight = activeTasks.length === 0 && rangeTasks.length === 0 ? 'Free day, good time to reset.' : 'Design work is active. Keep one clean next step.'

  return (
    <div className="animate-[workspace-rise_500ms_ease_both]">
      <section className="pt-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-[56px] font-bold lowercase leading-none tracking-normal text-[#212121]">today</h2>
          <div className="flex gap-2 pb-1">
            <span className="rounded-full bg-[#CFDECA] px-4 py-2 text-[11px] font-semibold text-[#212121]">{doneTasks.length} done</span>
            <span className="rounded-full bg-[#DBDFE9] px-4 py-2 text-[11px] font-semibold text-[#212121]">{activeTasks.length} tasks</span>
          </div>
        </div>
        <WeekStrip selectedDate={selectedDate} tasks={tasks} weekDays={weekDays} onSelectDate={onSelectDate} />
      </section>

      <button className="mt-8 w-full rounded-[28px] border border-black/5 bg-[#FFF0A3] p-6 text-left shadow-sm transition active:scale-[0.99]" type="button">
        <p className="text-[11px] font-semibold text-[#212121]/60">Insight</p>
        <p className="mt-3 text-3xl font-medium leading-tight tracking-normal text-[#111111]">{insight}</p>
        <span className="mt-6 flex items-center justify-between gap-4">
          <span className="text-xs italic text-[#212121]/60">Stay spacious. Move only what matters.</span>
          <span className="shrink-0 rounded-full bg-white/55 px-4 py-2 text-[11px] font-semibold text-[#212121]">View active</span>
        </span>
      </button>

      <section className="mt-9">
        <SectionHead count={rangeTasks.length} title="IN PROGRESS" />
        <div className="grid gap-3">
          {rangeTasks.map((task) => <RangeCard key={task.id} projects={projects} selectedDate={selectedDate} task={task} onOpenProject={onOpenProject} />)}
        </div>
      </section>

      <section className="mt-9">
        <SectionHead count={activeTasks.length} title="Tasks Today" />
        <div className="grid gap-3">
          {activeTasks.map((task) => <TaskCard key={task.id} projects={projects} task={task} />)}
          {!activeTasks.length ? <EmptyCard lines={['Nothing scheduled today.', 'Add one clear next step when ready.']} /> : null}
        </div>
      </section>

      <section className="mt-9">
        <SectionHead count={laterTasks.length} title="Later" />
        <div className="grid gap-3">
          {laterTasks.map((task) => <TaskCard key={task.id} projects={projects} task={task} />)}
        </div>
      </section>

      <section className="mt-9">
        <SectionHead count={projects.length} title="PROJECTS" />
        <div className="grid gap-3">
          {projects.slice(0, 5).map((project) => <ProjectRow key={project.id} project={project} onOpenProject={onOpenProject} />)}
        </div>
      </section>
    </div>
  )
}

const CalendarView = ({
  mode,
  onModeChange,
  onSelectDate,
  projects,
  selectedDate,
  tasks,
}: {
  mode: CalendarMode
  onModeChange: (mode: CalendarMode) => void
  onSelectDate: (date: Date) => void
  projects: MobileProject[]
  selectedDate: Date
  tasks: MobileTask[]
}) => {
  const monthDays = getMonthDays(selectedDate)
  const selectedTasks = tasks.filter((task) => occursOn(task, selectedDate))

  return (
    <div className="pb-4">
      <div className="sticky top-0 z-20 grid grid-cols-3 rounded-full border border-[rgba(33,33,33,0.08)] bg-white/95 p-1 shadow-[0_10px_24px_rgba(33,33,33,0.04)] backdrop-blur-xl">
        {(['Week', 'Month', 'Year'] as CalendarMode[]).map((item) => (
          <button key={item} className={`h-10 rounded-full text-sm font-medium transition active:scale-95 ${mode === item ? 'bg-[#212121] text-[#F5F5FA]' : 'text-[#777777]'}`} type="button" onClick={() => onModeChange(item)}>
            {item}
          </button>
        ))}
      </div>

      {mode === 'Week' ? <WeekCalendar selectedDate={selectedDate} tasks={tasks} onSelectDate={onSelectDate} /> : null}
      {mode === 'Month' ? <MonthCalendar monthDays={monthDays} projects={projects} selectedDate={selectedDate} tasks={tasks} onSelectDate={onSelectDate} /> : null}
      {mode === 'Year' ? <YearCalendar selectedDate={selectedDate} tasks={tasks} onSelectMonth={(date) => { onSelectDate(date); onModeChange('Month') }} /> : null}

      <section className="mt-8">
        <SectionHead count={selectedTasks.length} title={`Selected: ${formatShortDate(selectedDate)}`} />
        <TaskDayGroups projects={projects} selectedDate={selectedDate} tasks={selectedTasks} />
      </section>
    </div>
  )
}

const WeekCalendar = ({ selectedDate, tasks, onSelectDate }: { selectedDate: Date; tasks: MobileTask[]; onSelectDate: (date: Date) => void }) => {
  const weekDays = getWeekDays(selectedDate)
  return (
    <section className="mt-6">
      <div className="mb-5 rounded-[28px] border border-[rgba(33,33,33,0.08)] bg-white p-5">
        <p className="text-[11px] font-medium uppercase tracking-tight text-[#777777]">This week</p>
        <div className="mt-3 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold leading-tight text-[#212121]">{formatShortDate(weekDays[0])} - {formatShortDate(weekDays[6])}</h2>
          <p className="shrink-0 text-right text-sm text-[#777777]">{tasks.filter((task) => weekDays.some((day) => occursOn(task, day))).length} tasks</p>
        </div>
      </div>
      <WeekStrip selectedDate={selectedDate} tasks={tasks} weekDays={weekDays} onSelectDate={onSelectDate} />
    </section>
  )
}

const MonthCalendar = ({
  monthDays,
  onSelectDate,
  projects,
  selectedDate,
  tasks,
}: {
  monthDays: Date[]
  onSelectDate: (date: Date) => void
  projects: MobileProject[]
  selectedDate: Date
  tasks: MobileTask[]
}) => {
  const weeks = Array.from({ length: 6 }, (_, index) => monthDays.slice(index * 7, index * 7 + 7))
  return (
    <section className="mt-6">
      <div className="mb-4 flex items-center justify-between px-1">
        <span className="grid size-11 place-items-center rounded-full bg-white text-lg text-[#777777]">{'<'}</span>
        <p className="text-lg font-semibold text-[#212121]">{selectedDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}</p>
        <span className="grid size-11 place-items-center rounded-full bg-white text-lg text-[#777777]">{'>'}</span>
      </div>
      <div className="rounded-[28px] border border-[rgba(33,33,33,0.08)] bg-white px-3 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
        <div className="grid grid-cols-7">
          {dayLabels.map((label) => <span key={label} className="grid min-h-8 place-items-center text-[10px] font-semibold uppercase tracking-tight text-[#777777]">{label.slice(0, 2)}</span>)}
        </div>
        <div className="space-y-3">
          {weeks.map((week) => <MonthWeek key={week[0].toISOString()} projects={projects} selectedDate={selectedDate} tasks={tasks} week={week} onSelectDate={onSelectDate} />)}
        </div>
      </div>
      <Legend />
    </section>
  )
}

const MonthWeek = ({ projects, selectedDate, tasks, week, onSelectDate }: { projects: MobileProject[]; selectedDate: Date; tasks: MobileTask[]; week: Date[]; onSelectDate: (date: Date) => void }) => {
  const range = tasks.find((task) => task.type === 'phase' && parseDate(task.startDate) <= week[6] && parseDate(task.endDate) >= week[0])
  const startIndex = range ? Math.max(0, week.findIndex((date) => date >= parseDate(range.startDate))) : -1
  const endReverseIndex = range ? [...week].reverse().findIndex((date) => date <= parseDate(range.endDate)) : -1
  const endIndex = endReverseIndex === -1 ? 6 : 6 - endReverseIndex
  return (
    <div className="relative grid min-h-[98px] grid-cols-7">
      {week.map((date) => {
        const isSelected = isSameDay(date, selectedDate)
        const count = tasks.filter((task) => occursOn(task, date) && task.type !== 'phase').length
        return (
          <button key={date.toISOString()} className={`relative z-10 flex min-h-[98px] w-full flex-col items-center gap-1 rounded-[14px] p-1 text-center ${date.getMonth() === selectedDate.getMonth() ? 'text-[#212121]' : 'text-[#c0c0c0]'}`} type="button" onClick={() => onSelectDate(date)}>
            <span className={`mt-1 grid size-7 place-items-center rounded-full text-xs ${isSelected ? 'bg-[#212121] text-white shadow-md' : ''}`}>{date.getDate()}</span>
            {count ? <span className={`mt-1 size-1.5 rounded-full ${isSelected ? 'bg-[#FFF0A3]' : 'bg-[#212121]/65'}`} /> : null}
          </button>
        )
      })}
      {range ? (
        <div
          className="pointer-events-none absolute bottom-8 z-20 flex h-3 items-center overflow-hidden rounded-full border border-black/5 bg-[#DBDFE9] px-2 text-[10px] font-medium leading-none text-[#212121]"
          style={{ left: `${(Math.max(0, startIndex) / 7) * 100}%`, width: `${((endIndex - Math.max(0, startIndex) + 1) / 7) * 100}%` }}
        >
          <span className="truncate">{projectName(projects, range.projectId)} / {range.status === 'overdue' ? 'Overdue' : 'Active'}</span>
        </div>
      ) : null}
    </div>
  )
}

const YearCalendar = ({ selectedDate, tasks, onSelectMonth }: { selectedDate: Date; tasks: MobileTask[]; onSelectMonth: (date: Date) => void }) => (
  <section className="mt-6 grid grid-cols-2 gap-3">
    {monthLabels.map((month, monthIndex) => {
      const count = tasks.filter((task) => touchesMonth(task, selectedDate.getFullYear(), monthIndex)).length
      return (
        <button key={month} className="min-h-[118px] rounded-[22px] border border-[rgba(33,33,33,0.08)] bg-white p-4 text-left transition active:scale-95" type="button" onClick={() => onSelectMonth(new Date(selectedDate.getFullYear(), monthIndex, 1))}>
          <span className="flex items-center justify-between gap-2">
            <span className="block text-lg font-semibold text-[#212121]">{month}</span>
            {count ? <span className="size-2 rounded-full bg-[#FFF0A3]" /> : null}
          </span>
          <span className="mt-2 block text-sm text-[#777777]">{count} tasks</span>
          <span className="mt-4 flex flex-wrap gap-1.5">
            {Array.from({ length: Math.min(Math.max(count, 1), 10) }, (_, index) => <span key={index} className={`size-1.5 rounded-full ${count ? 'bg-[#DBDFE9]' : 'bg-[#212121] opacity-[0.08]'}`} />)}
          </span>
        </button>
      )
    })}
  </section>
)

const TaskDayGroups = ({ projects, selectedDate, tasks }: { projects: MobileProject[]; selectedDate: Date; tasks: MobileTask[] }) => {
  const rangeTasks = tasks.filter((task) => task.type === 'phase')
  const normalTasks = tasks.filter((task) => task.type !== 'phase' && task.status !== 'done')
  const groups = timeGroups.map((label) => ({ label, tasks: normalTasks.filter((task) => getTimeGroup(task) === label) }))
  return (
    <div className="space-y-4">
      {rangeTasks.length ? (
        <section>
          <h3 className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-tight text-[#777777]">In Progress</h3>
          <div className="space-y-3">{rangeTasks.map((task) => <RangeCard key={task.id} projects={projects} selectedDate={selectedDate} task={task} />)}</div>
        </section>
      ) : null}
      {groups.map((group) => (
        <section key={group.label}>
          <h3 className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-tight text-[#777777]">{group.label}</h3>
          <div className="space-y-3">
            {group.tasks.length ? group.tasks.map((task) => <TaskCard key={task.id} projects={projects} task={task} />) : <EmptyCard lines={[`No ${group.label.toLowerCase()} tasks.`]} compact />}
          </div>
        </section>
      ))}
    </div>
  )
}

const ProjectsView = ({
  onBack,
  onSelectProject,
  projects,
  selectedProject,
  tasks,
  workspace,
  onUpdateWorkspaceTask,
}: {
  onBack: () => void
  onSelectProject: (projectId: string) => void
  projects: MobileProject[]
  selectedProject: MobileProject | null
  tasks: MobileTask[]
  workspace: PersistedProjectWorkspace | null
  onUpdateWorkspaceTask: (taskId: string) => Promise<void>
}) => {
  if (selectedProject) {
    const projectTasks = tasks.filter((task) => task.projectId === selectedProject.id && task.type !== 'phase')
    return (
      <div className="pb-4">
        <button className="rounded-full border border-black/5 bg-white px-4 py-2 text-[11px] font-medium uppercase tracking-tight text-[#777777]" type="button" onClick={onBack}>Back to projects</button>
        <section className="mt-6 rounded-[28px] border border-black/5 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="truncate text-3xl font-bold leading-tight text-[#212121]">{selectedProject.name}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusChip label={`Phase: ${selectedProject.phase}`} />
                <StatusChip label={selectedProject.status} />
              </div>
            </div>
            <span className="shrink-0 text-xl font-semibold text-[#212121]">{selectedProject.progress}%</span>
          </div>
          <Progress value={selectedProject.progress} />
          <p className="mt-4 text-sm leading-6 text-[#777777]">{selectedProject.note}</p>
        </section>
        <section className="mt-6">
          <SectionHead count={projectTasks.length} title="Tasks" />
          <div className="grid gap-3">{projectTasks.map((task) => task.projectId === workspace?.project.id ? <MobileTaskEditorCard key={task.id} task={task} onUpdate={onUpdateWorkspaceTask} /> : <TaskCard key={task.id} projects={projects} task={task} />)}</div>
        </section>
        {workspace?.project.id === selectedProject.id && <section className="mt-6"><SectionHead count={workspace.siteReports.length} title="Site reports" /><div className="grid gap-3">{workspace.siteReports.map((report) => <article key={report.id} className="rounded-[22px] border border-black/5 bg-white p-4"><strong className="text-sm">{report.workScope}</strong><p className="mt-1 text-xs text-[#777777]">{report.date} · {report.completedToday}</p><p className="mt-2 text-[11px] text-[#777777]">{getAssetsForEntity(workspace, 'site-report', report.id).length} linked assets</p></article>)}</div></section>}
      </div>
    )
  }

  const groups = ['OVERDUE', 'IN PROGRESS', 'PLANNED', 'DONE'] as const
  return (
    <div className="pb-4">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-5xl font-bold lowercase leading-none tracking-normal text-[#212121]">projects</h2>
        <p className="text-[11px] font-medium uppercase tracking-tight text-[#777777]">{projects.length} total</p>
      </div>
      <div className="mt-6 space-y-7">
        {groups.map((group) => {
          const groupProjects = projects.filter((project) => project.status === group)
          if (!groupProjects.length) return null
          return (
            <section key={group}>
              <SectionHead count={groupProjects.length} title={group} />
              <div className="space-y-3">{groupProjects.map((project) => <ProjectCard key={project.id} project={project} onSelectProject={onSelectProject} />)}</div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

const MobileTaskEditorCard = ({ task, onUpdate }: { task: MobileTask; onUpdate: (taskId: string) => Promise<void> }) => {
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState('')
  return <article className="rounded-[22px] border border-black/5 bg-white p-4"><strong className="text-sm">{task.title}</strong><p className="mt-1 text-xs text-[#777777]">{task.detail}</p>{failure && <p className="mt-2 text-xs text-[#a43f37]" role="alert">{failure}</p>}<button className="mt-3 rounded-full bg-[#212121] px-4 py-2 text-[11px] font-semibold text-white" type="button" disabled={saving} onClick={async () => { setSaving(true); setFailure(''); try { await onUpdate(task.id) } catch (error) { setFailure(error instanceof Error ? error.message : 'Task update failed.') } finally { setSaving(false) } }}>{saving ? 'Saving…' : task.status === 'done' ? 'Reopen task' : 'Mark done'}</button></article>
}

const QuickAddView = ({ projects }: { projects: MobileProject[] }) => (
  <div className="pb-4">
    <h2 className="text-5xl font-bold lowercase leading-none tracking-normal text-[#212121]">quick add</h2>
    <section className="mt-6 rounded-[28px] border border-black/5 bg-white p-5 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-tight text-[#777777]">Capture</p>
      <input className="mt-4 h-12 w-full rounded-[18px] border border-black/5 bg-[#F5F5FA] px-4 text-sm outline-none" readOnly value={projects[0]?.name ?? 'Karun Phuket'} />
      <textarea className="mt-3 min-h-28 w-full rounded-[18px] border border-black/5 bg-[#F5F5FA] px-4 py-3 text-sm outline-none" placeholder="Site note, reminder, or next action" />
      <button className="mt-4 h-12 w-full rounded-[18px] bg-[#212121] text-sm font-semibold text-white" type="button">Save draft</button>
    </section>
  </div>
)

const MoreView = ({ projects, tasks }: { projects: MobileProject[]; tasks: MobileTask[] }) => (
  <div className="pb-4">
    <h2 className="text-5xl font-bold lowercase leading-none tracking-normal text-[#212121]">more</h2>
    <section className="mt-6 rounded-[28px] border border-black/5 bg-white p-5 shadow-sm">
      <SectionHead count={2} title="Workspace" />
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Projects" value={projects.length} />
        <MetricCard label="Open tasks" value={tasks.filter((task) => task.status !== 'done').length} />
      </div>
      <p className="mt-5 rounded-[22px] bg-[#F5F5FA] p-4 text-sm leading-6 text-[#777777]">The dense control-room report is intentionally not the default mobile home. Keep this space for future settings and debug links.</p>
    </section>
  </div>
)

const WeekStrip = ({ selectedDate, tasks, weekDays, onSelectDate }: { selectedDate: Date; tasks: MobileTask[]; weekDays: Date[]; onSelectDate: (date: Date) => void }) => (
  <div className="mobile-week-strip mt-5 flex w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
    {weekDays.map((date) => {
      const selected = isSameDay(date, selectedDate)
      const count = tasks.filter((task) => occursOn(task, date)).length
      return (
        <button key={date.toISOString()} className={`flex min-h-16 min-w-[54px] flex-col items-center justify-center rounded-[18px] px-3 py-3 transition active:scale-95 ${selected ? 'bg-[#212121] text-white' : 'bg-white text-[#212121]'}`} type="button" onClick={() => onSelectDate(date)}>
          <span className={`text-[10px] uppercase tracking-tight ${selected ? 'text-white/60' : 'text-[#777777]'}`}>{dayLabels[date.getDay()]}</span>
          <span className={`${selected ? 'text-xl font-semibold' : 'text-sm font-medium'}`}>{date.getDate()}</span>
          {count ? <span className={`mt-1 size-1.5 rounded-full ${selected ? 'bg-[#FFF0A3]' : 'bg-[#212121]/65'}`} /> : null}
        </button>
      )
    })}
  </div>
)

const RangeCard = ({ projects, selectedDate, task, onOpenProject }: { projects: MobileProject[]; selectedDate: Date; task: MobileTask; onOpenProject?: (projectId: string) => void }) => {
  const progress = rangeProgress(task, selectedDate)
  return (
    <button className="relative w-full overflow-hidden rounded-[22px] border border-black/5 bg-white p-4 text-left shadow-sm transition active:scale-[0.99]" type="button" onClick={() => onOpenProject?.(task.projectId)}>
      <span className="absolute bottom-4 left-0 top-4 w-1 rounded-r-full bg-[#DBDFE9]" />
      <span className="flex items-start justify-between gap-3 pl-2">
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-[#212121]">{projectName(projects, task.projectId)}</span>
          <span className="mt-1 block text-xs font-medium text-[#777777]">Phase: {task.phase || 'Design'}</span>
        </span>
        <StatusChip label={task.status === 'overdue' ? 'OVERDUE' : 'IN PROGRESS'} />
      </span>
      <span className="mt-4 block pl-2">
        <Progress value={progress.percent} />
        <span className="mt-2 block text-xs font-medium text-[#777777]">{formatShortDate(parseDate(task.startDate))} - {formatShortDate(parseDate(task.endDate))} / {progress.daysLeft} days left</span>
      </span>
    </button>
  )
}

const TaskCard = ({ projects, task }: { projects: MobileProject[]; task: MobileTask }) => (
  <div className="rounded-[22px] border border-black/5 bg-white px-4 py-3 text-left shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-[15px] font-semibold text-[#212121]">{task.title}</p>
        <p className="mt-1 truncate text-xs font-medium text-[#777777]">{projectName(projects, task.projectId)} / {task.phase}</p>
      </div>
      <span className="shrink-0 text-xs font-semibold text-[#777777]">{task.time ?? formatShortDate(parseDate(task.date))}</span>
    </div>
    {task.detail ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#777777]">{task.detail}</p> : null}
  </div>
)

const ProjectRow = ({ project, onOpenProject }: { project: MobileProject; onOpenProject: (projectId: string) => void }) => (
  <button className="flex min-h-[64px] w-full items-center gap-3 rounded-[22px] border border-[rgba(33,33,33,0.08)] bg-white px-4 py-3 text-left transition active:scale-95" type="button" onClick={() => onOpenProject(project.id)}>
    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#DBDFE9] text-xs font-bold uppercase text-[#212121]">{initials(project.name)}</span>
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-semibold text-[#212121]">{project.name}</span>
      <span className="mt-1 block text-xs font-medium text-[#777777]">{project.phase}</span>
    </span>
    <span className="text-xl leading-none text-[#555555]">{'>'}</span>
  </button>
)

const ProjectCard = ({ project, onSelectProject }: { project: MobileProject; onSelectProject: (projectId: string) => void }) => (
  <button className="w-full rounded-[26px] border border-black/5 bg-white p-4 text-left shadow-sm transition active:scale-[0.99]" type="button" onClick={() => onSelectProject(project.id)}>
    <span className="flex items-start justify-between gap-3">
      <span className="min-w-0">
        <span className="block truncate text-[17px] font-semibold leading-snug text-[#212121]">{project.name}</span>
        <StatusChip label={project.phase} />
      </span>
      <span className="shrink-0 text-lg font-semibold text-[#212121]">{project.progress}%</span>
    </span>
    <Progress value={project.progress} />
    <span className="mt-3 block text-xs font-medium text-[#777777]">{formatShortDate(parseDate(project.startDate))} - {formatShortDate(parseDate(project.endDate))}</span>
  </button>
)

const SectionHead = ({ count, title }: { count: number; title: string }) => (
  <div className="mb-3 flex items-center justify-between px-1">
    <h2 className="text-[11px] font-semibold uppercase tracking-tight text-[#777777]">{title}</h2>
    <p className="rounded-full bg-[#DBDFE9] px-2 py-0.5 text-[11px] font-semibold text-[#212121]">{count}</p>
  </div>
)

const StatusChip = ({ label }: { label: string }) => <span className="mt-2 inline-flex rounded-full bg-[#DBDFE9] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-tight text-[#212121]">{label}</span>
const Progress = ({ value }: { value: number }) => <span className="mt-4 block h-2 overflow-hidden rounded-full bg-[#DBDFE9]"><span className="block h-full rounded-full bg-[#212121]" style={{ width: `${Math.max(4, Math.min(100, value))}%` }} /></span>
const MetricCard = ({ label, value }: { label: string; value: number }) => <div className="rounded-[22px] bg-[#F5F5FA] p-4"><p className="text-[11px] font-semibold uppercase text-[#777777]">{label}</p><strong className="mt-2 block text-2xl text-[#212121]">{value}</strong></div>
const EmptyCard = ({ compact = false, lines }: { compact?: boolean; lines: string[] }) => <div className={`rounded-[24px] border border-black/5 bg-white text-xs leading-5 text-[#777777] ${compact ? 'px-4 py-3' : 'p-5'}`}>{lines.map((line) => <p key={line}>{line}</p>)}</div>
const Legend = () => <div className="mt-5 flex flex-wrap gap-2 rounded-[20px] bg-white/70 px-3 py-3 text-[10px] font-medium text-[#777777]"><span>Range</span><span>/</span><span>In Progress</span><span>/</span><span>Planned</span><span>/</span><span>Selected</span></div>

const buildMobileData = (data: OsData, workspace: PersistedProjectWorkspace | null): { projects: MobileProject[]; tasks: MobileTask[] } => {
  const legacyProjects = data.studioProjects.length ? data.studioProjects.slice(0, 8).map(toMobileProject) : fallbackProjects
  const sharedProject: MobileProject | null = workspace ? { id: workspace.project.id, name: workspace.project.name, phase: workspace.project.phase, status: workspace.project.status === 'complete' ? 'DONE' : workspace.project.status === 'planning' ? 'PLANNED' : 'IN PROGRESS', startDate: workspace.project.startDate, endDate: workspace.project.targetHandoverDate, progress: workspace.project.actualProgress, note: workspace.project.summary } : null
  const projects = sharedProject ? [sharedProject, ...legacyProjects.filter((project) => project.id !== sharedProject.id)] : legacyProjects
  const phaseTasks: MobileTask[] = projects.map((project) => ({
    id: `range-${project.id}`,
    projectId: project.id,
    title: project.name,
    detail: `${project.phase} phase timeline.`,
    phase: project.phase,
    date: project.startDate,
    startDate: project.startDate,
    endDate: project.endDate,
    status: project.status === 'DONE' ? 'done' : project.status === 'OVERDUE' ? 'overdue' : 'doing',
    type: 'phase' as const,
  }))
  const legacyTasks = data.studioTasks.length ? data.studioTasks.filter((task) => task.projectId !== workspace?.project.id).slice(0, 16).map(toMobileTask) : fallbackTasks
  const taskItems = workspace ? [...workspace.tasks.map(toMobileWorkspaceTask), ...legacyTasks] : legacyTasks
  return { projects, tasks: [...phaseTasks, ...taskItems] }
}

const toMobileWorkspaceTask = (task: ProjectTask): MobileTask => ({ id: task.id, projectId: task.projectId, title: task.title, detail: task.description, phase: task.phase, date: task.plannedStart, startDate: task.plannedStart, endDate: task.plannedFinish, status: task.status === 'done' ? 'done' : task.status === 'blocked' ? 'overdue' : task.status === 'in-progress' || task.status === 'review' ? 'doing' : 'todo', type: 'task' })

const toMobileProject = (project: StudioProject): MobileProject => ({
  id: project.id,
  name: project.name || project.client || 'Karun Phuket',
  phase: normalizePhase(project.phase),
  status: project.projectHealth === 'risk' ? 'OVERDUE' : project.status === 'handover' ? 'PLANNED' : 'IN PROGRESS',
  startDate: project.startDate,
  endDate: project.endDate,
  progress: project.progress,
  note: project.notes ?? project.taskTimeline ?? 'Design direction, client alignment, and approval-ready boards.',
})

const toMobileTask = (task: StudioTask): MobileTask => ({
  id: task.id,
  projectId: task.projectId,
  title: task.title,
  detail: task.notes ?? task.trade,
  phase: normalizePhase(task.processState),
  date: task.startDate,
  startDate: task.startDate,
  endDate: task.endDate,
  time: inferTime(task.timelineSlot),
  status: task.status === 'done' ? 'done' : task.status === 'blocked' ? 'overdue' : task.status === 'doing' ? 'doing' : 'todo',
  type: 'task',
})

const fallbackProjects: MobileProject[] = [
  { id: 'demo-karun-phuket', name: 'Karun Phuket', phase: 'Design', status: 'IN PROGRESS', startDate: '2026-05-04', endDate: '2026-05-20', progress: 35, note: 'Design direction, client alignment, and phase approvals.' },
  { id: 'demo-westville', name: 'Karun Central Westville', phase: 'Construction', status: 'OVERDUE', startDate: '2026-05-04', endDate: '2026-05-07', progress: 50, note: 'Construction coordination and BOQ updates.' },
  { id: 'demo-ultimate', name: 'Ultimate BKK', phase: 'Handover', status: 'PLANNED', startDate: '2026-05-15', endDate: '2026-05-20', progress: 12, note: 'Handover planning and final documentation.' },
]

const fallbackTasks: MobileTask[] = [
  { id: 'task-site', projectId: 'demo-karun-phuket', title: 'Site meeting with client', detail: 'Client walkthrough and design alignment.', phase: 'Design', date: '2026-05-05', startDate: '2026-05-05', endDate: '2026-05-05', time: '09:00', status: 'todo', type: 'task' },
  { id: 'task-moodboard', projectId: 'demo-karun-phuket', title: 'Moodboard review', detail: 'Review visual direction and references.', phase: 'Design', date: '2026-05-05', startDate: '2026-05-05', endDate: '2026-05-05', time: '14:00', status: 'todo', type: 'task' },
  { id: 'task-boq', projectId: 'demo-westville', title: 'Update BOQ', detail: 'Revise construction cost items.', phase: 'Construction', date: '2026-05-05', startDate: '2026-05-05', endDate: '2026-05-05', time: '18:00', status: 'todo', type: 'task' },
  { id: 'task-survey', projectId: 'demo-karun-phuket', title: 'Site survey', detail: 'Completed initial site survey.', phase: 'Design', date: '2026-05-01', startDate: '2026-05-01', endDate: '2026-05-01', status: 'done', type: 'task' },
]

const getWeekDays = (date: Date) => {
  const start = new Date(date)
  start.setDate(date.getDate() - ((date.getDay() + 6) % 7))
  start.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, index) => {
    const item = new Date(start)
    item.setDate(start.getDate() + index)
    return item
  })
}

const getMonthDays = (date: Date) => {
  const first = new Date(date.getFullYear(), date.getMonth(), 1)
  const start = new Date(first)
  start.setDate(first.getDate() - first.getDay())
  return Array.from({ length: 42 }, (_, index) => {
    const item = new Date(start)
    item.setDate(start.getDate() + index)
    return item
  })
}

const parseDate = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  const date = new Date(year, (month || 1) - 1, day || 1)
  date.setHours(0, 0, 0, 0)
  return date
}

const isSameDay = (left: Date, right: Date) => left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate()
const occursOn = (task: MobileTask, date: Date) => parseDate(task.startDate) <= date && parseDate(task.endDate) >= date
const touchesMonth = (task: MobileTask, year: number, month: number) => parseDate(task.startDate) <= new Date(year, month + 1, 0) && parseDate(task.endDate) >= new Date(year, month, 1)
const formatShortDate = (date: Date) => date.toLocaleDateString([], { month: 'short', day: 'numeric' })
const rangeProgress = (task: MobileTask, date: Date) => {
  const start = parseDate(task.startDate)
  const end = parseDate(task.endDate)
  const total = Math.max(1, Math.round((end.getTime() - start.getTime()) / dayMs) + 1)
  const elapsed = Math.min(total, Math.max(1, Math.round((date.getTime() - start.getTime()) / dayMs) + 1))
  return { daysLeft: Math.max(0, Math.round((end.getTime() - date.getTime()) / dayMs)), percent: (elapsed / total) * 100 }
}
const projectName = (projects: MobileProject[], projectId: string) => projects.find((project) => project.id === projectId)?.name ?? 'Karun Phuket'
const initials = (value: string) => value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('') || 'P'
const normalizePhase = (value: string) => {
  const text = value.toLowerCase()
  if (text.includes('construction') || text.includes('fit-out')) return 'Construction'
  if (text.includes('handover') || text.includes('punch')) return 'Handover'
  if (text.includes('opening')) return 'Opening'
  return 'Design'
}
const inferTime = (slot: string) => {
  const match = slot.match(/\b\d{1,2}:\d{2}\b/)
  if (match) return match[0]
  if (slot.toLowerCase().includes('morning')) return '09:00'
  if (slot.toLowerCase().includes('afternoon')) return '14:00'
  if (slot.toLowerCase().includes('evening')) return '18:00'
  return undefined
}
const getTimeGroup = (task: MobileTask): (typeof timeGroups)[number] => {
  if (!task.time) return 'No time'
  const hour = Number(task.time.split(':')[0])
  if (hour < 12) return 'Morning'
  if (hour < 18) return 'Afternoon'
  return 'Evening'
}


