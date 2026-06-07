import { Link, useParams } from 'react-router-dom'
import { useOs } from '../../core/os/useOs'

export const ProjectDetailPage = () => {
  const { slug } = useParams()
  const { data } = useOs()
  const project = data.projects.find((item) => item.slug === slug)

  if (!project) {
    return (
      <section className="mx-auto min-h-screen max-w-screen-2xl px-5 pb-32 pt-40 md:px-8">
        <h1 className="text-5xl font-extrabold uppercase leading-none">Project not found</h1>
        <Link to="/projects" className="public-project-meta mt-8 inline-block border-b border-current">
          back to projects
        </Link>
      </section>
    )
  }

  return (
    <section className="mx-auto min-h-screen max-w-screen-2xl px-5 pb-32 pt-40 md:px-8">
      <p className="public-project-meta text-[#777777]">{project.status} / {project.owner}</p>
      <h1 className="mt-6 max-w-5xl text-6xl font-extrabold uppercase leading-[0.86] md:text-8xl">
        {project.name}
      </h1>
      <div className="mt-16 h-[52vh] max-w-5xl border border-black/[0.06] bg-[linear-gradient(135deg,#eee9df,#cfc8bb_48%,#f7f4ed)]" />
      <p className="mt-8 max-w-2xl text-sm leading-7 text-[#666666]">
        Public project profile placeholder. Operational controls remain inside the private Studio OS workspace.
      </p>
    </section>
  )
}
