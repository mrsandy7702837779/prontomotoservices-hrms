"use client";

import { useEffect, useState } from "react";
import { UploadCloud, Trash2, Eye, Download, RefreshCw } from "lucide-react";

// Use the environment variable FIRST, then fall back to the Azure URL, and finally to localhost
const API =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API ||
  "https://prontomoto-func-001-h8a9fwh0gjdjdpda.centralindia-01.azurewebsites.net/api";

type TemplateItem = {
  name: string;
  url: string;
  contentType?: string;
  size?: number;
  lastModified?: string;
};

export default function AdminTemplatesPage() {
  const [files, setFiles] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<TemplateItem | null>(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  // Load templates on mount
  useEffect(() => {
    loadList();
  }, []);

  async function loadList() {
    try {
      setLoading(true);
      const res = await fetch(`${API}/templates/list`);
      const data = await res.json();
      setFiles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to list templates", err);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(",")[1];
        const payload = {
          filename: f.name,
          contentType: f.type || "application/octet-stream",
          base64: base64Data,
        };

        const res = await fetch(`${API}/templates/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await res.text());
        await loadList();
        setFileInputKey(Date.now());
        alert("Uploaded successfully");
      };
      reader.readAsDataURL(f);
    } catch (err: unknown) { // Fixed type
      console.error("upload error", err);
      alert("Upload failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(name: string) {
    if (!confirm(`Delete "${name}" ?`)) return;
    try {
      const res = await fetch(`${API}/templates/delete?filename=${encodeURIComponent(name)}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      await loadList();
      alert("Deleted successfully");
    } catch (err) {
      console.error("delete error", err);
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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Templates
              </h1>
              <p className="text-gray-600 mt-1">Upload, preview and manage PDF / Word templates</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={loadList}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
              >
                <RefreshCw size={18} className="text-gray-600" />
                <span className="text-gray-700">Refresh</span>
              </button>
              <label className="flex items-center gap-2 cursor-pointer px-4 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl transition-colors shadow-md">
                <UploadCloud size={18} />
                <span>{uploading ? "Uploading..." : "Upload file"}</span>
                <input
                  key={fileInputKey}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-300 mb-4"></div>
                <p className="text-gray-600 font-medium">Loading templates...</p>
              </div>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No templates uploaded yet</h3>
              <p className="text-gray-600 max-w-md mx-auto">Upload PDF or Word documents to get started with your template library</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {files.map((f) => (
                <div key={f.name} className="bg-gray-50 border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 flex items-center justify-center bg-white border border-gray-300 rounded-lg shadow-sm">
                      <span className="text-xs font-bold text-gray-700">
                        {f.name.toLowerCase().endsWith(".pdf") ? "PDF" : "DOC"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setPreview(f)}
                        className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 transition-colors"
                        title="Preview"
                      >
                        <Eye size={16} className="text-gray-600" />
                      </button>
                      <a 
                        href={f.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 transition-colors"
                        title="Download"
                      >
                        <Download size={16} className="text-gray-600" />
                      </a>
                      <button
                        onClick={() => handleDelete(f.name)}
                        className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} className="text-gray-600" />
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1 truncate">{f.name}</h3>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        {f.size ? `${Math.round(f.size / 1024)} KB` : "Unknown size"}
                      </div>
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {f.lastModified ? new Date(f.lastModified).toLocaleDateString() : "Unknown date"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview Modal */}
        {preview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl h-[85vh] overflow-hidden border border-gray-200 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded-lg shadow-sm">
                    <span className="text-sm font-bold text-gray-700">
                      {preview.name.toLowerCase().endsWith(".pdf") ? "PDF" : "DOC"}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{preview.name}</h3>
                    <div className="text-xs text-gray-500">
                      {preview.size ? `${Math.round(preview.size / 1024)} KB` : ""} • {" "}
                      {preview.lastModified ? new Date(preview.lastModified).toLocaleString() : ""}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a 
                    href={preview.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Download size={16} className="text-gray-600" />
                    <span className="text-gray-700">Download</span>
                  </a>
                  <button 
                    onClick={() => setPreview(null)} 
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-gray-700">Close</span>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto bg-gray-100">
                {preview.name.toLowerCase().endsWith(".pdf") ? (
                  <iframe 
                    src={preview.url} 
                    className="w-full h-full" 
                    title={preview.name}
                  />
                ) : (
                  <iframe
                    src={`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(preview.url)}`}
                    className="w-full h-full"
                    title={preview.name}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}