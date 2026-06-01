import { Link } from 'react-router-dom'

export const HomePage = () => {
  return (
    <section className="grid gap-6 py-10 md:grid-cols-[1.2fr_1fr]">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-[#a66b40]">Sheet-first Operating System</p>
        <h1 className="mt-3 text-5xl font-semibold leading-tight">
          Be Blank Core OS
          <span className="block text-[#8a6a4f]">from operations to decisions.</span>
        </h1>
        <p className="mt-5 max-w-xl text-base text-[#4d463e]">
          Front-of-house website for studio, finance, and AI-assisted operating workflows. Private OS lives behind login.
        </p>
        <div className="mt-8 flex gap-3">
          <Link className="btn-primary" to="/projects">
            View Projects
          </Link>
          <Link className="btn-secondary" to="/login">
            Enter Core OS
          </Link>
        </div>
      </div>
      <div className="rounded-[32px] border border-[#dfd4c5] bg-white/70 p-6">
        <h2 className="text-xl font-semibold">Ready for approved landing integration</h2>
        <p className="mt-3 text-sm text-[#5b544b]">
          This route structure is intentionally clean so the existing approved Be Blank landing can be dropped in later.
        </p>
      </div>
    </section>
  )
}

