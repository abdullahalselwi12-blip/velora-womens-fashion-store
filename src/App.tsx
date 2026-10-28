import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { I18nProvider } from '@/lib/i18n';
import { ThemeProvider } from '@/lib/theme';
import { AuthProvider } from '@/lib/auth';
import { CartProvider } from '@/lib/cart';
import { WishlistProvider } from '@/lib/wishlist';
import { ToastProvider } from '@/components/ui/Toast';
import { StoreLayout } from '@/layouts/StoreLayout';
import { AdminLayout } from '@/layouts/AdminLayout';

// Storefront pages
import { HomePage } from '@/pages/storefront/HomePage';
import { ProductListPage } from '@/pages/storefront/ProductListPage';
import { ProductDetailPage } from '@/pages/storefront/ProductDetailPage';
import { CartPage } from '@/pages/storefront/CartPage';
import { CheckoutPage } from '@/pages/storefront/CheckoutPage';
import { OrderConfirmationPage } from '@/pages/storefront/OrderConfirmationPage';
import { WishlistPage } from '@/pages/storefront/WishlistPage';
import { ContactPage } from '@/pages/storefront/ContactPage';
import { StaticPage } from '@/pages/storefront/StaticPage';
import { NotFoundPage } from '@/pages/storefront/NotFoundPage';

// Auth pages
import { SignInPage } from '@/pages/auth/SignInPage';
import { SignUpPage } from '@/pages/auth/SignUpPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';

// Account page
import { AccountPage } from '@/pages/account/AccountPage';

// Admin pages
import { AdminOverview } from '@/pages/admin/AdminOverview';
import { AdminProducts } from '@/pages/admin/AdminProducts';
import { AdminCategories } from '@/pages/admin/AdminCategories';
import { AdminOrders } from '@/pages/admin/AdminOrders';
import { AdminCustomers } from '@/pages/admin/AdminCustomers';
import { AdminInventory } from '@/pages/admin/AdminInventory';
import { AdminPromotions } from '@/pages/admin/AdminPromotions';
import { AdminContent } from '@/pages/admin/AdminContent';
import { AdminSettings } from '@/pages/admin/AdminSettings';

function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <ToastProvider>
                <BrowserRouter>
                  <Routes>
                    {/* Admin routes */}
                    <Route path="/admin" element={<AdminLayout><AdminOverview /></AdminLayout>} />
                    <Route path="/admin/products" element={<AdminLayout><AdminProducts /></AdminLayout>} />
                    <Route path="/admin/categories" element={<AdminLayout><AdminCategories /></AdminLayout>} />
                    <Route path="/admin/orders" element={<AdminLayout><AdminOrders /></AdminLayout>} />
                    <Route path="/admin/customers" element={<AdminLayout><AdminCustomers /></AdminLayout>} />
                    <Route path="/admin/inventory" element={<AdminLayout><AdminInventory /></AdminLayout>} />
                    <Route path="/admin/promotions" element={<AdminLayout><AdminPromotions /></AdminLayout>} />
                    <Route path="/admin/content" element={<AdminLayout><AdminContent /></AdminLayout>} />
                    <Route path="/admin/settings" element={<AdminLayout><AdminSettings /></AdminLayout>} />

                    {/* Storefront routes */}
                    <Route path="/*" element={
                      <StoreLayout>
                        <Routes>
                          <Route path="/" element={<HomePage />} />
                          <Route path="/products" element={<ProductListPage mode="all" />} />
                          <Route path="/new-arrivals" element={<ProductListPage mode="new-arrivals" />} />
                          <Route path="/best-sellers" element={<ProductListPage mode="best-sellers" />} />
                          <Route path="/sale" element={<ProductListPage mode="sale" />} />
                          <Route path="/featured" element={<ProductListPage mode="featured" />} />
                          <Route path="/search" element={<ProductListPage mode="search" />} />
                          <Route path="/category/:slug" element={<ProductListPage mode="category" />} />
                          <Route path="/product/:slug" element={<ProductDetailPage />} />
                          <Route path="/cart" element={<CartPage />} />
                          <Route path="/checkout" element={<CheckoutPage />} />
                          <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
                          <Route path="/wishlist" element={<WishlistPage />} />
                          <Route path="/contact" element={<ContactPage />} />
                          <Route path="/about" element={<StaticPage slug="about" />} />
                          <Route path="/faq" element={<StaticPage slug="faq" />} />
                          <Route path="/privacy-policy" element={<StaticPage slug="privacy-policy" />} />
                          <Route path="/terms-of-service" element={<StaticPage slug="terms-of-service" />} />
                          <Route path="/shipping-returns" element={<StaticPage slug="shipping-returns" />} />
                          <Route path="/signin" element={<SignInPage />} />
                          <Route path="/signup" element={<SignUpPage />} />
                          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                          <Route path="/account" element={<AccountPage />} />
                          <Route path="/account/orders" element={<AccountPage />} />
                          <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                      </StoreLayout>
                    } />
                  </Routes>
                </BrowserRouter>
              </ToastProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

export default App;
