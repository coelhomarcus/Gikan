import { Suspense, lazy } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router";
import { LoadingState } from "@/components/feedback/loading-state";
import { AppShell } from "@/components/layout/app-shell";
import { AuthLayout } from "@/components/layout/auth-layout";
import { RequireAuth } from "@/features/auth/components/require-auth";

const ProjectSettingsPage = lazy(() => import("@/pages/project-settings-page").then((module) => ({ default: module.ProjectSettingsPage })));
const ProfileSettingsPage = lazy(() => import("@/pages/profile-settings-page").then((module) => ({ default: module.ProfileSettingsPage })));
const ProjectCyclesPage = lazy(() => import("@/pages/project-cycles-page").then((module) => ({ default: module.ProjectCyclesPage })));
const DesignSystemPage = lazy(() => import("@/pages/design-system-page").then((module) => ({ default: module.default })));

const IssueView = lazy(() => import("@/features/issues/components/issue-view").then((module) => ({ default: module.IssueView })));
const LoginPage = lazy(() => import("@/pages/login-page").then((module) => ({ default: module.LoginPage })));
const NotFound = lazy(() => import("@/pages/not-found").then((module) => ({ default: module.NotFound })));
const ProjectBoardPage = lazy(() => import("@/pages/project-board-page").then((module) => ({ default: module.ProjectBoardPage })));
const ProjectDocumentsPage = lazy(() => import("@/pages/project-documents-page").then((module) => ({ default: module.ProjectDocumentsPage })));
const ProjectIssuesPage = lazy(() => import("@/pages/project-issues-page").then((module) => ({ default: module.ProjectIssuesPage })));
const ProjectOverviewPage = lazy(() => import("@/pages/project-overview-page").then((module) => ({ default: module.ProjectOverviewPage })));
const ProjectsPage = lazy(() => import("@/pages/projects-page").then((module) => ({ default: module.ProjectsPage })));
const RegisterPage = lazy(() => import("@/pages/register-page").then((module) => ({ default: module.RegisterPage })));

function ProjectSettingsRedirect() {
    const { projectId } = useParams();
    return <Navigate replace to={`/projects/${projectId}/settings/general`} />;
}

export const AppRoutes = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const backgroundLocation = (location.state as { backgroundLocation?: typeof location } | null)?.backgroundLocation;

    return (
        <Suspense fallback={<LoadingState label="Loading Gikan..." className="h-full p-6" />}>
            <Routes location={backgroundLocation || location}>
                <Route element={<AuthLayout />}>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                </Route>

                <Route
                    element={
                        <RequireAuth>
                            <AppShell />
                        </RequireAuth>
                    }
                >
                    <Route path="/" element={<ProjectsPage />} />
                    <Route path="/settings/profile" element={<ProfileSettingsPage />} />
                    <Route path="/projects/:projectId/settings" element={<ProjectSettingsRedirect />} />
                    <Route path="/projects/:projectId/settings/:section" element={<ProjectSettingsPage />} />
                    <Route path="/projects/:projectId/cycles" element={<ProjectCyclesPage />} />
                    <Route path="/projects/:projectId" element={<ProjectOverviewPage />} />
                    <Route path="/projects/:projectId/issues" element={<ProjectIssuesPage />} />
                    <Route path="/projects/:projectId/issues/:issueIdentifier" element={<IssueView mode="page" />} />
                    <Route path="/projects/:projectId/board" element={<ProjectBoardPage />} />
                    <Route path="/projects/:projectId/documents" element={<ProjectDocumentsPage />} />
                    <Route path="/projects/:projectId/page" element={<Navigate replace to="../documents" />} />
                </Route>

                {import.meta.env.DEV && <Route path="/__design-system" element={<DesignSystemPage />} />}
                <Route path="*" element={<NotFound />} />
            </Routes>

            {backgroundLocation && (
                <Routes>
                    <Route path="/projects/:projectId/issues/:issueIdentifier" element={<IssueView mode="peek" onClose={() => navigate(-1)} />} />
                </Routes>
            )}
        </Suspense>
    );
};
