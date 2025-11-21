"use client";

import { useEffect, useMemo, useState } from "react";
import Image from 'next/image';

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
  photo_url?: string;
};

type DayRecord = {
  date: string;
  in?: string | null;
  out?: string | null;
  status?: "present" | "absent" | "leave" | "holiday";
};

// Define proper types for API responses
type AttendanceRecord = {
  date: string;
  check_in_ts?: string | null;
  check_out_ts?: string | null;
};

type LeaveRecord = {
  start_date: string;
  end_date: string;
};

export default function AdminAttendance() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [errorEmployees, setErrorEmployees] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  // load employees on client only (avoid SSR mismatch)
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoadingEmployees(true);
      setErrorEmployees(null);
      try {
        const res = await fetch(`${API}/employees`);
        if (!res.ok) throw new Error(`Failed to load employees (${res.status})`);
        const json = await res.json();
        if (!mounted) return;
        setEmployees(Array.isArray(json) ? json : []);
      } catch (err: unknown) {
        console.error("Load employees failed", err);
        if (mounted) setErrorEmployees(String(err instanceof Error ? err.message : err));
      } finally {
        if (mounted) setLoadingEmployees(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Filter employees based on search query
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    
    const query = searchQuery.toLowerCase();
    return employees.filter(emp => 
      (emp.first_name?.toLowerCase().includes(query) || '') ||
      (emp.last_name?.toLowerCase().includes(query) || '') ||
      (emp.emp_code?.toLowerCase().includes(query) || '')
    );
  }, [employees, searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Employee Attendance
          </h1>
          <p className="text-gray-600 mt-1">Select an employee to view their attendance records</p>
          
          {/* Search Bar */}
          <div className="mt-4 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                placeholder="Search employees by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setSearchQuery("")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Employee list */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-slate-100">
          {loadingEmployees ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-300 mb-4"></div>
                <p className="text-gray-600 font-medium">Loading employees...</p>
              </div>
            </div>
          ) : errorEmployees ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              Error loading employees: {errorEmployees}
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-gray-600">
                {searchQuery ? "No employees match your search" : "No employees found."}
              </p>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="mt-3 text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {filteredEmployees.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => setSelectedEmp(emp)}
                  className="flex flex-col items-center cursor-pointer transition-all duration-300 hover:shadow-md bg-white border border-slate-200 rounded-2xl p-4 hover:border-gray-300"
                >
                  <div className="relative">
                    <Image
                      src={emp.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.first_name || "E")}`}
                      alt={`${emp.first_name} ${emp.last_name}`}
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full shadow-sm border-2 border-white object-cover"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-sm font-medium mt-3 text-gray-800 text-center truncate w-full">
                    {emp.first_name} {emp.last_name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{emp.emp_code}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Employee calendar */}
        <div>
          {selectedEmp ? (
            <EmployeeCalendar employee={selectedEmp} onClose={() => setSelectedEmp(null)} />
          ) : (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-slate-100">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Select an employee</h3>
              <p className="text-gray-600 max-w-md mx-auto">Choose an employee from the list above to view their attendance calendar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------
   EmployeeCalendar component
   Fetches calendar/leaves?month=...&employeeId=...
   Renders same calendar view as employee portal
   ------------------------- */
function iso(y: number, m: number, d: number) {
  const mm = (m + 1).toString().padStart(2, "0");
  return `${y}-${mm}-${String(d).padStart(2, "0")}`;
}

function toTimeDisplay(ts?: string | null) {
  if (!ts) return "—";
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return String(ts).slice(11, 16) || "—";
  }
}

function EmployeeCalendar({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [records, setRecords] = useState<Record<string, DayRecord>>({});
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function fetchMonth(empId: string, monthStr: string) {
    setLoading(true);
    setLoadError(null);
    try {
      const url = `${API}/calendar/leaves?month=${encodeURIComponent(monthStr)}&employeeId=${encodeURIComponent(empId)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`calendar API returned ${res.status}`);
      const data = await res.json();

      const recs: Record<string, DayRecord> = {};

      (data.attendance || []).forEach((a: AttendanceRecord) => {
         const utcDate = new Date(a.date);
         const dateStr = utcDate.toISOString().slice(0, 10);

        if (!dateStr) return;
        recs[dateStr] = {
          date: dateStr,
          in: a.check_in_ts || null,
          out: a.check_out_ts || null,
          status: a.check_in_ts ? "present" : undefined,
        };
      });

      (data.leaves || []).forEach((l: LeaveRecord) => {
        const startDate = new Date(l.start_date);
        const endDate = new Date(l.end_date);
         const currentDate = new Date();
        
        while (currentDate <= endDate) {
          const ds = currentDate.toISOString().slice(0, 10);
          const existing = recs[ds];
          if (!existing || existing.status !== "present") {
            recs[ds] = { date: ds, status: "leave" };
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });

      setRecords(recs);
    } catch (err: unknown) {
      console.error("fetchMonth failed", err);
      setLoadError(String(err instanceof Error ? err.message : err));
      setRecords({});
    } finally {
      setLoading(false);
    }
  }

  // initial + when month or employee changes
  useEffect(() => {
    if (!employee?.id) return;
    fetchMonth(employee.id, month);
  }, [employee?.id, month]);

  function changeMonth(delta: number) {
    const [y, m] = month.split("-").map(Number);
    const dt = new Date(y, m - 1 + delta, 1);
    setMonth(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`);
  }

  const days = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const first = new Date(y, m - 1, 1);
    const last = new Date(y, m, 0);
    const startOffset = first.getDay();
    const totalCells = Math.ceil((startOffset + last.getDate()) / 7) * 7;
    const list: { date?: string; dayNum?: number; muted: boolean; isSunday: boolean }[] = [];
    for (let i = 0; i < totalCells; i++) {
      const dayNum = i - startOffset + 1;
      const inMonth = dayNum >= 1 && dayNum <= last.getDate();
      const dateObj = inMonth ? new Date(y, m - 1, dayNum) : null;
      list.push({
        date: inMonth ? iso(y, m - 1, dayNum) : undefined,
        dayNum: inMonth ? dayNum : undefined,
        muted: !inMonth,
        isSunday: dateObj ? dateObj.getDay() === 0 : false,
      });
    }
    return list;
  }, [month]);

  const totals = useMemo(() => {
    let present = 0,
      leave = 0,
      absent = 0,
      workingDays = 0;
    for (const c of days) {
      if (!c.date) continue;
      const dt = new Date(c.date);
      if (dt.getDay() === 0) continue;
      workingDays++;
      const r = records[c.date];
      if (!r) absent++;
      else if (r.status === "present") present++;
      else if (r.status === "leave") leave++;
      else absent++;
    }
    return { present, leave, absent, workingDays };
  }, [days, records]);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="font-bold text-xl text-gray-800">
              {employee.first_name} {employee.last_name}
            </div>
            <div className="text-sm text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full">
              {employee.emp_code}
            </div>
          </div>
          <div className="text-gray-600">
            {new Date(`${month}-01`).toLocaleString(undefined, { month: "long", year: "numeric" })}
          </div>
          {loadError && <div className="text-xs text-red-600 mt-1">Error: {loadError}</div>}
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => changeMonth(-1)}
            className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            Prev
          </button>
          <button 
            onClick={() => changeMonth(1)}
            className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Next
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button 
            onClick={onClose}
            className="flex items-center gap-1 px-4 py-2 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Close
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-300 mb-4"></div>
            <p className="text-gray-600 font-medium">Loading attendance data...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 text-xs mb-3 font-medium text-gray-600 pb-2 border-b border-gray-100">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((cell, idx) => {
              const rec = cell.date ? records[cell.date] : undefined;
              const isHoliday = cell.isSunday && cell.date;
              const status = rec?.status ?? (isHoliday ? "holiday" : cell.date ? "absent" : "muted");

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl min-h-[90px] border text-xs transition-all duration-150 ${
                    cell.muted
                      ? "opacity-50 bg-transparent border-transparent"
                      : status === "present"
                      ? "border-gray-300 bg-gray-50 hover:bg-gray-100"
                      : status === "leave"
                      ? "border-gray-300 bg-gray-50 hover:bg-gray-100"
                      : status === "holiday"
                      ? "border-gray-200 bg-gray-50"
                      : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div className="font-medium text-gray-700 text-sm">{cell.dayNum ?? ""}</div>
                  <div className="mt-1 text-xs leading-5">
                    {status === "present" && (
                      <>
                        <div className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{toTimeDisplay(rec!.in)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{toTimeDisplay(rec!.out)}</span>
                        </div>
                      </>
                    )}
                    {status === "leave" && <div className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>On Leave</span>
                    </div>}
                    {status === "holiday" && <div className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Sunday</span>
                    </div>}
                    {status === "absent" && <div className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Absent</span>
                    </div>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 p-5 bg-gray-50 border border-gray-200 rounded-xl">
            <h3 className="font-medium text-gray-800 mb-4">Attendance Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Present</div>
                    <div className="font-medium text-gray-800">{totals.present}</div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Leave</div>
                    <div className="font-medium text-gray-800">{totals.leave}</div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Absent</div>
                    <div className="font-medium text-gray-800">{totals.absent}</div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Working Days</div>
                    <div className="font-medium text-gray-800">{totals.workingDays}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}