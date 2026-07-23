import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { LayoutDashboard, FolderKanban, Users, UserRound, BookOpen, LogOut, Menu, X } from 'lucide-react';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const props = usePage().props as unknown as { auth: { user: { id: number; username: string; email: string; role: string } } };
    const { auth } = props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const user = auth?.user;

    const sidebarContent = (
        <>
            <div className="flex items-center justify-between p-4 lg:p-6">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-[var(--radius)] bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-secondary-container)] flex items-center justify-center">
                        <span className="text-[var(--color-on-primary)] font-bold text-sm font-[var(--font-display)]">H</span>
                    </div>
                    <span className="text-lg font-bold text-[var(--color-on-surface)] font-[var(--font-display)]">Hideo Hosting</span>
                </Link>
                <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-[var(--color-outline)] hover:text-[var(--color-on-surface)]">
                    <X className="h-5 w-5" />
                </button>
            </div>

            <nav className="flex-1 px-3 lg:px-4 space-y-1">
                <Link
                    href="/dashboard"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius)] text-sm font-medium transition-all duration-200 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-on-surface)]`}
                >
                    <LayoutDashboard className="h-4 w-4" />
                    Overview
                </Link>
                <Link
                    href="/dashboard/projects"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius)] text-sm font-medium transition-all duration-200 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-on-surface)]`}
                >
                    <FolderKanban className="h-4 w-4" />
                    Projects
                </Link>
                <Link
                    href="/dashboard/docs"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius)] text-sm font-medium transition-all duration-200 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-on-surface)]`}
                >
                    <BookOpen className="h-4 w-4" />
                    Docs
                </Link>
                {user?.role === 'admin' && (
                    <Link
                        href="/dashboard/directory"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius)] text-sm font-medium transition-all duration-200 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-on-surface)]`}
                    >
                        <UserRound className="h-4 w-4" />
                        Directory
                    </Link>
                )}
                {user?.role === 'admin' && (
                    <Link
                        href="/dashboard/users"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius)] text-sm font-medium transition-all duration-200 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-on-surface)]`}
                    >
                        <Users className="h-4 w-4" />
                        Users
                    </Link>
                )}
            </nav>

            <div className="p-4 border-t border-[rgba(255,255,255,0.06)]">
                {user && (
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-secondary-container)] flex items-center justify-center text-[var(--color-on-primary)] text-sm font-semibold">
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
                    <LogOut className="h-4 w-4" />
                    Sign out
                </Link>
            </div>
        </>
    );

    return (
        <div className="min-h-screen flex bg-[var(--color-bg-base)]">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-[var(--color-surface-container)] backdrop-blur-xl border-r border-[rgba(255,255,255,0.06)] flex flex-col transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 lg:z-auto ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {sidebarContent}
            </aside>

            <main className="flex-1 min-w-0 overflow-auto">
                <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 backdrop-blur-xl border-b border-[rgba(255,255,255,0.06)] lg:hidden" style={{ background: 'rgb(12 22 12 / 0.8)' }}>
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
                <div className="p-4 sm:p-6 lg:p-8">{children}</div>
            </main>
        </div>
    );
}
