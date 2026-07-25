import { Link, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { LayoutDashboard, FolderKanban, Users, UserRound, BookOpen, LogOut, Menu, X } from 'lucide-react';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const props = usePage().props as unknown as { auth: { user: { id: number; username: string; email: string; role: string } } };
    const { auth } = props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const user = auth?.user;

    const closeSidebar = useCallback(() => setSidebarOpen(false), []);

    useEffect(() => {
        if (sidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [sidebarOpen]);

    const navLinks = (
        <>
            <Link
                href="/dashboard"
                onClick={closeSidebar}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius)] text-sm font-medium transition-all duration-200 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-on-surface)]"
            >
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                Overview
            </Link>
            <Link
                href="/dashboard/projects"
                onClick={closeSidebar}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius)] text-sm font-medium transition-all duration-200 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-on-surface)]"
            >
                <FolderKanban className="h-4 w-4 shrink-0" />
                Projects
            </Link>
            <Link
                href="/dashboard/docs"
                onClick={closeSidebar}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius)] text-sm font-medium transition-all duration-200 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-on-surface)]"
            >
                <BookOpen className="h-4 w-4 shrink-0" />
                Docs
            </Link>
            {user?.role === 'admin' && (
                <Link
                    href="/dashboard/directory"
                    onClick={closeSidebar}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius)] text-sm font-medium transition-all duration-200 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-on-surface)]"
                >
                    <UserRound className="h-4 w-4 shrink-0" />
                    Directory
                </Link>
            )}
            {user?.role === 'admin' && (
                <Link
                    href="/dashboard/users"
                    onClick={closeSidebar}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius)] text-sm font-medium transition-all duration-200 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-on-surface)]"
                >
                    <Users className="h-4 w-4 shrink-0" />
                    Users
                </Link>
            )}
        </>
    );

    return (
        <div className="h-[100dvh] flex flex-col overflow-hidden bg-[var(--color-bg-base)]">
            <div className="flex flex-1 min-h-0">
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                        onClick={closeSidebar}
                    />
                )}

                <aside
                    className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[75vw] bg-[var(--color-surface-container)] backdrop-blur-xl border-r border-[rgba(255,255,255,0.06)] flex flex-col transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 lg:z-auto lg:max-w-none ${
                        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                >
                    <div className="flex items-center justify-between p-4 lg:p-6">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-[var(--radius)] bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-secondary-container)] flex items-center justify-center">
                                <span className="text-[var(--color-on-primary)] font-bold text-sm font-[var(--font-display)]">H</span>
                            </div>
                            <span className="text-lg font-bold text-[var(--color-on-surface)] font-[var(--font-display)]">Hideo Hosting</span>
                        </Link>
                        <button onClick={closeSidebar} className="lg:hidden p-1 text-[var(--color-outline)] hover:text-[var(--color-on-surface)]">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <nav className="flex-1 overflow-y-auto px-3 lg:px-4 space-y-1">
                        {navLinks}
                    </nav>

                    <div className="p-4 border-t border-[rgba(255,255,255,0.06)]">
                        {user && (
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-secondary-container)] flex items-center justify-center text-[var(--color-on-primary)] text-sm font-semibold">
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

                <main className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
                    <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-[rgba(255,255,255,0.06)] lg:hidden">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-1.5 text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]"
                            aria-label="Open sidebar"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-secondary-container)] flex items-center justify-center">
                                <span className="text-[var(--color-on-primary)] font-bold text-xs font-[var(--font-display)]">H</span>
                            </div>
                            <span className="text-lg font-bold font-[var(--font-display)]">Hideo Hosting</span>
                        </Link>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
