"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, RefreshCw, Trash2, UserCheck } from "lucide-react";
import Image from 'next/image'; // Added this import

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
  status: string; // 'archived'
};

const initials = (f: string, l: string) =>
  `${(f || "")[0] || ""}${(l || "")[0] || ""}`.toUpperCase();

export default function ArchivedEmployeesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [filteredRows, setFilteredRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await fetch(`${API}/employees-archived`).then((r) => r.json());
      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load archived employees:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    // Filter employees based on search query
    if (!searchQuery.trim()) {
      setFilteredRows(rows);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = rows.filter(
        (row) =>
          row.first_name.toLowerCase().includes(query) ||
          row.last_name.toLowerCase().includes(query) ||
          row.emp_code.toLowerCase().includes(query) ||
          (row.job_title && row.job_title.toLowerCase().includes(query))
      );
      setFilteredRows(filtered);
    }
  }, [searchQuery, rows]);

  async function onHardDelete(id: string) {
    if (!confirm("Permanently delete this employee? This cannot be undone.")) return;
    try {
      const r = await fetch(`${API}/employees-archived/${id}`, { method: "DELETE" });
      if (!r.ok) {
        alert("Delete failed");
        return;
      }
      load();
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Delete failed");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <UserCheck className="h-6 w-6 text-gray-600" />
                Archived Employees
              </h1>
              <p className="text-gray-600 mt-1">Manage employees who have been archived</p>
              
              {/* Search Bar */}
              <div className="mt-4 max-w-md">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="Search by name, code, or job title..."
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
            <div className="flex items-center gap-3">
              <button
                onClick={load}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
              >
                <RefreshCw className="h-4 w-4 text-gray-600" />
                <span className="text-gray-700">Refresh</span>
              </button>
              <Link href="/a/employees" className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-gray-700">Back to Employees</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-300 mb-4"></div>
                <p className="text-gray-600 font-medium">Loading archived employees...</p>
              </div>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <UserCheck className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                {searchQuery ? "No archived employees match your search" : "No archived employees found"}
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {searchQuery 
                  ? "Try adjusting your search to find what you're looking for." 
                  : "There are no archived employees at the moment."}
              </p>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredRows.map((row) => (
                <li key={row.id} className="p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Avatar */}
                      {row.photo_url ? (
                        <Image
                          src={row.photo_url}
                          alt={`${row.first_name} ${row.last_name}`}
                          width={56}
                          height={56}
                          className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700 flex items-center justify-center font-bold text-lg shadow-sm">
                          {initials(row.first_name, row.last_name)}
                        </div>
                      )}

                      {/* Text */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="font-semibold text-gray-800 text-lg">
                              {row.first_name} {row.last_name}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                              </svg>
                              {row.emp_code}
                            </div>
                          </div>
                          <div className="mt-2 md:mt-0">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                              </svg>
                              Archived
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-1 text-sm text-gray-600">
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {row.job_title || "—"}
                          </div>
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {row.email || "—"}
                          </div>
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {row.mobile || "—"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center">
                      <button
                        onClick={() => onHardDelete(row.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-red-600 transition-colors shadow-sm"
                        title="Delete permanently"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}