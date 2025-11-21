"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image"; // Import Next.js Image component

/**
 * Employee dashboard (polling) — style & celebrations fix
 *
 * Same endpoints as before. This file only updates UI and filters celebrations
 * so the signed-in employee sees today's celebration if it matches.
 */
// Use the environment variable FIRST, then fall back to the Azure URL, and finally to localhost
const API =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API ||
  "https://prontomoto-func-001-h8a9fwh0gjdjdpda.centralindia-01.azurewebsites.net/api";
type Employee = {
  id: string;
  emp_code?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string | null;
  job_title?: string | null;
};

type Announcement = {
  id: string;
  title: string;
  body: string;
  created_at?: string;
};

type PresenceIn = {
  id: string;
  emp_code?: string;
  first_name?: string;
  last_name?: string;
  last_seen_ts?: string;
  photo_url?: string | null;
};

type PresenceOut = {
  id: string;
  emp_code?: string;
  first_name?: string;
  last_name?: string;
  check_out_ts?: string;
  photo_url?: string | null;
};

type Celebration = {
  type: "birthday" | "anniversary";
  name: string;
  date: string; // ISO date or yyyy-mm-dd
};

type LinkItem = {
  id: string;
  label: string;
  url: string;
};

function fmtTime(iso?: string) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "—";
  }
}

function shortDate(iso?: string) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString();
  } catch {
    return iso.slice(0, 10);
  }
}

// UI Components
const DashboardHeader = ({ employee }: { employee: Employee }) => {
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

  return (
    <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl shadow-sm p-6 mb-8 border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-5">
          <div className="relative">
            {employee.photo_url ? (
              <Image 
                src={employee.photo_url} 
                alt={`${employee.first_name} ${employee.last_name}`} 
                width={64}
                height={64}
                className="w-16 h-16 rounded-full border-4 border-white shadow-sm" 
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 border-4 border-white shadow-sm flex items-center justify-center text-xl font-bold text-gray-700">
                {employee.first_name?.[0] ?? "E"}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-400 border-2 border-white flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Hello, {employee.first_name} {employee.last_name}</h1>
            <p className="text-gray-600">{employee.job_title ?? "Employee"}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-gray-500 text-sm">Today</div>
          <div className="text-lg font-semibold text-gray-800">{time}</div>
          <div className="text-xs text-gray-400 mt-1">ID: {employee.emp_code ?? "—"}</div>
        </div>
      </div>
    </div>
  );
};

const AnnouncementCard = ({ announcement }: { announcement: Announcement }) => {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-start">
        <div className="p-2 bg-gray-100 rounded-lg mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-800 mb-2">{announcement.title}</h3>
          <p className="text-gray-600 mb-3">{announcement.body}</p>
          <div className="flex items-center text-xs text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {announcement.created_at ? new Date(announcement.created_at).toLocaleDateString() : ""}
          </div>
        </div>
      </div>
    </div>
  );
};

const EmployeeCard = ({ employee, status, time }: { 
  employee: PresenceIn | PresenceOut; 
  status: 'in' | 'out'; 
  time: string;
}) => {
  const employeeName = `${employee.first_name} ${employee.last_name}`;
  
  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition-all duration-300">
      <div className="flex items-center space-x-3">
        <Image 
          src={employee.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(employeeName)}&background=random`} 
          alt={employeeName} 
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
        />
        <div>
          <div className="font-medium text-gray-800">{employeeName}</div>
          <div className="text-xs text-gray-500">{employee.emp_code}</div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${status === 'in' ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'}`}>
          {status === 'in' ? 'IN' : 'OUT'}
        </div>
        <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
          {time}
        </div>
      </div>
    </div>
  );
};

