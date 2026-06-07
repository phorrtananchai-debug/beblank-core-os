import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOs } from '../../core/os/useOs'

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const projectLayouts = [
  { x: 6, y: 12, width: 22, height: 28, speed: 0.18, tone: 'stone' },
  { x: 58, y: 8, width: 28, height: 18, speed: 0.1, tone: 'paper' },
  { x: 34, y: 36, width: 18, height: 34, speed: 0.24, tone: 'ink' },
  { x: 70, y: 52, width: 20, height: 30, speed: 0.16, tone: 'warm' },
]

export const HomePage = () => {
  const navigate = useNavigate()
  const { data } = useOs()
  const hasProjects = data.projects.length > 0
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const updateProgress = () => {
      const maxScroll = Math.max(window.innerHeight * 1.4, 1)
      setScrollProgress(clamp(window.scrollY / maxScroll, 0, 1))
    }

    updateProgress()
    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)
    return () => {
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [])

  const heroStyle = useMemo(
    () => ({
      opacity: 0.96 - scrollProgress * 0.24,
      transform: `translate3d(0, ${-scrollProgress * 34}vh, 0) scale(${1 - scrollProgress * 0.42})`,
    }),
    [scrollProgress],
  )

  const archiveOpacity = clamp((scrollProgress - 0.12) / 0.72, 0, 1)

  return (
    <section className={`relative ${hasProjects ? 'min-h-[240vh]' : 'min-h-screen'} overflow-hidden px-5 pb-32 pt-[36vh] md:px-8 md:pt-[39vh]`}>
      <div className="pointer-events-none fixed left-0 right-0 top-[22vh] z-20 flex justify-center px-5 md:top-[24vh]">
        <h1
          className="public-masthead-type max-w-[12ch] text-center text-[#111111]"
          style={heroStyle}
        >
          BE BLANK TO BEHIND STUDIO
        </h1>
      </div>

      {hasProjects ? (
        <>
          <div
            className="pointer-events-none fixed left-0 right-0 top-20 z-10 mx-auto hidden max-w-screen-2xl px-8 md:block"
            style={{
              opacity: clamp((scrollProgress - 0.42) / 0.45, 0, 0.55),
              transform: `translate3d(0, ${18 - scrollProgress * 28}px, 0)`,
            }}
          >
            <div className="public-os-preview ml-auto w-[28rem] rounded-[32px] border border-black/[0.06] bg-white/80 p-4">
              <div className="flex items-center justify-between">
                <span>BE BLANK OS</span>
                <span>Studio Environment</span>
              </div>
              <div className="mt-4 grid grid-cols-[0.35fr_1fr] gap-3">
                <div className="space-y-2">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="space-y-2">
                  <strong>Operational Workspace</strong>
                  <span />
                  <span />
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-30 mx-auto max-w-screen-2xl">
            <div
              className="public-archive-canvas"
              style={{
                opacity: archiveOpacity,
                transform: `translate3d(0, ${(1 - archiveOpacity) * 11}vh, 0)`,
              }}
            >
              {projectLayouts.map((layout, index) => {
                const project = data.projects[index % data.projects.length]
                return (
                  <article
                    key={`${project.id}-${layout.tone}`}
                    className={`public-work-item public-work-image public-work-image-${layout.tone}`}
                    style={{
                      left: `${layout.x}%`,
                      top: `${layout.y}%`,
                      width: `${layout.width}%`,
                      transform: `translate3d(0, ${scrollProgress * layout.speed * -180}px, 0)`,
                    }}
                  >
                    <div style={{ height: `clamp(180px, ${layout.height}vw, 520px)` }} />
                    <p className="public-project-title mt-3">{project.name}</p>
                    <p className="public-project-meta mt-1 text-[#777777]">
                      {project.status} / studio archive
                    </p>
                  </article>
                )
              })}
            </div>

            <div className="public-transition-statement">
              <p>Blank Canvas</p>
              <p>Studio Identity</p>
              <p>Operational Workspace</p>
            </div>
          </div>
        </>
      ) : (
        <div className="relative z-30 mx-auto max-w-screen-2xl">
          <div className="max-w-xl">
            <p className="public-project-meta text-[#777777]">studio / landing</p>
            <p className="mt-8 text-sm leading-7 text-[#666666]">
              A blank editorial studio canvas becoming an operating system.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <button className="btn-primary" type="button" onClick={() => navigate('/os')}>Enter OS</button>
              <button className="btn-secondary" type="button" onClick={() => navigate('/projects')}>View Studio Archive</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
