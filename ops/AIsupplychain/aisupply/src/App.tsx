import { useNavigate } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { KeyboardShortcutsHelp } from "./components/KeyboardShortcutsHelp";
import { useToast } from "./context/ToastContext";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Dashboard } from "./pages/Dashboard";
import { AbsorptionRequests } from "./pages/AbsorptionRequests";
import { Analytics } from "./pages/Analytics";
import { EWayBill } from "./pages/EWayBill";
import { Drivers } from "./pages/Drivers";
import { CarbonTracking } from "./pages/CarbonTracking";
import { AdminProfile } from "./pages/AdminProfile";
import { Packages } from "./pages/Packages";
import { Login } from "./pages/Login";
import { AssignTasks } from "./pages/AssignTasks";
import { AllocateRoutes } from "./pages/AllocateRoutes";
import { FairDispatch } from "./pages/FairDispatch";
import { ApiKeys } from "./pages/ApiKeys";
import { LoadConsolidation } from "./pages/LoadConsolidation";
import { useLocation } from "react-router-dom";

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-eco-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eco-brand-orange"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Main App Layout Component
function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (
        (e.target as HTMLElement).tagName === "INPUT" ||
        (e.target as HTMLElement).tagName === "TEXTAREA"
      ) {
        return;
      }

      // Help Shortcut (?)
      if (e.key === "?" && e.shiftKey) {
        e.preventDefault();
        setIsShortcutsOpen(true);
        return;
      }

      // Check for Ctrl/Cmd key modifications
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "1":
            e.preventDefault();
            navigate("/");
            break;
          case "2":
            e.preventDefault();
            navigate("/absorption-requests");
            break;
          case "3":
            e.preventDefault();
            navigate("/packages");
            break;
          case "4":
            e.preventDefault();
            navigate("/analytics");
            break;
          case "5":
            e.preventDefault();
            navigate("/eway-bill");
            break;
          case "6":
            e.preventDefault();
            navigate("/drivers");
            break;
          case "k":
          case "K":
            e.preventDefault();
            document.getElementById("global-search-input")?.focus();
            break;
          case "q":
          case "Q":
            e.preventDefault();
            showToast("Quick Actions", "Opening quick actions menu...", "info");
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, showToast]);

  return (
    <div className="min-h-screen bg-eco-dark text-white font-sans selection:bg-eco-brand-orange/30">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-eco-emerald-900/10 via-eco-dark to-eco-dark pointer-events-none"></div>

      <Sidebar />
      <TopBar />

      <main className={`ml-[240px] relative z-10 transition-all duration-300 ${location.pathname.startsWith('/allocate-routes') ? '' : 'p-8'}`}>
        <div className={`${location.pathname.startsWith('/allocate-routes') ? '' : 'max-w-[1600px] mx-auto'}`}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/fair-dispatch" element={<FairDispatch />} />
            <Route
              path="/absorption-requests"
              element={<AbsorptionRequests />}
            />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/eway-bill" element={<EWayBill />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/packages" element={<Packages />} />
            <Route path="/carbon-tracking" element={<CarbonTracking />} />
            <Route path="/admin" element={<AdminProfile />} />
            <Route path="/assign-tasks" element={<AssignTasks />} />
            <Route path="/allocate-routes" element={<AllocateRoutes />} />
            <Route path="/load-consolidation" element={<LoadConsolidation />} />
            <Route path="/api-keys" element={<ApiKeys />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </div>
      </main>

      <KeyboardShortcutsHelp
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}

function AppContent() {
  const { loading } = useAuth();

  // Initialize dev token if available (dev only)
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const initializeToken = async () => {
      try {
        const response = await fetch("/dev_token.json");
        const data = await response.json();
        if (data.token && !localStorage.getItem("authToken")) {
          localStorage.setItem("authToken", data.token);
        }
      } catch {
        // dev_token.json not found — expected in most setups
      }
    };

    initializeToken();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-eco-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eco-brand-orange"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
