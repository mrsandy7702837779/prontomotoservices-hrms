// src/functions/attendance-get.ts
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { pool } from "../shared/db";

function looksLikeYYYYMM(s?: string) {
  return !!s && /^\d{4}-\d{2}$/.test(s);
}

export async function attendanceGet(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const url = new URL(req.url);
    const getQ = (k: string) =>
      typeof (req.query as any)?.get === "function"
        ? (req.query as any).get(k)
        : url.searchParams.get(k);

    const employeeId = getQ("employeeId");
    const month = getQ("month");

    if (!employeeId)
      return { status: 400, jsonBody: { error: "employeeId required" } };

    /* ✅ Case 1: Month in YYYY-MM format */
    if (month && looksLikeYYYYMM(month)) {
      const [y, m] = month.split("-").map(Number);
      const monthStart = `${y}-${String(m).padStart(2, "0")}-01`;
      const next = new Date(y, m, 1);
      const monthNext = next.toISOString().slice(0, 10);

      let rows: any[] = [];

      try {
        const result = await pool.query(
          `
          SELECT 
            date, login_time, logout_time, worked_minutes, hours, status
          FROM attendance
          WHERE employee_id = $1
            AND date >= $2::date
            AND date < $3::date
          ORDER BY date ASC
          `,
          [employeeId, monthStart, monthNext]
        );
        rows = result.rows || [];
      } catch (err: any) {
        if (err?.code === "42P01") {
          console.warn("attendance table missing, falling back to attendance_logs");
        } else {
          console.error("attendance-get query error:", err);
          return { status: 500, jsonBody: { error: "DB error", details: String(err) } };
        }
      }

      if (!rows.length) {
        const { rows: logRows } = await pool.query(
          `
          SELECT 
            a.date, a.check_in_ts AS login_time, a.check_out_ts AS logout_time, a.worked_minutes,
            e.first_name, e.last_name, e.emp_code, e.photo_url
          FROM attendance_logs a
          JOIN employees e ON e.id = a.employee_id
          WHERE a.employee_id = $1
            AND a.date >= $2::date
            AND a.date < $3::date
          ORDER BY a.date ASC
          `,
          [employeeId, monthStart, monthNext]
        );
        rows = logRows;
      }

      const normalized = rows.map((r: any) => {
        // Convert to correct local date
        const dateObj = r.date ? new Date(r.date) : null;
        const localDateStr = dateObj
          ? new Date(
              dateObj.getTime() - dateObj.getTimezoneOffset() * 60000
            )
              .toISOString()
              .slice(0, 10)
          : null;

        return {
          date: localDateStr,
          login_time: r.login_time ?? r.check_in_ts ?? null,
          logout_time: r.logout_time ?? r.check_out_ts ?? null,
          hours:
            typeof r.hours === "number"
              ? r.hours
              : r.worked_minutes
              ? Math.round(Number(r.worked_minutes) / 60)
              : 0,
          status: r.status ?? (r.worked_minutes ? "present" : "absent"),
        };
      });

      return { status: 200, jsonBody: normalized };
    }

    /* ✅ Case 2: Month not YYYY-MM */
    if (month) {
      const { rows } = await pool
        .query(
          `
          SELECT date, login_time, logout_time, worked_minutes, hours, status
          FROM attendance
          WHERE employee_id = $1
            AND to_char(date, 'Month') ILIKE $2
          ORDER BY date ASC
          `,
          [employeeId, `%${month}%`]
        )
        .catch(async (err: any) => {
          if (err?.code === "42P01") {
            const { rows: logs } = await pool.query(
              `
              SELECT a.date, a.check_in_ts AS login_time, a.check_out_ts AS logout_time, a.worked_minutes
              FROM attendance_logs a
              WHERE a.employee_id = $1
                AND to_char(a.date, 'Month') ILIKE $2
              ORDER BY a.date ASC
              `,
              [employeeId, `%${month}%`]
            );
            return { rows: logs };
          }
          throw err;
        });

      const normalized = rows.map((r: any) => {
        const dateObj = r.date ? new Date(r.date) : null;
        const localDateStr = dateObj
          ? new Date(
              dateObj.getTime() - dateObj.getTimezoneOffset() * 60000
            )
              .toISOString()
              .slice(0, 10)
          : null;

        return {
          date: localDateStr,
          login_time: r.login_time ?? r.check_in_ts ?? null,
          logout_time: r.logout_time ?? r.check_out_ts ?? null,
          hours:
            r.hours ??
            (r.worked_minutes
              ? Math.round(Number(r.worked_minutes) / 60)
              : 0),
          status: r.status ?? (r.worked_minutes ? "present" : "absent"),
        };
      });

      return { status: 200, jsonBody: normalized };
    }

    /* ✅ Case 3: Last 31 days fallback */
    const { rows } = await pool.query(
      `
      SELECT date, login_time, logout_time, worked_minutes, hours, status
      FROM attendance
      WHERE employee_id = $1
        AND date >= (CURRENT_DATE - INTERVAL '31 days')
      ORDER BY date ASC
      `,
      [employeeId]
    );

    const normalized = rows.map((r: any) => {
      const dateObj = r.date ? new Date(r.date) : null;
      const localDateStr = dateObj
        ? new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 10)
        : null;

      return {
        date: localDateStr,
        login_time: r.login_time ?? null,
        logout_time: r.logout_time ?? null,
        hours:
          r.hours ??
          (r.worked_minutes
            ? Math.round(Number(r.worked_minutes) / 60)
            : 0),
        status: r.status ?? (r.worked_minutes ? "present" : "absent"),
      };
    });

    return { status: 200, jsonBody: normalized };
  } catch (err: any) {
    console.error("attendance-get outer error:", err);
    return {
      status: 500,
      jsonBody: { error: "Server error", details: String(err) },
    };
  }
}

app.http("attendance-get", {
  route: "attendance",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: attendanceGet,
});
