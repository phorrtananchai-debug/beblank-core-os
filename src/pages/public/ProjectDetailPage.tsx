import { Link, useParams } from 'react-router-dom'
import { useOs } from '../../core/os/useOs'

export const ProjectDetailPage = () => {
  const { slug } = useParams()
  const { data } = useOs()
  const project = data.projects.find((item) => item.slug === slug || item.id === slug)

  if (!project) {
    return (
      <section className="mx-auto min-h-screen max-w-screen-2xl px-5 pb-32 pt-40 md:px-8">
        <h1 className="public-page-heading text-5xl font-extrabold uppercase leading-none">Project not found</h1>
        <Link to="/projects" className="public-project-meta mt-8 inline-block border-b border-current">
          back to portfolio
        </Link>
      </section>
    )
  }

  return (
    <section className="mx-auto min-h-screen max-w-screen-2xl px-5 pb-32 pt-40 md:px-8">
      <p className="public-project-meta text-[#777777]">{project.status} / {project.owner}</p>
      <h1 className="public-page-heading mt-6 max-w-5xl text-6xl font-extrabold uppercase leading-[0.86] md:text-8xl">
        {project.name}
      </h1>
      <div
        className="public-detail-visual mt-16 h-[52vh] max-w-5xl border border-black/[0.06]"
        style={{ backgroundImage: project.coverImageUrl ? `url(${project.coverImageUrl})` : undefined }}
      >
        {!project.coverImageUrl ? <span className="public-work-fallback-label">portfolio image pending</span> : null}
      </div>
      <p className="mt-8 max-w-2xl text-sm leading-7 text-[#666666]">
        Public project profile from the shared Studio OS project data. Operational controls remain inside the private Studio OS workspace.
      </p>
    </section>
  )
}