const CelebrationCard = ({ celebration }: { celebration: Celebration }) => {
  const isBirthday = celebration.type === "birthday";
  const today = new Date().toISOString().slice(0, 10);
  const isToday = celebration.date === today;
  
  return (
    <div className={`p-4 rounded-xl border ${isToday ? 'border-emerald-100 bg-emerald-50' : 'border-gray-100 bg-white'} hover:shadow-sm transition-all duration-300`}>
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-full ${isToday ? 'bg-emerald-100' : 'bg-gray-100'}`}>
          {isBirthday ? (
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isToday ? 'text-emerald-600' : 'text-amber-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isToday ? 'text-emerald-600' : 'text-purple-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center">
            <h3 className="font-medium text-gray-800">{celebration.name}</h3>
            {isToday && (
              <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">Today</span>
            )}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {isBirthday ? "Birthday" : "Anniversary"} • {shortDate(celebration.date)}
          </div>
        </div>
      </div>
    </div>
  );
};

const LinkCard = ({ link }: { link: LinkItem }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition-all duration-300 group">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gray-100 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <div>
          <div className="font-medium text-gray-800 group-hover:text-gray-700 transition-colors">{link.label}</div>
          <div className="text-xs text-gray-500 truncate max-w-xs">{link.url}</div>
        </div>
      </div>
      <a 
        href={link.url} 
        target="_blank" 
        rel="noreferrer" 
        className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors duration-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  );
};

export default function EmployeeDashboard() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [presence, setPresence] = useState<{ in: PresenceIn[]; out: PresenceOut[] }>({ in: [], out: [] });
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const POLL_INTERVAL = 5000; // 5 seconds

  // read employee id from localStorage (only on client)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = localStorage.getItem("employee_id") || null;
    setEmployeeId(id);
  }, []);

  // data loader (fetches all dashboard data)
  const loadData = useCallback(
    async (empId?: string | null) => {
      if (!empId) return;
      setLoading(true);
      try {
        const [empRes, annRes, presRes, celRes, linksRes] = await Promise.allSettled([
          fetch(`${API}/employees/${empId}`),
          fetch(`${API}/announcements`),
          fetch(`${API}/presence`),
          fetch(`${API}/celebrations`),
          fetch(`${API}/links`),
        ]);
        // employee
        if (empRes.status === "fulfilled" && empRes.value.ok) {
          try {
            const empJson = await empRes.value.json();
            setEmployee(empJson);
          } catch {
            setEmployee(null);
          }
        } else {
          setEmployee(null);
        }

        // announcements
        if (annRes.status === "fulfilled" && annRes.value.ok) {
          try {
            const anns = await annRes.value.json();
            setAnnouncements(Array.isArray(anns) ? anns : []);
          } catch {
            setAnnouncements([]);
          }
        } else {
          setAnnouncements([]);
        }

        // presence
        if (presRes.status === "fulfilled" && presRes.value.ok) {
          try {
            const presJson = await presRes.value.json();
            setPresence({
              in: Array.isArray(presJson.in) ? presJson.in : [],
              out: Array.isArray(presJson.out) ? presJson.out : [],
            });
          } catch {
            setPresence({ in: [], out: [] });
          }
        } else {
          setPresence({ in: [], out: [] });
        }

        // celebrations
        if (celRes.status === "fulfilled" && celRes.value.ok) {
          try {
            const celJson = await celRes.value.json();

            // 1) If API already returns an array (legacy)
            if (Array.isArray(celJson)) {
              setCelebrations(celJson);
              // 2) If API returns object with celebrations field
            } else if (celJson?.celebrations && Array.isArray(celJson.celebrations)) {
              setCelebrations(celJson.celebrations);
              // 3) If API returns separate birthdays / anniversaries arrays
            } else if ((Array.isArray(celJson?.birthdays) && celJson.birthdays.length) || (Array.isArray(celJson?.anniversaries) && celJson.anniversaries.length)) {
              const fromBirthdays = (celJson.birthdays || []).map((b: { // Fixed type
                id?: string;
                emp_code?: string;
                code?: string;
                name?: string;
                first_name?: string;
                last_name?: string;
                date?: string;
                photo_url?: string;
                photo?: string;
              }) => ({
                id: b.id ?? b.emp_code ?? b.code,
                emp_code: b.emp_code ?? b.code,
                name: b.name ?? `${b.first_name ?? ""} ${b.last_name ?? ""}`.trim(),
                type: "birthday",
                date: b.date,
                photo_url: b.photo_url ?? b.photo,
              }));
              const fromAnniv = (celJson.anniversaries || []).map((a: { // Fixed type
                id?: string;
                emp_code?: string;
                code?: string;
                name?: string;
                first_name?: string;
                last_name?: string;
                date?: string;
                photo_url?: string;
                photo?: string;
              }) => ({
                id: a.id ?? a.emp_code ?? a.code,
                emp_code: a.emp_code ?? a.code,
                name: a.name ?? `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim(),
                type: "anniversary",
                date: a.date,
                photo_url: a.photo_url ?? a.photo,
              }));
              const merged = [...fromBirthdays, ...fromAnniv].sort((x, y) => (x.date || "").localeCompare(y.date || ""));
              setCelebrations(merged);
            } else {
              setCelebrations([]);
            }
          } catch (err) {
            console.error("celebrations parsing error", err);
            setCelebrations([]);
          }
        } else {
          setCelebrations([]);
        }

        // links
        if (linksRes.status === "fulfilled" && linksRes.value.ok) {
          try {
            const linkJson = await linksRes.value.json();
            setLinks(Array.isArray(linkJson) ? linkJson : []);
          } catch {
            setLinks([]);
          }
        } else {
          setLinks([]);
        }
      } catch (err) {
        console.error("Dashboard load failed:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // initial load + polling
  useEffect(() => {
    if (!employeeId) return;
    loadData(employeeId);

    const id = setInterval(() => {
      loadData(employeeId);
    }, POLL_INTERVAL);

    return () => clearInterval(id);
  }, [employeeId, loadData]);

  // check-in
  async function handleLogin() {
    if (!employee) return;
    try {
      await fetch(`${API}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: employee.id }),
      });
    } catch (e) {
      console.error("check-in failed:", e);
    } finally {
      // refresh immediately (don&apos;t wait for interval)
      loadData(employee.id);
    }
  }

  // check-out
  async function handleLogout() {
    if (!employee) return;
    try {
      await fetch(`${API}/check-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: employee.id }),
      });
    } catch (e) {
      console.error("check-out failed:", e);
    } finally {
      loadData(employee.id);
    }
  }

  // derived small helpers
  const myInRecord = useMemo(() => presence.in.find((p) => p.id === employee?.id), [presence.in, employee]);
  const myOutRecord = useMemo(() => presence.out.find((p) => p.id === employee?.id), [presence.out, employee]);

  // --- Celebrations: compute today&apos;s matches for the signed-in employee
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  // helper to normalize celebration date strings to YYYY-MM-DD
  function normalizeDate(s?: string | null) {
    if (!s) return "";
    if (s.length >= 10 && s[4] === "-" && s[7] === "-") return s.slice(0, 10);
    try {
      return new Date(s).toISOString().slice(0, 10);
    } catch {
      return s.slice(0, 10);
    }
  }

  // Filter celebrations that either:
  //  - match today&apos;s date OR
  //  - include the employee&apos;s name (handles per-employee entries)
  const todaysCelebrations = useMemo(() => {
    if (!employee) return [];
    const fname = (employee.first_name || "").toLowerCase();
    const lname = (employee.last_name || "").toLowerCase();

    const today = new Date(todayStr);

    return celebrations.filter((c) => {
      const cDate = normalizeDate(c.date);
      if (!cDate) return false;
      const d = new Date(cDate);

      // only show if exact same date (ignores timezones)
      const isToday = d.getFullYear() === today.getFullYear() &&
                      d.getMonth() === today.getMonth() &&
                      d.getDate() === today.getDate();

      if (isToday) return true;

      // also match employee name (optional personal greeting)
      const name = (c.name || "").toLowerCase();
      if (fname && name.includes(fname)) return true;
      if (lname && name.includes(lname)) return true;
      if (fname && lname && name.includes(`${fname} ${lname}`)) return true;

      return false;
    });
  }, [celebrations, employee, todayStr]);

  const upcomingCelebrations = useMemo(() => {
    const now = new Date(todayStr);
    return celebrations
      .map((c) => ({ ...c, nd: normalizeDate(c.date) }))
      .filter((c) => {
        // skip invalid dates
        if (!c.nd) return false;
        const d = new Date(c.nd);
        return d > now; // only future dates
      })
      .sort((a, b) => (a.nd > b.nd ? 1 : -1))
      .slice(0, 5);
  }, [celebrations, todayStr]);

  // UI guards
  if (!employeeId) {
    return (
      <div className="p-8">
        <div className="text-rose-600 font-semibold">Not signed in</div>
        <div className="text-sm text-slate-600 mt-2">
          Your account is not selected. Admin must create login credentials and you must login (or set <code>localStorage.employee_id</code>
          ) to view dashboard.
        </div>
      </div>
    );
  }

  if (loading && !employee) {
    return <div className="p-6 text-slate-500">Loading dashboard...</div>;
  }

  if (!employee) {
    return <div className="p-8 text-rose-600">Employee not found (invalid employee_id).</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Dashboard Header */}
        <DashboardHeader employee={employee} />

        {/* Login / Logout Section */}
        <section className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Time Tracking
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Login Area */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">Check In</h3>
                    <p className="text-sm text-gray-600">Mark your start time</p>
                  </div>
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Time:</span> {myInRecord ? fmtTime(myInRecord.last_seen_ts) : "—"}
                  </div>
                  <button
                    onClick={handleLogin}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Check In
                  </button>
                </div>
              </div>

              {/* Logout Area */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">Check Out</h3>
                    <p className="text-sm text-gray-600">Mark your end time</p>
                  </div>
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Time:</span> {myOutRecord ? fmtTime(myOutRecord.check_out_ts) : "—"}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Check Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Announcements Section */}
        <section className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Announcements
              </h2>
              <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {announcements.length} active
              </span>
            </div>

            {announcements.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No announcements yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((a) => (
                  <AnnouncementCard key={`ann-${a.id}`} announcement={a} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 2x2 Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Who&apos;s Checked In */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Who&apos;s Checked In
              </h3>
              <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {presence.in.length} present
              </span>
            </div>
            
            {presence.in.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12H4" />
                </svg>
                <p>No one is checked in</p>
              </div>
            ) : (
              <div className="space-y-3">
                {presence.in.map((p) => (
                  <EmployeeCard key={`in-${p.id}`} employee={p} status="in" time={fmtTime(p.last_seen_ts)} />
                ))}
              </div>
            )}
          </div>

          {/* Recent Checkouts */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recent Checkouts
              </h3>
              <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                Today
              </span>
            </div>
            
            {presence.out.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12H4" />
                </svg>
                <p>No checkouts yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {presence.out.map((p) => (
                  <EmployeeCard key={`out-${p.id}`} employee={p} status="out" time={fmtTime(p.check_out_ts)} />
                ))}
              </div>
            )}
          </div>

          {/* Celebrations */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
                Celebrations
              </h3>
              <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {todaysCelebrations.length + upcomingCelebrations.length} upcoming
              </span>
            </div>
            
            {todaysCelebrations.length === 0 && upcomingCelebrations.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
                </svg>
                <p>No upcoming celebrations</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaysCelebrations.map((c, i) => (
                  <CelebrationCard key={`today-${i}`} celebration={c} />
                ))}
                {upcomingCelebrations.map((c, i) => (
                  <CelebrationCard key={`upcoming-${i}`} celebration={c} />
                ))}
              </div>
            )}
          </div>

          {/* Company Links */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Company Links
              </h3>
            </div>
            
            {links.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <p>No links yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {links.map(l => (
                  <LinkCard key={`link-${l.id}`} link={l} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}