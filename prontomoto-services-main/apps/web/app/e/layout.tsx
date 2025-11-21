"use client";
import "../globals.css";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/* Show today's date & time */
function Today() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(now);
      setTime(formatted);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);
  return <span>{time}</span>;
}

/* 3D Icon Components */
const DashboardIcon = ({ active }: { active?: boolean }) => (
  <svg className={`w-6 h-6 transition-all duration-300 ${active ? 'text-gray-700' : 'text-slate-500 group-hover:text-gray-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
);

const ProfileIcon = ({ active }: { active?: boolean }) => (
  <svg className={`w-6 h-6 transition-all duration-300 ${active ? 'text-gray-700' : 'text-slate-500 group-hover:text-gray-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const EmployeesIcon = ({ active }: { active?: boolean }) => (
  <svg className={`w-6 h-6 transition-all duration-300 ${active ? 'text-gray-700' : 'text-slate-500 group-hover:text-gray-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0Zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

const LeaveIcon = ({ active }: { active?: boolean }) => (
  <svg className={`w-6 h-6 transition-all duration-300 ${active ? 'text-gray-700' : 'text-slate-500 group-hover:text-gray-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
  </svg>
);

const PayslipsIcon = ({ active }: { active?: boolean }) => (
  <svg className={`w-6 h-6 transition-all duration-300 ${active ? 'text-gray-700' : 'text-slate-500 group-hover:text-gray-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
  </svg>
);

const AttendanceIcon = ({ active }: { active?: boolean }) => (
  <svg className={`w-6 h-6 transition-all duration-300 ${active ? 'text-gray-700' : 'text-slate-500 group-hover:text-gray-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l3 3L15 9m4.5 5.25h.008M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ResignationIcon = ({ active }: { active?: boolean }) => (
  <svg className={`w-6 h-6 transition-all duration-300 ${active ? 'text-gray-700' : 'text-slate-500 group-hover:text-gray-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TemplatesIcon = ({ active }: { active?: boolean }) => (
  <svg className={`w-6 h-6 transition-all duration-300 ${active ? 'text-gray-700' : 'text-slate-500 group-hover:text-gray-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-6 h-6 text-slate-500 group-hover:text-red-500 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 006 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h7.5" />
  </svg>
);

// Enhanced Sidebar Link Component
const SidebarLink = ({ href, icon, children }: { 
  href: string; 
  icon: React.ReactNode; 
  children: React.ReactNode 
}) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  
  return (
    <Link 
      href={href} 
      className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
        isActive 
          ? 'bg-gray-100 text-gray-800 font-medium shadow-sm' 
          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {icon}
      <span>{children}</span>
      {isActive && (
        <div className="ml-auto w-2 h-2 rounded-full bg-gray-700"></div>
      )}
    </Link>
  );
};

/* Employee Layout */
export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);
   
  function handleLogout() {
    localStorage.removeItem("employee_id"); // remove stored ID
    window.location.href = "/login"; // redirect to login page
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900">
      {/* Header with enhanced design */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Image src="/logo.png" alt="Logo" width={32} height={32} className="rounded-lg" />
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-white"></div>
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-800">Pronto MotoServices</h1>
            <p className="text-xs text-slate-500">Employee Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-sm text-slate-600 flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <Today />
          </div>
          <div className="relative" ref={menuRef}>
            <button 
              className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300" 
              onClick={() => setMenuOpen(v => !v)}
            >
              <Image src="/avatar.png" alt="Profile" width={32} height={32} className="rounded-full border-2 border-white shadow-sm" />
              <span className="font-medium text-slate-800">Employee</span>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-slate-500 transition-transform duration-300 ${menuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50">
                <button
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-red-600 transition-colors duration-200"
                  onClick={handleLogout}
                >
                  <LogoutIcon />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar + Main Content with enhanced design */}
      <div className="flex">
        {/* Sidebar with glassmorphism effect */}
        <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-white/60 backdrop-blur-sm p-5 shadow-sm">
          <div className="mb-8">
            <h2 className="text-xs uppercase text-slate-500 font-semibold tracking-wider mb-3 px-2">Main Menu</h2>
            <nav className="space-y-1.5">
              <SidebarLink href="/e/dashboard" icon={<DashboardIcon />}>
                Dashboard
              </SidebarLink>
              <SidebarLink href="/e/profile" icon={<ProfileIcon />}>
                Profile
              </SidebarLink>
              <SidebarLink href="/e/employees" icon={<EmployeesIcon />}>
                Employees
              </SidebarLink>
              <SidebarLink href="/e/leaves" icon={<LeaveIcon />}>
                Leave Management
              </SidebarLink>
              <SidebarLink href="/e/payslips" icon={<PayslipsIcon />}>
                Payslips
              </SidebarLink>
              <SidebarLink href="/e/attendance" icon={<AttendanceIcon />}>
                Attendance
              </SidebarLink>
              <SidebarLink href="/e/resignation" icon={<ResignationIcon />}>
                Resignation
              </SidebarLink>
              <SidebarLink href="/e/templates" icon={<TemplatesIcon />}>
                Templates
              </SidebarLink>
            </nav>
          </div>

          <div>
            <h2 className="text-xs uppercase text-slate-500 font-semibold tracking-wider mb-3 px-2">System</h2>
            <nav className="space-y-1.5">
              <button
                className="group flex items-center gap-3 px-4 py-3 w-full text-slate-700 hover:bg-slate-100 hover:text-red-600 rounded-xl transition-all duration-300"
                onClick={handleLogout}
              >
                <LogoutIcon />
                <span>Logout</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Page Content */}
        <main className="flex-1 p-6 bg-gradient-to-br from-slate-50 to-slate-100">
          {children}
        </main>
      </div>
    </div>
  );
}