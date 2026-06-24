import { MobileStudioApp } from '../../components/studio/mobile/MobileStudioApp'
import { useOs } from '../../core/os/useOs'

export const StudioMobilePage = () => {
  const { data, createActionRequest } = useOs()

  return (
    <section
      className="min-h-screen p-3"
      style={{
        background: 'var(--bbh-canvas)',
      }}
    >
      <MobileStudioApp data={data} createActionRequest={createActionRequest} />
    </section>
  )
}
