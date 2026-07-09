import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PortfolioHomepageCanvas } from '../../components/portfolio/PortfolioHomepageCanvas'
import { useOs } from '../../core/os/useOs'
import { usePortfolioLayout } from '../../core/portfolio/usePortfolioLayout'

export const PortfolioManagerPage = () => {
  const { data } = useOs()
  const portfolio = usePortfolioLayout(data.projects)
  const [selectedItemId, setSelectedItemId] = useState(portfolio.snapshot.homepageItems[0]?.id ?? '')
  const selectedItem = portfolio.snapshot.homepageItems.find((item) => item.id === selectedItemId) ?? null

  const addItem = () => {
    const id = portfolio.addItem()
    setSelectedItemId(id)
    return id
  }

  const handleUpload = (file: File) => {
    const targetId = selectedItemId || addItem()
    portfolio.uploadImage(targetId, file)
  }

  return (
    <section className="portfolio-manager px-4 py-5 md:px-6">
      <header className="portfolio-manager-header">
        <div>
          <p className="public-project-meta text-[#777777]">Back office / portfolio</p>
          <h1>Portfolio Editor v1</h1>
        </div>
        <div className="portfolio-manager-actions">
          <Link to="/?edit=1">edit homepage</Link>
          <Link to="/">public homepage</Link>
          <button type="button" onClick={portfolio.save}>save layout</button>
        </div>
      </header>

      <div className="portfolio-manager-grid">
        <div>
          <PortfolioHomepageCanvas
            editing
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

        <aside className="portfolio-manager-panel">
          <p className="portfolio-manager-label">Selected card</p>
          {portfolio.adapterWarning ? <p className="portfolio-manager-copy">{portfolio.adapterWarning}</p> : null}
          {selectedItem ? (
            <>
              <label>
                <span>project</span>
                <select value={selectedItem.projectId} onChange={(event) => portfolio.updateItem(selectedItem.id, { projectId: event.target.value })}>
                  {portfolio.snapshot.projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.title}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>image</span>
                <input
                  accept="image/*"
                  type="file"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) handleUpload(file)
                  }}
                />
              </label>
              <label>
                <span>image url</span>
                <input value={selectedItem.imageUrl} onChange={(event) => portfolio.updateItem(selectedItem.id, { imageUrl: event.target.value })} />
              </label>
              <label>
                <span>visible</span>
                <select value={selectedItem.isVisible ? 'yes' : 'no'} onChange={(event) => portfolio.updateItem(selectedItem.id, { isVisible: event.target.value === 'yes' })}>
                  <option value="yes">yes</option>
                  <option value="no">no</option>
                </select>
              </label>
            </>
          ) : (
            <p className="portfolio-manager-copy">Select a homepage card, drop an image, paste an image, or add a new placeholder.</p>
          )}

          <div
            className="portfolio-drop-zone"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              const file = Array.from(event.dataTransfer.files).find((item) => item.type.startsWith('image/'))
              if (file) handleUpload(file)
            }}
          >
            <strong>drop image here</strong>
            <span>Dev fallback uses object URLs. Firebase Storage is the deploy target.</span>
          </div>
        </aside>
      </div>
    </section>
  )
}
