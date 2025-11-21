-- =====================================================================
--  PRONTOMOTO SERVICES - DATABASE SCHEMA (AZURE SAFE VERSION)
--  No extensions required. App generates UUIDs with uuidv4().
-- =====================================================================

-- ======================================
-- EMPLOYEES MASTER TABLE
-- ======================================
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY,
  emp_code TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  mobile TEXT,
  job_title TEXT,
  department TEXT,
  project TEXT,
  manager TEXT,
  address TEXT,
  status VARCHAR(20) DEFAULT 'active',
  photo_url TEXT,
  dob DATE,
  join_date DATE,
  marital_status VARCHAR(20),
  marriage_date DATE,
  blood_group VARCHAR(8),
  emergency_name TEXT,
  emergency_mobile TEXT,
  grad_college TEXT,
  grad_degree TEXT,
  grad_year INT,
  inter_college TEXT,
  inter_course TEXT,
  inter_year INT,
  face_descriptor JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ======================================
-- EMPLOYEE LOGINS
-- ======================================
CREATE TABLE IF NOT EXISTS employee_logins (
  id UUID PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_employee_login UNIQUE (employee_id)
);

-- ======================================
-- EMPLOYEE STATUS
-- ======================================
CREATE TABLE IF NOT EXISTS employee_status (
  employee_id UUID PRIMARY KEY REFERENCES employees(id) ON DELETE CASCADE,
  presence TEXT NOT NULL DEFAULT 'out',
  last_seen_ts TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_employee_status UNIQUE (employee_id)
);

-- ======================================
-- ATTENDANCE LOGS
-- ======================================
CREATE TABLE IF NOT EXISTS attendance_logs (
  id UUID PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in_ts TIMESTAMPTZ,
  check_out_ts TIMESTAMPTZ,
  worked_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_employee_date UNIQUE (employee_id, date)
);
CREATE INDEX IF NOT EXISTS idx_att_emp_date ON attendance_logs(employee_id, date);

-- ======================================
-- ATTENDANCE (simplified)
-- ======================================
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id),
  date DATE NOT NULL,
  login_time TIME,
  logout_time TIME,
  worked_minutes INTEGER DEFAULT 0,
  hours NUMERIC(5,2) GENERATED ALWAYS AS (worked_minutes::numeric / 60) STORED,
  status TEXT DEFAULT 'absent',
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_attendance_date UNIQUE (employee_id, date)
);
CREATE INDEX IF NOT EXISTS attendance_employee_date_idx ON attendance(employee_id, date);

-- ======================================
-- LEAVE REQUESTS
-- ======================================
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_leave_emp ON leave_requests(employee_id, start_date);

-- ======================================
-- EMPLOYEE ASSETS
-- ======================================
CREATE TABLE IF NOT EXISTS employee_assets (
  id UUID PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_code TEXT,
  issued_on DATE,
  returned_on DATE,
  status TEXT DEFAULT 'issued',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_assets_emp ON employee_assets(employee_id);

-- ======================================
-- REQUESTS TABLE
-- ======================================
CREATE TABLE IF NOT EXISTS requests (
  id UUID PRIMARY KEY,
  type VARCHAR(32) NOT NULL,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  handled_by UUID,
  handled_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_requests_type_status ON requests(type, status);

-- ======================================
-- ANNOUNCEMENTS
-- ======================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  announced_on DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ======================================
-- COMPANY LINKS
-- ======================================
CREATE TABLE IF NOT EXISTS company_links (
  id UUID PRIMARY KEY,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ======================================
-- PAYSLIPS
-- ======================================
CREATE TABLE IF NOT EXISTS payslips (
  id UUID PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL,
  year INTEGER NOT NULL,
  salary NUMERIC,
  pf NUMERIC,
  totalWorkedDays INTEGER,
  totalHours INTEGER,
  netPay NUMERIC,
  pdf_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payslips_employee_month ON payslips(employee_id, month);

-- ======================================
-- ADMIN LOGIN
-- ======================================
CREATE TABLE IF NOT EXISTS admin_logins (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======================================
-- TRIGGER FUNCTIONS (same logic)
-- ======================================

CREATE OR REPLACE FUNCTION fn_create_employee_status()
RETURNS TRIGGER LANGUAGE plpgsql AS
$$
BEGIN
  INSERT INTO employee_status(employee_id, presence, last_seen_ts)
  VALUES (NEW.id, 'out', now())
  ON CONFLICT (employee_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_after_insert_employee_create_status ON employees;
CREATE TRIGGER trg_after_insert_employee_create_status
AFTER INSERT ON employees
FOR EACH ROW EXECUTE FUNCTION fn_create_employee_status();

CREATE OR REPLACE FUNCTION fn_delete_payslips_on_employee_delete()
RETURNS TRIGGER LANGUAGE plpgsql AS
$$
BEGIN
  DELETE FROM payslips WHERE employee_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_delete_payslips_on_employee_delete ON employees;
CREATE TRIGGER trg_delete_payslips_on_employee_delete
AFTER DELETE ON employees
FOR EACH ROW EXECUTE FUNCTION fn_delete_payslips_on_employee_delete();

-- ======================================
-- BACKFILL EXISTING STATUS
-- ======================================
INSERT INTO employee_status (employee_id, presence, last_seen_ts)
SELECT e.id, 'out', now()
FROM employees e
LEFT JOIN employee_status s ON s.employee_id = e.id
WHERE s.employee_id IS NULL;

-- ======================================
-- DONE
-- ======================================
SELECT '✅ Azure-safe ProntoMoto schema deployed successfully at ' || now() AS status;
