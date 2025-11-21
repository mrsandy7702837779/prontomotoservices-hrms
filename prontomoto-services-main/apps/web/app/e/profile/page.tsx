"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

// Use the environment variable FIRST, then fall back to the Azure URL, and finally to localhost
const API =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API ||
  "https://prontomoto-func-001-h8a9fwh0gjdjdpda.centralindia-01.azurewebsites.net/api";
/* ---------- Types (same as before) ---------- */
type Emp = {
  id: string;
  emp_code: string;
  first_name: string;
  last_name: string;
  email?: string;
  mobile?: string;
  address?: string;
  dob?: string | null;
  join_date?: string | null;
  marital_status?: string | null;
  marriage_date?: string | null;
  blood_group?: string | null;
  emergency_name?: string | null;
  emergency_mobile?: string | null;
  job_title?: string | null;
  department?: string | null;
  grad_college?: string | null;
  grad_degree?: string | null;
  grad_year?: number | null;
  inter_college?: string | null;
  inter_course?: string | null;
  inter_year?: number | null;
  photo_url?: string | null;
  project?: string | null;
  manager?: string | null;
  status: string;
  presence: "in" | "out";
  last_seen_ts?: string | null;
};

type Leave = {
  id: string;
  start_date: string;
  end_date: string;
  reason?: string;
  status: string;
  created_at?: string;
};

type Asset = {
  id: string;
  item_name: string;
  item_code?: string;
  issued_on?: string | null;
  returned_on?: string | null;
  status: string;
  notes?: string | null;
};

type Req = {
  id: string;
  type: "profile" | "asset" | string;
  payload: {
    field_name?: string;
    new_value?: string;
    old_value?: string;
    asset_name?: string;
    reason?: string;
  };
  status: "pending" | "approved" | "rejected" | string;
  created_at?: string;
};

/* ---------- Helpers ---------- */
function fmtDate(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return (d || "").slice(0, 10);
  }
}
function fmtTime(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return String(d).slice(11, 16) || "—";
  }
}

/* ---------- UI Components ---------- */
const ProfileHeader = ({ employee, onProfileModalOpen, onAssetModalOpen }: { 
  employee: Emp; 
  onProfileModalOpen: () => void;
  onAssetModalOpen: () => void;
}) => {
  const fullName = `${employee.first_name} ${employee.last_name}`.trim();
  
  return (
    <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            {employee.photo_url ? (
              <Image 
                src={employee.photo_url} 
                alt={fullName} 
                width={80}
                height={80}
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md" 
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-100 border-4 border-white shadow-md flex items-center justify-center">
                <span className="text-xl font-bold text-gray-600">
                  {`${employee.first_name[0] || ""}${employee.last_name[0] || ""}`.toUpperCase()}
                </span>
              </div>
            )}
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${
              employee.presence === "in" ? "bg-green-400" : "bg-amber-400"
            }`}>
              {employee.presence === "in" ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{fullName}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-gray-600">{employee.job_title || "—"}</span>
              {employee.department && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-600">{employee.department}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 mt-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                employee.presence === "in" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-amber-100 text-amber-800"
              }`}>
                {employee.presence === "in" ? `Present • ${fmtTime(employee.last_seen_ts)}` : "Absent"}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {employee.status}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onProfileModalOpen}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium text-sm shadow-sm hover:shadow-md transition-all flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Request Profile Change
          </button>
          <button
            onClick={onAssetModalOpen}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium text-sm shadow-sm hover:shadow-md transition-all flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7H4m10 6v6m4-6a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Request Asset
          </button>
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
    <div className="flex items-start">
      <div className="p-2 bg-gray-50 rounded-lg mr-3">
        {icon}
      </div>
      <div>
        <div className="text-xs text-gray-500 mb-1">{title}</div>
        <div className="font-medium text-gray-800">{value}</div>
      </div>
    </div>
  </div>
);

