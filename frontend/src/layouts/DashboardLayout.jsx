import { Outlet } from "react-router";
import Sidebar from "../components/Sidebar";

const DashboardLayout = () => {
  return (
    <div className="h-screen bg-[var(--app-bg)] flex">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto text-[var(--app-text)]">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
