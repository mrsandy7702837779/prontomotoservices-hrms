 
ProntoMoto Services – Employee Management System

A full-stack HR & Employee Management Platform built for ProntoMoto Services with real-time attendance, face authentication, leave workflows, payroll, and admin management tools.
Backend runs on Azure Functions + PostgreSQL, and frontend on Next.js (Vercel).


---

🚀 Features Overview

Admin Portal

Dashboard with announcements, celebrations, checked-in/out employees.

Manage all employees (add, update, delete, archive).

View employee details, assets, leaves, attendance.

Approve/reject:

Leave requests

Profile update requests

Asset requests


Payroll generation (auto-filled data + downloadable payslip PDF).

Calendar with approved leaves & employee photos.

Attendance logs & month-wise reports.

Template/document uploads and deletion.

Reporting matrix (project assignments).

Admin login settings & employee login settings.


Employee Portal

Login using username/password + optional face authentication.

Dashboard with:

Announcements

Check-in / Check-out

Who’s In / Out

Celebrations


Profile data with edit request system.

Apply for leave & track status.

View approved leave history.

Download payslips.

Attendance history & daily logs.



---

🏗 Architecture

Frontend: Next.js + Vercel
Backend: Azure Functions (Node.js)
Database: Azure PostgreSQL Flexible Server
Storage: Azure Blob Storage (Photos, Payslips, Templates)
Authentication: face-api.js face descriptor matching


---

📂 Project Structure

PMS/
│
├── api/
│   └── functions/
│       ├── host.json
│       ├── local.settings.json (ignored)
│       └── src/functions/*.ts
│
└── apps/
    └── web/
        ├── app/
        ├── components/
        ├── public/
        └── .env.local (ignored)


---

🗄 Database Tables

employees

employee_logins

employee_status

attendance_logs

leave_requests

employee_assets

requests (profile, leave, asset)

announcements

company_links

payslips

archived_employees


> Full schema available in /database/schema.sql.




---

💾 Storage Containers

photos – employee images

payslips – generated PDF files

templates – admin-uploaded documents



---

⚙️ Environment Variables

Backend (Azure Function App Settings)

PGHOST=<postgres host>
PGUSER=<postgres username>
PGPASSWORD=<postgres password>
PGDATABASE=postgres
PGPORT=5432
PGSSLMODE=require

AZURE_STORAGE_CONNECTION_STRING=<storage connection string>
AzureWebJobsStorage=<same storage connection string>

CORS_ALLOWED_ORIGINS=*

Frontend (.env.local)

NEXT_PUBLIC_API_BASE=<Azure Function App URL>/api


---

▶️ Run Locally

1️⃣ Start Backend

cd api/functions
func start

2️⃣ Start Frontend

cd apps/web
npm install
npm run dev


---

☁️ Deployment

Backend – Azure Functions

1. Install VS Code Azure Functions extension


2. Open /api/functions folder


3. Click “Deploy to Function App”


4. Add Application Settings in Azure Portal


5. Copy Function App URL into frontend .env.local



Frontend – Vercel

1. Connect GitHub repo


2. Set environment variable:

NEXT_PUBLIC_API_BASE=https://<azure-app>.azurewebsites.net/api


3. Deploy.




---

🎯 Key Highlights

Complete employee lifecycle management

Secure face authentication (face-api.js)

Cloud-native system (Azure Functions + PostgreSQL)

Real-time attendance & leave workflow

Auto PDF payslip generation

Admin & Employee portals with different permissions

Modern UI using Next.js & Tailwind



---

👤 Author

Harshita 
Developer of ProntoMoto Employee Management System

 
