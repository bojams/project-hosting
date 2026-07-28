import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';

interface DashboardLayoutProps {
    children: React.ReactNode;
    breadcrumbs?: { title: string; href: string }[];
}

export default function DashboardLayout({ children, breadcrumbs = [] }: DashboardLayoutProps) {
    return (
        <AppShell>
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 lg:p-8">
                    {children}
                </div>
            </AppContent>
        </AppShell>
    );
}
