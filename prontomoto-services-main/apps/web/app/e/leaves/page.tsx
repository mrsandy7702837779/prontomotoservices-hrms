"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { CalendarDays, Send, Clock3, CheckCircle2, XCircle, Trash2, User, Calendar, FileText, BadgeCheck } from "lucide-react";

// Use the environment variable FIRST, then fall back to the Azure URL, and finally to localhost
const API =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API ||
  "https://prontomoto-func-001-h8a9fwh0gjdjdpda.centralindia-01.azurewebsites.net/api";
type LeaveStatus = "pending" | "approved" | "rejected";

type Leave = {
  id: string;
  employee_id?: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: LeaveStatus;
  created_at?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string | null;
};

export default function LeaveManagementPage() {
  const [reason, setReason] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [days, setDays] = useState(0);
  const [myLeaves, setMyLeaves] = useState<Leave[]>([]);
  const [onLeave, setOnLeave] = useState<Leave[]>([]);
  const [sending, setSending] = useState(false);

  const employeeId =
    typeof window !== "undefined" ? localStorage.getItem("employee_id") : null;

  const fetchLeaves = useCallback(async () => {
    if (!employeeId) return;
    try {
      const res = await fetch(`${API}/requests?employeeId=${employeeId}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      const myData: Leave[] = (Array.isArray(data) ? data : [])
        .filter((r: { type?: string }) => r.type === "leave")
        .map((r: { 
          id: string;
          employee_id?: string;
          payload?: {
            start_date?: string;
            from?: string;
            end_date?: string;
            to?: string;
            reason?: string;
          };
          start_date?: string;
          end_date?: string;
          reason?: string;
          status?: LeaveStatus;
          created_at?: string;
          first_name?: string;
          last_name?: string;
          photo_url?: string | null;
        }) => {
          const p = r.payload || {};
          return {
            id: r.id,
            employee_id: r.employee_id,
            start_date: (p.start_date || p.from || r.start_date || "").slice(0, 10),
            end_date: (p.end_date || p.to || r.end_date || "").slice(0, 10),
            reason: p.reason || r.reason || "",
            status: r.status || "pending",
            created_at: r.created_at,
            first_name: r.first_name || "",
            last_name: r.last_name || "",
            photo_url: r.photo_url || "/avatar.png",
          };
        });

      // Remove duplicates
      const seen = new Set();
      const unique = myData.filter((r) => {
        const key = `${r.start_date}|${r.end_date}|${r.reason}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Filter out expired approved leaves
      const today = new Date();
      const filtered = unique.filter((r) => {
        if (r.status === "approved" && r.end_date) {
          const end = new Date(r.end_date);
          return end >= new Date(today.toDateString()); // keep if not ended yet
        }
        return true; // keep pending/rejected as usual
      });

      setMyLeaves(filtered);

      // Employees currently on leave
      const onLeaveRes = await fetch(`${API}/requests?type=leave&status=approved`);
      if (onLeaveRes.ok) {
        const data = await onLeaveRes.json();
        setOnLeave(
          (Array.isArray(data) ? data : [])
            .map((r: { 
              id: string;
              payload?: {
                start_date?: string;
                end_date?: string;
                reason?: string;
              };
              start_date?: string;
              end_date?: string;
              reason?: string;
              first_name?: string;
              last_name?: string;
              photo_url?: string | null;
              status?: LeaveStatus;
            }) => {
              const p = r.payload || {};
              return {
                id: r.id,
                start_date: (p.start_date || r.start_date || "").slice(0, 10),
                end_date: (p.end_date || r.end_date || "").slice(0, 10),
                reason: p.reason || r.reason || "",
                first_name: r.first_name || "",
                last_name: r.last_name || "",
                photo_url: r.photo_url || "/avatar.png",
                status: r.status || "approved", // Fixed: provide default value
              };
            })
            // Only show those who are still on leave today
            .filter((r) => {
              const start = new Date(r.start_date);
              const end = new Date(r.end_date);
              return start <= today && end >= today;
            })
        );
      }
    } catch (err) {
      console.error("fetchLeaves error", err);
    }
  }, [employeeId]);

  useEffect(() => {
    if (!employeeId) return;
    fetchLeaves();
    const interval = setInterval(fetchLeaves, 10000); // auto refresh
    return () => clearInterval(interval);
  }, [employeeId, fetchLeaves]);

  const calcDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diff = (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24) + 1;
    return diff > 0 ? diff : 0;
  };

  async function handleSendRequest() {
    if (!reason || !from || !to) {
      alert("Please fill all fields!");
      return;
    }
    if (!employeeId) {
      alert("Employee not found. Please login again.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`${API}/requests/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: employeeId,
          start_date: from,
          end_date: to,
          reason,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchLeaves();
      setReason("");
      setFrom("");
      setTo("");
      setDays(0);
      alert("✅ Leave request submitted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to send leave request");
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this leave request?")) return;
    try {
      const res = await fetch(`${API}/requests/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setMyLeaves((prev) => prev.filter((l) => l.id !== id));
      alert("🗑️ Leave request removed successfully!");
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete request");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl shadow-lg">
              <CalendarDays className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Leave Management</h1>
              <p className="text-slate-600">Request and track your leave applications</p>
            </div>
          </div>
        </div>

        {/* Request Leave Section */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-10">
          <div className="flex items-start gap-6 mb-8">
            <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl">
              <FileText className="text-gray-700" size={32} />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Request a Leave</h2>
              <p className="text-slate-600">Fill in your leave reason and select your date range</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Leave Reason</label>
              <textarea
                className="w-full h-32 resize-none border border-gray-200 rounded-2xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-all shadow-sm"
                placeholder="Enter your reason for leave..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">From Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => {
                      setFrom(e.target.value);
                      setDays(calcDays(e.target.value, to));
                    }}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 pr-12 focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-all shadow-sm"
                  />
                  <Calendar className="absolute right-4 top-3.5 text-gray-400" size={20} />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">To Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => {
                      setTo(e.target.value);
                      setDays(calcDays(from, e.target.value));
                    }}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 pr-12 focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-all shadow-sm"
                  />
                  <Calendar className="absolute right-4 top-3.5 text-gray-400" size={20} />
                </div>
              </div>
              
              {days > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center">
                  <div className="p-2 bg-gray-100 rounded-lg mr-3">
                    <CalendarDays className="text-gray-700" size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">Selected Duration</div>
                    <div className="text-lg font-bold text-gray-700">{days} day{days > 1 && "s"}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleSendRequest}
            disabled={sending}
            className={`w-full py-4 text-lg flex items-center justify-center gap-3 rounded-2xl shadow-lg transition-all transform hover:-translate-y-0.5 ${
              sending
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-gray-950 text-white shadow-lg"
            }`}
          >
            <Send size={20} />
            {sending ? "Sending..." : "Send Leave Request"}
          </button>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Employees on Leave */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl">
                <User className="text-gray-700" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Employees on Leave</h2>
            </div>
            
            {onLeave.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <User className="text-gray-400" size={32} />
                </div>
                <p className="text-slate-500">No employees are currently on leave</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {onLeave.map((emp) => (
                  <div
                    key={emp.id}
                    className="group bg-gradient-to-br from-white to-gray-50 border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="relative mb-4">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md">
                          <Image
                            src={emp.photo_url || "/avatar.png"}
                            alt={emp.first_name || ""}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                            style={{ objectPosition: "center" }}
                          />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                          <BadgeCheck className="text-white" size={12} />
                        </div>
                      </div>
                      <div className="font-bold text-slate-800 text-lg">
                        {emp.first_name} {emp.last_name}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {emp.start_date} → {emp.end_date}
                      </div>
                      <div className="mt-3 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium inline-block">
                        {emp.reason}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Requests */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl">
                <FileText className="text-gray-700" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">My Leave Requests</h2>
            </div>
            
            {myLeaves.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <FileText className="text-gray-400" size={32} />
                </div>
                <p className="text-slate-500">You haven&apos;t submitted any leave requests yet</p>
              </div>
            ) : (
              <div className="space-y-5">
                {myLeaves.map((req) => (
                  <div
                    key={req.id}
                    className={`group relative p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg ${
                      req.status === "approved" 
                        ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-100" 
                        : req.status === "rejected"
                        ? "bg-gradient-to-br from-red-50 to-rose-50 border-red-100"
                        : "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100"
                    }`}
                  >
                    <div className="flex gap-5">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md">
                          <Image
                            src={req.photo_url || "/avatar.png"}
                            alt={req.first_name || "You"}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                            style={{ objectPosition: "center" }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-lg text-slate-800 mb-1">{req.reason}</h3>
                            <div className="flex items-center text-sm text-slate-600 mb-3">
                              <Calendar className="mr-1.5" size={16} />
                              {req.start_date} → {req.end_date}
                            </div>
                            
                            <div className="flex items-center">
                              {req.status === "approved" && (
                                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                  <CheckCircle2 className="mr-1.5" size={16} />
                                  Approved
                                </span>
                              )}
                              {req.status === "pending" && (
                                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                                  <Clock3 className="mr-1.5" size={16} />
                                  Pending
                                </span>
                              )}
                              {req.status === "rejected" && (
                                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                  <XCircle className="mr-1.5" size={16} />
                                  Rejected
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Delete option (only for pending) */}
                          {req.status === "pending" && (
                            <button
                              onClick={() => handleDelete(req.id)}
                              className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors duration-200"
                              title="Remove"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}