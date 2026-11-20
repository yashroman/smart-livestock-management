import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { LivestockListPage } from './pages/LivestockListPage';
import { LivestockDetailPage } from './pages/LivestockDetailPage';
import { HealthPage } from './pages/HealthPage';
import { VaccinationPage } from './pages/VaccinationPage';
import { BreedingPage } from './pages/BreedingPage';
import { MilkPage } from './pages/MilkPage';
import { FeedPage } from './pages/FeedPage';
import { IncomePage } from './pages/IncomePage';
import { ExpensePage } from './pages/ExpensePage';
import { RemindersPage } from './pages/RemindersPage';
import { ReportsPage } from './pages/ReportsPage';
import { AIAssistantPage } from './pages/AIAssistantPage';

export function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Authenticated Application Shell */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="livestock" element={<LivestockListPage />} />
              <Route path="livestock/:id" element={<LivestockDetailPage />} />
              <Route path="health" element={<HealthPage />} />
              <Route path="vaccination" element={<VaccinationPage />} />
              <Route path="vaccinations" element={<VaccinationPage />} />
              <Route path="breeding" element={<BreedingPage />} />
              <Route path="milk" element={<MilkPage />} />
              <Route path="feed" element={<FeedPage />} />
              <Route path="income" element={<IncomePage />} />
              <Route path="expenses" element={<ExpensePage />} />
              <Route path="reminders" element={<RemindersPage />} />

              {/* Phase 5 Reports & Analytics Route */}
              <Route path="reports" element={<ReportsPage />} />

              {/* Phase 7 AI Farm Assistant Route */}
              <Route path="ai-assistant" element={<AIAssistantPage />} />

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
