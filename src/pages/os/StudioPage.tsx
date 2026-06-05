import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../../components/shared/EmptyState'
import { useOs } from '../../core/os/OsContext'

export const StudioPage = () => {
  const navigate = useNavigate()
  const { data } = useOs()

  return (
    <section className="space-y-7">
      <header className="command-hero rounded-[36px] border border-black/[0.05] bg-[#faf9f8] p-6 md:p-9">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--bb-text-muted)]">Studio / workspace</p>
        <h2 className="mt-4 text-2xl font-extrabold">สตูดิโอ</h2>
        <p className="mt-1 text-sm text-[var(--bb-text-soft)]">พื้นที่ทำงานโปรเจค WorkScope ไทม์ไลน์ ควบคุมเอกสาร ไซต์หน้างาน</p>
      </header>

      <EmptyState
        title="ยังไม่มีโปรเจกต์"
        body="สร้างโปรเจกต์แรกของคุณเพื่อเริ่มต้นการทำงานใน Studio"
        action={
          <button className="btn-primary" type="button" onClick={() => navigate('/os/studio/workspace')}>
            ไปที่ Studio Workspace
          </button>
        }
      />

      {data.documents.length > 0 || data.siteIssues.length > 0 ? (
        <section className="panel">
          <h3 className="text-lg font-semibold">Document Control · Site Watch · Creative Brief</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-[#e6e0d5] bg-white p-3 text-sm">Documents: {data.documents.length}</div>
            <div className="rounded-2xl border border-[#e6e0d5] bg-white p-3 text-sm">Site issues: {data.siteIssues.length}</div>
            <div className="rounded-2xl border border-[#e6e0d5] bg-white p-3 text-sm">Artwork brief: placeholder</div>
          </div>
        </section>
      ) : null}
    </section>
  )
}

