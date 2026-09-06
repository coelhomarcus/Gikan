import { Home02 } from "@untitledui/icons";
import { useLocation } from "react-router";
import type { NavItemType } from "@/components/application/app-navigation/config";
import { SidebarNavigationSimple } from "@/components/application/app-navigation/sidebar-navigation/sidebar-simple";

const navItems: NavItemType[] = [{ label: "Projetos", href: "/", icon: Home02 }];

export const Sidebar = () => {
    const location = useLocation();

    return <SidebarNavigationSimple activeUrl={location.pathname} items={navItems} showAccountCard={false} />;
};
