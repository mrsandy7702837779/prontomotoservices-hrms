"use client";
import "../globals.css";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

function Today() {
  const [d, setD] = useState("");
  useEffect(() => {
    const f = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
    setD(f.format(new Date()));
  }, []);
  return <span>{d}</span>;
}

// 3D Icon Components
const DashboardIcon = ({ active }: { active?: boolean }) => (
  <svg className={`w-6 h-6 transition-all duration-300 ${active ? 'text-gray-600' : 'text-slate-500 group-hover:text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
);

const EmployeesIcon = ({ active }: { active?: boolean }) => (
  <svg className={`w-6 h-6 transition-all duration-300 ${active ? 'text-gray-600' : 'text-slate-500 group-hover:text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0Zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

const RequestsIcon = ({ active }: { active?: boolean }) => (
  <svg className={`w-6 h-6 transition-all duration-300 ${active ? 'text-gray-600' : 'text-slate-500 group-hover:text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const PayrollIcon = ({ active }: { active?: boolean }) => (
  <svg className={`w-6 h-6 transition-all duration-300 ${active ? 'text-gray-600' : 'text-slate-500 group-hover:text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
  </svg>
);

const AssetsIcon = ({ active }: { active?: boolean }) => (
  <svg className={`w-6 h-6 transition-all duration-300 ${active ? 'text-gray-600' : 'text-slate-500 group-hover:text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
  </svg>
);

const CalendarIcon = ({ active }: { active?: boolean }) => (
  <svg className={`w-6 h-6 transition-all duration-300 ${active ? 'text-gray-600' : 'text-slate-500 group-hover:text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

const AttendanceIcon = ({ active }: { active?: boolean }) => (
  <svg className={`w-6 h-6 transition-all duration-300 ${active ? 'text-gray-600' : 'text-slate-500 group-hover:text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l3 3L15 9m4.5 5.25h.008M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ReportingIcon = ({ active }: { active?: boolean }) => (
  <svg className={`w-6 h-6 transition-all duration-300 ${active ? 'text-gray-600' : 'text-slate-500 group-hover:text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

const TemplatesIcon = ({ active }: { active?: boolean }) => (
  <svg className={`w-6 h-6 transition-all duration-300 ${active ? 'text-gray-600' : 'text-slate-500 group-hover:text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125 1.125 1.125 0 00-1.125-1.125h-1.5A3.375 3.375 0 006 12.75v2.25m13.5-6h-3.375a1.125 1.125 0 01-1.125-1.125V9.75m3.375 6h-3.375a1.125 1.125 0 01-1.125-1.125V9.75m6 6h.375c.621 0 1.125-.504 1.125-1.125v-1.5a1.125 1.125 0 00-1.125-1.125h-.375m-13.5 6h.375c.621 0 1.125-.504 1.125-1.125v-1.5a1.125 1.125 0 00-1.125-1.125h-.375m6 6v-3m-3 3h.008v.008H12v-.008Z" />
  </svg>
);

const ArchivedIcon = ({ active }: { active?: boolean }) => (
  <svg className={`w-6 h-6 transition-all duration-300 ${active ? 'text-gray-600' : 'text-slate-500 group-hover:text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
  </svg>
);

const SettingsIcon = ({ active }: { active?: boolean }) => (
  <svg className={`w-6 h-6 transition-all duration-300 ${active ? 'text-gray-600' : 'text-slate-500 group-hover:text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.52 6.52 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
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
          ? 'bg-gray-50 text-gray-700 font-medium shadow-sm' 
          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {icon}
      <span>{children}</span>
      {isActive && (
        <div className="ml-auto w-2 h-2 rounded-full bg-gray-600"></div>
      )}
    </Link>
  );
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);
     
  function handleLogout() {
    localStorage.removeItem("employee_id");
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900">
      {/* Top header with enhanced design */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Image src="/logo.png" alt="Logo" width={32} height={32} className="rounded-lg" />
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-white"></div>
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-800">Pronto MotoServices</h1>
            <p className="text-xs text-slate-500">Admin Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-sm text-slate-600 flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <Today />
          </div>
          <div className="relative" ref={menuRef}>
            <button 
              className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300" 
              onClick={() => setMenuOpen(v => !v)}
            >
              <Image src="/avatar.png" alt="Profile" width={32} height={32} className="rounded-full border-2 border-white shadow-sm" />
              <span className="font-medium text-slate-800">Admin</span>
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

      {/* Main content with enhanced sidebar */}
      <div className="flex">
        {/* Sidebar with glassmorphism effect */}
        <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-white/60 backdrop-blur-sm p-5 shadow-sm">
          <div className="mb-8">
            <h2 className="text-xs uppercase text-slate-500 font-semibold tracking-wider mb-3 px-2">Main Menu</h2>
            <nav className="space-y-1.5">
              <SidebarLink href="/a/dashboard" icon={<DashboardIcon />}>
                Dashboard
              </SidebarLink>
              <SidebarLink href="/a/employees" icon={<EmployeesIcon />}>
                Employees
              </SidebarLink>
              <SidebarLink href="/a/requests" icon={<RequestsIcon />}>
                Request Management
              </SidebarLink>
              <SidebarLink href="/a/payroll" icon={<PayrollIcon />}>
                Payroll Management
              </SidebarLink>
              <SidebarLink href="/a/assets" icon={<AssetsIcon />}>
                Asset Details
              </SidebarLink>
              <SidebarLink href="/a/calendar" icon={<CalendarIcon />}>
                View Calendar
              </SidebarLink>
              <SidebarLink href="/a/attendance" icon={<AttendanceIcon />}>
                Attendance
              </SidebarLink>
              <SidebarLink href="/a/reporting" icon={<ReportingIcon />}>
                Reporting Matrix
              </SidebarLink>
              <SidebarLink href="/a/templates" icon={<TemplatesIcon />}>
                Templates
              </SidebarLink>
              <SidebarLink href="/a/archived" icon={<ArchivedIcon />}>
                Archived Employees
              </SidebarLink>
            </nav>
          </div>

          <div>
            <h2 className="text-xs uppercase text-slate-500 font-semibold tracking-wider mb-3 px-2">System</h2>
            <nav className="space-y-1.5">
              <SidebarLink href="/a/settings" icon={<SettingsIcon />}>
                Settings
              </SidebarLink>
              <button
                className="group flex items-center gap-3 px-4 py-3 w-full text-slate-700 hover:bg-slate-100 hover:text-red-600 rounded-xl transition-all duration-300"
                onClick={handleLogout}
              >
                <LogoutIcon />
                <span>Logout</span>
              </button>
            </nav>
          </div>

          {/* Sidebar footer */}
          <div className="absolute bottom-5 left-5 right-5">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-800">Need Help?</p>
                  <p className="text-xs text-gray-600">Contact support</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content area */}
        <main className="flex-1 p-6 bg-gradient-to-br from-slate-50 to-slate-100">
          {children}
        </main>
      </div>
    </div>
  );
}