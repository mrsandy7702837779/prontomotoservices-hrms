"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

// Use the environment variable FIRST, then fall back to the Azure URL, and finally to localhost
const API =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API ||
  "https://prontomoto-func-001-h8a9fwh0gjdjdpda.centralindia-01.azurewebsites.net/api";

// Define type for API responses
interface EmployeePhotoResponse {
  photo_url: string;
}

interface LoginResponse {
  employee_id: string;
  employee_name: string;
  error?: string;
}

// Define a minimal interface for faceapi to avoid 'any' type
interface FaceAPI {
  nets: {
    tinyFaceDetector: { loadFromUri: (uri: string) => Promise<void> };
    faceRecognitionNet: { loadFromUri: (uri: string) => Promise<void> };
    faceLandmark68Net: { loadFromUri: (uri: string) => Promise<void> };
  };
  TinyFaceDetectorOptions: new () => { inputSize?: number; scoreThreshold?: number };
  detectSingleFace: (input: HTMLVideoElement | HTMLImageElement, options?: unknown) => {
    withFaceLandmarks: () => {
      withFaceDescriptor: () => { descriptor: Float32Array };
    };
  };
  fetchImage: (uri: string) => Promise<HTMLImageElement>;
  euclideanDistance: (descriptor1: Float32Array, descriptor2: Float32Array) => number;
}

