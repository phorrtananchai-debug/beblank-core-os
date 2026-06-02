import { Navigate, Route, Routes } from 'react-router-dom'
import { OSLayout } from '../layouts/OSLayout'
import { PublicWebsiteLayout } from '../layouts/PublicWebsiteLayout'
import { AIWorkflowPage } from '../pages/os/AIWorkflowPage'
import { CommandCenterPage } from '../pages/os/CommandCenterPage'
import { FamilyOfficePage } from '../pages/os/FamilyOfficePage'
import { FinancePage } from '../pages/os/FinancePage'
import { InvestmentsPage } from '../pages/os/InvestmentsPage'
import { SettingsPage } from '../pages/os/SettingsPage'
import { StudioPage } from '../pages/os/StudioPage'
import { TradingLabPage } from '../pages/os/TradingLabPage'
import { AboutPage } from '../pages/public/AboutPage'
import { ContactPage } from '../pages/public/ContactPage'
import { HomePage } from '../pages/public/HomePage'
import { JournalPage } from '../pages/public/JournalPage'
import { LoginPage } from '../pages/public/LoginPage'
import { ProjectDetailPage } from '../pages/public/ProjectDetailPage'
import { ProjectsPage } from '../pages/public/ProjectsPage'
import { ProtectedRoute } from '../routes/ProtectedRoute'

export const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<PublicWebsiteLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:slug" element={<ProjectDetailPage />} />
        <Route path="/work" element={<ProjectsPage />} />
        <Route path="/journal" element={<JournalPage />} />
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
        <Route path="studio" element={<StudioPage />} />
        <Route path="finance" element={<FinancePage />} />
        <Route path="finance/investments" element={<InvestmentsPage />} />
        <Route path="finance/family-office" element={<FamilyOfficePage />} />
        <Route path="finance/trading-lab" element={<TradingLabPage />} />
        <Route path="ai-workflow" element={<AIWorkflowPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

