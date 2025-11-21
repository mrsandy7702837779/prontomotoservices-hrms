"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from 'next/image';

// Use the environment variable FIRST, then fall back to the Azure URL, and finally to localhost
const API =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API ||
  "https://prontomoto-func-001-h8a9fwh0gjdjdpda.centralindia-01.azurewebsites.net/api";

/* =========================
   Types
========================= */
type Emp = {
  id: string;
  emp_code: string;
  first_name: string;
  last_name: string;
  email?: string;
  mobile?: string;
  address?: string;
  dob?: string;
  join_date?: string;
  marital_status?: string;
  marriage_date?: string;
  blood_group?: string;
  emergency_name?: string;
  emergency_mobile?: string;
  job_title?: string;
  department?: string;
  grad_college?: string;
  grad_degree?: string;
  grad_year?: number;
  inter_college?: string;
  inter_course?: string;
  inter_year?: number;
  photo_url?: string;
  project?: string;
  manager?: string;
  status: string;
  presence: "in" | "out";
  last_seen_ts?: string;
};

type Leave = {
  id: string;
  start_date: string;
  end_date: string;
  reason?: string;
  status: string;
  created_at: string;
};

type Asset = {
  id: string;
  item_name: string;
  item_code?: string;
  issued_on?: string;
  returned_on?: string;
  status: string;
  notes?: string;
};

// Define proper types for form and diff
type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  address: string;
  dob: string;
  join_date: string;
  marital_status: string;
  marriage_date: string;
  blood_group: string;
  emergency_name: string;
  emergency_mobile: string;
  job_title: string;
  department: string;
  grad_college: string;
  grad_degree: string;
  grad_year: string;
  inter_college: string;
  inter_course: string;
  inter_year: string;
  photo_url: string;
};

type DiffState = {
  [key in keyof FormState]?: FormState[key] | null;
};

