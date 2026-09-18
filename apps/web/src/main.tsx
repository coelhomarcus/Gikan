import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { AppErrorBoundary } from "@/components/feedback/app-error-boundary";
import { ContextMenuProvider } from "@/components/overlay/context-menu-provider";
import { AuthProvider } from "@/features/auth/hooks/use-auth";
import { queryClient } from "@/lib/query-client";
import { RouteProvider } from "@/providers/router-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { AppRoutes } from "@/routes";
import "@/styles/globals.css";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <AppErrorBoundary>
            <ThemeProvider>
                <QueryClientProvider client={queryClient}>
                    <AuthProvider>
                        <BrowserRouter>
                            <RouteProvider>
                                <ContextMenuProvider>
                                    <AppRoutes />
                                </ContextMenuProvider>
                            </RouteProvider>
                        </BrowserRouter>
                    </AuthProvider>
                </QueryClientProvider>
            </ThemeProvider>
        </AppErrorBoundary>
    </StrictMode>,
);
