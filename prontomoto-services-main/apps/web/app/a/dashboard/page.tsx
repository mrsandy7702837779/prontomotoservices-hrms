"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import Image from 'next/image';

// Use the environment variable FIRST, then fall back to the Azure URL, and finally to localhost
const API =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API ||
  "https://prontomoto-func-001-h8a9fwh0gjdjdpda.centralindia-01.azurewebsites.net/api";
const POLL_INTERVAL = 5000; // 5s

type Ann = { id: string; title: string; body?: string; announced_on?: string | null; created_at: string };
type InRow = { id: string; emp_code: string; first_name: string; last_name: string; last_seen_ts: string };
type OutRow = { id: string; emp_code: string; first_name: string; last_name: string; check_out_ts: string };
type LinkItem = { id: string; label: string; url: string; created_at?: string };
type CeleItem = {
  id: string;
  code?: string;
  name?: string;
  date?: string;
  photo?: string;
  type?: "birthday" | "anniversary" | string;
};

// Define proper types for API responses
type RawCelebration = {
  id?: string;
  emp_code?: string;
  code?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  type?: string;
  isAnniversary?: boolean;
  date?: string;
  photo_url?: string;
  photo?: string;
  photoUrl?: string;
};

type CelebrationResponse = {
  celebrations?: RawCelebration[];
  birthdays?: RawCelebration[];
  anniversaries?: RawCelebration[];
};

// UI Components
const DashboardHeader = () => {
  const [time, setTime] = useState("");
  
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(now);
      setTime(formatted);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-2xl shadow-xl p-6 mb-8 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-5">
          <div className="relative">
            <Image src="/avatar.png" alt="Admin" width={64} height={64} className="w-16 h-16 rounded-full border-4 border-white shadow-lg" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Hello, Admin</h1>
            <p className="text-gray-300">Welcome back to your dashboard</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-gray-300 text-sm">Today</div>
          <div className="text-lg font-semibold">{time}</div>
        </div>
      </div>
    </div>
  );
};

const AnnouncementCard = ({ announcement, onDelete }: { announcement: Ann; onDelete: (id: string) => void }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <div className="p-2 bg-gray-100 rounded-lg mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg text-slate-800 group-hover:text-gray-700 transition-colors">{announcement.title}</h3>
          </div>
          {announcement.body && (
            <p className="text-slate-600 mb-3 ml-11">{announcement.body}</p>
          )}
          <div className="flex items-center text-xs text-slate-500 ml-11">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {announcement.announced_on 
              ? `Announced on: ${announcement.announced_on}` 
              : `Created: ${new Date(announcement.created_at).toLocaleDateString()}`}
          </div>
        </div>
        <button 
          onClick={() => onDelete(announcement.id)}
          className="p-2 rounded-lg text-slate-400 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const EmployeeCard = ({ employee, status }: { employee: InRow | OutRow; status: 'in' | 'out' }) => {
  const time = 'last_seen_ts' in employee ? employee.last_seen_ts : employee.check_out_ts;
  const employeeName = `${employee.first_name} ${employee.last_name}`;
  
  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 hover:shadow-sm transition-all duration-300">
      <div className="flex items-center space-x-3">
        <Image 
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(employeeName)}&background=random`} 
          alt={employeeName} 
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
        />
        <div>
          <div className="font-medium text-slate-800">{employeeName}</div>
          <div className="text-xs text-slate-500">{employee.emp_code}</div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${status === 'in' ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800'}`}>
          {status === 'in' ? 'IN' : 'OUT'}
        </div>
        <div className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
          {new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

const CelebrationCard = ({ celebration }: { celebration: CeleItem }) => {
  const isBirthday = celebration.type === "birthday";
  const today = new Date().toISOString().slice(0, 10);
  const isToday = celebration.date === today;
  
  return (
    <div className={`p-4 rounded-xl border ${isToday ? 'border-gray-200 bg-gray-50' : 'border-slate-200 bg-white'} hover:shadow-sm transition-all duration-300`}>
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-full ${isToday ? 'bg-gray-100' : 'bg-slate-100'}`}>
          {isBirthday ? (
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isToday ? 'text-gray-600' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isToday ? 'text-gray-600' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center">
            <h3 className="font-medium text-slate-800">{celebration.name}</h3>
            {isToday && (
              <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">Today</span>
            )}
          </div>
          <div className="text-sm text-slate-600 mt-1">
            {isBirthday ? "Birthday" : "Anniversary"} • {celebration.date}
          </div>
        </div>
        <Image 
         src={celebration.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(celebration.name || "")}`} 
  alt={celebration.name || "Celebration"} // Fixed: Provide a fallback value
  width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
        />
      </div>
    </div>
  );
};

