import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { queryClient } from "@/lib/query-client";
import { RouteProvider } from "@/providers/router-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { AppRoutes } from "@/routes";
import "@/styles/globals.css";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ThemeProvider>
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <RouteProvider>
                        <AppRoutes />
                    </RouteProvider>
                </BrowserRouter>
            </QueryClientProvider>
        </ThemeProvider>
    </StrictMode>,
);
