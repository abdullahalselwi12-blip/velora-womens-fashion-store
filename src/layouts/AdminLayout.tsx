import { type ReactNode, useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, FolderTree, ShoppingCart, Users,
  Boxes, Tag, FileText, Settings, LogOut, Menu, X, Store
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Spinner } from '@/components/ui/Spinner';

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading, signOut } = useAuth();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  if (!user) return <Navigate to="/signin" replace />;
  if (!isAdmin) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold mb-2">{t('msg.accessDenied')}</h1>
      <p className="text-sm text-stone-500 mb-6">{t('msg.adminOnly')}</p>
      <p className="text-sm text-stone-500 mb-6">{t('msg.promoteAdmin')}</p>
      <Link to="/" className="text-rose-600 underline">{t('msg.backHome')}</Link>
    </div>
  );

  const navItems = [
    { path: '/admin', label: t('msg.overview'), icon: LayoutDashboard },
    { path: '/admin/products', label: t('msg.products'), icon: Package },
    { path: '/admin/categories', label: t('msg.categories'), icon: FolderTree },
    { path: '/admin/orders', label: t('msg.orders'), icon: ShoppingCart },
    { path: '/admin/customers', label: t('msg.customers'), icon: Users },
    { path: '/admin/inventory', label: t('msg.inventory'), icon: Boxes },
    { path: '/admin/promotions', label: t('msg.promotions'), icon: Tag },
    { path: '/admin/content', label: t('msg.content'), icon: FileText },
    { path: '/admin/settings', label: t('msg.settings'), icon: Settings },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}
      <aside className={`fixed md:sticky top-0 left-0 rtl:left-auto rtl:right-0 h-screen w-64 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 z-40 transition-transform duration-300 flex flex-col ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full md:translate-x-0 rtl:md:translate-x-0'
      }`}>
        <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <span className="text-lg font-bold tracking-widest">VELORA</span>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden"><X className="w-5 h-5" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }: { isActive: boolean }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-stone-200 dark:border-stone-800 space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
            <Store className="w-4 h-4" />
            {t('msg.viewStore')}
          </Link>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <LogOut className="w-4 h-4" />
            {t('action.signOut')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2">
            <Menu className="w-5 h-5" />
          </button>
          <p className="text-sm text-stone-500">{lang === 'ar' ? 'لوحة تحكم فيلورا' : 'VELORA Admin'}</p>
          <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-xs font-medium">
            {(user.email || '?').charAt(0).toUpperCase()}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-x-auto">{children}</main>
      </div>
    </div>
  );
}
