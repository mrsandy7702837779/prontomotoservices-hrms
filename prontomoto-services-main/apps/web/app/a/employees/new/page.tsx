"use client";
import { useEffect, useState } from "react";
import Image from "next/image"; // Import Next.js Image component

// Use the environment variable FIRST, then fall back to the Azure URL, and finally to localhost
const API =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API ||
  "https://prontomoto-func-001-h8a9fwh0gjdjdpda.centralindia-01.azurewebsites.net/api";

type Form = {
  emp_code: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  address: string;
  dob: string;
  marital_status: "single" | "married" | "";
  marriage_date: string;
  join_date: string;
  blood_group: string;
  emergency_name: string;
  emergency_mobile: string;
  job_title: string;     // role
  department: string;
  // structured education:
  grad_college: string;
  grad_degree: string;
  grad_year: string;      // keep as string in form
  inter_college: string;
  inter_course: string;
  inter_year: string;
  photo_url?: string;
};

export default function NewEmployeePage() {
  const [f, setF] = useState<Form>({
    emp_code: "",
    first_name: "",
    last_name: "",
    email: "",
    mobile: "",
    address: "",
    dob: "",
    marital_status: "",
    marriage_date: "",
    join_date: "",
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
  });

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/employees/next-code`).then(r => r.json());
        setF(s => ({ ...s, emp_code: r.emp_code || "PMS001" }));
      } catch {
        setF(s => ({ ...s, emp_code: "PMS001" }));
      }
    })();
  }, []);

  function up<K extends keyof Form>(key: K, val: Form[K]) {
    setF(s => ({ ...s, [key]: val }));
  }

  function onPickPhoto(file: File | null) {
    setPhoto(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  }

  async function uploadPhotoIfAny() {
    if (!photo) return undefined;
    const res = await fetch(`${API}/photos`, {
      method: "POST",
      headers: { "Content-Type": photo.type, "x-file-name": photo.name },
      body: photo
    });
    if (!res.ok) throw new Error("Photo upload failed");
    const data = await res.json();
    return data.url as string; // SAS URL
  }

  async function submit() {
    setErrMsg(null);
    if (!f.first_name.trim()) { setErrMsg("First name is required"); return; }
    if (!f.emp_code.trim())   { setErrMsg("Employee ID is required"); return; }

    setSaving(true);
    try {
      const photo_url = await uploadPhotoIfAny();

      const body = {
        ...f,
        grad_year: f.grad_year ? Number(f.grad_year) : undefined,
        inter_year: f.inter_year ? Number(f.inter_year) : undefined,
        photo_url,
      };

      const res = await fetch(`${API}/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (res.status === 409) {
        const j = await res.json();
        setErrMsg(j.error || "Employee ID already exists. Use another.");
        return;
      }
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t);
      }

      alert("Employee created successfully");
      window.location.href = "/a/employees";
    } catch (e: unknown) { // Changed from 'any' to 'unknown'
      setErrMsg(e instanceof Error ? e.message : "Failed to create employee. Check backend.");
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Add New Employee</h1>
          <p className="text-gray-600">Fill in the details below to create a new employee record</p>
        </div>

        {errMsg && (
          <div className="mb-6 p-4 rounded-xl bg-gray-100 border border-gray-300 text-gray-800 text-sm">
            {errMsg}
          </div>
        )}

        <form className="space-y-8">
          {/* Employee Information Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Employee Information</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm" 
                    value={f.emp_code} 
                    onChange={e => up("emp_code", e.target.value)} 
                  />
                  <p className="mt-1 text-xs text-gray-500">Auto-generated (editable). Format: PMS001</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position / Role</label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm" 
                    value={f.job_title} 
                    onChange={e => up("job_title", e.target.value)} 
                    placeholder="e.g., UI Developer" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm" 
                    value={f.department} 
                    onChange={e => up("department", e.target.value)} 
                    placeholder="e.g., Engineering" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Personal Details Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Personal Details</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm" 
                    value={f.first_name} 
                    onChange={e => up("first_name", e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm" 
                    value={f.last_name} 
                    onChange={e => up("last_name", e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm" 
                    value={f.email} 
                    onChange={e => up("email", e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm" 
                    value={f.mobile} 
                    onChange={e => up("mobile", e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm" 
                    value={f.dob} 
                    onChange={e => up("dob", e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm" 
                    value={f.join_date} 
                    onChange={e => up("join_date", e.target.value)} 
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm" 
                    rows={2} 
                    value={f.address} 
                    onChange={e => up("address", e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm" 
                    value={f.blood_group} 
                    onChange={e => up("blood_group", e.target.value)} 
                    placeholder="e.g., O+" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                  <select 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm" 
                    value={f.marital_status} 
                    onChange={e => up("marital_status", e.target.value as "single" | "married" | "")} // Fixed type assertion
                  >
                    <option value="">Select</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marriage Date</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm disabled:bg-gray-100 disabled:text-gray-500" 
                    value={f.marriage_date} 
                    onChange={e => up("marriage_date", e.target.value)} 
                    disabled={f.marital_status !== "married"} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm" 
                    onChange={e => onPickPhoto(e.target.files?.[0] || null)} 
                  />
                  {photoPreview && (
                    <div className="mt-3">
                      <Image 
                        src={photoPreview} 
                        alt="preview" 
                        width={96} 
                        height={96}
                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 shadow-sm" 
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Emergency Contact</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm" 
                    value={f.emergency_name} 
                    onChange={e => up("emergency_name", e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm" 
                    value={f.emergency_mobile} 
                    onChange={e => up("emergency_mobile", e.target.value)} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Education Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Education</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-md font-medium text-gray-800 mb-4">Graduation</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
                      <input 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm" 
                        value={f.grad_college} 
                        onChange={e => up("grad_college", e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                      <input 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm" 
                        value={f.grad_degree} 
                        onChange={e => up("grad_degree", e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year of Passout</label>
                      <input 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm" 
                        value={f.grad_year} 
                        onChange={e => up("grad_year", e.target.value)} 
                        placeholder="e.g., 2023" 
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-md font-medium text-gray-800 mb-4">Intermediate / Diploma</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
                      <input 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm" 
                        value={f.inter_college} 
                        onChange={e => up("inter_college", e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                      <input 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm" 
                        value={f.inter_course} 
                        onChange={e => up("inter_course", e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year of Passout</label>
                      <input 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors bg-white shadow-sm" 
                        value={f.inter_year} 
                        onChange={e => up("inter_year", e.target.value)} 
                        placeholder="e.g., 2020" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <button 
              type="button"
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm"
              onClick={() => (window.location.href="/a/employees")}
            >
              Cancel
            </button>
            <button 
              type="button"
              className="px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-medium transition-colors shadow-md"
              onClick={submit} 
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}