export default function LoginPage() {
  const [mode, setMode] = useState<"employee" | "admin">("employee");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [faceMatched, setFaceMatched] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceApiLoaded, setFaceApiLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const router = useRouter();

  // URLs for models via CDN
  const WEIGHTS_BASE =
    "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";

  // Load face-api.js script from CDN
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js";
    script.async = true;
    script.onload = () => {
      setFaceApiLoaded(true);
    };
    script.onerror = () => {
      setError("Failed to load face-api library.");
    };
    document.body.appendChild(script);
  }, []);

  // Load models after face-api is ready
  useEffect(() => {
    async function loadModels() {
      if (!faceApiLoaded) return;
      
      // Use type assertion with a more specific type instead of 'any'
      const faceapi = (window as unknown as { faceapi?: FaceAPI }).faceapi;
      if (!faceapi) return;
      
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(WEIGHTS_BASE),
          faceapi.nets.faceRecognitionNet.loadFromUri(WEIGHTS_BASE),
          faceapi.nets.faceLandmark68Net.loadFromUri(WEIGHTS_BASE),
        ]);
        setModelsLoaded(true);
        console.log("✅ Face models loaded from CDN");
      } catch (e) {
        console.error("Model load error", e);
        setError("Failed to load face detection models.");
      }
    }
    loadModels();
  }, [faceApiLoaded]);

  // Start webcam automatically when Employee mode is selected
  useEffect(() => {
    if (mode === "employee" && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch(() => {
          setError("Camera access denied. Please allow camera permission.");
        });
    }
  }, [mode]);

  async function verifyFace() {
    // Use type assertion with a more specific type instead of 'any'
    const faceapi = (window as unknown as { faceapi?: FaceAPI }).faceapi;
    if (!faceapi || !videoRef.current) return;
    setError("");
    setIsScanning(true);

    try {
      // Create options using the constructor
      const options = new faceapi.TinyFaceDetectorOptions();
      const detections = await faceapi
        .detectSingleFace(videoRef.current, options)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detections) {
        setError("Face not detected. Please try again.");
        setIsScanning(false);
        return;
      }

      // Fetch stored employee photo for comparison
      const res = await fetch(
        `${API}/employee-photo?username=${encodeURIComponent(username)}`
      );
      if (!res.ok) throw new Error("Employee not found or no face data.");
      const data = (await res.json()) as EmployeePhotoResponse;

      const img = await faceapi.fetchImage(data.photo_url);
      const storedOptions = new faceapi.TinyFaceDetectorOptions();
      const storedFace = await faceapi
        .detectSingleFace(img, storedOptions)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!storedFace) throw new Error("Stored face not detected.");

      const distance = faceapi.euclideanDistance(
        detections.descriptor,
        storedFace.descriptor
      );
      console.log("🔍 Face match distance:", distance);

      if (distance < 0.45) {
        setFaceMatched(true);
      } else {
        setError("Face mismatch. Please try again.");
      }
    } catch (e: unknown) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "Face authentication failed";
      setError(errorMessage);
    } finally {
      setIsScanning(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "admin") {
        // Admin login
        const res = await fetch(`${API}/root-admin-verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        const data = (await res.json()) as LoginResponse;
        if (!res.ok) throw new Error(data.error || "Invalid credentials");
        router.push("/a/dashboard");
      } else {
        // Employee login
        if (!faceMatched)
          throw new Error("Please complete face authentication first.");

        const res = await fetch(`${API}/employee-login-verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        const data = (await res.json()) as LoginResponse;
        if (!res.ok) throw new Error(data.error || "Invalid credentials");

        localStorage.setItem("employee_id", data.employee_id);
        localStorage.setItem("employee_name", data.employee_name);
        router.push("/e/dashboard");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-blue-100 opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-indigo-100 opacity-20 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white opacity-10 blur-3xl"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-md">
        {/* Main card with glassmorphism effect */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 transition-all duration-500 hover:shadow-3xl">
          {/* Header with icon and title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 mb-5 shadow-lg border border-white/50">
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {mode === "employee" ? "Employee Portal" : "Admin Portal"}
            </h1>
            <p className="text-gray-500">Secure biometric authentication</p>
          </div>

          {/* Mode toggle with enhanced design */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1 bg-gray-100 rounded-2xl shadow-inner">
              <button
                onClick={() => setMode("employee")}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  mode === "employee"
                    ? "bg-white text-blue-600 shadow-md"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Employee
                </div>
              </button>
              <button
                onClick={() => setMode("admin")}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  mode === "admin"
                    ? "bg-white text-blue-600 shadow-md"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Admin
                </div>
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username field with enhanced design */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 bg-white/70 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all shadow-sm"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            {/* Password field with enhanced design */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 bg-white/70 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all shadow-sm"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {/* Face scanning section with futuristic design */}
            {mode === "employee" && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-800 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Biometric Verification
                  </h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    faceMatched ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {faceMatched ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Verified
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Pending
                      </>
                    )}
                  </span>
                </div>
                
                <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 overflow-hidden shadow-inner">
                  {modelsLoaded ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        className="w-full h-56 object-cover"
                      />
                      
                      {/* Futuristic overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        {/* Scanning frame */}
                        <div className={`absolute w-48 h-48 rounded-full border-4 ${
                          isScanning ? 'border-blue-400 animate-pulse' : faceMatched ? 'border-green-400' : 'border-white/30'
                        }`}></div>
                        
                        {/* Corner indicators */}
                        <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-blue-400 rounded-tl-lg"></div>
                        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-blue-400 rounded-tr-lg"></div>
                        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-blue-400 rounded-bl-lg"></div>
                        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-blue-400 rounded-br-lg"></div>
                        
                        {/* Scanning animation */}
                        {isScanning && (
                          <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-scan"></div>
                        )}
                        
                        {/* Scan button or verification status */}
                        {!faceMatched ? (
                          <button
                            type="button"
                            onClick={verifyFace}
                            disabled={isScanning}
                            className="absolute px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-medium hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {isScanning ? 'Scanning...' : 'Scan Face'}
                          </button>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-green-500/10">
                            <div className="bg-white rounded-full p-4 shadow-xl">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-56">
                      <div className="relative">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-ping"></div>
                      </div>
                      <p className="text-gray-500">Loading biometric models...</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error message with enhanced design */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100 flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Login button with enhanced design */}
            <button
              type="submit"
              disabled={loading || (mode === "employee" && !faceMatched)}
              className={`w-full py-4 mt-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center ${
                loading
                  ? "bg-gray-300 text-gray-500"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authenticating...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Secure Login
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer with enhanced design */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} ProntoMoto Services. Secure by design.
          </p>
          <div className="flex justify-center mt-3 space-x-4">
            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
          </div>
        </div>
      </div>
      
      {/* Custom animation styles */}
      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  );
}