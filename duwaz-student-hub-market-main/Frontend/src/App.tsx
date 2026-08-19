import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import ShopLoader from './components/ShopLoader';
import HomePage from './pages/HomePage';
import MarketplacePage from './pages/MarketplacePage';
import ProductDetailPage from './pages/ProductDetailPage';
import ShopPage from './pages/ShopPage';
import CreateShopPage from './pages/CreateShopPage';
import MyShopsPage from './pages/MyShopsPage';
import ShopDashboardPage from './pages/ShopDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import DriverDashboardPage from './pages/DriverDashboardPage';
import DriverLoginPage from './pages/DriverLoginPage';
import AboutPage from './pages/AboutPage';
import AccountPage from './pages/AccountPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFound from './pages/NotFound';
import OrderTrackingPage from './pages/OrderTrackingPage';
import MyOrdersPage from './pages/MyOrdersPage';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ShopLoader />
        <Routes>
          {/* Auth pages — no Layout wrapper (full-screen cards) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/driver/login" element={<DriverLoginPage />} />

          {/* Driver dashboard — no marketplace Layout */}
          <Route
            path="/driver"
            element={
              <RoleProtectedRoute requiredRole="DRIVER">
                <DriverDashboardPage />
              </RoleProtectedRoute>
            }
          />

          {/* Main app — all inside Layout */}
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="marketplace" element={<MarketplacePage />} />
            <Route path="product/:id" element={<ProductDetailPage />} />
            <Route path="shop/:id" element={<ShopPage />} />
            <Route path="about" element={<AboutPage />} />

            {/* Protected routes */}
            <Route
              path="account"
              element={
                <ProtectedRoute>
                  <AccountPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="create-shop"
              element={
                <ProtectedRoute>
                  <CreateShopPage />
                </ProtectedRoute>
              }
            />
            {/* All shops list */}
            <Route
              path="my-shops"
              element={
                <ProtectedRoute>
                  <MyShopsPage />
                </ProtectedRoute>
              }
            />
            {/* Individual shop dashboard — /my-shop/:id */}
            <Route
              path="my-shop/:shopId"
              element={
                <ProtectedRoute>
                  <ShopDashboardPage />
                </ProtectedRoute>
              }
            />
            {/* Legacy /my-shop → redirect to list */}
            <Route
              path="my-shop"
              element={
                <ProtectedRoute>
                  <MyShopsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin"
              element={
                <RoleProtectedRoute requiredRole="ADMIN">
                  <AdminDashboardPage />
                </RoleProtectedRoute>
              }
            />
            <Route path="cart" element={<CartPage />} />

            {/* Orders */}
            <Route
              path="my-orders"
              element={
                <ProtectedRoute>
                  <MyOrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="order/:orderId/track"
              element={
                <ProtectedRoute>
                  <OrderTrackingPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
