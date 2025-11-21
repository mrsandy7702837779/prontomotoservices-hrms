"use client";
import { useEffect, useState } from "react";
import Image from "next/image"; // Import Next.js Image component

// Use the environment variable FIRST, then fall back to the Azure URL, and finally to localhost
const API =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API ||
  "https://prontomoto-func-001-h8a9fwh0gjdjdpda.centralindia-01.azurewebsites.net/api";

type Employee = {
  id: string;
  emp_code: string;
  first_name: string;
  last_name: string;
  email?: string;
  mobile?: string;
  job_title?: string;
  photo_url?: string;
  presence?: "in" | "out";
  project?: string;
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  async function loadEmployees() {
    try {
      setLoading(true);
      const res = await fetch(`${API}/employees`);
      if (!res.ok) throw new Error("Failed to fetch employees");
      const data = await res.json();
      setEmployees(data);
      setFilteredEmployees(data);
    } catch (err) {
      console.error("Error fetching employees:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  // Handle search functionality
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredEmployees(employees);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = employees.filter(
      (emp) =>
        emp.first_name.toLowerCase().includes(term) ||
        emp.last_name.toLowerCase().includes(term) ||
        emp.emp_code.toLowerCase().includes(term) ||
        (emp.email && emp.email.toLowerCase().includes(term))
    );
    setFilteredEmployees(filtered);
  }, [searchTerm, employees]);

  if (loading) return <div className="text-center py-12">Loading employees...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with search */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Employees Directory</h1>
          <p className="text-slate-600 mb-6">Browse and manage all employees in your organization</p>
          
          {/* Search Bar */}
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search employees by name, ID, or email..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredEmployees.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-slate-500 mb-2">No employees found.</div>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-8 justify-center">
            {filteredEmployees.map((emp) => (
              <div
                key={emp.id}
                className="flex flex-col items-center cursor-pointer group"
                onClick={() => setSelected(emp)}
              >
                <div className="relative">
                  {emp.photo_url ? (
                    <Image
                      src={emp.photo_url}
                      alt={emp.first_name}
                      width={128}
                      height={128}
                      className="w-32 h-32 rounded-full border-4 border-white shadow-lg group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full flex items-center justify-center bg-slate-200 text-slate-600 text-3xl font-semibold border shadow-lg">
                      {emp.first_name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}

                  <span
                    className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-white ${
                      emp.presence === "in" ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></span>
                </div>

                <div className="text-center mt-4">
                  <div className="font-semibold text-lg text-slate-800">
                    {emp.first_name} {emp.last_name}
                  </div>
                  <div className="text-sm text-slate-500">{emp.emp_code}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selected && (
          <EmployeeModal employee={selected} onClose={() => setSelected(null)} />
        )}
      </div>
    </div>
  );
}

/* ---------------------- POPUP MODAL ---------------------- */
function EmployeeModal({
  employee,
  onClose,
}: {
  employee: Employee;
  onClose: () => void;
}) {
  const fullName = `${employee.first_name} ${employee.last_name}`;
  const projectName = employee.project || "Not Assigned";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 w-[440px] shadow-2xl relative border border-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-5 text-slate-500 hover:text-slate-700 text-lg p-1 rounded-full hover:bg-slate-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col items-center text-center">
          {employee.photo_url ? (
            <Image
              src={employee.photo_url}
              alt={fullName}
              width={144}
              height={144}
              className="w-36 h-36 rounded-full border-4 border-white shadow-lg"
            />
          ) : (
            <div className="w-36 h-36 rounded-full bg-slate-200 flex items-center justify-center text-3xl font-bold text-slate-700">
              {employee.first_name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}

          <h2 className="text-2xl font-semibold mt-4 text-slate-800">{fullName}</h2>
          <p className="text-slate-500 mb-5 text-sm">
            {employee.job_title || "—"}
          </p>

          <div className="w-full border-t border-slate-200 pt-5 space-y-4 text-sm">
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-600 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
                Employee ID:
              </span>
              <span className="text-slate-800 font-medium">{employee.emp_code}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-600 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email:
              </span>
              <span className="text-slate-800 font-medium">{employee.email || "—"}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-600 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Mobile:
              </span>
              <span className="text-slate-800 font-medium">{employee.mobile || "—"}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-600 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                Project:
              </span>
              <span className="text-slate-800 font-medium">{projectName}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-600 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Status:
              </span>
              <span className={`font-medium ${employee.presence === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                {employee.presence === 'in' ? 'Checked In' : 'Checked Out'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}