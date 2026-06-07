import { Link } from 'react-router-dom'
import { useOs } from '../../core/os/useOs'

export const ProjectsPage = () => {
  const { data } = useOs()
  const hasProjects = data.projects.length > 0

  return (
    <section className="mx-auto min-h-screen max-w-screen-2xl px-5 pb-32 pt-40 md:px-8">
      <p className="public-project-meta text-[#777777]">projects / work index</p>
      <h1 className="mt-6 max-w-4xl text-6xl font-extrabold uppercase leading-[0.86] md:text-8xl">
        {hasProjects ? 'Studio archive in progress.' : 'Projects coming soon'}
      </h1>

      {hasProjects ? (
        <div className="mt-24 grid gap-y-16 border-t border-black/[0.08] pt-8">
          {data.projects.map((project, index) => (
            <article key={project.id} className="grid gap-4 md:grid-cols-[0.18fr_1fr_0.24fr]">
              <p className="public-project-meta text-[#777777]">{String(index + 1).padStart(2, '0')}</p>
              <Link to={`/projects/${project.slug}`} className="group">
                <h2 className="public-project-title text-3xl transition group-hover:opacity-60 md:text-5xl">
                  {project.name}
                </h2>
              </Link>
              <p className="public-project-meta text-[#777777]">
                {project.status}
                <br />
                {project.owner}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-12 max-w-xl">
          <p className="text-sm leading-7 text-[#666666]">
            The studio archive is being prepared. Projects will appear here once they are created in the workspace.
          </p>
          <Link to="/" className="public-project-meta mt-8 inline-block border-b border-current text-[#111111] transition hover:opacity-55">
            back to home
          </Link>
        </div>
      )}
    </section>
  )
}