/* =========================
   Page
========================= */
export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<"personal" | "leaves" | "assets">("personal");
  const [emp, setEmp] = useState<Emp | null>(null);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [openLeave, setOpenLeave] = useState<Leave | null>(null);

  // Edit drawer state
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Edit form state
  const [form, setForm] = useState<FormState>({
    first_name: "",
    last_name: "",
    email: "",
    mobile: "",
    address: "",
    dob: "",
    join_date: "",
    marital_status: "",
    marriage_date: "",
    blood_group: "",
    emergency_name: "",
    emergency_mobile: "",
    job_title: "",
    department: "",
    grad_college: "",
    grad_degree: "",
    grad_year: "",
    inter_college: "",
    inter_course: "",
    inter_year: "",
    photo_url: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const photoPreview = useMemo(
    () => (photoFile ? URL.createObjectURL(photoFile) : null),
    [photoFile]
  );

  async function load() {
    const [e, l, a] = await Promise.all([
      fetch(`${API}/employees/${id}`).then((r) => r.json()),
      fetch(`${API}/employees/${id}/leaves`).then((r) => r.json()),
      fetch(`${API}/employees/${id}/assets`).then((r) => r.json()),
    ]);
    setEmp(e);
    setLeaves(l);
    setAssets(a);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!emp) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-400 mb-4"></div>
      <p className="text-gray-600 font-medium">Loading employee profile...</p>
    </div>
  </div>;
  
  const fullName = `${emp.first_name} ${emp.last_name}`.trim();

  /* ---------------- Edit helpers ---------------- */
  function openEdit() {
    if (!emp) return;
    setErr(null);
    setPhotoFile(null);
    setForm({
      first_name: emp.first_name || "",
      last_name: emp.last_name || "",
      email: emp.email || "",
      mobile: emp.mobile || "",
      address: emp.address || "",
      dob: (emp.dob || "").slice(0, 10),
      join_date: (emp.join_date || "").slice(0, 10),
      marital_status: emp.marital_status || "",
      marriage_date: (emp.marriage_date || "").slice(0, 10),
      blood_group: emp.blood_group || "",
      emergency_name: emp.emergency_name || "",
      emergency_mobile: emp.emergency_mobile || "",
      job_title: emp.job_title || "",
      department: emp.department || "",
      grad_college: emp.grad_college || "",
      grad_degree: emp.grad_degree || "",
      grad_year: emp.grad_year ? String(emp.grad_year) : "",
      inter_college: emp.inter_college || "",
      inter_course: emp.inter_course || "",
      inter_year: emp.inter_year ? String(emp.inter_year) : "",
      photo_url: emp.photo_url || "",
    });
    setEditOpen(true);
  }

  function up<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  async function uploadPhotoIfAny() {
    if (!photoFile) return undefined;
    const res = await fetch(`${API}/photos`, {
      method: "POST",
      headers: { "Content-Type": photoFile.type, "x-file-name": photoFile.name },
      body: photoFile,
    });
    if (!res.ok) throw new Error("Photo upload failed");
    const j = await res.json();
    return j.url as string; // SAS URL
  }

  // Build partial update (diff only)
  function buildDiff(): DiffState {
    if (!emp) return {};
    const diff: DiffState = {};

    const setIfChanged = <K extends keyof FormState>(key: K, newVal: FormState[K]) => {
      const current = (emp as unknown as Record<string, unknown>)[String(key)];
      
      // normalize numbers
      if (key === "grad_year" || key === "inter_year") {
        const numNew = newVal ? Number(newVal) : null;
        if ((current ?? null) !== (numNew ?? null)) {
          // Fixed: Convert number to string for diff
          diff[key] = numNew !== null ? String(numNew) : null;
        }
      } else if (
  key === "dob" ||
  key === "join_date" ||
  key === "marriage_date"
) {
  // Keep only date string, no timezone shift
  const newStr = newVal ? String(newVal).slice(0, 10) : null;
  const curStr = current ? String(current).slice(0, 10) : null;
  if (curStr !== newStr) {
    diff[key] = newStr; // always YYYY-MM-DD plain string
  }
}
 else {
        const newStr = (newVal as unknown) || "";
        const curStr = (current as unknown) || "";
        if (newStr !== curStr) diff[key] = newVal || null;
      }
    };

    (Object.keys(form) as (keyof FormState)[]).forEach((k) =>
      setIfChanged(k, form[k])
    );
    return diff;
  }

  async function saveEdit() {
    setErr(null);
    setSaving(true);
    try {
      // 1) upload photo first if chosen
      const uploadedUrl = await uploadPhotoIfAny();
      if (uploadedUrl) {
        up("photo_url", uploadedUrl);
      }

      // 2) compute diff (after photo maybe set)
      const diff = buildDiff();
      if (uploadedUrl) diff.photo_url = uploadedUrl;

      if (Object.keys(diff).length === 0) {
        setSaving(false);
        setEditOpen(false);
        return;
      }
       console.log("🟦 Sending diff:", JSON.stringify(diff, null, 2));

      // 3) PATCH update
      const res = await fetch(`${API}/employees/${emp!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(diff),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t);
      }
      const j = await res.json();

      // 4) refresh local view with returned employee or reload
      const updated: Emp =
        j?.employee ||
        (await fetch(`${API}/employees/${id}`).then((r) => r.json()));

      setEmp(updated);
      setEditOpen(false);
    } catch (e: unknown) {
      console.error(e);
      setErr(e instanceof Error ? e.message : "Failed to update employee");
    } finally {
      setSaving(false);
    }
  }

  /* =========================
     Render
  ========================= */
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Card + Edit Button */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-5">
              {emp.photo_url ? (
                <Image
                  src={emp.photo_url}
                  alt={emp.first_name || "Employee"}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-800 text-white flex items-center justify-center text-xl font-bold shadow-md">
                  {`${emp.first_name[0] || ""}${emp.last_name[0] || ""}`.toUpperCase()}
                </div>
              )}

              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {fullName} <span className="text-gray-400 font-normal">•</span> <span className="text-gray-600 font-normal">{emp.emp_code}</span>
                </div>
                <div className="text-gray-600 mt-1">
                  {emp.job_title || "—"} {emp.department ? <span className="text-gray-400">•</span> : null}{" "}
                  {emp.department || ""}
                </div>
                <div className="flex flex-wrap gap-3 mt-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    {emp.project ? <span>📁 {emp.project}</span> : "No Project"}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    {emp.manager ? <span>👤 {emp.manager}</span> : "No Manager"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                emp.presence === "in" 
                  ? "bg-gray-900 text-white" 
                  : "bg-gray-200 text-gray-700"
              }`}>
                {emp.presence === "in" ? "Present" : "Absent"}
              </span>
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                {emp.status}
              </span>
              <button 
                className="px-5 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-medium transition-colors shadow-md"
                onClick={openEdit}
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-8">
          <button 
            className={`px-5 py-3 font-medium text-sm rounded-t-lg transition-colors ${
              tab === "personal" 
                ? "text-gray-900 border-b-2 border-gray-900 bg-white" 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
            onClick={() => setTab("personal")}
          >
            Personal Details
          </button>
          <button 
            className={`px-5 py-3 font-medium text-sm rounded-t-lg transition-colors ${
              tab === "leaves" 
                ? "text-gray-900 border-b-2 border-gray-900 bg-white" 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
            onClick={() => setTab("leaves")}
          >
            Leaves
          </button>
          <button 
            className={`px-5 py-3 font-medium text-sm rounded-t-lg transition-colors ${
              tab === "assets" 
                ? "text-gray-900 border-b-2 border-gray-900 bg-white" 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
            onClick={() => setTab("assets")}
          >
            Assets
          </button>
        </div>

        {/* Personal */}
        {tab === "personal" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-800">📌</span>
                  Personal Information
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between pb-3 border-b border-gray-100">
                    <span className="text-gray-600">Full Name</span>
                    <span className="font-medium text-gray-800">{fullName}</span>
                  </div>
                  <div className="flex justify-between pb-3 border-b border-gray-100">
                    <span className="text-gray-600">Employee Code</span>
                    <span className="font-medium text-gray-800">{emp.emp_code}</span>
                  </div>
                  <div className="flex justify-between pb-3 border-b border-gray-100">
                    <span className="text-gray-600">Email</span>
                    <span className="font-medium text-gray-800">{emp.email || "—"}</span>
                  </div>
                  <div className="flex justify-between pb-3 border-b border-gray-100">
                    <span className="text-gray-600">Mobile</span>
                    <span className="font-medium text-gray-800">{emp.mobile || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Address</span>
                    <span className="font-medium text-gray-800 text-right max-w-xs">{emp.address || "—"}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-800">🏢</span>
                  Employment
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between pb-3 border-b border-gray-100">
                    <span className="text-gray-600">Job Title</span>
                    <span className="font-medium text-gray-800">{emp.job_title || "—"}</span>
                  </div>
                  <div className="flex justify-between pb-3 border-b border-gray-100">
                    <span className="text-gray-600">Department</span>
                    <span className="font-medium text-gray-800">{emp.department || "—"}</span>
                  </div>
                  <div className="flex justify-between pb-3 border-b border-gray-100">
                    <span className="text-gray-600">Date of Joining</span>
                    <span className="font-medium text-gray-800">{emp.join_date || "—"}</span>
                  </div>
                  <div className="flex justify-between pb-3 border-b border-gray-100">
                    <span className="text-gray-600">Project</span>
                    <span className="font-medium text-gray-800">{emp.project || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reporting Manager</span>
                    <span className="font-medium text-gray-800">{emp.manager || "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-800">🎂</span>
                  Important Dates
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between pb-3 border-b border-gray-100">
                    <span className="text-gray-600">Date of Birth</span>
                    <span className="font-medium text-gray-800">{emp.dob || "—"}</span>
                  </div>
                  <div className="flex justify-between pb-3 border-b border-gray-100">
                    <span className="text-gray-600">Marital Status</span>
                    <span className="font-medium text-gray-800">{emp.marital_status || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Marriage Date</span>
                    <span className="font-medium text-gray-800">{emp.marriage_date || "—"}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-800">🩺</span>
                  Health & Emergency
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between pb-3 border-b border-gray-100">
                    <span className="text-gray-600">Blood Group</span>
                    <span className="font-medium text-gray-800">{emp.blood_group || "—"}</span>
                  </div>
                  <div className="flex justify-between pb-3 border-b border-gray-100">
                    <span className="text-gray-600">Emergency Contact</span>
                    <span className="font-medium text-gray-800">{emp.emergency_name || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Emergency Mobile</span>
                    <span className="font-medium text-gray-800">{emp.emergency_mobile || "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-800">🎓</span>
                  Graduation
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between pb-3 border-b border-gray-100">
                    <span className="text-gray-600">Degree</span>
                    <span className="font-medium text-gray-800">{emp.grad_degree || "—"}</span>
                  </div>
                  <div className="flex justify-between pb-3 border-b border-gray-100">
                    <span className="text-gray-600">College</span>
                    <span className="font-medium text-gray-800">{emp.grad_college || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Year of Passout</span>
                    <span className="font-medium text-gray-800">{emp.grad_year || "—"}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-800">📘</span>
                  Intermediate / Diploma
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between pb-3 border-b border-gray-100">
                    <span className="text-gray-600">Course</span>
                    <span className="font-medium text-gray-800">{emp.inter_course || "—"}</span>
                  </div>
                  <div className="flex justify-between pb-3 border-b border-gray-100">
                    <span className="text-gray-600">College</span>
                    <span className="font-medium text-gray-800">{emp.inter_college || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Year of Passout</span>
                    <span className="font-medium text-gray-800">{emp.inter_year || "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaves */}
        {tab === "leaves" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Leave Requests</h2>
            </div>
            {leaves.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">No leave requests</h3>
                <p className="text-gray-600 max-w-md mx-auto">This employee hasn&apos;t submitted any leave requests yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {leaves.map((l) => (
                  <li key={l.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-800">
                          {l.start_date} → {l.end_date}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{l.reason || "—"}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            l.status === "approved" 
                              ? "bg-gray-900 text-white" 
                              : l.status === "rejected" 
                                ? "bg-gray-200 text-gray-800" 
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {l.status}
                        </span>
                        <button 
                          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                          onClick={() => setOpenLeave(l)}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Assets */}
        {tab === "assets" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Assigned Assets</h2>
            </div>
            {assets.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">No assets assigned</h3>
                <p className="text-gray-600 max-w-md mx-auto">This employee doesn&apos;t have any assets assigned to them.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {assets.map((a) => (
                  <li key={a.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-800">
                          {a.item_name}
                          {a.item_code ? ` • ${a.item_code}` : ""}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Issued On: {a.issued_on || "—"}</div>
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {a.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Leave Modal */}
        {openLeave && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="text-lg font-semibold text-gray-800">Leave Details</div>
                <button 
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => setOpenLeave(null)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <div className="text-sm text-gray-600 mb-1">Reason</div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[60px]">
                    {openLeave.reason || "—"}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Start Date</div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 font-medium">
                      {openLeave.start_date}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">End Date</div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 font-medium">
                      {openLeave.end_date}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== Edit Drawer ===================== */}
        {editOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* backdrop */}
            <div 
              className="flex-1 bg-black/30 backdrop-blur-sm" 
              onClick={() => setEditOpen(false)} 
            />
            {/* drawer */}
            <div className="w-full max-w-2xl h-full bg-white shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-in-out">
              <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-5 flex items-center justify-between">
                <div className="text-xl font-bold text-gray-800">Edit Employee</div>
                <div className="flex gap-3">
                  <button 
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={() => setEditOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-medium transition-colors"
                    onClick={saveEdit}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>

              {err && (
                <div className="m-5 p-4 rounded-xl bg-gray-100 border border-gray-300 text-gray-800 text-sm">
                  {err}
                </div>
              )}

              <div className="p-5 space-y-8">
                {/* Summary & Photo */}
                <div className="bg-gray-50 rounded-2xl p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0">
                      {/* photo preview / current */}
                      {photoPreview || form.photo_url ? (
                        <Image
                          src={photoPreview || form.photo_url}
                          alt={form.first_name || "Employee"}
                          width={96}
                          height={96}
                          className="w-24 h-24 rounded-full object-cover border-2 border-white shadow-md"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold text-xl shadow-md">
                          {(form.first_name?.[0] || "").toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">First Name</div>
                          <input
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm"
                            value={form.first_name}
                            onChange={(e) => up("first_name", e.target.value)}
                          />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">Last Name</div>
                          <input
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm"
                            value={form.last_name}
                            onChange={(e) => up("last_name", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">Position / Role</div>
                          <input
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm"
                            value={form.job_title}
                            onChange={(e) => up("job_title", e.target.value)}
                          />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">Department</div>
                          <input
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm"
                            value={form.department}
                            onChange={(e) => up("department", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">Employee ID</div>
                          <input 
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-600 shadow-sm" 
                            value={emp.emp_code} 
                            readOnly 
                          />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">Change Photo</div>
                          <input
                            type="file"
                            accept="image/*"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm"
                            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-5">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Email</div>
                      <input 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm" 
                        value={form.email} 
                        onChange={(e) => up("email", e.target.value)} 
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Mobile</div>
                      <input 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm" 
                        value={form.mobile} 
                        onChange={(e) => up("mobile", e.target.value)} 
                      />
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-sm font-medium text-gray-700 mb-1">Address</div>
                      <textarea 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm" 
                        rows={3} 
                        value={form.address} 
                        onChange={(e) => up("address", e.target.value)} 
                      />
                    </div>
                  </div>
                </div>

                {/* Dates & Marital */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-5">Important Dates</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Date of Birth</div>
                      <input 
                        type="date" 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm" 
                        value={form.dob} 
                        onChange={(e) => up("dob", e.target.value)} 
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Date of Joining</div>
                      <input 
                        type="date" 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm" 
                        value={form.join_date} 
                        onChange={(e) => up("join_date", e.target.value)} 
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Blood Group</div>
                      <input 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm" 
                        value={form.blood_group} 
                        onChange={(e) => up("blood_group", e.target.value)} 
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Marital Status</div>
                      <select
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm"
                        value={form.marital_status}
                        onChange={(e) => up("marital_status", e.target.value)}
                      >
                        <option value="">Select</option>
                        <option value="single">Single</option>
                        <option value="married">Married</option>
                      </select>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Marriage Date</div>
                      <input
                        type="date"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm disabled:bg-gray-100 disabled:text-gray-500"
                        value={form.marriage_date}
                        onChange={(e) => up("marriage_date", e.target.value)}
                        disabled={form.marital_status !== "married"}
                      />
                    </div>
                  </div>
                </div>

                {/* Emergency */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-5">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Emergency Name</div>
                      <input
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm"
                        value={form.emergency_name}
                        onChange={(e) => up("emergency_name", e.target.value)}
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Emergency Mobile</div>
                      <input
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm"
                        value={form.emergency_mobile}
                        onChange={(e) => up("emergency_mobile", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Education */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-5">Education</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-md font-medium text-gray-800 mb-4">Graduation</h4>
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">College</div>
                          <input
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm"
                            value={form.grad_college}
                            onChange={(e) => up("grad_college", e.target.value)}
                          />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">Degree</div>
                          <input
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm"
                            value={form.grad_degree}
                            onChange={(e) => up("grad_degree", e.target.value)}
                          />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">Year of Passout</div>
                          <input
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-whiteshadow-sm"
                            value={form.grad_year}
                            onChange={(e) => up("grad_year", e.target.value)}
                            placeholder="e.g., 2023"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-md font-medium text-gray-800 mb-4">Intermediate / Diploma</h4>
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">College</div>
                          <input
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm"
                            value={form.inter_college}
                            onChange={(e) => up("inter_college", e.target.value)}
                          />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">Course</div>
                          <input
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm"
                            value={form.inter_course}
                            onChange={(e) => up("inter_course", e.target.value)}
                          />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">Year of Passout</div>
                          <input
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm"
                            value={form.inter_year}
                            onChange={(e) => up("inter_year", e.target.value)}
                            placeholder="e.g., 2020"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-2 text-xs text-gray-500 text-center">
                  * Employee ID (e.g., {emp.emp_code}) is not editable.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}