// src/App.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/Protectedroute";
import DashboardLayout from "@/components/DashboardLayout";
import Login from './lib/pages/Login';
import Register from './lib/pages/Register';
import Dashboard from './lib/pages/Dashboard';
import Products from "./lib/pages/Products";
import Inspections from "./lib/pages/Inspections";
import LabResults from "./lib/pages/LabResults";
import Certifications from "./lib/pages/Certifications";
import Compliance from "./lib/pages/Compliance";
import Alerts from "./lib/pages/Alerts";
import Users from "./lib/pages/Users";
import SettingsPage from "./lib/pages/Settings";
import NotFound from "./lib/pages/NotFound";
import CertificateLayout from "./certificate officer/certificatelayout";
import ProductDecision from "./certificate officer/productdecision";
import RecordProduct from "./certificate officer/recordproduct";
import InspectorLayout from "./insepector/insepectorlayout";
import InspectorDashboard from "./insepector/dashboard";
import VerifyProduct from "./insepector/verify";
import MarketInspections from "./insepector/insepection";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* ── ADMIN only ───────────────────────────────────────────── */}
            <Route
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard"      element={<Dashboard />} />
              <Route path="/products"       element={<Products />} />
              <Route path="/inspections"    element={<Inspections />} />
              <Route path="/lab-results"    element={<LabResults />} />
              <Route path="/certifications" element={<Certifications />} />
              <Route path="/compliance"     element={<Compliance />} />
              <Route path="/alerts"         element={<Alerts />} />
              <Route path="/users"          element={<Users />} />
              <Route path="/settings"       element={<SettingsPage />} />
            </Route>

            {/* ── CERTIFICATION OFFICER only ───────────────────────────── */}
            <Route
              path="/certificate-officer"
              element={
                <ProtectedRoute allowedRoles={["CERTIFICATION_OFFICER"]}>
                  <CertificateLayout />
                </ProtectedRoute>
              }
            >
              <Route path="product-decision" element={<ProductDecision />} />
              <Route path="record-product"   element={<RecordProduct />} />
            </Route>

            {/* ── INSPECTOR only ───────────────────────────────────────── */}
            <Route
              path="/inspector"
              element={
                <ProtectedRoute allowedRoles={["INSPECTOR"]}>
                  <InspectorLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/inspector/dashboard" replace />} />
              <Route path="dashboard"         element={<InspectorDashboard />} />
              <Route path="verify-product"    element={<VerifyProduct />} />
              <Route path="market-inspections" element={<MarketInspections />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;