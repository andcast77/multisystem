import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryProvider } from "@/providers/QueryProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// TODO: Import page components after migration
// import { ProductsPage } from "@/pages/ProductsPage";
// ... etc

function App() {
  return (
    <BrowserRouter>
      <QueryProvider>
        <Routes>
          {/* Public routes */}
          
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            {/* TODO: Add protected routes */}
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </QueryProvider>
    </BrowserRouter>
  );
}

export default App;
