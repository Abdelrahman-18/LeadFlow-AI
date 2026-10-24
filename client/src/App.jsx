import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ManagerLayout from './components/ManagerLayout';
import LoginScreen from './pages/LoginScreen';

// Lazy load pages for better performance
const HomePage = lazy(() => import('./pages/HomePage'));
const ConversationsPage = lazy(() => import('./pages/ConversationsPage'));
const OpportunitiesPage = lazy(() => import('./pages/OpportunitiesPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const KnowledgeBasePage = lazy(() => import('./pages/KnowledgeBasePage'));
const ApprovalsPage = lazy(() => import('./pages/ApprovalsPage'));
const IntegrationsPage = lazy(() => import('./pages/IntegrationsPage'));
const CopilotsPage = lazy(() => import('./pages/CopilotsPage'));
const DocumentsLibrary = lazy(() => import('./pages/DocumentsLibrary'));
const DashboardsPage = lazy(() => import('./pages/DashboardsPage'));
const ReportBotPage = lazy(() => import('./pages/ReportBotPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const CampusPage = lazy(() => import('./pages/CampusPage'));
const DocsPage = lazy(() => import('./pages/DocsPage'));
const DocsViewer = lazy(() => import('./pages/DocsViewer'));

// Branded loading fallback with LeadFlow branding
const LoadingFallback = () => (
    <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-page, #111214)',
        color: 'var(--text-primary, #F5F6FA)',
    }}>
        <div style={{ textAlign: 'center' }}>
            {/* Spinner ring + pulsing logo */}
            <div style={{
                position: 'relative',
                width: '80px',
                height: '80px',
                margin: '0 auto 24px',
            }}>
                {/* Spinning ring */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    border: '3px solid rgba(128,91,231,0.15)',
                    borderTopColor: '#805BE7',
                    animation: 'lf-spin 1s linear infinite',
                }} />
                {/* Logo in center */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'var(--brand-gradient, linear-gradient(135deg, #805BE7 0%, #5E3FC4 100%))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: '800',
                    color: '#fff',
                    animation: 'lf-pulse 2s ease-in-out infinite',
                }}>
                    LF
                </div>
            </div>
            {/* Brand text */}
            <div style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                background: 'linear-gradient(135deg, #9B7DF0, #805BE7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '6px',
            }}>LeadFlow AI</div>
            <div style={{
                fontSize: '0.7rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--text-secondary, #A9ADB8)',
            }}>Revenue Operations</div>
        </div>
        {/* Keyframe animations injected via style tag */}
        <style>{`
            @keyframes lf-spin {
                to { transform: rotate(360deg); }
            }
            @keyframes lf-pulse {
                0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                50% { opacity: 0.6; transform: translate(-50%, -50%) scale(0.92); }
            }
        `}</style>
    </div>
);

function App() {
    return (
        <AuthProvider>
            <Suspense fallback={<LoadingFallback />}>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<LoginScreen />} />

                    {/* Root redirect to /leadflow */}
                    <Route path="/" element={<Navigate replace to="/leadflow" />} />

                    {/* Protected Routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<ManagerLayout />}>
                            <Route path="/leadflow" element={<HomePage />} />
                            <Route path="/conversations" element={<ConversationsPage />} />
                            <Route path="/opportunities" element={<OpportunitiesPage />} />
                            <Route path="/analytics" element={<AnalyticsPage />} />
                            <Route path="/analytics/dashboards" element={<DashboardsPage />} />
                            <Route path="/knowledge" element={<KnowledgeBasePage />} />
                            <Route path="/approvals" element={<ApprovalsPage />} />
                            <Route path="/integrations" element={<IntegrationsPage />} />
                            <Route path="/copilots" element={<CopilotsPage />} />
                            <Route path="/documents" element={<DocumentsLibrary />} />
                            <Route path="/report-bot" element={<ReportBotPage />} />
                            <Route path="/reports" element={<ReportsPage />} />
                            <Route path="/settings" element={<SettingsPage />} />
                            <Route path="/campus" element={<CampusPage />} />
                            <Route path="/docs" element={<DocsPage />} />
                            <Route path="/docs/:slug" element={<DocsViewer />} />
                        </Route>
                    </Route>

                    {/* Fallback redirect */}
                    <Route path="*" element={<Navigate replace to="/leadflow" />} />
                </Routes>
            </Suspense>
        </AuthProvider>
    );
}

export default App;
