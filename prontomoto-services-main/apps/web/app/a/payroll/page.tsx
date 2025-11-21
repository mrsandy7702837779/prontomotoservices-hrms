"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { CalendarDays, Save, X, Trash2, User, FileText, Calculator, Search } from "lucide-react"; // Removed unused RefreshCw
import jsPDF from "jspdf";

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
  photo_url?: string;
};

type DayRecord = {
  date: string;
  login_time?: string;
  logout_time?: string;
  hours?: number;
  status?: "present" | "absent" | "leave" | "holiday";
};

type PayslipMeta = {
  id: string;
  month: string; // stored as YYYY-MM
  year: number;
  pdf_url: string;
  netPay?: number;
};

function monthLabelFromYYYYMM(ym: string) {
  try {
    const [y, m] = ym.split("-");
    const dt = new Date(Number(y), Number(m) - 1, 1);
    return dt.toLocaleString("default", { month: "long", year: "numeric" });
  } catch {
    return ym;
  }
}

function currentYYYYMM() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export default function PayrollManagementPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [monthData, setMonthData] = useState<DayRecord[]>([]);
  const [salary, setSalary] = useState<number>(0);
  const [pf, setPf] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [payslips, setPayslips] = useState<PayslipMeta[]>([]);
  const [daysWorkedManual, setDaysWorkedManual] = useState<number | null>(null); // manual override if attendance empty
  const [searchQuery, setSearchQuery] = useState("");

  const currentMonthParam = currentYYYYMM();
  const currentMonthLabel = monthLabelFromYYYYMM(currentMonthParam);

  // load employees
  useEffect(() => {
    async function fetchEmployees() {
      try {
        const res = await fetch(`${API}/employees`);
        const text = await res.text();
        const data = text ? JSON.parse(text) : [];
        setEmployees(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load employees:", e);
      }
    }
    fetchEmployees();
  }, []);

  // when employee selected, fetch attendance and payslips
  useEffect(() => {
    if (!selected) {
      setMonthData([]);
      setPayslips([]);
      setDaysWorkedManual(null);
      return;
    }

    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        // attendance: month param as YYYY-MM
        const res = await fetch(`${API}/attendance?employeeId=${encodeURIComponent(selected.id)}&month=${encodeURIComponent(currentMonthParam)}`);
        const text = await res.text();
        const att = text ? JSON.parse(text) : [];

        if (!mounted) return;

        if (Array.isArray(att) && att.length > 0) {
          setMonthData(
            att.map((d: { // Fixed type for attendance data
              date?: string | Date;
              login_time?: string;
              check_in_ts?: string;
              logout_time?: string;
              check_out_ts?: string;
              hours?: number;
              worked_minutes?: number;
              status?: string;
            }) => {
              // timezone-safe local date string (always a string)
              const rawDate = d.date ? new Date(d.date) : null;
              const localDateStr = rawDate
                ? rawDate.toISOString().slice(0, 10)
                : ""; // <-- fallback to empty string if no date

              return {
                date: localDateStr, // guaranteed string now
                login_time: d.login_time ?? d.check_in_ts ?? "--",
                logout_time: d.logout_time ?? d.check_out_ts ?? "--",
                hours:
                  typeof d.hours === "number"
                    ? d.hours
                    : d.worked_minutes
                    ? Math.round(Number(d.worked_minutes) / 60)
                    : 0,
                status: (d.status ?? (d.worked_minutes ? "present" : "absent")) as DayRecord["status"],
              } as DayRecord;
            })
          );
          setDaysWorkedManual(null); // attendance available so no manual override needed
        } else {
          // attendance empty -> clear monthData and allow manual days entry
          setMonthData([]);
          setDaysWorkedManual(null); // user can fill
        }

        // fetch payslips for this employee
        const pRes = await fetch(`${API}/payslips?employeeId=${encodeURIComponent(selected.id)}`);
        const pText = await pRes.text();
        const pData = pText ? JSON.parse(pText) : [];
        setPayslips(Array.isArray(pData) ? pData : []);
      } catch (err) {
        console.error("fetch error", err);
        setMonthData([]);
        setPayslips([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [selected, currentMonthParam]);

  const totalWorkedDays = monthData.filter((d) => d.status === "present").length;
  const totalHours = monthData.filter((d) => d.status === "present").reduce((a, b) => a + (b.hours || 0), 0);
  // days to save: if attendance empty and manual provided use manual, else computed
  const daysToSave = monthData.length === 0 ? (daysWorkedManual ?? 0) : totalWorkedDays;

  // Filter employees based on search query
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    
    const query = searchQuery.toLowerCase();
    return employees.filter(emp => 
      emp.first_name.toLowerCase().includes(query) ||
      emp.last_name.toLowerCase().includes(query) ||
      emp.emp_code.toLowerCase().includes(query)
    );
  }, [employees, searchQuery]);

  // small helper to safely parse text JSON responses
  async function safeJson(textOrResponse: Response | string) {
    try {
      if (typeof textOrResponse === "string") return JSON.parse(textOrResponse);
      const t = await textOrResponse.text();
      return t ? JSON.parse(t) : null;
    } catch {
      return null;
    }
  }

  async function savePayslip() {
    if (!selected) return alert("Select employee");
    setSaving(true);
    try {
      const netPay = salary - pf;
      // Build PDF manually (improved layout)
      const doc = new jsPDF({ unit: "pt", format: "a4" });

      // helpers
      const timeOnly = (s?: string | null) => {
        if (!s) return "--";
        try {
          const d = new Date(s);
          return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
        } catch {
          return String(s).slice(11, 16) || "-";
        }
      };
      const safeText = (v: unknown) => (v === null || v === undefined ? "—" : String(v)); // Fixed type

      // Header
      doc.setFontSize(18);
      doc.setFont(undefined, "normal");
      doc.text("ProntoMoto Services Pvt Ltd", 300, 60, { align: "center" });
      doc.setFontSize(10);
      doc.text("Address: Kakinada • Phone: 9885255567", 300, 76, { align: "center" });
      doc.setLineWidth(0.5);
      doc.line(40, 90, 555, 90);

      // Payslip title and employee block
      doc.setFontSize(13);
      doc.setFont(undefined, "bold");
      doc.text(`Payslip — ${currentMonthLabel}`, 60, 120);

      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.text(`Employee: ${selected.first_name} ${selected.last_name}`, 60, 140);
      doc.text(`Employee Code: ${selected.emp_code}`, 60, 156);
      doc.text(`Days Worked: ${daysToSave}`, 60, 172);

      // Salary block (right side) — labels small, amounts larger bold, right aligned
      const blockLeft = 330; // start of salary block (less right-aligned)
      const labelX = blockLeft;
      const valueX = blockLeft + 150; // space between label and value

      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.text("Basic Salary:", labelX, 140);
      doc.text("PF:", labelX, 156);
      doc.text("Net Pay:", labelX, 172);

      // Amounts (bold, aligned to right edge of block)
      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text(`₹${salary || 0}`, valueX, 140);
      doc.text(`₹${pf || 0}`, valueX, 156);
      doc.text(`₹${netPay || 0}`, valueX, 172);

      // small gray separator box (optional)
      doc.setDrawColor(200);
      doc.setLineWidth(0.3);
      doc.line(blockLeft, 180, blockLeft + 200, 180);

      // generated by footnote
      doc.setFontSize(9);
      doc.setFont(undefined, "normal");
      doc.text("Generated by ProntoMoto Payroll System", 60, 204);

      // Table header (Date | Login | Logout | Status)
      let y = 230;
      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      const colDateX = 60;
      const colLoginX = 160;
      const colLogoutX = 300;
      const colStatusX = 440;

      doc.text("Date", colDateX, y);
      doc.text("Login", colLoginX, y);
      doc.text("Logout", colLogoutX, y);
      doc.text("Status", colStatusX, y);

      // separator below header
      y += 8;
      doc.setLineWidth(0.3);
      doc.line(50, y, 555, y);
      y += 12;

      // rows
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      for (const d of monthData) {
        // page break if needed
        if (y > 760) {
          doc.addPage();
          y = 60;
        }

        // Date only (YYYY-MM-DD)
        const dateOnly = (d.date || "").slice(0, 10) || "-";
        doc.text(safeText(dateOnly), colDateX, y);

        // Login / Logout: show ONLY time
        doc.text(timeOnly(d.login_time), colLoginX, y);
        doc.text(timeOnly(d.logout_time), colLogoutX, y);

        // Status
        doc.text(safeText(d.status || "-"), colStatusX, y);

        y += 16; // row spacing
      }

      // If there were no attendance rows, show a friendly note
      if (!monthData || monthData.length === 0) {
        doc.setFontSize(10);
        doc.setFont(undefined, "italic");
        doc.text(`No daily attendance records available for ${currentMonthLabel}.`, 60, y);
        y += 16;
      }

      // footer / signature area
      y += 20;
      if (y + 60 > 820) {
        doc.addPage();
        y = 60;
      }
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.text("Authorised Signatory:", 60, y + 20);
      doc.line(60, y + 35, 220, y + 35);

      const pdfBlob = doc.output("blob");

      // upload blob (your function must accept raw blob posted to /upload/pdf and return { url })
      const uploadRes = await fetch(`${API}/upload/pdf`, {
        method: "POST",
        body: pdfBlob,
      });
      const upText = await uploadRes.text();
      const upData = upText ? JSON.parse(upText) : {};
      const pdfUrl = upData.url;
      if (!pdfUrl) throw new Error("Upload failed");

      // record metadata
      const recordRes = await fetch(`${API}/payslips`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: selected.id,
          month: currentMonthParam,
          year: new Date().getFullYear(),
          salary,
          pf,
          totalWorkedDays: daysToSave,
          totalHours,
          netPay,
          pdf_url: pdfUrl,
        }),
      });
      if (!recordRes.ok) {
        const bodyText = await recordRes.text();
        throw new Error(bodyText || "Failed to save metadata");
      }

      alert("Payslip saved and uploaded.");
      // refresh payslips list
      const pRes = await fetch(`${API}/payslips?employeeId=${encodeURIComponent(selected.id)}`);
      const pText = await pRes.text();
      const pData = pText ? JSON.parse(pText) : [];
      setPayslips(Array.isArray(pData) ? pData : []);
      // reset salary/pf if you want:
      setSalary(0); setPf(0);
    } catch (err: unknown) { // Fixed type
      console.error("savePayslip error:", err);
      alert("Save failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  }

  // Delete with fallback logic:
  // 1) try DELETE /payslips/{id}
  // 2) if server returns invalid-uuid or 500, try POST /payslips/delete-by-url with { pdf_url }
  async function deletePayslip(id: string, pdf_url?: string) {
    if (!confirm("Delete this payslip? This will remove the PDF from storage.")) return;

    // quick UUID regex check
    const isUuidLike = /^[0-9a-fA-F-]{36}$/.test(id);
    try {
      // primary attempt (path param)
      const res = await fetch(`${API}/payslips/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) {
        setPayslips((p) => p.filter((x) => x.id !== id));
        alert("Deleted");
        return;
      }

      // parse error body
      const txt = await res.text();
      let parsed;
      try { parsed = JSON.parse(txt); } catch { parsed = null; }
      // If server error complains about uuid, we'll attempt fallback
      const errMsg = parsed?.details || txt || "";
      if (errMsg.toLowerCase().includes("invalid input syntax for type uuid") || !isUuidLike) {
        // fallback: call a delete-by-url endpoint (you must implement this server function)
        if (!pdf_url) throw new Error("Backend rejected id and no pdf_url available for fallback.");
        const fb = await fetch(`${API}/payslips/delete-by-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pdf_url }),
        });
        if (!fb.ok) {
          const tb = await fb.text();
          throw new Error(tb || "Fallback delete failed");
        }
        // remove from UI list
        setPayslips((p) => p.filter((x) => x.pdf_url !== pdf_url));
        alert("Deleted (via fallback)");
        return;
      }

      // if we reach here, deletion failed for a different reason
      throw new Error(txt || "Delete failed");
    } catch (e: unknown) { // Fixed type
      console.error("delete error", e);
      alert("Delete failed: " + (e instanceof Error ? e.message : String(e)));
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
                <Calculator className="h-6 w-6 text-gray-600" />
                Payroll Management
              </h1>
              <p className="text-gray-600 mt-1">Generate and manage employee payslips</p>
              
              {/* Search Bar */}
              <div className="mt-4 max-w-md">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="Search employees by name or code..."
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
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                {currentMonthLabel}
              </div>
              <div className="text-sm text-gray-600">
                {filteredEmployees.length} of {employees.length} employees
              </div>
            </div>
          </div>
        </div>

        {/* Employee Grid */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <User className="h-5 w-5 text-gray-600" />
              Select Employee
            </h2>
            <div className="text-sm text-gray-600">
              {filteredEmployees.length} employees found
            </div>
          </div>

          {filteredEmployees.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <User className="h-8 w-8 text-gray-500" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredEmployees.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => setSelected(emp)}
                  className="cursor-pointer group bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center transition-all duration-300 hover:shadow-md hover:border-gray-300"
                >
                  <div className="relative mb-4">
                    <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-white shadow-sm">
                      <Image
                        src={emp.photo_url || "/avatar.png"}
                        alt={emp.first_name}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full rounded-full"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-800 text-base">
                    {emp.first_name} {emp.last_name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">{emp.emp_code}</p>
                  <button className="text-gray-700 hover:text-gray-900 text-sm font-medium flex items-center justify-center gap-1 w-full py-2 bg-white border border-gray-300 rounded-lg transition-colors">
                    <CalendarDays size={15} />
                    View Payslip
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Employee Detail Modal */}
        {selected && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200 flex flex-col">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-lg">
                      <Image 
                        src={selected.photo_url || "/avatar.png"} 
                        alt={selected.first_name} 
                        width={64} 
                        height={64} 
                        className="object-cover w-full h-full rounded-full" 
                      />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">
                        {selected.first_name} {selected.last_name}
                      </h2>
                      <p className="text-sm text-gray-600">{selected.emp_code}</p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        Payroll for {currentMonthLabel}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelected(null)} 
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                  <div className="flex justify-center items-center py-16">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-300 mb-4"></div>
                      <p className="text-gray-600 font-medium">Loading attendance & payslips...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Attendance Summary */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                          <CalendarDays className="h-5 w-5 text-gray-600" />
                          Attendance Summary
                        </h3>
                        <div className="text-sm text-gray-600">
                          {monthData.length > 0 ? `${totalWorkedDays} days worked` : 'No attendance data'}
                        </div>
                      </div>

                      {monthData.length === 0 ? (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              <CalendarDays className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-800">No attendance records</h4>
                              <p className="text-sm text-gray-600">You can manually enter days worked below</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-7 gap-3 mb-6">
                          {monthData.map((d, i) => {
                            const day = d.date ? new Date(d.date).getDate() : i + 1;
                            const color =
                              d.status === "present" ? "bg-gray-100 border-gray-300" :
                              d.status === "leave" ? "bg-gray-100 border-gray-300" :
                              d.status === "holiday" ? "bg-gray-100 border-gray-300" :
                              "bg-gray-100 border-gray-300";
                            return (
                              <div key={i} className={`border rounded-xl p-3 text-center ${color} shadow-sm`}>
                                <div className="font-semibold text-gray-800 text-sm">{day}</div>
                                <div className="text-xs text-gray-600 mt-1">{d.hours ?? 0}h</div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Payroll Form */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-8">
                      <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-gray-600" />
                        Payroll Calculation
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Days Worked
                          </label>
                          <input
                            type="number"
                            value={monthData.length === 0 ? (daysWorkedManual ?? "") : totalWorkedDays}
                            onChange={(e) => setDaysWorkedManual(Number(e.target.value))}
                            placeholder="Enter days worked"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Basic Salary (₹)
                          </label>
                          <input
                            type="number"
                            value={salary}
                            onChange={(e) => setSalary(Number(e.target.value))}
                            placeholder="Enter basic salary"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            PF Amount (₹)
                          </label>
                          <input
                            type="number"
                            value={pf}
                            onChange={(e) => setPf(Number(e.target.value))}
                            placeholder="Enter PF amount"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white rounded-xl border border-gray-300">
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Final Net Pay</div>
                          <div className="text-2xl font-bold text-gray-800">₹{(salary - pf) || 0}</div>
                        </div>
                        <button 
                          onClick={savePayslip} 
                          disabled={saving}
                          className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-xl transition-colors shadow-md hover:shadow-lg mt-4 sm:mt-0"
                        >
                          <Save className="h-5 w-5" />
                          {saving ? "Saving..." : "Save Payslip"}
                        </button>
                      </div>
                    </div>

                    {/* Payslips List */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                          <FileText className="h-5 w-5 text-gray-600" />
                          Saved Payslips
                        </h3>
                        <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                          {payslips.length} payslips
                        </div>
                      </div>

                      {payslips.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                            <FileText className="h-8 w-8 text-gray-500" />
                          </div>
                          <h4 className="text-lg font-medium text-gray-800 mb-2">No payslips yet</h4>
                          <p className="text-gray-600 max-w-md mx-auto">Generate and save payslips for this employee</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {payslips.map((p) => (
                            <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                              <div>
                                <div className="font-medium text-gray-800">
                                  {monthLabelFromYYYYMM(p.month)}
                                </div>
                                <div className="text-sm text-gray-600">Year: {p.year}</div>
                              </div>
                              <div className="flex items-center gap-3">
                                <a 
                                  href={p.pdf_url} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S4.758 19.057 3.458 12z" />
                                  </svg>
                                  Preview
                                </a>
                                <button 
                                  onClick={() => deletePayslip(p.id, p.pdf_url)} 
                                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}