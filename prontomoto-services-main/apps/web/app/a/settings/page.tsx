"use client";
import { useRouter } from "next/navigation";
import { Settings, MapPin } from "lucide-react";

export default function SettingsHome() {
  const router = useRouter();

  const settings = [
    {
      title: "Login Settings",
      description: "Manage employee login credentials.",
      icon: <Settings className="w-8 h-8 text-blue-600" />,
      path: "/a/settings/login",
    },
    {
      title: "Geo-Location Settings",
      description: "Set allowed login locations for employees.",
      icon: <MapPin className="w-8 h-8 text-green-600" />,
      path: "/a/settings/geolocation",
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {settings.map((item) => (
          <div
            key={item.path}
            onClick={() => router.push(item.path)}
            className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition cursor-pointer"
          >
            <div className="flex items-center gap-4 mb-3">
              {item.icon}
              <div>
                <h2 className="font-semibold text-lg">{item.title}</h2>
                <p className="text-sm text-slate-500">{item.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
