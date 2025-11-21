"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

// Use the environment variable FIRST, then fall back to the Azure URL, and finally to localhost
const API =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API ||
  "https://prontomoto-func-001-h8a9fwh0gjdjdpda.centralindia-01.azurewebsites.net/api";
type Emp = {
  id: string;
  emp_code: string;
  first_name: string;
  last_name: string;
};

export default function AddAssetPage() {
  const [employees, setEmployees] = useState<Emp[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemCode, setItemCode] = useState("");
  const [issuedOn, setIssuedOn] = useState("");

  async function loadEmployees() {
    const res = await fetch(`${API}/employees`);
    const data = await res.json();
    setEmployees(data);
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  // Fixed: Changed 'any' to the proper React FormEvent type
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!employeeId || !itemName) return alert("Please fill required fields");

    const res = await fetch(`${API}/assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employee_id: employeeId,
        item_name: itemName,
        item_code: itemCode,
        issued_on: issuedOn
      })
    });

    if (res.ok) {
      alert("Asset added successfully");
      window.location.href = "/a/assets";
    } else {
      alert("Failed to add asset");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header with back button */}
        <div className="mb-8">
          <Link href="/a/assets">
            <button className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 text-gray-700 hover:text-gray-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Assets</span>
            </button>
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-slate-100">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Add New Asset</h1>
            <p className="text-gray-600">Assign an asset to an employee</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Employee Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Employee <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-300 focus:border-gray-500 focus:ring-1 focus:ring-gray-200 outline-none transition-all appearance-none bg-white shadow-sm"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  required
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.emp_code} - {emp.first_name} {emp.last_name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-gray-700 w-12">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Asset Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asset Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-300 focus:border-gray-500 focus:ring-1 focus:ring-gray-200 outline-none transition-all bg-white shadow-sm"
                  placeholder="e.g. Laptop, ID Card"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  required
                />
                <div className="absolute inset-y-0 left-0 flex items-center px-3 text-gray-400 w-12">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Asset Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asset Code <span className="text-gray-500 text-xs">(optional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-300 focus:border-gray-500 focus:ring-1 focus:ring-gray-200 outline-none transition-all bg-white shadow-sm"
                  placeholder="e.g. LAP-HP-1322"
                  value={itemCode}
                  onChange={(e) => setItemCode(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 flex items-center px-3 text-gray-400 w-12">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Issued On */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issued On <span className="text-gray-500 text-xs">(optional)</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-300 focus:border-gray-500 focus:ring-1 focus:ring-gray-200 outline-none transition-all bg-white shadow-sm"
                  value={issuedOn}
                  onChange={(e) => setIssuedOn(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 flex items-center px-3 text-gray-400 w-12">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-3 px-4 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-xl transition-colors duration-300 shadow-md hover:shadow-lg flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>Save Asset</span>
              </button>
            </div>
          </form>
        </div>

        {/* Additional Info Card */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-10 w-10 rounded-md bg-gray-100 text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-800">Asset Assignment</h3>
              <div className="mt-2 text-sm text-gray-600">
                <p>Assigning assets to employees helps track company property and ensure accountability. All asset assignments are recorded in the system.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}