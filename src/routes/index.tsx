import { Navigate, Route, Routes } from 'react-router-dom'
import { OSLayout } from '../layouts/OSLayout'
import { PublicWebsiteLayout } from '../layouts/PublicWebsiteLayout'
import { AIWorkflowPage } from '../pages/os/AIWorkflowPage'
import { BridgeSettingsPage } from '../pages/os/BridgeSettingsPage'
import { CommandCenterPage } from '../pages/os/CommandCenterPage'
import { CapitalPage } from '../pages/os/CapitalPage'
import { DividendHistoryPage } from '../pages/os/DividendHistoryPage'
import { FamilyOfficePage } from '../pages/os/FamilyOfficePage'
import { FinancePage } from '../pages/os/FinancePage'
import { InvestmentsPage } from '../pages/os/InvestmentsPage'
import { InvestmentsV2Page } from '../pages/os/InvestmentsV2Page'
import { SettingsPage } from '../pages/os/SettingsPage'
import { StudioMobilePage } from '../pages/os/StudioMobilePage'
import { StudioProjectDetailPage } from '../pages/os/StudioProjectDetailView'
import { StudioWorkspacePage } from '../pages/os/StudioControlRoomPage'
import { TradingLabPage } from '../pages/os/TradingLabPage'
import { AboutPage } from '../pages/public/AboutPage'
import { CareersPage } from '../pages/public/CareersPage'
import { ContactPage } from '../pages/public/ContactPage'
import { HomePage } from '../pages/public/HomePage'
import { JournalPage } from '../pages/public/JournalPage'
import { LoginPage } from '../pages/public/LoginPage'
import { ProjectDetailPage } from '../pages/public/ProjectDetailPage'
import { ProjectsPage } from '../pages/public/ProjectsPage'
import { ServicesPage } from '../pages/public/ServicesPage'
import { ProtectedRoute } from './ProtectedRoute'

export const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<PublicWebsiteLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:slug" element={<ProjectDetailPage />} />
        <Route path="/work" element={<ProjectsPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route
        path="/os"
        element={
          <ProtectedRoute>
            <OSLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CommandCenterPage />} />
        <Route path="studio" element={<StudioWorkspacePage />} />
        <Route path="studio/mobile" element={<StudioMobilePage />} />
        <Route path="studio/projects/:projectId" element={<StudioProjectDetailPage />} />
        <Route path="studio/projects" element={<StudioWorkspacePage />} />
        <Route path="studio/timeline" element={<StudioWorkspacePage />} />
        <Route path="studio/site-watch" element={<StudioWorkspacePage />} />
        <Route path="studio/documents" element={<StudioWorkspacePage />} />
        <Route path="studio/artwork" element={<StudioWorkspacePage />} />
        <Route path="studio/briefs" element={<StudioWorkspacePage />} />
        <Route path="studio/reviews" element={<StudioWorkspacePage />} />
        <Route path="finance" element={<FinancePage />} />
        <Route path="finance/investments" element={<InvestmentsPage />} />
        <Route path="labs/investments-v2" element={<InvestmentsV2Page />} />
        <Route path="finance/investments/dividend-history" element={<DividendHistoryPage />} />
        <Route path="capital" element={<CapitalPage />} />
        <Route path="finance/family-office" element={<FamilyOfficePage />} />
        <Route path="finance/trading-lab" element={<TradingLabPage />} />
        <Route path="ai" element={<AIWorkflowPage view="overview" />} />
        <Route path="ai/context" element={<AIWorkflowPage view="context" />} />
        <Route path="ai/reviews" element={<AIWorkflowPage view="reviews" />} />
        <Route path="ai/memory" element={<AIWorkflowPage view="memory" />} />
        <Route path="ai/exports" element={<AIWorkflowPage view="exports" />} />
        <Route path="ai/imports" element={<AIWorkflowPage view="imports" />} />
        <Route path="ai-workflow" element={<AIWorkflowPage view="overview" />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="bridge" element={<BridgeSettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
