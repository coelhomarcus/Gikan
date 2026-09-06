import { Route, Routes } from "react-router";
import { AppShell } from "@/components/layout/app-shell";
import { AuthLayout } from "@/components/layout/auth-layout";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { LoginPage } from "@/pages/login-page";
import { NotFound } from "@/pages/not-found";
import { ProjectBoardPage } from "@/pages/project-board-page";
import { ProjectSettingsPage } from "@/pages/project-settings-page";
import { ProjectsPage } from "@/pages/projects-page";
import { RegisterPage } from "@/pages/register-page";

export const AppRoutes = () => (
    <Routes>
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
            <Route path="/projects/:projectId" element={<ProjectBoardPage />} />
            <Route path="/projects/:projectId/settings" element={<ProjectSettingsPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
    </Routes>
);
