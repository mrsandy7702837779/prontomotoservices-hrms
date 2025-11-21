"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Check, X, Edit3, PackagePlus, RefreshCw, Clock, User, FileText, Package } from "lucide-react"; // Removed unused Eye
import { useRouter } from "next/navigation";

type RequestType = "leave" | "profile" | "asset";
type RequestStatus = "pending" | "approved" | "rejected";

type RequestPayload = {
  start_date?: string;
  end_date?: string;
  reason?: string;
  field?: string;
  field_name?: string;
  new_value?: string;
  newValue?: string;
  new?: Record<string, unknown>;
  old_value?: string;
  oldValue?: string;
  old?: Record<string, unknown>;
  asset_name?: string;
  item_code?: string;
};

type Request = {
  id: string;
  employee_id: string;
  type: RequestType;
  emp_code?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string | null;
  reason?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  payload?: RequestPayload; // Fixed type
  status: RequestStatus;
  created_at?: string;
};

// Use the environment variable FIRST, then fall back to the Azure URL, and finally to localhost
const API =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API ||
  "https://prontomoto-func-001-h8a9fwh0gjdjdpda.centralindia-01.azurewebsites.net/api";

export default function RequestManagement() {
  const router = useRouter();
  const [active, setActive] = useState<Request | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function fetchRequests() {
    try {
      setLoading(true);
      const res = await fetch(`${API}/requests`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("fetchRequests error", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  const byType = useMemo(() => {
    const now = new Date();
    const daysOld = (d?: string) => {
      if (!d) return Infinity;
      const created = new Date(d);
      return (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    };

    const leave = requests.filter((r) => r.type === "leave" && r.status === "pending");
    const profile = requests.filter((r) => r.type === "profile" && r.status === "pending");
    const asset = requests.filter((r) => r.type === "asset" && r.status === "pending");

    // Hide approved/rejected older than 3 days
    const processed = requests.filter(
      (r) => r.status !== "pending" && daysOld(r.created_at) <= 3
    );

    return { leave, profile, asset, processed };
  }, [requests]);

  async function handleAction(req: Request, status: RequestStatus) {
    if (!req?.id) return;
    if (!confirm(`Confirm ${status.toUpperCase()} for this request?`)) return;

    setBusyId(req.id);
    try {
      const res = await fetch(`${API}/requests/${encodeURIComponent(req.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(await res.text());
      const j = await res.json();
      const updatedRequest: Request = j?.request || { ...req, status };

      setRequests((prev) => {
        const others = prev.filter((p) => p.id !== req.id);
        return [updatedRequest, ...others];
      });

      setActive(null);
    } catch (err: unknown) { // Fixed type
      console.error("handleAction error", err);
      alert("Action failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setBusyId(null);
    }
  }

  const sections: { 
    title: string; 
    key: keyof typeof byType; 
    icon: React.ReactNode;
  }[] = [
    { 
      title: "Leave Requests", 
      key: "leave", 
      icon: <Clock className="h-5 w-5 text-gray-600" />
    },
    { 
      title: "Profile Change Requests", 
      key: "profile", 
      icon: <User className="h-5 w-5 text-gray-600" />
    },
    { 
      title: "Asset Requests", 
      key: "asset", 
      icon: <Package className="h-5 w-5 text-gray-600" />
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FileText className="h-6 w-6 text-gray-600" />
                Request Management
              </h1>
              <p className="text-gray-600 mt-1">Approve, reject, or view employee requests</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchRequests}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                <span className="text-gray-700">Refresh</span>
              </button>
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                {requests.length} requests
              </div>
            </div>
          </div>
        </div>

        {/* Request Sections */}
        <div className="grid lg:grid-cols-3 gap-6">
          {sections.map((sec) => {
            const pending = byType[sec.key]; // Fixed type
            const processed = byType.processed.filter((r) => r.type === sec.key);

            return (
              <div key={sec.key} className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  {sec.icon}
                  <h2 className="text-lg font-semibold text-gray-800">{sec.title}</h2>
                </div>

                {/* Pending Requests */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-500">Pending</h3>
                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                      {pending.length}
                    </span>
                  </div>
                  
                  {pending.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="text-gray-500 text-sm">No pending requests</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {pending.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => setActive(r)}
                          className="flex flex-col items-center p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300"
                        >
                          <div className="relative mb-3">
                            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm">
                              <Image
                                src={r.photo_url || "/avatar.png"}
                                alt={r.first_name || "employee"}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-400 border-2 border-white flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-white"></div>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium text-gray-800 truncate w-full">
                              {r.first_name ?? "—"}
                            </div>
                            <div className="text-xs text-gray-500">{r.emp_code ?? ""}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Processed Requests */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-500">Processed</h3>
                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                      {processed.length}
                    </span>
                  </div>
                  
                  {processed.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="text-gray-500 text-sm">No processed requests</div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {processed.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => setActive(r)}
                          className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-colors ${
                            r.status === "approved"
                              ? "bg-green-50 border-green-200 hover:bg-green-100"
                              : "bg-red-50 border-red-200 hover:bg-red-100"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
                              <Image
                                src={r.photo_url || "/avatar.png"}
                                width={40}
                                height={40}
                                alt={r.first_name || ""}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-medium text-gray-800">
                                {r.first_name ?? "—"} <span className="text-gray-500">({r.emp_code ?? ""})</span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}
                              </div>
                            </div>
                          </div>
                          <div className={`flex items-center gap-1 text-xs font-semibold uppercase px-2 py-1 rounded-full ${
                            r.status === "approved" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                          }`}>
                            {r.status}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {active && (
        <Modal
          req={active}
          close={() => setActive(null)}
          action={handleAction}
          navigate={(p) => router.push(p)}
          busyId={busyId}
        />
      )}
    </div>
  );
}

/* ------------------- MODAL ------------------- */
function Modal({
  req,
  close,
  action,
  navigate,
  busyId,
}: {
  req: Request;
  close: () => void;
  action: (req: Request, status: RequestStatus) => void;
  navigate: (path: string) => void;
  busyId: string | null;
}) {
  const { type, emp_code, first_name, last_name, photo_url, employee_id } = req;
  const name = `${first_name ?? ""} ${last_name ?? ""}`.trim();
  const payload = req.payload || {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-lg">
                <Image 
                  src={photo_url || "/avatar.png"} 
                  width={64} 
                  height={64} 
                  alt={name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{name || "—"}</h2>
                <div className="text-sm text-gray-600">{emp_code ?? ""}</div>
                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {req.created_at ? new Date(req.created_at).toLocaleString() : ""}
                </div>
              </div>
            </div>
            <button 
              onClick={close}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {type === "leave" && (
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Leave Request Details
              </h3>
              {(() => {
                const start = req.start_date || payload?.start_date;
                const end = req.end_date || payload?.end_date;
                let total = 0;
                if (start && end) {
                  const s = new Date(start);
                  const e = new Date(end);
                  total = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                }
                return (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">From</div>
                      <div className="font-medium text-gray-800">{start || "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">To</div>
                      <div className="font-medium text-gray-800">{end || "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Total Days</div>
                      <div className="font-medium text-gray-800">{total > 0 ? total : "1"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Reason</div>
                      <div className="font-medium text-gray-800">{req.reason || payload?.reason || "—"}</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {type === "profile" && (
            <div>
              <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Change Summary
              </h3>

              {(
                payload && typeof payload === "object" && (payload.new && Object.keys(payload.new || {}).length > 0)
              ) ? (
                <div className="space-y-3">
                  {(Object.keys(payload.new || {}) as string[]).map((key) => (
                    <div key={key} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="text-xs text-gray-500 uppercase mb-2">{key}</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Old</div>
                          <div className="text-sm text-gray-800">{String(payload.old?.[key] ?? "—")}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">New</div>
                          <div className="text-sm text-gray-800">{String(payload.new?.[key] ?? "—")}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                (() => {
                  const field = payload.field || payload.field_name || null;
                  const newVal = payload.new_value ?? payload.newValue ?? payload.new ?? null;
                  const oldVal = payload.old_value ?? payload.oldValue ?? payload.old ?? null;
                  if (!field) {
                    return <div className="text-sm text-gray-500 bg-gray-50 rounded-xl p-4">No preview data.</div>;
                  }
                  return (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="text-xs text-gray-500 uppercase mb-2">{String(field)}</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Old</div>
                          <div className="text-sm text-gray-800">{String(oldVal ?? "—")}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">New</div>
                          <div className="text-sm text-gray-800">{String(newVal ?? "—")}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {type === "asset" && (
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Asset Request Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Asset</div>
                  <div className="font-medium text-gray-800">{String(payload.asset_name ?? "—")}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Item Code</div>
                  <div className="font-medium text-gray-800">{String(payload.item_code ?? "—")}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-gray-500 mb-1">Reason</div>
                  <div className="font-medium text-gray-800">{String(req.reason ?? payload.reason ?? "—")}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions (only show for pending) */}
        {req.status === "pending" && (
          <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
            {type === "profile" && (
              <button
                onClick={() => {
                  close();
                  if (employee_id) navigate(`/a/employees/${encodeURIComponent(employee_id)}`);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Edit3 size={16} />
                <span className="text-gray-700">Edit</span>
              </button>
            )}

            {type === "asset" && (
              <button
                onClick={() => {
                  close();
                  if (employee_id) navigate(`/a/assets/new?employee_id=${encodeURIComponent(employee_id)}`);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <PackagePlus size={16} />
                <span className="text-gray-700">Add Asset</span>
              </button>
            )}

            <button
              onClick={() => action(req, "rejected")}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              disabled={busyId === req.id}
            >
              <X size={16} />
              <span className="text-gray-700">Reject</span>
            </button>

            <button
              onClick={() => action(req, "approved")}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-colors"
              disabled={busyId === req.id}
            >
              <Check size={16} />
              <span>Approve</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}