const PersonalDetailsSection = ({ employee, requests }: { employee: Emp; requests: Req[] }) => {
  const fullName = `${employee.first_name} ${employee.last_name}`.trim();
  const recentRequests = requests.filter(r => r.type === "profile");
  
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-800 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Personal Details
        </h2>
        <span className="text-xs text-gray-500">Read-only</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-4">Basic Information</h3>
          <div className="space-y-4">
            <DetailItem label="Full Name" value={fullName} />
            <DetailItem label="Email" value={employee.email || "—"} />
            <DetailItem label="Mobile" value={employee.mobile || "—"} />
            <DetailItem label="Address" value={employee.address || "—"} />
            <DetailItem label="Date of Birth" value={fmtDate(employee.dob)} />
            <DetailItem label="Blood Group" value={employee.blood_group || "—"} />
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-4">Professional Information</h3>
          <div className="space-y-4">
            <DetailItem label="Employee Code" value={employee.emp_code} />
            <DetailItem label="Job Title" value={employee.job_title || "—"} />
            <DetailItem label="Department" value={employee.department || "—"} />
            <DetailItem label="Project" value={employee.project || "—"} />
            <DetailItem label="Reporting Manager" value={employee.manager || "—"} />
            <DetailItem label="Join Date" value={fmtDate(employee.join_date)} />
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-4">Education</h3>
          <div className="space-y-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">Graduation</div>
              <DetailItem label="Degree" value={employee.grad_degree || "—"} />
              <DetailItem label="College" value={employee.grad_college || "—"} />
              <DetailItem label="Year" value={employee.grad_year ? String(employee.grad_year) : "—"} />
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-4">Emergency Contact</h3>
          <div className="space-y-4">
            <DetailItem label="Emergency Name" value={employee.emergency_name || "—"} />
            <DetailItem label="Emergency Mobile" value={employee.emergency_mobile || "—"} />
          </div>
        </div>
      </div>
      
      {recentRequests.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Recent Profile Change Requests</h3>
          <div className="space-y-3">
            {recentRequests.map((request) => (
              <div 
                key={request.id} 
                className="bg-gray-50 border border-gray-100 rounded-xl p-4 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">
                      {request.payload?.field_name || "Profile Change"}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {request.payload?.new_value || "—"}
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    request.status === "pending" ? "bg-amber-100 text-amber-800" :
                    request.status === "approved" ? "bg-green-100 text-green-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {request.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="text-xs text-gray-500 mb-1">{label}</div>
    <div className="text-sm text-gray-800 font-medium">{value}</div>
  </div>
);

const LeaveCard = ({ leave, onClick }: { leave: Leave; onClick: () => void }) => {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-all cursor-pointer" onClick={onClick}>
      <div className="flex items-start justify-between">
        <div className="flex items-start">
          <div className="p-2 bg-green-50 rounded-lg mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <div className="font-medium text-gray-800">Leave</div>
            <div className="text-sm text-gray-600 mt-1">
              {fmtDate(leave.start_date)} → {fmtDate(leave.end_date)}
            </div>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          leave.status === "approved" ? "bg-green-100 text-green-800" : 
          leave.status === "pending" ? "bg-amber-100 text-amber-800" : 
          "bg-gray-100 text-gray-800"
        }`}>
          {leave.status}
        </div>
      </div>
    </div>
  );
};

const AssetCard = ({ asset, onClick }: { asset: Asset; onClick: () => void }) => {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-all cursor-pointer" onClick={onClick}>
      <div className="flex items-start justify-between">
        <div className="flex items-start">
          <div className="p-2 bg-blue-50 rounded-lg mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7H4m10 6v6m4-6a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <div className="font-medium text-gray-800">{asset.item_name}</div>
            {asset.item_code && (
              <div className="text-sm text-gray-600 mt-1">Code: {asset.item_code}</div>
            )}
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          asset.status === "assigned" ? "bg-blue-100 text-blue-800" : 
          asset.status === "returned" ? "bg-gray-100 text-gray-800" : 
          "bg-purple-100 text-purple-800"
        }`}>
          {asset.status}
        </div>
      </div>
    </div>
  );
};

const ProfileChangeModal = ({ isOpen, onClose, onSubmit, isSubmitting }: { 
  isOpen: boolean; 
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) => {
  const [field, setField] = useState("");
  const [oldValue, setOldValue] = useState("");
  const [newValue, setNewValue] = useState("");
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800">Request Profile Change</h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Field</label>
              <select 
                value={field} 
                onChange={(e) => setField(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-100 focus:border-gray-400 outline-none transition-all"
              >
                <option value="">Select a field</option>
                <option value="email">Email</option>
                <option value="mobile">Mobile</option>
                <option value="address">Address</option>
                <option value="emergency_name">Emergency Name</option>
                <option value="emergency_mobile">Emergency Mobile</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Old Value (Optional)</label>
              <input 
                type="text" 
                value={oldValue} 
                onChange={(e) => setOldValue(e.target.value)}
                placeholder="Current value"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-100 focus:border-gray-400 outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Value</label>
              <input 
                type="text" 
                value={newValue} 
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="New value"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-100 focus:border-gray-400 outline-none transition-all"
              />
            </div>
            
            <div className="flex gap-3 pt-2">
              <button 
                onClick={onSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </button>
              <button 
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AssetRequestModal = ({ isOpen, onClose, onSubmit, isSubmitting }: { 
  isOpen: boolean; 
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) => {
  const [assetName, setAssetName] = useState("");
  const [reason, setReason] = useState("");
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800">Request Asset</h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asset Name</label>
              <input 
                type="text" 
                value={assetName} 
                onChange={(e) => setAssetName(e.target.value)}
                placeholder="e.g., Laptop, Monitor, etc."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-100 focus:border-gray-400 outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <textarea 
                value={reason} 
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why do you need this asset?"
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-100 focus:border-gray-400 outline-none transition-all"
              />
            </div>
            
            <div className="flex gap-3 pt-2">
              <button 
                onClick={onSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </button>
              <button 
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailPopup = ({ 
  isOpen, 
  onClose, 
  title, 
  children 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-3">
            {children}
          </div>
          
          <div className="mt-6">
            <button 
              onClick={onClose}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- Component ---------- */
export default function EmployeeProfilePage() {
  const [emp, setEmp] = useState<Emp | null>(null);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [requests, setRequests] = useState<Req[]>([]);

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [sendingProfileReq, setSendingProfileReq] = useState(false);
  const [sendingAssetReq, setSendingAssetReq] = useState(false);
  
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // prevent hydration mismatch — read localStorage on client only
  const [employeeIdState, setEmployeeIdState] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    setEmployeeIdState(typeof window !== "undefined" ? localStorage.getItem("employee_id") : null);
  }, []);

  async function fetchAll(employeeId: string | null | undefined) {
    if (!employeeId) {
      setEmp(null);
      setLeaves([]);
      setAssets([]);
      setRequests([]);
      return;
    }
    try {
      const [eRes, lRes, aRes, rRes] = await Promise.all([
        fetch(`${API}/employees/${employeeId}`),
        fetch(`${API}/leaves/${employeeId}`),
        fetch(`${API}/assets/${employeeId}`),
        fetch(`${API}/requests?employeeId=${encodeURIComponent(employeeId)}`),
      ]);

      if (eRes.ok) setEmp(await eRes.json());
      else setEmp(null);

      if (lRes.ok) {
        const l = await lRes.json();
        setLeaves(Array.isArray(l) ? l : l.leaves ?? []);
      } else setLeaves([]);

      if (aRes.ok) {
        const a = await aRes.json();
        setAssets(Array.isArray(a) ? a : a.assets ?? []);
      } else setAssets([]);

      if (rRes.ok) {
        const rr = await rRes.json();
        setRequests(Array.isArray(rr) ? rr : rr.requests ?? []);
      } else setRequests([]);
    } catch (err) {
      console.error("fetchAll error", err);
    }
  }

  useEffect(() => {
    if (employeeIdState === undefined) return;
    fetchAll(employeeIdState);
    const t = window.setInterval(() => fetchAll(employeeIdState), 5000);
    return () => clearInterval(t);
  }, [employeeIdState]);

  // Modal handlers
  const handleProfileModalOpen = () => setProfileModalOpen(true);
  const handleAssetModalOpen = () => setAssetModalOpen(true);
  
  const handleProfileModalClose = () => setProfileModalOpen(false);
  const handleAssetModalClose = () => setAssetModalOpen(false);
  
  const handleProfileSubmit = async () => {
    if (!employeeIdState) return alert("No employee id found. Login again.");
    setSendingProfileReq(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert("Profile change request submitted successfully");
      handleProfileModalClose();
      fetchAll(employeeIdState);
    } catch {
      alert("Failed to submit profile change request");
    } finally {
      setSendingProfileReq(false);
    }
  };
  
  const handleAssetSubmit = async () => {
    if (!employeeIdState) return alert("No employee id found. Login again.");
    setSendingAssetReq(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert("Asset request submitted successfully");
      handleAssetModalClose();
      fetchAll(employeeIdState);
    } catch {
      alert("Failed to submit asset request");
    } finally {
      setSendingAssetReq(false);
    }
  };

  // Detail popup handlers
  const handleLeaveClick = (leave: Leave) => setSelectedLeave(leave);
  const handleAssetClick = (asset: Asset) => setSelectedAsset(asset);
  
  const handleDetailPopupClose = () => {
    setSelectedLeave(null);
    setSelectedAsset(null);
  };

  // SSR -> client mismatch guard
  if (employeeIdState === undefined) return <div className="p-6 text-gray-600">Loading…</div>;
  if (!employeeIdState) return <div className="p-6 text-gray-600">Please login to view your profile.</div>;
  if (!emp) return <div className="p-6 text-gray-600">Loading profile…</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <ProfileHeader 
          employee={emp} 
          onProfileModalOpen={handleProfileModalOpen}
          onAssetModalOpen={handleAssetModalOpen}
        />
        
        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <InfoCard 
            title="Employee Code" 
            value={emp.emp_code} 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 10-4 0v1m4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
            }
          />
          <InfoCard 
            title="Joined" 
            value={fmtDate(emp.join_date)} 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
          <InfoCard 
            title="Requests" 
            value={`${requests.length} total`} 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
        </div>
        
        {/* Personal Details Section */}
        <PersonalDetailsSection employee={emp} requests={requests} />
        
        {/* Leaves and Assets Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Leaves Section */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Approved Leaves
              </h2>
              <span className="text-sm text-gray-500">{leaves.length} leaves</span>
            </div>
            
            {leaves.length === 0 ? (
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500">No approved leaves</p>
              </div>
            ) : (
              <div className="space-y-4">
                {leaves.map((leave) => (
                  <LeaveCard 
                    key={leave.id} 
                    leave={leave} 
                    onClick={() => handleLeaveClick(leave)} 
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Assets Section */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7H4m10 6v6m4-6a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Assigned Assets
              </h2>
              <span className="text-sm text-gray-500">{assets.length} assets</span>
            </div>
            
            {assets.length === 0 ? (
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7H4m10 6v6m4-6a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="text-gray-500">No assets assigned</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assets.map((asset) => (
                  <AssetCard 
                    key={asset.id} 
                    asset={asset} 
                    onClick={() => handleAssetClick(asset)} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <ProfileChangeModal 
        isOpen={profileModalOpen} 
        onClose={handleProfileModalClose}
        onSubmit={handleProfileSubmit}
        isSubmitting={sendingProfileReq}
      />
      
      <AssetRequestModal 
        isOpen={assetModalOpen} 
        onClose={handleAssetModalClose}
        onSubmit={handleAssetSubmit}
        isSubmitting={sendingAssetReq}
      />
      
      {/* Detail Popups */}
      <DetailPopup
        isOpen={selectedLeave !== null}
        onClose={handleDetailPopupClose}
        title="Leave Details"
      >
        {selectedLeave && (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">From</span>
              <span className="text-sm font-medium">{fmtDate(selectedLeave.start_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">To</span>
              <span className="text-sm font-medium">{fmtDate(selectedLeave.end_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Reason</span>
              <span className="text-sm font-medium">{selectedLeave.reason || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Status</span>
              <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                selectedLeave.status === "approved" ? "bg-green-100 text-green-800" : 
                selectedLeave.status === "pending" ? "bg-amber-100 text-amber-800" : 
                "bg-gray-100 text-gray-800"
              }`}>
                {selectedLeave.status}
              </span>
            </div>
          </div>
        )}
      </DetailPopup>
      
      <DetailPopup
        isOpen={selectedAsset !== null}
        onClose={handleDetailPopupClose}
        title="Asset Details"
      >
        {selectedAsset && (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Item Name</span>
              <span className="text-sm font-medium">{selectedAsset.item_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Item Code</span>
              <span className="text-sm font-medium">{selectedAsset.item_code || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Issued On</span>
              <span className="text-sm font-medium">{fmtDate(selectedAsset.issued_on)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Returned On</span>
              <span className="text-sm font-medium">{fmtDate(selectedAsset.returned_on)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Status</span>
              <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                selectedAsset.status === "assigned" ? "bg-blue-100 text-blue-800" : 
                selectedAsset.status === "returned" ? "bg-gray-100 text-gray-800" : 
                "bg-purple-100 text-purple-800"
              }`}>
                {selectedAsset.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Notes</span>
              <span className="text-sm font-medium">{selectedAsset.notes || "—"}</span>
            </div>
          </div>
        )}
      </DetailPopup>
    </div>
  );
}