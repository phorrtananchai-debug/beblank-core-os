import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { HomepagePortfolioItem, PortfolioProject } from '../../core/portfolio/types'

interface PortfolioHomepageCanvasProps {
  editing: boolean
  items: HomepagePortfolioItem[]
  projects: PortfolioProject[]
  selectedItemId: string
  onAddItem: () => string
  onDeleteItem: (itemId: string) => void
  onSave: () => void
  onReset: () => void
  onSelectItem: (itemId: string) => void
  onUpdateItem: (itemId: string, patch: Partial<HomepagePortfolioItem>) => void
  onUploadImage: (itemId: string, file: File) => void
  storageWarning?: string
  saveState: string
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export const PortfolioHomepageCanvas = ({
  editing,
  items,
  onAddItem,
  onDeleteItem,
  onReset,
  onSave,
  onSelectItem,
  onUpdateItem,
  onUploadImage,
  projects,
  saveState,
  selectedItemId,
  storageWarning,
}: PortfolioHomepageCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const [draggingItemId, setDraggingItemId] = useState('')
  const visibleItems = items.filter((item) => item.isVisible || editing).sort((a, b) => a.zIndex - b.zIndex)
  const selectedItem = items.find((item) => item.id === selectedItemId) ?? null

  const addAndSelect = useCallback(() => {
    const id = onAddItem()
    onSelectItem(id)
  }, [onAddItem, onSelectItem])

  const handleFiles = useCallback((fileList: FileList | File[]) => {
    const [file] = Array.from(fileList).filter((item) => item.type.startsWith('image/'))
    if (!file) return
    const targetId = selectedItemId || onAddItem()
    onSelectItem(targetId)
    onUploadImage(targetId, file)
  }, [onAddItem, onSelectItem, onUploadImage, selectedItemId])

  useEffect(() => {
    if (!editing) return undefined
    const handlePaste = (event: ClipboardEvent) => {
      if (event.clipboardData?.files.length) {
        handleFiles(event.clipboardData.files)
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [editing, handleFiles])

  const startDrag = (event: React.PointerEvent, item: HomepagePortfolioItem) => {
    if (!editing || !canvasRef.current) return
    event.preventDefault()
    onSelectItem(item.id)
    setDraggingItemId(item.id)
    const rect = canvasRef.current.getBoundingClientRect()
    const startX = event.clientX
    const startY = event.clientY
    const origin = { x: item.x, y: item.y }

    const move = (moveEvent: PointerEvent) => {
      const nextX = origin.x + ((moveEvent.clientX - startX) / rect.width) * 100
      const nextY = origin.y + ((moveEvent.clientY - startY) / rect.height) * 100
      onUpdateItem(item.id, {
        x: Number(clamp(nextX, 0, 92).toFixed(2)),
        y: Number(clamp(nextY, 0, 92).toFixed(2)),
      })
    }
    const stop = () => {
      setDraggingItemId('')
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
  }

  return (
    <div
      ref={canvasRef}
      className={`public-portfolio-editor-surface ${editing ? 'is-editing' : ''}`}
      onDragOver={(event) => {
        if (!editing) return
        event.preventDefault()
      }}
      onDrop={(event) => {
        if (!editing) return
        event.preventDefault()
        handleFiles(event.dataTransfer.files)
      }}
    >
      {editing ? (
        <PortfolioEditorToolbar
          saveState={saveState}
          selectedItem={selectedItem}
          storageWarning={storageWarning}
          onAdd={addAndSelect}
          onDelete={() => selectedItem && onDeleteItem(selectedItem.id)}
          onReset={onReset}
          onSave={onSave}
          projects={projects}
          onUpload={(file) => {
            const targetId = selectedItem?.id ?? onAddItem()
            onSelectItem(targetId)
            onUploadImage(targetId, file)
          }}
          onUpdateItem={onUpdateItem}
        />
      ) : null}

      <div className="public-archive-canvas">
        {visibleItems.map((item) => {
          const project = projects.find((entry) => entry.id === item.projectId) ?? projects[0]
          const selected = selectedItemId === item.id
          const card = (
            <>
              <div
                aria-hidden="true"
                className="public-work-frame"
                style={{
                  height: `clamp(180px, ${item.height}vw, 560px)`,
                  backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : undefined,
                }}
              >
                {!item.imageUrl ? <span className="public-work-fallback-label">portfolio image pending</span> : null}
              </div>
              <p className="public-project-title mt-3">{item.title || project?.title}</p>
              <p className="public-project-meta mt-1 text-[#777777]">{item.caption || project?.status}</p>
            </>
          )

          return (
            <article
              key={item.id}
              className={`public-work-item public-work-image ${editing ? 'public-work-editable' : ''} ${selected ? 'is-selected' : ''} ${draggingItemId === item.id ? 'is-dragging' : ''}`}
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                width: `${item.width}%`,
                zIndex: item.zIndex,
                transform: `rotate(${item.rotation}deg)`,
              }}
              onPointerDown={(event) => startDrag(event, item)}
            >
              {editing ? (
                <button className="block w-full text-left" type="button" onClick={() => onSelectItem(item.id)}>
                  {card}
                </button>
              ) : (
                <Link className="block" to={`/portfolio/${project?.slug ?? 'karun-central-khon-kaen'}`}>
                  {card}
                </Link>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}

const PortfolioEditorToolbar = ({
  onAdd,
  onDelete,
  onReset,
  onSave,
  onUpdateItem,
  onUpload,
  projects,
  saveState,
  selectedItem,
  storageWarning,
}: {
  onAdd: () => void
  onDelete: () => void
  onReset: () => void
  onSave: () => void
  onUpdateItem: (itemId: string, patch: Partial<HomepagePortfolioItem>) => void
  onUpload: (file: File) => void
  projects: PortfolioProject[]
  saveState: string
  selectedItem: HomepagePortfolioItem | null
  storageWarning?: string
}) => (
  <aside className="public-editor-toolbar">
    <div className="public-editor-toolbar-head">
      <div>
        <p>Portfolio Editor v1</p>
        <span>{saveState === 'saved' ? 'saved locally' : saveState}</span>
      </div>
      <div className="public-editor-actions">
        <button type="button" onClick={onAdd}>add image</button>
        <label className="public-editor-upload">upload image<input accept="image/*" type="file" onChange={(event) => { const file = event.target.files?.[0]; if (file) onUpload(file) }} /></label>
        <button type="button" onClick={onSave}>save layout</button>
        <button type="button" onClick={onReset}>reset</button>
      </div>
    </div>
    {storageWarning ? <p className="public-editor-storage-warning">{storageWarning}</p> : null}

    {selectedItem ? (
      <div className="public-editor-fields">
        <label>
          <span>title</span>
          <input value={selectedItem.title} onChange={(event) => onUpdateItem(selectedItem.id, { title: event.target.value })} />
        </label>
        <label>
          <span>project slug</span>
          <select value={selectedItem.projectId} onChange={(event) => onUpdateItem(selectedItem.id, { projectId: event.target.value })}>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.slug}</option>
            ))}
          </select>
        </label>
        <label>
          <span>caption / status</span>
          <input value={selectedItem.caption} onChange={(event) => onUpdateItem(selectedItem.id, { caption: event.target.value })} />
        </label>
        <div className="public-editor-grid">
          <NumberField item={selectedItem} label="x" prop="x" onUpdateItem={onUpdateItem} />
          <NumberField item={selectedItem} label="y" prop="y" onUpdateItem={onUpdateItem} />
          <NumberField item={selectedItem} label="width" prop="width" onUpdateItem={onUpdateItem} />
          <NumberField item={selectedItem} label="height" prop="height" onUpdateItem={onUpdateItem} />
          <NumberField item={selectedItem} label="z" prop="zIndex" onUpdateItem={onUpdateItem} />
          <NumberField item={selectedItem} label="rotate" prop="rotation" onUpdateItem={onUpdateItem} />
        </div>
        <div className="public-editor-actions">
          <button type="button" onClick={() => onUpdateItem(selectedItem.id, { zIndex: selectedItem.zIndex + 1 })}>bring forward</button>
          <button type="button" onClick={() => onUpdateItem(selectedItem.id, { zIndex: selectedItem.zIndex - 1 })}>send backward</button>
          <button type="button" onClick={onDelete}>delete</button>
        </div>
      </div>
    ) : (
      <p className="public-editor-hint">Drop, paste, or add an image placeholder. Select a card to edit layout metadata.</p>
    )}
  </aside>
)

const NumberField = ({
  item,
  label,
  onUpdateItem,
  prop,
}: {
  item: HomepagePortfolioItem
  label: string
  onUpdateItem: (itemId: string, patch: Partial<HomepagePortfolioItem>) => void
  prop: keyof Pick<HomepagePortfolioItem, 'x' | 'y' | 'width' | 'height' | 'zIndex' | 'rotation'>
}) => (
  <label>
    <span>{label}</span>
    <input
      type="number"
      value={item[prop]}
      onChange={(event) => onUpdateItem(item.id, { [prop]: Number(event.target.value) })}
    />
  </label>
)



