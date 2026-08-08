import { Link, usePage } from '@inertiajs/react';
import { LayoutDashboard, FolderKanban, Users } from 'lucide-react';
import BrandLogo from '@/components/brand-logo';
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
import type { NavItem } from '@/types';

export function AppSidebar() {
    const { props: pageProps } = usePage();
    const authProps = pageProps as unknown as { auth?: { user?: { role?: string } } };
    const userRole = authProps?.auth?.user?.role;

    const mainNavItems: NavItem[] = [
        {
            title: 'Home',
            href: '/dashboard',
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
                            <Link href="/" prefetch>
                                <BrandLogo className="h-14 w-auto shrink-0" />
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
