import { Link, usePage } from '@inertiajs/react';
import { LayoutDashboard, FolderKanban, Users } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const { props: pageProps } = usePage();
    const authProps = pageProps as unknown as { auth?: { user?: { role?: string } } };
    const userRole = authProps?.auth?.user?.role;

    const mainNavItems: NavItem[] = [
        {
            title: 'Overview',
            href: dashboard(),
            icon: LayoutDashboard,
        },
        {
            title: 'Projects',
            href: '/dashboard/projects',
            icon: FolderKanban,
        },
        ...(userRole === 'admin'
            ? [{
                title: 'Users',
                href: '/dashboard/users',
                icon: Users,
              } as NavItem]
            : []),
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" className="group-data-[collapsible=icon]:!p-2" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
