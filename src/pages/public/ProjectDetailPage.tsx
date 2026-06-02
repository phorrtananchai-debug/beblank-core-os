import { Link, useParams } from 'react-router-dom'
import { useOs } from '../../core/os/OsContext'

export const ProjectDetailPage = () => {
  const { slug } = useParams()
  const { data } = useOs()
  const project = data.projects.find((item) => item.slug === slug)

  if (!project) {
    return (
      <section className="py-10">
        <h1 className="text-3xl font-semibold">Project not found</h1>
        <Link to="/projects" className="mt-4 inline-block underline">Back to projects</Link>
      </section>
    )
  }

  return (
    <section className="py-10">
      <h1 className="text-4xl font-semibold">{project.name}</h1>
      <p className="mt-3 max-w-2xl text-[#564f46]">
        Public project profile page. Detailed operational controls are only available inside `/os/studio`.
      </p>
      <div className="mt-6 rounded-[28px] border border-[#dfd4c5] bg-white/80 p-5">
        <p className="text-sm">Status: {project.status}</p>
        <p className="text-sm">Owner: {project.owner}</p>
      </div>
    </section>
  )
}

