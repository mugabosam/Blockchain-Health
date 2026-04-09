import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { Web3Provider, useWeb3 } from "./contexts/Web3Context";
import type { ActiveView } from "./types";
import LoginScreen from "./pages/LoginScreen";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import DashboardPage from "./pages/DashboardPage";
import RecordsPage from "./pages/RecordsPage";
import PrescriptionsPage from "./pages/PrescriptionsPage";
import AccessPage from "./pages/AccessPage";
import AdminPage from "./pages/AdminPage";
import EmergencyPage from "./pages/EmergencyPage";

function AppContent() {
  const { isConnected } = useWeb3();
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!isConnected) return <LoginScreen />;

  const renderPage = () => {
    switch (activeView) {
      case "dashboard": return <DashboardPage onNavigate={setActiveView} />;
      case "records": return <RecordsPage />;
      case "prescriptions": return <PrescriptionsPage />;
      case "access": return <AccessPage />;
      case "admin": return <AdminPage />;
      case "emergency": return <EmergencyPage />;
      default: return <DashboardPage onNavigate={setActiveView} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar active={activeView} onNavigate={setActiveView} open={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-6">{renderPage()}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Web3Provider>
      <AppContent />
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: "12px", background: "#0f172a", color: "#f1f5f9", fontSize: "13px", padding: "12px 16px" } }} />
    </Web3Provider>
  );
}
