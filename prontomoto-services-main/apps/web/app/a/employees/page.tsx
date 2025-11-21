"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image"; // Import Next.js Image component
import { Search, UserPlus, Archive, Eye, Mail, Briefcase, Users, UserCheck } from "lucide-react"; // Removed unused icons

// Use the environment variable FIRST, then fall back to the Azure URL, and finally to localhost
const API =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API ||
  "https://prontomoto-func-001-h8a9fwh0gjdjdpda.centralindia-01.azurewebsites.net/api";
type Row = {
  id: string;
  emp_code: string;
  first_name: string;
  last_name: string;
  job_title?: string;
  email?: string;
  mobile?: string;
  photo_url?: string;
  presence: "in" | "out";
  last_seen_ts: string;
};

const initials = (f: string, l: string) =>
  `${(f||"")[0]||""}${(l||"")[0]||""}`.toUpperCase();

export default function EmployeesPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);

  async function load(search: string = "") {
    setLoading(true);
    try {
      const url = search.trim()
        ? `${API}/employees?q=${encodeURIComponent(search.trim())}`
        : `${API}/employees`;
      const data = await fetch(url).then(r => r.json());
      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load employees:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    load(); 
  }, []);

  async function onDelete(id: string) {
    if (!confirm("Archive this employee?")) return;
    try {
      const r = await fetch(`${API}/employees/${id}`, { method: "DELETE" });
      if (!r.ok) return alert("Archive failed");
      load(q);
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Archive failed");
    }
  }

  const presentCount = useMemo(
    () => rows.filter(r => r.presence === "in").length, [rows]
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-gray-600" />
            Employees
          </h1>
          <p className="text-gray-600">Manage and view all employees in your organization</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gray-100 text-gray-600 mr-4">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-gray-800">{rows.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gray-100 text-gray-600 mr-4">
                <UserCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Present Today</p>
                <p className="text-2xl font-bold text-gray-800">{presentCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gray-100 text-gray-600 mr-4">
                <Archive className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Archived</p>
                <p className="text-2xl font-bold text-gray-800">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Action Bar */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-xl">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                placeholder="Search by name, ID, email, mobile…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load(q)}
              />
              {q && (
                <button
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => {
                    setQ("");
                    load("");
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Link href="/a/archived" className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                <Archive className="h-5 w-5 text-gray-600" />
                <span className="text-gray-700 font-medium">Archived</span>
              </Link>
              <Link href="/a/employees/new" className="flex items-center gap-2 px-5 py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-xl transition-colors shadow-md">
                <UserPlus className="h-5 w-5" />
                <span className="font-medium">Add Employee</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Employee List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-400 mb-4"></div>
                <p className="text-gray-600 font-medium">Loading employees...</p>
              </div>
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Users className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                {q ? "No employees match your search" : "No employees found"}
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {q 
                  ? "Try adjusting your search to find what you're looking for." 
                  : "There are no employees in the system at the moment."}
              </p>
              {q && (
                <button 
                  onClick={() => {
                    setQ("");
                    load("");
                  }}
                  className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {rows.map((r) => (
                <div key={r.id} className="p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Avatar with presence indicator */}
                      <div className="relative">
                        {r.photo_url ? (
                          <Image
                            src={r.photo_url}
                            alt={`${r.first_name} ${r.last_name}`}
                            width={56}
                            height={56}
                            className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-lg shadow-sm flex-shrink-0">
                            {initials(r.first_name, r.last_name)}
                          </div>
                        )}
                        <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                          r.presence === "in" ? "bg-gray-900" : "bg-gray-300"
                        }`}></div>
                      </div>

                      {/* Main info */}
                      <div className="min-w-0 flex-1">
                        <div className="mb-1">
                          <div className="font-semibold text-gray-800 text-lg">
                            {r.first_name} {r.last_name}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-gray-500 text-sm">
                              ID: {r.emp_code}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              r.presence === "in" 
                                ? "bg-gray-900 text-white" 
                                : "bg-gray-200 text-gray-600"
                            }`}>
                              {r.presence === "in" ? "Present" : "Absent"}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <Briefcase className="h-4 w-4 mr-1.5 text-gray-400" />
                          {r.job_title || "—"}
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-1.5 text-gray-400" />
                          {r.email || "—"}
                        </div>
                      </div>
                    </div>

                    {/* Right side: actions */}
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      <Link 
                        href={`/a/employees/${r.id}`} 
                        className="p-2.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm flex items-center justify-center"
                        title="View employee details"
                      >
                        <Eye className="h-5 w-5 text-gray-600" />
                      </Link>
                      <button 
                        onClick={() => onDelete(r.id)}
                        className="p-2.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm flex items-center justify-center"
                        title="Archive employee"
                      >
                        <Archive className="h-5 w-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}