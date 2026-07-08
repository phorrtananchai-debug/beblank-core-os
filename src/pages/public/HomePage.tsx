import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PortfolioHomepageCanvas } from '../../components/portfolio/PortfolioHomepageCanvas'
import { useAuth } from '../../core/auth/useAuth'
import { useOs } from '../../core/os/useOs'
import { usePortfolioLayout } from '../../core/portfolio/usePortfolioLayout'

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export const HomePage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated } = useAuth()
  const { data } = useOs()
  const portfolio = usePortfolioLayout(data.projects)
  const hasProjects = data.projects.length > 0
  const [scrollProgress, setScrollProgress] = useState(0)
  const [selectedItemId, setSelectedItemId] = useState(portfolio.snapshot.homepageItems[0]?.id ?? '')
  const editing = isAuthenticated && searchParams.get('edit') === '1'

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
      opacity: 0.96 - scrollProgress * 0.12,
      transform: `translate3d(0, ${-scrollProgress * 16}vh, 0) scale(${1 - scrollProgress * 0.26})`,
    }),
    [scrollProgress],
  )

  const archiveOpacity = editing ? 1 : clamp((scrollProgress - 0.12) / 0.72, 0, 1)

  const addItem = () => {
    const id = portfolio.addItem()
    setSelectedItemId(id)
    return id
  }

  return (
    <section className={`relative ${hasProjects ? 'min-h-[240vh]' : 'min-h-screen'} overflow-hidden px-5 pb-32 pt-[36vh] md:px-8 md:pt-[39vh]`}>
      <div className="pointer-events-none fixed left-0 right-0 top-[22vh] z-20 flex justify-center px-5 md:top-[24vh]">
        <h1
          className="public-masthead-type public-home-masthead text-center text-[#111111]"
          style={heroStyle}
        >
          BE BLANK TO BEHIND STUDIO
        </h1>
      </div>

      {hasProjects ? (
        <div className="relative z-30 mx-auto max-w-screen-2xl">
          <div
            style={{
              opacity: archiveOpacity,
              transform: editing ? 'none' : `translate3d(0, ${(1 - archiveOpacity) * 11}vh, 0)`,
            }}
          >
            <PortfolioHomepageCanvas
              editing={editing}
              items={portfolio.snapshot.homepageItems}
              projects={portfolio.snapshot.projects}
              saveState={portfolio.saveState}
              selectedItemId={selectedItemId}
              onAddItem={addItem}
              onDeleteItem={(itemId) => {
                portfolio.deleteItem(itemId)
                setSelectedItemId('')
              }}
              onReset={portfolio.reset}
              onSave={portfolio.save}
              onSelectItem={setSelectedItemId}
              onUpdateItem={portfolio.updateItem}
              onUploadImage={portfolio.uploadImage}
              storageWarning={portfolio.adapterWarning}
            />
          </div>

          <div className="public-transition-statement">
            <p>Blank Canvas</p>
            <p>Studio Identity</p>
            <p>Operational Workspace</p>
          </div>

          <div className="public-private-entry">
            <p className="public-private-entry-label">Private access</p>
            <h2 className="public-private-entry-title">Studio OS stays behind the portfolio.</h2>
            <p className="max-w-sm text-sm leading-6 text-[#5f5a52]">
              Portfolio is public. Editing, project operations, and OS controls require private access.
            </p>
            <div className="public-private-entry-actions">
              <Link className="btn-primary" to={isAuthenticated ? '/?edit=1' : '/login'}>
                {isAuthenticated ? 'Edit homepage' : 'Continue with Google (mock)'}
              </Link>
              <Link className="btn-secondary" to="/os">OS</Link>
              <Link className="btn-secondary" to="/os/portfolio">portfolio editor</Link>
            </div>
          </div>
        </div>
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
