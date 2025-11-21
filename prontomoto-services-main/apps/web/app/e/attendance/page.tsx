"use client";

import { useEffect, useMemo, useState } from "react";

// Use the environment variable FIRST, then fall back to the Azure URL, and finally to localhost
const API =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API ||
  "https://prontomoto-func-001-h8a9fwh0gjdjdpda.centralindia-01.azurewebsites.net/api"; // change if needed

type DayRecord = {
  date: string;
  in?: string | null;
  out?: string | null;
  status?: "present" | "absent" | "leave" | "holiday";
};

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

/**
 * Helper to read employee id from localStorage in a robust way.
 * Prioritises common keys used in your app.
 */
function readEmployeeIdFromStorage() {
  if (typeof window === "undefined") return null;
  // prefer canonical key 'employee_id' but allow fallbacks for older keys
  return (
    localStorage.getItem("employee_id") ||
    localStorage.getItem("employeeId") ||
    localStorage.getItem("pms_employee_id") ||
    localStorage.getItem("pms_employeeId") ||
    null
  );
}

export default function EmployeeAttendance() {
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // current month
  const [records, setRecords] = useState<Record<string, DayRecord>>({});
  const [selected, setSelected] = useState<string | null>(null);

  // Read employee ID from localStorage on client
  const [employeeId, setEmployeeId] = useState<string | null>(() => {
    return typeof window !== "undefined" ? readEmployeeIdFromStorage() : null;
  });

  // helper: fetch data for current month & employee
  async function fetchMonthData(empId: string | null, monthStr: string) {
    if (!empId) {
      setRecords({});
      return;
    }
    try {
      const url = `${API}/calendar/leaves?month=${monthStr}&employeeId=${encodeURIComponent(empId)}`;
      // console.log("[attendance] fetching:", url);
      const res = await fetch(url);
      if (!res.ok) {
        console.warn("[attendance] calendar API returned", res.status);
        setRecords({});
        return;
      }
      const data = await res.json();
      // console.log("[attendance] calendar response:", data);

      // Build records map from attendance (present)
      const recs: Record<string, DayRecord> = {};
      (data.attendance || []).forEach((a: { // Fixed type
        date?: string | Date;
        check_in_ts?: string | null;
        check_out_ts?: string | null;
      }) => {
  // Convert UTC date to local date string (YYYY-MM-DD)
  const local = new Date(a.date || "");
  const localDateStr = new Date(
    local.getTime() - local.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 10);

  recs[localDateStr] = {
    date: localDateStr,
    in: a.check_in_ts || null,
    out: a.check_out_ts || null,
    status: a.check_in_ts ? "present" : undefined,
  };
});


      // Mark leaves (override to 'leave' unless present)
      (data.leaves || []).forEach((l: { // Fixed type
        start_date?: string | Date;
        end_date?: string | Date;
      }) => {
        const startDate = new Date(l.start_date || "");
        const endDate = new Date(l.end_date || "");
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
    } catch (err) {
      console.error("[attendance] load failed", err);
      setRecords({});
    }
  }

  // Respond to storage events & custom events so the view updates immediately when login/logout occurs
  useEffect(() => {
    function handleStorage(ev: StorageEvent) {
      // If login key changed in another tab/or same tab, pick up new id
      const keysOfInterest = ["employee_id", "employeeId", "pms_employee_id", "pms_employeeId"];
      if (keysOfInterest.includes(ev.key || "")) {
        const newId = readEmployeeIdFromStorage();
        setEmployeeId(newId);
        // fetch immediately for new id
        fetchMonthData(newId, month);
      }
    }

    function onCustomLogin() {
      const newId = readEmployeeIdFromStorage();
      setEmployeeId(newId);
      fetchMonthData(newId, month);
    }

    function onCustomLogout() {
      setEmployeeId(null);
      setRecords({});
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("pms:login", onCustomLogin);
    window.addEventListener("pms:logout", onCustomLogout);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("pms:login", onCustomLogin);
      window.removeEventListener("pms:logout", onCustomLogout);
    };
  }, [month]);

  // initial load + polling every 5s
  useEffect(() => {
    const timer = window.setInterval(() => { // Fixed declaration
      if (employeeId) {
        fetchMonthData(employeeId, month);
      }
    }, 5000);

    // load immediately
    if (employeeId) {
      fetchMonthData(employeeId, month);
    }

    return () => {
      clearInterval(timer);
    };
  }, [employeeId, month]);

  // month navigation & grid construction
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

  // totals
  const totals = useMemo(() => {
    let present = 0,
      leave = 0,
      absent = 0,
      workingDays = 0;
    for (const c of days) {
      if (!c.date) continue;
      const dt = new Date(c.date);
      if (dt.getDay() === 0) continue; // skip Sunday
      workingDays++;
      const r = records[c.date];
      if (!r) absent++;
      else if (r.status === "present") present++;
      else if (r.status === "leave") leave++;
      else absent++;
    }
    return { present, leave, absent, workingDays };
  }, [days, records]);

  // Day detail modal (READ-ONLY)
  function DayDetailModal({ day, onClose }: { day: string; onClose: () => void }) {
    const rec = records[day];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Attendance Details</h3>
                <p className="text-sm text-gray-500">{new Date(day).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm text-gray-500 mb-1">Status</div>
                <div className="flex items-center">
                  {rec ? (
                    rec.status === "present" ? (
                      <>
                        <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                        <span className="font-medium text-green-700">Present</span>
                      </>
                    ) : rec.status === "leave" ? (
                      <>
                        <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                        <span className="font-medium text-yellow-700">On Leave</span>
                      </>
                    ) : (
                      <>
                        <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                        <span className="font-medium text-red-700">Absent</span>
                      </>
                    )
                  ) : (
                    <>
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                      <span className="font-medium text-red-700">Absent</span>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-1">Check In</div>
                  <div className="font-medium text-gray-800">{toTimeDisplay(rec?.in)}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-1">Check Out</div>
                  <div className="font-medium text-gray-800">{toTimeDisplay(rec?.out)}</div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4">
                <div className="text-sm text-blue-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  These values are automatically recorded when you check in and out through the system.
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button 
                onClick={onClose}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!employeeId) {
    return <div className="p-6 text-center text-gray-500">Please login to view your attendance.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">My Attendance</h1>
              <p className="text-gray-500 mt-1">Track your monthly attendance records</p>
            </div>
            <div className="flex items-center space-x-3 mt-4 md:mt-0">
              <button 
                onClick={() => changeMonth(-1)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="text-lg font-medium text-gray-800 min-w-[180px] text-center">
                {new Date(`${month}-01`).toLocaleString(undefined, { month: "long", year: "numeric" })}
              </div>
              <button 
                onClick={() => changeMonth(1)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="mb-6">
            <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-gray-500 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="py-2">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {days.map((cell, idx) => {
                const dayKey = cell.date;
                const rec = dayKey ? records[dayKey] : undefined;
                const isSunday = cell.isSunday;
                const inMonth = !!cell.date;
                const isHoliday = isSunday && inMonth;
                const status = rec?.status ?? (isHoliday ? "holiday" : inMonth ? "absent" : "muted");

                return (
                  <div
                    key={idx}
                    onClick={() => dayKey && setSelected(dayKey)}
                    className={`
                      rounded-xl p-3 min-h-[100px] cursor-pointer transition-all duration-300
                      ${cell.muted ? 'opacity-40' : ''}
                      ${status === 'present' ? 'bg-green-50 border border-green-100 hover:bg-green-100' : ''}
                      ${status === 'leave' ? 'bg-yellow-50 border border-yellow-100 hover:bg-yellow-100' : ''}
                      ${status === 'absent' ? 'bg-red-50 border border-red-100 hover:bg-red-100' : ''}
                      ${status === 'holiday' ? 'bg-gray-100 border border-gray-200' : ''}
                      ${status === 'muted' ? 'bg-transparent' : ''}
                    `}
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-sm font-medium ${cell.muted ? 'text-gray-400' : 'text-gray-700'}`}>
                          {cell.dayNum ?? ''}
                        </span>
                        {isHoliday && inMonth && (
                          <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">Holiday</span>
                        )}
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-end">
                        {status === 'present' && (
                          <div className="space-y-1">
                            <div className="flex items-center text-xs">
                              <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></div>
                              <span className="text-green-700">In: {toTimeDisplay(rec?.in)}</span>
                            </div>
                            <div className="flex items-center text-xs">
                              <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></div>
                              <span className="text-green-700">Out: {toTimeDisplay(rec?.out)}</span>
                            </div>
                          </div>
                        )}
                        
                        {status === 'leave' && (
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-600 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xs font-medium text-yellow-700">On Leave</span>
                          </div>
                        )}
                        
                        {status === 'absent' && !isHoliday && (
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="text-xs font-medium text-red-700">Absent</span>
                          </div>
                        )}
                        
                        {status === 'holiday' && (
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs font-medium text-gray-700">Sunday</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-green-500">
            <div className="text-sm text-gray-500 mb-1">Present Days</div>
            <div className="text-2xl font-bold text-gray-800">{totals.present}</div>
            <div className="mt-2 h-2 w-full bg-green-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full" 
                style={{ width: `${(totals.present / totals.workingDays) * 100 || 0}%` }}
              ></div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-yellow-500">
            <div className="text-sm text-gray-500 mb-1">Leave Days</div>
            <div className="text-2xl font-bold text-gray-800">{totals.leave}</div>
            <div className="mt-2 h-2 w-full bg-yellow-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-yellow-500 rounded-full" 
                style={{ width: `${(totals.leave / totals.workingDays) * 100 || 0}%` }}
              ></div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-red-500">
            <div className="text-sm text-gray-500 mb-1">Absent Days</div>
            <div className="text-2xl font-bold text-gray-800">{totals.absent}</div>
            <div className="mt-2 h-2 w-full bg-red-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-500 rounded-full" 
                style={{ width: `${(totals.absent / totals.workingDays) * 100 || 0}%` }}
              ></div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-gray-500">
            <div className="text-sm text-gray-500 mb-1">Working Days</div>
            <div className="text-2xl font-bold text-gray-800">{totals.workingDays}</div>
            <div className="mt-2 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gray-500 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-start">
            <div className="p-3 bg-blue-100 rounded-xl mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-1">About Your Attendance</h3>
              <p className="text-gray-600 text-sm">
                Your attendance is automatically recorded when you check in and out through the system. 
                Sundays are marked as holidays. Leave days are recorded when you have approved leave requests.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selected && <DayDetailModal day={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}