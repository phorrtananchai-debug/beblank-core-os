import { MobileStudioApp } from '../../components/studio/mobile/MobileStudioApp'
import { useAuth } from '../../core/auth/useAuth'
import { useOs } from '../../core/os/useOs'

export const StudioMobilePage = () => {
  const { isAuthenticated, login } = useAuth()
  const { data, createActionRequest } = useOs()

  if (!isAuthenticated) {
    return <MobileStudioLanding onLogin={login} />
  }

  return (
    <section className="mobile-studio-route min-h-screen overflow-hidden bg-[#F5F5FA] font-[var(--font-ui)] text-[#212121]">
      <MobileStudioApp data={data} createActionRequest={createActionRequest} />
    </section>
  )
}

const GoogleMark = () => (
  <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
    <path d="M21.6 12.22c0-.78-.07-1.53-.2-2.22H12v4.2h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.51Z" fill="#4285F4" />
    <path d="M12 22c2.7 0 4.97-.9 6.62-2.27l-3.24-2.51c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.76-5.6-4.12H3.06v2.6A10 10 0 0 0 12 22Z" fill="#34A853" />
    <path d="M6.4 14.05A6 6 0 0 1 6.08 12c0-.7.12-1.4.32-2.05v-2.6H3.06A10 10 0 0 0 2 12c0 1.61.39 3.14 1.06 4.65l3.34-2.6Z" fill="#FBBC05" />
    <path d="M12 5.83c1.47 0 2.8.5 3.84 1.5l2.87-2.87A9.62 9.62 0 0 0 12 2 10 10 0 0 0 3.06 7.35l3.34 2.6C7.2 7.6 9.4 5.83 12 5.83Z" fill="#EA4335" />
  </svg>
)

const MobileStudioLanding = ({ onLogin }: { onLogin: () => void }) => {
  return (
    <main className="mobile-studio-landing min-h-[100dvh] w-full overflow-hidden bg-[#f5f5f5] font-[var(--font-ui)] text-[#111111]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col justify-between px-5 py-6">
        <div aria-hidden="true" />

        <section className="flex flex-col items-center justify-center text-center">
          <div className="grid size-[92px] place-items-center rounded-full border border-black/[0.08] bg-white text-lg font-semibold tracking-tight shadow-sm">
            bb
          </div>
          <p className="mt-8 whitespace-nowrap text-[15px] font-medium tracking-tight">
            Be blank to behind studio
          </p>
          <div className="my-4 h-px w-10 bg-black/[0.18]" />
          <p className="text-sm font-normal tracking-tight text-[#777777]">Studio OS</p>
          <p className="mt-3 max-w-[260px] text-xs leading-5 text-[#9a9a9a]">
            Mobile companion for today, calendar, projects, notes, and quick field follow-up.
          </p>
        </section>

        <div className="w-full">
          <button
            className="flex h-14 w-full items-center justify-center gap-3 rounded-[18px] border border-black/[0.08] bg-white text-sm font-medium text-[#111111] transition duration-200 ease-out hover:bg-[#fbfbfa] active:scale-[0.98]"
            type="button"
            onClick={onLogin}
          >
            <GoogleMark />
            Continue with Google (mock)
          </button>
          <p className="mt-5 text-center text-xs font-normal tracking-tight text-[#9a9a9a]">Private workspace</p>
        </div>
      </div>
    </main>
  )
}
