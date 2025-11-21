import "./globals.css";
import Script from "next/script"; // Import the Script component

export const metadata = {
  title: "PMS | Employee System",
  description: "Employee Management System"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* ✅ Use Next.js Script component instead */}
        <Script
          src="https://unpkg.com/face-api.js/dist/face-api.min.js"
          strategy="afterInteractive" // This loads the script after the page becomes interactive
        />
      </head>
      <body className="bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}