const LinkCard = ({ link, onDelete }: { link: LinkItem; onDelete: (id: string) => void }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:shadow-sm transition-all duration-300 group">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gray-100 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <div>
          <div className="font-medium text-slate-800 group-hover:text-gray-700 transition-colors">{link.label}</div>
          <div className="text-xs text-slate-500 truncate max-w-xs">{link.url}</div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <a 
          href={link.url} 
          target="_blank" 
          rel="noreferrer" 
          className="p-2 rounded-lg text-slate-400 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
        <button 
          onClick={() => onDelete(link.id)}
          className="p-2 rounded-lg text-slate-400 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const [ann, setAnn] = useState<Ann[]>([]);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [desc, setDesc] = useState("");

  const [inList, setInList] = useState<InRow[]>([]);
  const [outList, setOutList] = useState<OutRow[]>([]);
  const [birthdays, setBirthdays] = useState<CeleItem[]>([]);
  const [annivs, setAnnivs] = useState<CeleItem[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const [actionLoading, setActionLoading] = useState(false);
  const pollRef = useRef<number | null>(null);

  const loadAll = useCallback(async () => {
    try {
      // fetch all in parallel, tolerate individual failures
      const [annR, presR, celR, linksR] = await Promise.allSettled([
        fetch(`${API}/announcements`),
        fetch(`${API}/presence`),
        fetch(`${API}/celebrations`),
        fetch(`${API}/links`),
      ]);

      // announcements
      if (annR.status === "fulfilled" && annR.value.ok) {
        try {
          const json = await annR.value.json();
          setAnn(Array.isArray(json) ? json : []);
        } catch {
          setAnn([]);
        }
      } else {
        setAnn([]);
      }

      // presence
      if (presR.status === "fulfilled" && presR.value.ok) {
        try {
          const json = await presR.value.json();
          setInList(Array.isArray(json.in) ? json.in : []);
          setOutList(Array.isArray(json.out) ? json.out : []);
        } catch {
          setInList([]); setOutList([]);
        }
      } else {
        setInList([]); setOutList([]);
      }

      // celebrations
      if (celR.status === "fulfilled" && celR.value.ok) {
        try {
          const json: CelebrationResponse = await celR.value.json();

          const rawArray: RawCelebration[] = (() => {
            if (Array.isArray(json.celebrations)) return json.celebrations;
            if (Array.isArray(json.birthdays) || Array.isArray(json.anniversaries)) {
              const b = Array.isArray(json.birthdays) ? json.birthdays : [];
              const a = Array.isArray(json.anniversaries) ? json.anniversaries : [];
              return [...b, ...a];
            }
            if (Array.isArray(json)) return json;
            return [];
          })();

          const normalized = rawArray.map((c: RawCelebration) => ({
            id: c.id ?? c.emp_code ?? c.code ?? "",
            code: c.emp_code ?? c.code ?? "",
            name: (c.name ?? `${c.first_name ?? ""} ${c.last_name ?? ""}`).trim(),
            type: (c.type ?? (c.isAnniversary ? "anniversary" : "birthday")).toLowerCase(),
            date: c.date ? String(c.date).slice(0, 10) : "",
            photo: c.photo_url ?? c.photo ?? c.photoUrl ?? "",
          }));

          function todayInKolkataYMD() {
            const fmt = new Intl.DateTimeFormat("en-GB", {
              timeZone: "Asia/Kolkata",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            });
            const parts = fmt.formatToParts(new Date());
            const y = parts.find((p) => p.type === "year")?.value ?? "0000";
            const m = parts.find((p) => p.type === "month")?.value ?? "00";
            const d = parts.find((p) => p.type === "day")?.value ?? "00";
            return `${y}-${m}-${d}`;
          }

          const todayKey = todayInKolkataYMD();

          const filterFutureOrToday = (arr: CeleItem[]) =>
            arr.filter((c) => (c.date ?? "") >= todayKey);

          const birthdayList = filterFutureOrToday(normalized.filter((c) => c.type === "birthday"));
          const annivList = filterFutureOrToday(normalized.filter((c) => c.type === "anniversary"));

          setBirthdays(birthdayList);
          setAnnivs(annivList);
        } catch (err) {
          console.error("celebrations parse error:", err);
          setBirthdays([]);
          setAnnivs([]);
        }
      } else {
        setBirthdays([]);
        setAnnivs([]);
      }

      // links
      if (linksR.status === "fulfilled" && linksR.value.ok) {
        try {
          const json = await linksR.value.json();
          setLinks(Array.isArray(json) ? json : []);
        } catch {
          setLinks([]);
        }
      } else {
        setLinks([]);
      }
    } catch (err) {
      console.error("loadAll error", err);
    }
  }, []);

  // initial load + polling
  useEffect(() => {
    loadAll();
    pollRef.current = window.setInterval(() => {
      loadAll();
    }, POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadAll]);

  // helpers for alerts (simple)
  const showOK = (msg = "Done") => alert(msg);
  const showErr = (msg = "Failed") => alert(msg);

  // announcement actions
  async function addAnn() {
    if (!name.trim()) return showErr("Title required");
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: name.trim(), body: desc.trim(), announced_on: date || null }),
      });
      if (!res.ok) {
        const text = await safeText(res);
        throw new Error(text || "Add failed");
      }
      setName(""); setDate(""); setDesc("");
      await loadAll();
      showOK("Announcement added");
    } catch (err: unknown) {
      console.error("addAnn error", err);
      showErr(String(err instanceof Error ? err.message : err));
    } finally {
      setActionLoading(false);
    }
  }

  async function delAnn(id: string) {
    if (!confirm("Delete this announcement?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/announcements/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const text = await safeText(res);
        throw new Error(text || "Delete failed");
      }
      await loadAll();
      showOK("Deleted");
    } catch (err: unknown) {
      console.error("delAnn error", err);
      showErr(String(err instanceof Error ? err.message : err));
    } finally {
      setActionLoading(false);
    }
  }

  // links
  async function addLink() {
    if (!linkLabel.trim() || !linkUrl.trim()) return showErr("Label & URL required");
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: linkLabel.trim(), url: linkUrl.trim() }),
      });
      if (!res.ok) {
        const text = await safeText(res);
        throw new Error(text || "Link add failed");
      }
      setLinkLabel(""); setLinkUrl("");
      await loadAll();
      showOK("Link added");
    } catch (err: unknown) {
      console.error("addLink error", err);
      showErr(String(err instanceof Error ? err.message : err));
    } finally {
      setActionLoading(false);
    }
  }

  async function delLink(id: string) {
    if (!confirm("Delete this link?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/links/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const text = await safeText(res);
        throw new Error(text || "Link delete failed");
      }
      await loadAll();
      showOK("Link deleted");
    } catch (err: unknown) {
      console.error("delLink error", err);
      showErr(String(err instanceof Error ? err.message : err));
    } finally {
      setActionLoading(false);
    }
  }

  // small helper to get text from non-ok response
  async function safeText(res: Response) {
    try { const j = await res.json(); return j?.error || j?.message || JSON.stringify(j); } catch { try { return await res.text(); } catch { return null; } }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Dashboard Header */}
        <DashboardHeader />

        {/* Announcements Section */}
        <section className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Announcements
              </h2>
            </div>

            {/* Add Announcement Form */}
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <input 
                  className="md:col-span-4 px-4 py-3 rounded-lg border border-slate-200 focus:border-gray-500 focus:ring-1 focus:ring-gray-200 outline-none transition-all" 
                  placeholder="Announcement title" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                />
                <input 
                  className="md:col-span-3 px-4 py-3 rounded-lg border border-slate-200 focus:border-gray-500 focus:ring-1 focus:ring-gray-200 outline-none transition-all" 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                />
                <input 
                  className="md:col-span-4 px-4 py-3 rounded-lg border border-slate-200 focus:border-gray-500 focus:ring-1 focus:ring-gray-200 outline-none transition-all" 
                  placeholder="(Optional) short description" 
                  value={desc} 
                  onChange={(e) => setDesc(e.target.value)} 
                />
                <button 
                  className="md:col-span-1 px-4 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center" 
                  onClick={addAnn} 
                  disabled={actionLoading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add
                </button>
              </div>
            </div>

            {/* Announcements List */}
            {ann.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No announcements yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {ann.map((a) => (
                  <AnnouncementCard key={`ann-${a.id}`} announcement={a} onDelete={delAnn} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 2x2 Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Who&apos;s Checked In */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Who&apos;s Checked In
              </h3>
              <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {inList.length} present
              </span>
            </div>
            
            {inList.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12H4" />
                </svg>
                <p>No one is checked in</p>
              </div>
            ) : (
              <div className="space-y-3">
                {inList.map((p) => (
                  <EmployeeCard key={`in-${p.id}`} employee={p} status="in" />
                ))}
              </div>
            )}
          </div>

          {/* Recent Checkouts */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recent Checkouts
              </h3>
              <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                Today
              </span>
            </div>
            
            {outList.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12H4" />
                </svg>
                <p>No checkouts yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {outList.map((p) => (
                  <EmployeeCard key={`out-${p.id}`} employee={p} status="out" />
                ))}
              </div>
            )}
          </div>

          {/* Celebrations */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
                Celebrations
              </h3>
              <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {birthdays.length + annivs.length} upcoming
              </span>
            </div>
            
            {birthdays.length === 0 && annivs.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
                </svg>
                <p>No upcoming celebrations</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...birthdays, ...annivs].map((c) => (
                  <CelebrationCard key={`${c.type}-${c.id}`} celebration={c} />
                ))}
              </div>
            )}
          </div>

          {/* Company Links */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Company Links
              </h3>
            </div>
            
            {/* Add Link Form */}
            <div className="bg-slate-50 rounded-xl p-3 mb-4">
              <div className="flex gap-2">
                <input 
                  className="flex-1 px-3 py-2.5 rounded-lg border border-slate-200 focus:border-gray-500 focus:ring-1 focus:ring-gray-200 outline-none transition-all text-sm" 
                  placeholder="Label" 
                  value={linkLabel} 
                  onChange={e => setLinkLabel(e.target.value)} 
                />
                <input 
                  className="flex-1 px-3 py-2.5 rounded-lg border border-slate-200 focus:border-gray-500 focus:ring-1 focus:ring-gray-200 outline-none transition-all text-sm" 
                  placeholder="URL" 
                  value={linkUrl} 
                  onChange={e => setLinkUrl(e.target.value)} 
                />
                <button 
                  className="px-4 py-2.5 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center" 
                  onClick={addLink} 
                  disabled={actionLoading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
            </div>
            
            {links.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <p>No links yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {links.map(l => (
                  <LinkCard key={`link-${l.id}`} link={l} onDelete={delLink} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}