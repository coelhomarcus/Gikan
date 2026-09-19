import type { ReactNode } from "react";
import { useEffect } from "react";

interface ThemeProviderProps {
    children: ReactNode;
}

/** Gikan intentionally ships with a dark-only interface. */
export const ThemeProvider = ({ children }: ThemeProviderProps) => {
    useEffect(() => {
        const root = document.documentElement;
        root.classList.add("dark-mode");
        root.dataset.theme = "dark";
        root.style.colorScheme = "dark";
        localStorage.removeItem("ui-theme");
    }, []);

    return children;
};
