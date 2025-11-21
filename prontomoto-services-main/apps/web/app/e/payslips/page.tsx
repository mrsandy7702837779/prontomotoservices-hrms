"use client";

import { useEffect, useState, useCallback } from "react";
import { FileText, Download, Eye, Calendar, Clock, DollarSign, Shield } from "lucide-react";

// Use the environment variable FIRST, then fall back to the Azure URL, and finally to localhost
const API =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API ||
  "https://prontomoto-func-001-h8a9fwh0gjdjdpda.centralindia-01.azurewebsites.net/api";
type PayslipMeta = {
  id: string;
  month: string;
  year: number;
  salary: number;
  pf: number;
  totalWorkedDays: number;
  totalHours: number;
  netPay: number;
  pdf_url: string;
  created_at: string;
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

export default function EmployeePayslipsPage() {
  const [payslips, setPayslips] = useState<PayslipMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const employeeId = typeof window !== "undefined" ? localStorage.getItem("employeeId") : null;

  const fetchPayslips = useCallback(async () => {
    if (!employeeId) return;
    try {
      const res = await fetch(`${API}/payslips?employeeId=${encodeURIComponent(employeeId)}`);
      const text = await res.text();
      const data = text ? JSON.parse(text) : [];
      setPayslips(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("fetchPayslips error:", err);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchPayslips();
    const iv = setInterval(fetchPayslips, 5000);
    return () => clearInterval(iv);
  }, [employeeId, fetchPayslips]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gray-100 rounded-lg">
              <FileText className="h-6 w-6 text-gray-700" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">My Payslips</h1>
          </div>
          <p className="text-gray-500">Access and download your monthly payslips</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-300 mb-3"></div>
              <p className="text-gray-500">Loading payslips...</p>
            </div>
          </div>
        ) : payslips.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No payslips found</h3>
            <p className="text-gray-500">Your payslips will appear here once they&apos;re available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {payslips.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-5 border-b border-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">
                        {monthLabelFromYYYYMM(p.month)}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">{p.year}</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <Calendar className="h-5 w-5 text-gray-600" />
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <div className="p-1.5 bg-gray-50 rounded-lg mr-3">
                        <Clock className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500">Days Worked</div>
                        <div className="font-medium text-gray-800">{p.totalWorkedDays} days</div>
                      </div>
                    </div>

                    <div className="flex items-center text-sm">
                      <div className="p-1.5 bg-gray-50 rounded-lg mr-3">
                        <Clock className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500">Total Hours</div>
                        <div className="font-medium text-gray-800">{p.totalHours} hours</div>
                      </div>
                    </div>

                    <div className="flex items-center text-sm">
                      <div className="p-1.5 bg-gray-50 rounded-lg mr-3">
                        <DollarSign className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500">Salary</div>
                        <div className="font-medium text-gray-800">₹{p.salary.toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="flex items-center text-sm">
                      <div className="p-1.5 bg-gray-50 rounded-lg mr-3">
                        <Shield className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500">Provident Fund</div>
                        <div className="font-medium text-gray-800">₹{p.pf.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  {/* Net Pay Highlight */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-gray-500">Net Pay</div>
                        <div className="text-lg font-bold text-gray-800">₹{p.netPay.toLocaleString()}</div>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-5 bg-gray-50 flex gap-3">
                  <a
                    href={p.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Eye size={16} />
                    Preview
                  </a>
                  <a
                    href={p.pdf_url}
                    download={`${monthLabelFromYYYYMM(p.month)} Payslip.pdf`}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Download size={16} />
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}