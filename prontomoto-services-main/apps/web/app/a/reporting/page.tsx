"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image"; // Import Next.js Image component

// Use the environment variable FIRST, then fall back to the Azure URL, and finally to localhost
const API =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API ||
  "https://prontomoto-func-001-h8a9fwh0gjdjdpda.centralindia-01.azurewebsites.net/api";

/* ---------- Types ---------- */
type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  emp_code: string;
  job_title?: string;
  project?: string;
  manager_name?: string;
  photo_url?: string;
};

/* ---------- Small helpers ---------- */
const Chip = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-gray-100 border border-gray-200 text-gray-700">
    {children}
  </span>
);

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default function ReportingMatrix() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<Employee | null>(null);

  /* -------- Assign modal state -------- */
  const [assignOpen, setAssignOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [projectName, setProjectName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [roleName, setRoleName] = useState("");

  /* ---------- Load all employees from API ---------- */
  useEffect(() => {
    async function loadEmployees() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API}/employees`);
        if (!res.ok) throw new Error(`Failed to fetch employees (${res.status})`);
        const data = await res.json();
        // Expect data as array of employees
        setEmployees(data);
      } catch (err: unknown) { // Fixed type
        console.error("Failed to load employees", err);
        setError(err instanceof Error ? err.message : "Error fetching employees");
      } finally {
        setLoading(false);
      }
    }

    loadEmployees();
  }, []);

  /* ---------- Managers filtered ---------- */
  const managers = useMemo(
    () => employees.filter((e) => (e.job_title || "").toLowerCase().includes("manager")),
    [employees]
  );

  /* ---------- Filtered list ---------- */
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) =>
      [e.first_name, e.last_name, e.emp_code, e.job_title, e.project, e.manager_name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [searchQuery, employees]);

  // Removed unused toggleSelect function

  function resetAssignForm() {
    setSelectedIds(new Set());
    setProjectName("");
    setManagerName("");
    setRoleName("");
    setModalSearch("");
  }

  /* ---------- API helpers ---------- */
  async function postJSON(url: string, body: Record<string, unknown>) { // Fixed type
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function handleAssign() {
    if (!projectName.trim() || !managerName.trim() || selectedIds.size === 0) {
      alert("Select employees, enter project name and manager.");
      return;
    }

    try {
      await postJSON(`${API}/reporting/assign`, {
        employee_ids: [...selectedIds],
        project: projectName.trim(),
        manager: managerName.trim(),
        role: roleName.trim() || undefined,
      });

      // Optimistic UI update
      setEmployees((prev) =>
        prev.map((e) =>
          selectedIds.has(e.id)
            ? {
                ...e,
                project: projectName.trim(),
                manager_name: managerName.trim(),
                job_title: roleName.trim() || e.job_title,
              }
            : e
        )
      );

      setAssignOpen(false);
      resetAssignForm();
    } catch (err) {
      console.error(err);
      alert("Failed to assign. Check backend logs.");
    }
  }

  async function handleRemove(emp: Employee) {
    if (!confirm(`Remove ${emp.first_name} ${emp.last_name} (${emp.emp_code}) from this matrix?`))
      return;

    try {
      await postJSON(`${API}/reporting/remove`, { employee_id: emp.id });
      // UI: clear project and manager
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === emp.id ? { ...e, project: undefined, manager_name: undefined } : e
        )
      );
      if (selected?.id === emp.id)
        setSelected({ ...emp, project: undefined, manager_name: undefined });
    } catch (err) {
      console.error(err);
      alert("Failed to remove. Check backend logs.");
    }
  }

  /* ---------- UI ---------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Reporting Matrix
              </h1>
              <p className="text-gray-600 mt-1">Assign projects and see reporting lines at a glance</p>
              
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
                    placeholder="Search employees by name, code, or project..."
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
            <button
              className="flex items-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-xl transition-colors shadow-md hover:shadow-lg"
              onClick={() => setAssignOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Assign Project
            </button>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-300 mb-4"></div>
              <p className="text-gray-600 font-medium">Loading employees...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            Error: {error}
          </div>
        )}

        {/* Employee Grid */}
        {!loading && !error && (
          <>
            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-slate-100">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  {searchQuery ? "No employees match your search" : "No employees found"}
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {searchQuery 
                    ? "Try adjusting your search to find what you're looking for." 
                    : "There are no employees in the system at the moment."}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filtered.map((emp) => {
                  const fullName = `${emp.first_name} ${emp.last_name}`;
                  return (
                    <div
                      key={emp.id}
                      className="group relative bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <button
                        onClick={() => handleRemove(emp)}
                        className="absolute top-3 right-3 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors"
                      >
                        Remove
                      </button>

                      <button className="w-full text-left" onClick={() => setSelected(emp)}>
                        <div className="flex flex-col items-center text-center space-y-4">
                          {emp.photo_url ? (
                            <Image
                              src={emp.photo_url}
                              alt={fullName}
                              width={80}
                              height={80}
                              className="w-20 h-20 rounded-full object-cover shadow-sm group-hover:ring-4 group-hover:ring-gray-100 transition"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700 text-lg font-bold flex items-center justify-center shadow-sm">
                              {initials(fullName)}
                            </div>
                          )}
                          <div>
                            <h2 className="font-semibold text-lg text-gray-800 group-hover:text-gray-900 transition-colors">
                              {fullName}
                            </h2>
                            <p className="text-sm text-gray-500">{emp.emp_code}</p>
                            <p className="text-sm text-gray-700 mt-1">{emp.job_title || "—"}</p>
                          </div>
                          <div className="flex flex-wrap justify-center gap-2">
                            <Chip>{emp.project ? `📁 ${emp.project}` : "No Project"}</Chip>
                            <Chip>
                              {emp.manager_name ? `👤 ${emp.manager_name}` : "No Manager"}
                            </Chip>
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Employee Detail Popup */}
        {selected && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div className="text-lg font-bold text-gray-800">Employee Details</div>
                <button 
                  onClick={() => setSelected(null)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="flex items-center gap-4">
                  {selected.photo_url ? (
                    <Image
                      src={selected.photo_url}
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                      alt=""
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700 flex items-center justify-center font-bold text-xl">
                      {initials(`${selected.first_name} ${selected.last_name}`)}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-gray-800 text-lg">
                      {selected.first_name} {selected.last_name}
                    </div>
                    <div className="text-sm text-gray-600">{selected.emp_code}</div>
                    <div className="text-sm text-gray-500 mt-1">{selected.job_title || "—"}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="text-xs text-gray-500 mb-1">Project</div>
                    <div className="font-medium text-gray-800">{selected.project || "—"}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="text-xs text-gray-500 mb-1">Manager</div>
                    <div className="font-medium text-gray-800">{selected.manager_name || "—"}</div>
                  </div>
                </div>

                <button
                  onClick={() => handleRemove(selected)}
                  className="w-full py-3 px-4 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-xl transition-colors flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove from Matrix
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Project Modal */}
        {assignOpen && (
          <AssignModal
            managers={managers}
            filtered={filtered}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            projectName={projectName}
            setProjectName={setProjectName}
            managerName={managerName}
            setManagerName={setManagerName}
            roleName={roleName}
            setRoleName={setRoleName}
            setAssignOpen={setAssignOpen}
            resetAssignForm={resetAssignForm}
            handleAssign={handleAssign}
            search={modalSearch}
            setSearch={setModalSearch}
          />
        )}
      </div>
    </div>
  );
}

/* ---------- AssignModal extracted for clarity ---------- */
interface AssignModalProps {
  managers: Employee[];
  filtered: Employee[];
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  projectName: string;
  setProjectName: React.Dispatch<React.SetStateAction<string>>;
  managerName: string;
  setManagerName: React.Dispatch<React.SetStateAction<string>>;
  roleName: string;
  setRoleName: React.Dispatch<React.SetStateAction<string>>;
  setAssignOpen: React.Dispatch<React.SetStateAction<boolean>>;
  resetAssignForm: () => void;
  handleAssign: () => void;
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
}

function AssignModal({
  managers,
  filtered,
  selectedIds,
  setSelectedIds,
  projectName,
  setProjectName,
  managerName,
  setManagerName,
  roleName,
  setRoleName,
  setAssignOpen,
  resetAssignForm,
  handleAssign,
  search,
  setSearch,
}: AssignModalProps) {
  // Removed unused toggleSelect function

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="text-xl font-bold text-gray-800">Assign Project</div>
          <button
            onClick={() => {
              setAssignOpen(false);
              resetAssignForm();
            }}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: employee selector */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <div className="relative">
<div className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 pointer-events-none">                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  placeholder="Search employees..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="border border-gray-200 rounded-xl max-h-[360px] overflow-auto">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No employees match your search.
                </div>
              ) : (
                filtered.map((emp: Employee) => {
                  const checked = selectedIds.has(emp.id);
                  const fullName = `${emp.first_name} ${emp.last_name}`;
                  return (
                    <label
                      key={emp.id}
                      className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
                        checked ? "bg-gray-50" : ""
                      }`}
                      onClick={() => {
                        const next = new Set(selectedIds);
                        next.has(emp.id) ? next.delete(emp.id) : next.add(emp.id);
                        setSelectedIds(next);
                      }}
                    >
                      {emp.photo_url ? (
                        <Image
                          src={emp.photo_url}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                          alt=""
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700 text-xs flex items-center justify-center font-bold">
                          {initials(fullName)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">
                          {fullName}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {emp.emp_code} • {emp.job_title || "—"}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" checked={checked} readOnly className="w-5 h-5 text-gray-800 rounded focus:ring-gray-500" />
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: project + manager + role */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-xl p-5 space-y-6">
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Project Name
                </div>
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  placeholder="e.g., CRM Revamp"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>

              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Reporting Manager
                </div>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 appearance-none"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                >
                  <option value="">Select manager</option>
                  {managers.map((m: Employee) => (
                    <option key={m.id} value={`${m.first_name} ${m.last_name}`}>
                      {m.first_name} {m.last_name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Role (optional)
                </div>
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  placeholder="e.g., Senior UI Developer"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                />
              </div>

              <div className="pt-2 space-y-3">
                <button
                  className="w-full py-3 px-4 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-xl transition-colors flex items-center justify-center"
                  onClick={handleAssign}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Assign to {selectedIds.size || 0} employee
                  {selectedIds.size === 1 ? "" : "s"}
                </button>
                <button 
                  className="w-full py-3 px-4 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  onClick={resetAssignForm}
                >
                  Reset Form
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}