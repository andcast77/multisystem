import { Navigate, Outlet, Route, Routes, BrowserRouter } from "react-router-dom";
import { QueryProvider } from "@/providers/QueryProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardSessionGate } from "@/components/auth/DashboardSessionGate";
import { ShopflowModuleGuard } from "@/components/layout/ShopflowModuleGuard";
import { CompanyContextBootstrap } from "@/components/providers/CompanyContextBootstrap";
import { StoreProvider } from "@/components/providers/StoreContext";
import { ProductList } from "@/components/features/products/ProductList";
import { CustomerList } from "@/components/features/customers/CustomerList";
import { SupplierList } from "@/components/features/suppliers/SupplierList";
import { UserList } from "@/components/features/users/UserList";
import { LowStockAlert } from "@/components/features/inventory/LowStockAlert";
import { LandingPage } from "@/views/LandingPage";
import { LoginPage } from "@/views/LoginPage";
import { RegisterPage } from "@/views/RegisterPage";
import { TermsPage } from "@/views/TermsPage";
import { PageFrame } from "@/views/PageFrame";
import {
  AccountPage,
  AdminSettingsPage,
  BackupPage,
  CategoriesPage,
  CustomerCreatePage,
  CustomerEditPage,
  DashboardPage,
  InventoryAdjustmentsPage,
  InventoryLowStockPage,
  LoyaltyPage,
  POSPage,
  ProductCreatePage,
  ProductEditPage,
  ReportsInventoryPage,
  ReportsPage,
  ReportsSalesPage,
  SupplierCreatePage,
  SupplierEditPage,
  UserCreatePage,
  UserEditPage,
} from "@/views/ShopflowPages";

function ProtectedAppLayout() {
  return (
    <DashboardSessionGate>
      <ShopflowModuleGuard>
        <CompanyContextBootstrap>
          <StoreProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <div className="min-w-0 flex-1">
                <Outlet />
              </div>
            </div>
          </StoreProvider>
        </CompanyContextBootstrap>
      </ShopflowModuleGuard>
    </DashboardSessionGate>
  );
}

function App() {
  return (
    <BrowserRouter>
      <QueryProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<ProtectedAppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/pos" element={<POSPage />} />
              <Route
                path="/products"
                element={
                  <PageFrame title="Productos">
                    <ProductList />
                  </PageFrame>
                }
              />
              <Route path="/products/new" element={<ProductCreatePage />} />
              <Route path="/products/:id" element={<ProductEditPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route
                path="/inventory"
                element={
                  <PageFrame title="Inventario">
                    <LowStockAlert />
                  </PageFrame>
                }
              />
              <Route path="/inventory/low-stock" element={<InventoryLowStockPage />} />
              <Route path="/inventory/adjustments" element={<InventoryAdjustmentsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/reports/sales" element={<ReportsSalesPage />} />
              <Route path="/reports/inventory" element={<ReportsInventoryPage />} />
              <Route
                path="/customers"
                element={
                  <PageFrame title="Clientes">
                    <CustomerList />
                  </PageFrame>
                }
              />
              <Route path="/customers/new" element={<CustomerCreatePage />} />
              <Route path="/customers/:id" element={<CustomerEditPage />} />
              <Route
                path="/suppliers"
                element={
                  <PageFrame title="Proveedores">
                    <SupplierList />
                  </PageFrame>
                }
              />
              <Route path="/suppliers/new" element={<SupplierCreatePage />} />
              <Route path="/suppliers/:id" element={<SupplierEditPage />} />
              <Route
                path="/admin/users"
                element={
                  <PageFrame title="Usuarios">
                    <UserList />
                  </PageFrame>
                }
              />
              <Route path="/admin/users/new" element={<UserCreatePage />} />
              <Route path="/admin/users/:id" element={<UserEditPage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
              <Route path="/admin/loyalty" element={<LoyaltyPage />} />
              <Route path="/admin/backup" element={<BackupPage />} />
              <Route path="/account" element={<AccountPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </QueryProvider>
    </BrowserRouter>
  );
}

export default App;
