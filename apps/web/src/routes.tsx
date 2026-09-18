import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router";
import { AppShell } from "@/components/layout/app-shell";
import { AuthLayout } from "@/components/layout/auth-layout";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { IssueView } from "@/features/issues/components/issue-view";
import { LoginPage } from "@/pages/login-page";
import { NotFound } from "@/pages/not-found";
import { ProjectBoardPage } from "@/pages/project-board-page";
import { ProjectDocumentsPage } from "@/pages/project-documents-page";
import { ProjectIssuesPage } from "@/pages/project-issues-page";
import { ProjectOverviewPage } from "@/pages/project-overview-page";
import { ProjectsPage } from "@/pages/projects-page";
import { RegisterPage } from "@/pages/register-page";

export const AppRoutes = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const backgroundLocation = (location.state as { backgroundLocation?: typeof location } | null)?.backgroundLocation;

    return (
        <>
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
                    <Route path="/projects/:projectId" element={<ProjectOverviewPage />} />
                    <Route path="/projects/:projectId/issues" element={<ProjectIssuesPage />} />
                    <Route path="/projects/:projectId/issues/:issueIdentifier" element={<IssueView mode="page" />} />
                    <Route path="/projects/:projectId/board" element={<ProjectBoardPage />} />
                    <Route path="/projects/:projectId/documents" element={<ProjectDocumentsPage />} />
                    <Route path="/projects/:projectId/page" element={<Navigate replace to="../documents" />} />
                </Route>

                <Route path="*" element={<NotFound />} />
            </Routes>

            {backgroundLocation && (
                <Routes>
                    <Route path="/projects/:projectId/issues/:issueIdentifier" element={<IssueView mode="peek" onClose={() => navigate(-1)} />} />
                </Routes>
            )}
        </>
    );
};
