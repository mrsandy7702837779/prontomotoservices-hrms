"use client";
import { useEffect, useMemo, useState } from "react";
import Image from 'next/image';

// Use the environment variable FIRST, then fall back to the Azure URL, and finally to localhost
const API =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API ||
  "https://prontomoto-func-001-h8a9fwh0gjdjdpda.centralindia-01.azurewebsites.net/api";
/* ---------------- Types ---------------- */
type LeaveRow = {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
  emp_code: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
};

// Define proper type for API response
type RawLeaveRequest = {
  id: string;
  employee_id: string;
  start_date?: string;
  end_date?: string;
  reason?: string;
  emp_code?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  payload?: {
    start_date?: string;
    end_date?: string;
    reason?: string;
  };
};

// 🕓 Helper: Get "today" based on India (Asia/Kolkata) timezone
function todayIndia(): Date {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(now);
  const y = parseInt(parts.find((p) => p.type === "year")?.value ?? "0", 10);
  const m = parseInt(parts.find((p) => p.type === "month")?.value ?? "1", 10);
  const d = parseInt(parts.find((p) => p.type === "day")?.value ?? "1", 10);
  // Return a date object that represents midnight of today (India time)
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/* -------------- Date helpers -------------- */
const toLocalISODate = (s: string) => {
  if (!s) return "";
  if (s.length >= 10 && s[4] === "-" && s[7] === "-") return s.slice(0, 10);
  const d = new Date(s);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const fmtYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
const daysInclusive = (s: string, e: string) => {
  const sd = new Date(toLocalISODate(s) + "T00:00:00");
  const ed = new Date(toLocalISODate(e) + "T00:00:00");
  if (isNaN(sd.getTime()) || isNaN(ed.getTime())) return 0;
  return Math.floor((ed.getTime() - sd.getTime()) / 86400000) + 1;
};

/* -------------- UI helpers -------------- */
// Changed to use only grey colors, fixed unused parameter
const ringByReason = (_reason?: string) => {
  return "ring-gray-400";
};

export default function AdminCalendar() {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [rows, setRows] = useState<LeaveRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<LeaveRow | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  
  // Fixed: Wrap start and end in useMemo to avoid dependency warnings
  const start = useMemo(() => new Date(year, month, 1), [year, month]);
  const end = useMemo(() => new Date(year, month + 1, 0), [year, month]);

  // Load only approved leave requests (real data)
  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/requests?type=leave&status=approved`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      // Extract relevant fields with proper typing
      const approved = (Array.isArray(data) ? data : []).map((r: RawLeaveRequest) => {
        const p = r.payload || {};
        return {
          id: r.id,
          employee_id: r.employee_id,
          start_date: toLocalISODate(p.start_date || r.start_date || ""),
          end_date: toLocalISODate(p.end_date || r.end_date || ""),
          reason: p.reason || r.reason || "",
          emp_code: r.emp_code || "",
          first_name: r.first_name || "",
          last_name: r.last_name || "",
          photo_url: r.photo_url || "/avatar.png",
        } as LeaveRow;
      });

      // Fix: Remove expired approved leaves (end_date before today)
      // ✅ Fix: Remove expired approved leaves (based on India timezone)
      const today = todayIndia(); // midnight India time

      const filtered = approved.filter((lv) => {
        if (!lv.end_date) return false;

        // Parse end_date correctly (YYYY-MM-DD)
        const [y, m, d] = lv.end_date.split("-").map(Number);
        const endDate = new Date(y, m - 1, d, 23, 59, 59, 999); // end of leave day (India time)

        return endDate >= today;
      });

      setRows(filtered);

    } catch (e) {
      console.error("Calendar fetch failed", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Removed auto-refresh interval
  }, [year, month]);

  /* grid generation */
  const grid = useMemo(() => {
    const firstOffset = start.getDay();
    const total = Math.ceil((firstOffset + end.getDate()) / 7) * 7;
    const cells: Date[] = [];
    for (let i = 0; i < total; i++) {
      const dayNum = i - firstOffset + 1;
      cells.push(new Date(year, month, dayNum));
    }
    return cells;
  }, [year, month, start, end]);

  /* map leaves to days */
  const dayMap = useMemo(() => {
    const map = new Map<string, LeaveRow[]>();
    for (const lv of rows) {
      const s = new Date(lv.start_date + "T00:00:00");
      const e = new Date(lv.end_date + "T00:00:00");
      const cs = s < start ? start : s;
      const ce = e > end ? end : e;
      for (let d = new Date(cs); d <= ce; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
        const key = fmtYMD(d);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(lv);
      }
    }
    return map;
  }, [rows, start, end]); // Removed year and month as they're already dependencies of start and end

  const prevMonth = () => setCursor(new Date(year, month - 1, 1));
  const nextMonth = () => setCursor(new Date(year, month + 1, 1));
  const monthLabel = new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(start);

  const todayKey = fmtYMD(new Date());

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Leave Calendar
              </h1>
              <p className="text-gray-600 mt-1">
                Only <span className="font-medium text-gray-800">approved</span> leaves appear below
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={load}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-xl">
                <button 
                  onClick={prevMonth}
                  className="p-1 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="font-medium text-gray-800 min-w-[180px] text-center">{monthLabel}</div>
                <button 
                  onClick={nextMonth}
                  className="p-1 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
          <div className="grid grid-cols-7 text-xs font-semibold text-gray-600 mb-4 pb-2 border-b border-gray-100">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="px-2 py-1 text-center">
                {d}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="p-16 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-300 mb-4"></div>
              <p className="text-gray-600 font-medium">Loading calendar...</p>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-3">
              {grid.map((date, i) => {
                const inMonth = date.getMonth() === month;
                const key = fmtYMD(date);
                const leaves = dayMap.get(key) || [];
                const show = leaves.slice(0, 3);
                const extras = leaves.length - show.length;
                const weekend = date.getDay() === 0 || date.getDay() === 6;
                const isToday = key === todayKey;

                return (
                  <div
                    key={i}
                    className={`border rounded-2xl p-3 min-h-[140px] flex flex-col ${
                      inMonth ? "bg-white" : "bg-gray-50 opacity-70"
                    } ${weekend ? "bg-gray-50" : ""} ${isToday ? "ring-2 ring-gray-300" : ""} border-gray-200`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`text-sm font-medium ${isToday ? "text-gray-900" : "text-gray-700"}`}>
                        {date.getDate()}
                      </div>
                      {isToday && (
                        <div className="text-[10px] px-2 py-1 rounded-full bg-gray-200 text-gray-800">
                          Today
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1 mt-auto">
                      {show.map((lv, idx) => (
                        <button
                          key={lv.id + "_" + idx}
                          className={`inline-block ring-2 ${ringByReason(lv.reason)} rounded-full`}
                          title={`${lv.first_name} ${lv.last_name} • ${lv.emp_code}`}
                          onClick={() => setModal(lv)}
                        >
                          {lv.photo_url ? (
                            <Image
                              src={lv.photo_url}
                              alt=""
                              width={32}
                              height={32}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700 text-[10px] flex items-center justify-center font-bold">
                              {`${lv.first_name[0] || ""}${lv.last_name[0] || ""}`.toUpperCase()}
                            </div>
                          )}
                        </button>
                      ))}
                      {extras > 0 && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 text-xs flex items-center justify-center border-2 border-white">
                          +{extras}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal */}
        {modal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div className="text-lg font-bold text-gray-800">Leave Details</div>
                <button 
                  onClick={() => setModal(null)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-4">
                  <div className={`rounded-full ring-4 ${ringByReason(modal.reason)}`}>
                    {modal.photo_url ? (
                      <Image
                        src={modal.photo_url}
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-full object-cover"
                        alt=""
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 text-white flex items-center justify-center text-xl font-bold">
                        {`${modal.first_name[0] || ""}${modal.last_name[0] || ""}`.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 text-lg">
                      {modal.first_name} {modal.last_name}
                    </div>
                    <div className="text-gray-600 text-sm">{modal.emp_code}</div>
                    <div className="text-gray-500 text-xs mt-1">{modal.reason || "—"}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="text-xs text-gray-500 mb-1">Start Date</div>
                    <div className="font-medium text-gray-800">{modal.start_date}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="text-xs text-gray-500 mb-1">End Date</div>
                    <div className="font-medium text-gray-800">{modal.end_date}</div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="text-xs text-gray-500 mb-1">Duration</div>
                  <div className="font-medium text-gray-800">
                    {daysInclusive(modal.start_date, modal.end_date)}{" "}
                    {daysInclusive(modal.start_date, modal.end_date) === 1 ? "day" : "days"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}