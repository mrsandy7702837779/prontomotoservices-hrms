"use client";
import { useState } from "react";

export default function ResignationPage() {
  const [form, setForm] = useState({
    fullName: "",
    empCode: "",
    email: "",
    department: "",
    position: "",
    noticePeriod: "30 Days",
    lastWorkingDay: "",
    reason: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSendMail = () => {
    const subject = `Resignation Letter - ${form.fullName} (${form.empCode})`;
    const body = `
Dear [Manager's Name],

I am writing to formally resign from my position as ${form.position} in the ${form.department} department at Pronto MotoServices.

My last working day will be ${form.lastWorkingDay}, considering the standard notice period of ${form.noticePeriod}.

Reason for resignation: ${form.reason}

I would like to express my gratitude for the opportunity to work with the company and for all the learning experiences I've had during my tenure.

Sincerely,
 ${form.fullName}
Employee ID: ${form.empCode}
Email: ${form.email}
`;

    // Use Gmail compose link directly
    const gmailURL = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    window.open(gmailURL, "_blank"); // opens in new tab
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
      <div className="max-w-3xl w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-slate-800">Resignation Form</h1>
          <p className="text-slate-500 mt-2">Please complete all fields to submit your resignation</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Field label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} />
          <Field label="Employee ID" name="empCode" value={form.empCode} onChange={handleChange} />
          <Field label="Email Address" name="email" value={form.email} onChange={handleChange} />
          <Field label="Department" name="department" value={form.department} onChange={handleChange} />
          <Field label="Position / Designation" name="position" value={form.position} onChange={handleChange} />
          <Select
            label="Notice Period"
            name="noticePeriod"
            value={form.noticePeriod}
            onChange={handleChange}
            options={["15 Days", "30 Days", "45 Days"]}
          />
          <Field label="Last Working Day" type="date" name="lastWorkingDay" value={form.lastWorkingDay} onChange={handleChange} />
        </div>

        <div className="mb-8">
          <label className="text-sm font-medium text-slate-700 block mb-2">Reason for Resignation</label>
          <textarea
            name="reason"
            rows={4}
            value={form.reason}
            onChange={handleChange}
            placeholder="Write your reason..."
            className="w-full border border-slate-300 rounded-xl p-4 focus:ring-2 focus:ring-slate-400 outline-none transition-all"
          />
        </div>

        <div className="text-center">
          <button
            onClick={handleSendMail}
            className="bg-slate-800 hover:bg-slate-900 text-white font-medium px-8 py-3 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md flex items-center justify-center mx-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Send Resignation
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------- Sub Components ---------------------- */
function Field({
  label,
  name,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700 block mb-2">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-slate-400 outline-none transition-all"
      />
    </div>
  );
}

function Select({
  label,
  name,
  value,
  options,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  options: string[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700 block mb-2">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-slate-400 outline-none transition-all bg-white"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}