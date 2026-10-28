import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, Menu, X, Moon, Sun, Globe } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { supabase } from '@/lib/supabase';
import type { Category } from '@/types';

export function Header() {
  const { t, tl, lang, setLang } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { user, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order')
      .then(({ data }) => {
        if (data) setCategories(data as Category[]);
      });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchOpen]);

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-stone-900 text-white text-xs py-2.5 text-center tracking-wide">
        {tl('شحن مجاني للطلبات فوق 200$', 'Free shipping on orders over $200')}
      </div>

      {/* Main header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-stone-950/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800">
        <div className="container-velora">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-stone-600 dark:text-stone-400"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-1">
              <span className="text-2xl md:text-3xl font-bold tracking-[0.2em] text-stone-900 dark:text-stone-100">
                VELORA
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/products" className="text-sm font-medium text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                {t('nav.shop')}
              </Link>
              <Link to="/new-arrivals" className="text-sm font-medium text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                {t('nav.newArrivals')}
              </Link>
              <Link to="/best-sellers" className="text-sm font-medium text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                {t('nav.bestSellers')}
              </Link>
              <Link to="/sale" className="text-sm font-medium text-rose-600 hover:text-rose-700 transition-colors">
                {t('nav.sale')}
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* Language switcher */}
              <button
                onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
                className="p-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                aria-label={t('msg.language')}
              >
                <Globe className="w-5 h-5" />
              </button>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                aria-label={t('msg.theme')}
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>

              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                aria-label={t('action.search')}
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="p-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors hidden sm:block"
                aria-label={t('nav.wishlist')}
              >
                <Heart className="w-5 h-5" />
              </Link>

              {/* Account */}
              <Link
                to={user ? '/account' : '/signin'}
                className="p-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                aria-label={t('nav.account')}
              >
                <User className="w-5 h-5" />
              </Link>

              {/* Admin link */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="hidden md:inline-flex px-3 py-1.5 text-xs font-medium border border-stone-300 dark:border-stone-700 rounded-md text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  {t('msg.adminDashboard')}
                </Link>
              )}

              {/* Cart */}
              <Link
                to="/cart"
                className="relative p-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                aria-label={t('nav.cart')}
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-stone-900 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center dark:bg-stone-100 dark:text-stone-900">
                    {itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 animate-fade-in" onClick={() => setSearchOpen(false)}>
          <div className="bg-white dark:bg-stone-900 p-4" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSearch} className="container-velora flex items-center gap-3">
              <Search className="w-5 h-5 text-stone-400" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('msg.searchPlaceholder')}
                className="flex-1 bg-transparent text-lg text-stone-900 dark:text-stone-100 placeholder-stone-400 outline-none"
              />
              <button type="button" onClick={() => setSearchOpen(false)}>
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute top-0 bottom-0 left-0 rtl:left-auto rtl:right-0 w-72 bg-white dark:bg-stone-900 shadow-xl animate-slide-in overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-800">
              <span className="text-lg font-bold tracking-widest">VELORA</span>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-4 flex flex-col gap-1">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="py-2.5 px-3 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 text-sm font-medium">
                {t('nav.home')}
              </Link>
              <Link to="/products" onClick={() => setMobileMenuOpen(false)} className="py-2.5 px-3 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 text-sm font-medium">
                {t('nav.allProducts')}
              </Link>
              <Link to="/new-arrivals" onClick={() => setMobileMenuOpen(false)} className="py-2.5 px-3 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 text-sm font-medium">
                {t('nav.newArrivals')}
              </Link>
              <Link to="/best-sellers" onClick={() => setMobileMenuOpen(false)} className="py-2.5 px-3 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 text-sm font-medium">
                {t('nav.bestSellers')}
              </Link>
              <Link to="/sale" onClick={() => setMobileMenuOpen(false)} className="py-2.5 px-3 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/20 text-sm font-medium text-rose-600">
                {t('nav.sale')}
              </Link>

              <div className="border-t border-stone-200 dark:border-stone-800 my-3" />
              <p className="px-3 py-1 text-xs font-semibold text-stone-400 uppercase tracking-wider">{t('nav.categories')}</p>
              {categories.map(cat => (
                <Link
                  key={cat.id}
                  to={`/category/${cat.slug}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 text-sm"
                >
                  {lang === 'ar' ? cat.name_ar : cat.name_en}
                </Link>
              ))}

              <div className="border-t border-stone-200 dark:border-stone-800 my-3" />
              <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)} className="py-2.5 px-3 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 text-sm font-medium">
                {t('nav.wishlist')}
              </Link>
              {user ? (
                <Link to="/account" onClick={() => setMobileMenuOpen(false)} className="py-2.5 px-3 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 text-sm font-medium">
                  {t('nav.account')}
                </Link>
              ) : (
                <Link to="/signin" onClick={() => setMobileMenuOpen(false)} className="py-2.5 px-3 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 text-sm font-medium">
                  {t('action.signIn')}
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="py-2.5 px-3 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 text-sm font-medium">
                  {t('msg.adminDashboard')}
                </Link>
              )}
              <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="py-2.5 px-3 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 text-sm">
                {t('nav.about')}
              </Link>
              <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="py-2.5 px-3 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 text-sm">
                {t('nav.contact')}
              </Link>
              <Link to="/faq" onClick={() => setMobileMenuOpen(false)} className="py-2.5 px-3 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 text-sm">
                {t('nav.faq')}
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
