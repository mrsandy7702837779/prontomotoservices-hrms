"use client";

import { useEffect, useState } from "react";
import Image from "next/image"; // Import Next.js Image component

type Employee = {
  id: string;
  emp_code: string;
  first_name: string;
  last_name: string;
  job_title?: string;
  photo_url?: string;
};

// Use the environment variable FIRST, then fall back to the Azure URL, and finally to localhost
const API =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API ||
  "https://prontomoto-func-001-h8a9fwh0gjdjdpda.centralindia-01.azurewebsites.net/api";

// Define face-api types to avoid using 'any'
declare global {
  interface Window {
    faceapi?: {
      nets: {
        tinyFaceDetector: {
          loadFromUri: (uri: string) => Promise<void>;
        };
        faceLandmark68Net: {
          loadFromUri: (uri: string) => Promise<void>;
        };
        faceRecognitionNet: {
          loadFromUri: (uri: string) => Promise<void>;
        };
      };
      detectSingleFace: (input: HTMLImageElement, options: unknown) => {
        withFaceLandmarks: () => {
          withFaceDescriptor: () => Promise<{
            descriptor: Float32Array;
          } | null>;
        };
      };
      TinyFaceDetectorOptions: new () => unknown;
    };
  }
}

export default function LoginSettings() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [active, setActive] = useState<Employee | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminSaved, setAdminSaved] = useState(false);

  useEffect(() => {
    fetch(`${API}/employees`)
      .then((r) => r.json())
      .then(setEmployees)
      .catch(console.error);

    (async () => {
      try {
        const r = await fetch(`${API}/root-admin-logins`);
        if (!r.ok) return;
        const j = await r.json();
        if (Array.isArray(j) && j.length > 0) {
          setAdminUsername(j[0].username || "");
        }
      } catch {
        // ignore - fixed unused variable warning
      }
    })();
  }, []);

  async function saveLogin() {
    if (!active) return;
    setLoading(true);
    setSaved(false);
    try {
      const res = await fetch(`${API}/employee-logins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: active.id,
          username,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      setSaved(true);
      setTimeout(() => {
        setActive(null);
        setUsername("");
        setPassword("");
        setSaved(false);
      }, 1000);
    } catch (err) {
      console.error(err);
      alert("Error saving credentials. Check console.");
    } finally {
      setLoading(false);
    }
  }

  function openFor(emp: Employee) {
    setActive(emp);
    setUsername("");
    setPassword("");
    setFile(null);
    setPreview(null);
    setUploadStatus("");
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files && e.target.files[0];
    setFile(f || null);
    if (f) setPreview(URL.createObjectURL(f));
  }

  // ✅ New version with auto face descriptor
  async function uploadPhotoAndSave() {
    if (!active) return alert("No employee selected");
    if (!file) return alert("Choose a photo first");
    setUploadingPhoto(true);
    setUploadStatus("Loading face models...");

    try {
      if (!window.faceapi) {
        alert("face-api.js not loaded. Add CDN <script> in layout.");
        setUploadingPhoto(false);
        return;
      }
      const faceapi = window.faceapi; // Fixed type

      // load models from /models or CDN fallback
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);
      } catch (e) {
        console.warn("Face models load failed (if using CDN, ignore).", e);
      }

      // compute descriptor
      setUploadStatus("Analyzing face...");
      const imgUrl = URL.createObjectURL(file);
      const imgEl = document.createElement("img");
      imgEl.src = imgUrl;
      await new Promise((r) => (imgEl.onload = r));
      const det = await faceapi
        .detectSingleFace(imgEl, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!det) {
        URL.revokeObjectURL(imgUrl);
        setUploadStatus("");
        alert("No face detected. Use a clearer front-facing photo.");
        return;
      }

      const descriptorArray = Array.from(det.descriptor);
      URL.revokeObjectURL(imgUrl);

      // Upload image to blob
      setUploadStatus("Uploading photo...");
      const arrayBuffer = await file.arrayBuffer();
      const uploadRes = await fetch(`${API}/photos`, {
        method: "POST",
        body: arrayBuffer,
        headers: { "Content-Type": file.type || "image/jpeg" },
      });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadJson.error || "Upload failed");
      const url = uploadJson.url;

      // Save descriptor
      setUploadStatus("Saving face data...");
      const descRes = await fetch(`${API}/face-descriptor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: active.id,
          descriptor: descriptorArray,
        }),
      });
      if (!descRes.ok) console.warn("Descriptor save failed");

      // Update employee photo URL
      const upd = await fetch(`${API}/employees/${encodeURIComponent(active.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo_url: url }),
      });
      if (!upd.ok) throw new Error(await upd.text());

      setEmployees((prev) =>
        prev.map((p) => (p.id === active.id ? { ...p, photo_url: url } : p))
      );
      setActive((a) => (a ? { ...a, photo_url: url } : a));
      setFile(null);
      setPreview(null);
      setUploadStatus("✅ Uploaded and saved successfully!");
    } catch (err: unknown) { // Fixed type
      console.error("uploadPhoto failed", err);
      alert("Upload failed: " + (err instanceof Error ? err.message : String(err)));
      setUploadStatus("");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function saveAdminCredentials() {
    setAdminLoading(true);
    setAdminSaved(false);
    try {
      const res = await fetch(`${API}/root-admin-logins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: adminUsername, password: adminPassword }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      setAdminSaved(true);
      setTimeout(() => setAdminSaved(false), 1200);
    } catch (e) {
      console.error(e);
      alert("Failed to save admin credentials");
    } finally {
      setAdminLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Login Settings</h1>
      <p className="text-slate-500">
        Assign login credentials and upload employee face photos.
      </p>

      {/* Admin credentials block */}
      <div className="bg-white border rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">Admin Credentials</div>
            <div className="text-sm text-slate-500">
              Create or update admin username/password
            </div>
          </div>
          <div className="text-sm text-slate-500">
            (used for admin dashboard login)
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            className="input p-2 rounded-md border"
            placeholder="Admin username"
            value={adminUsername}
            onChange={(e) => setAdminUsername(e.target.value)}
          />
          <input
            className="input p-2 rounded-md border"
            placeholder="Admin password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
          />
          <button
            onClick={saveAdminCredentials}
            disabled={adminLoading}
            className="btn bg-blue-600 text-white rounded-md px-3"
          >
            {adminLoading ? "Saving..." : adminSaved ? "Saved ✅" : "Save Admin"}
          </button>
        </div>
      </div>

      {/* Employee list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map((emp) => (
          <div
            key={emp.id}
            className="p-4 rounded-xl border hover:shadow-md bg-white transition cursor-pointer"
            onClick={() => openFor(emp)}
          >
            <div className="flex items-center gap-4">
              <Image
                src={emp.photo_url || "https://randomuser.me/api/portraits/lego/1.jpg"}
                width={56}
                height={56}
                className="w-14 h-14 rounded-full border object-cover"
                alt=""
              />
              <div>
                <div className="font-semibold text-slate-800">
                  {emp.first_name} {emp.last_name}
                </div>
                <div className="text-sm text-slate-500">{emp.emp_code}</div>
                <div className="text-xs text-slate-400">
                  {emp.job_title || "Employee"}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for employee config */}
      {active && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-[520px] relative">
            <button
              onClick={() => setActive(null)}
              className="absolute top-3 right-4 text-slate-500 hover:text-slate-700"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-5">
              <Image
                src={
                  active.photo_url || "https://randomuser.me/api/portraits/lego/2.jpg"
                }
                width={56}
                height={56}
                className="w-14 h-14 rounded-full border object-cover"
                alt=""
              />
              <div>
                <div className="font-semibold text-lg">
                  {active.first_name} {active.last_name}
                </div>
                <div className="text-sm text-slate-500">{active.emp_code}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Username</label>
                <input
                  type="text"
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Password</label>
                <input
                  type="password"
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                />
              </div>

              {/* Upload */}
              <div>
                <div className="text-sm text-slate-600 mb-1">
                  Upload / Change Face Photo
                </div>
                <div className="flex gap-3 items-center">
                  <input type="file" accept="image/*" onChange={onFileChange} />
                  {preview ? (
                    <Image
                      src={preview}
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full object-cover border"
                      alt="preview"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-xs">
                      preview
                    </div>
                  )}
                  <button
                    onClick={uploadPhotoAndSave}
                    disabled={uploadingPhoto || !file}
                    className="px-3 py-2 bg-emerald-600 text-white rounded-md"
                  >
                    {uploadingPhoto ? "Processing..." : "Upload Photo"}
                  </button>
                </div>
                {uploadStatus && (
                  <div className="text-xs text-slate-500 mt-1">{uploadStatus}</div>
                )}
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={saveLogin}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? "Saving..." : saved ? "✅ Saved" : "Save Credentials"}
                </button>
                <button
                  onClick={() => {
                    setUsername("");
                    setPassword("");
                  }}
                  className="w-full py-3 rounded-xl bg-white border border-slate-200 font-semibold hover:bg-slate-50"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}