import { Link } from 'react-router-dom'
import { useOs } from '../../core/os/OsContext'

export const ProjectsPage = () => {
  const { data } = useOs()

  return (
    <section className="py-10">
      <h1 className="text-4xl font-semibold">Projects</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {data.projects.map((project) => (
          <article key={project.id} className="rounded-[28px] border border-[#dfd4c5] bg-white/80 p-5">
            <h2 className="text-xl font-semibold">{project.name}</h2>
            <p className="mt-1 text-sm text-[#5c544b]">Owner: {project.owner}</p>
            <p className="mt-2 text-xs uppercase tracking-wide text-[#98633d]">{project.status}</p>
            <Link to={`/projects/${project.slug}`} className="mt-4 inline-block text-sm font-medium underline">
              Open details
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}

