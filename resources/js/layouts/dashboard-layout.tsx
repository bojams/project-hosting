import { Link, usePage } from '@inertiajs/react';
import { LayoutDashboard, FolderKanban, Users, UserRound, LogOut, Menu, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const { url, props: pageProps } = usePage();
    const authProps = pageProps as unknown as { auth: { user: { id: number; username: string; email: string; role: string } } };
    const { auth } = authProps;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const user = auth?.user;

    const closeSidebar = useCallback(() => setSidebarOpen(false), []);

    useEffect(() => {
        if (sidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
 document.body.style.overflow = ''; 
};
    }, [sidebarOpen]);

    const active = useCallback((path: string) => {
        if (path === '/dashboard') {
            return url === '/dashboard' || url === '/dashboard/';
        }

        return url.startsWith(path);
    }, [url]);

    const linkClass = useCallback((path: string) => {
        const isActive = active(path);

        return `flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius)] text-sm font-medium transition-all duration-200 ${
            isActive
                ? 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)]'
                : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-on-surface)]'
        }`;
    }, [active]);

    const iconClass = useCallback((path: string) => {
        return `h-[18px] w-[18px] shrink-0 ${active(path) ? 'text-[var(--color-primary)]' : ''}`;
    }, [active]);

    const navLinks = useMemo(() => (
        <>
            <Link href="/dashboard" onClick={closeSidebar} className={linkClass('/dashboard')}>
                <LayoutDashboard className={iconClass('/dashboard')} />
                Overview
            </Link>
            <Link href="/dashboard/projects" onClick={closeSidebar} className={linkClass('/dashboard/projects')}>
                <FolderKanban className={iconClass('/dashboard/projects')} />
                Projects
            </Link>
            {user?.role === 'admin' && (
                <Link href="/dashboard/directory" onClick={closeSidebar} className={linkClass('/dashboard/directory')}>
                    <UserRound className={iconClass('/dashboard/directory')} />
                    Directory
                </Link>
            )}
            {user?.role === 'admin' && (
                <Link href="/dashboard/users" onClick={closeSidebar} className={linkClass('/dashboard/users')}>
                    <Users className={iconClass('/dashboard/users')} />
                    Users
                </Link>
            )}
        </>
    ), [closeSidebar, linkClass, iconClass, user?.role]);

    return (
        <div className="h-[100dvh] flex overflow-hidden bg-[var(--color-bg-base)]">
            {/* Desktop sidebar — always visible, in document flow */}
            <aside className="hidden lg:flex lg:w-40 lg:shrink-0 bg-[var(--color-surface-container)] border-r border-[rgba(255,255,255,0.06)] flex-col">
                <div className="flex items-center justify-center gap-2 py-4 px-3">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-[var(--radius)] bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-secondary-container)] flex items-center justify-center">
                            <span className="text-[var(--color-on-primary)] font-bold text-xs font-[var(--font-display)]">H</span>
                        </div>
                        <span className="text-sm font-bold text-[var(--color-on-surface)] font-[var(--font-display)]">Hideo</span>
                    </Link>
                </div>

                <nav className="flex-1 overflow-y-auto px-2.5 space-y-0.5">
                    {navLinks}
                </nav>

                <div className="p-4 border-t border-[rgba(255,255,255,0.06)]">
                    {user && (
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-secondary-container)] flex items-center justify-center text-[var(--color-on-primary)] text-xs font-semibold">
                                {user.username[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[var(--color-on-surface)] truncate">{user.username}</p>
                                <p className="text-xs text-[var(--color-outline)] truncate">{user.email}</p>
                            </div>
                        </div>
                    )}
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)] rounded-[var(--radius)] transition-all"
                    >
                        <LogOut className="h-4 w-4 shrink-0" />
                        Sign out
                    </Link>
                </div>
            </aside>

            {/* Mobile sidebar — overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                    onClick={closeSidebar}
                />
            )}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[75vw] bg-[var(--color-surface-container)] backdrop-blur-xl border-r border-[rgba(255,255,255,0.06)] flex flex-col transition-transform duration-200 ease-in-out lg:hidden ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex items-center justify-between py-4 px-5">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-[var(--radius)] bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-secondary-container)] flex items-center justify-center">
                            <span className="text-[var(--color-on-primary)] font-bold text-xs font-[var(--font-display)]">H</span>
                        </div>
                        <span className="text-lg font-bold text-[var(--color-on-surface)] font-[var(--font-display)]">Hideo Hosting</span>
                    </Link>
                    <button onClick={closeSidebar} className="p-1 text-[var(--color-outline)] hover:text-[var(--color-on-surface)]">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto px-3 space-y-1">
                    {navLinks}
                </nav>

                <div className="p-4 border-t border-[rgba(255,255,255,0.06)]">
                    {user && (
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-secondary-container)] flex items-center justify-center text-[var(--color-on-primary)] text-xs font-semibold">
                                {user.username[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[var(--color-on-surface)] truncate">{user.username}</p>
                                <p className="text-xs text-[var(--color-outline)] truncate">{user.email}</p>
                            </div>
                        </div>
                    )}
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)] rounded-[var(--radius)] transition-all"
                    >
                        <LogOut className="h-4 w-4 shrink-0" />
                        Sign out
                    </Link>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
                <div className="shrink-0 flex items-center gap-3 px-4 py-2.5 border-b border-[rgba(255,255,255,0.06)] lg:hidden">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-1.5 text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]"
                        aria-label="Open sidebar"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-secondary-container)] flex items-center justify-center">
                            <span className="text-[var(--color-on-primary)] font-bold text-xs font-[var(--font-display)]">H</span>
                        </div>
                        <span className="text-base font-bold font-[var(--font-display)]">Hideo Hosting</span>
                    </Link>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
