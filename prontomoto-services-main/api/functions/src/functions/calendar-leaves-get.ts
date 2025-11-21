// calendar-leaves-get.ts
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { pool } from "../shared/db";

/**
 * GET /api/calendar/leaves?month=YYYY-MM&employeeId=... OR empCode=...
 * Returns: { month, leaves, attendance, summary }
 */
export async function calendarLeavesGet(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const url = new URL(req.url);
    const monthParam = url.searchParams.get("month");
    const employeeId = url.searchParams.get("employeeId") || null; // UUID
    const empCode = url.searchParams.get("empCode") || null;       // optional emp code (PMS001)

    const today = new Date();
    const monthStr = monthParam || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

    // compute month start (YYYY-MM-01) and month end (first day of next month)
    const [y, m] = monthStr.split("-").map(Number);
    const monthStartDate = new Date(y, m - 1, 1);
    const monthNextDate = new Date(y, m, 1); // first day of next month (handles december -> next year)

    const monthStart = monthStartDate.toISOString().slice(0, 10);
    const monthNext = monthNextDate.toISOString().slice(0, 10);

    // Build where clauses safely
    const leaveWhereExtra = employeeId ? "AND l.employee_id = $3" : empCode ? "AND e.emp_code = $3" : "";
    const leaveParams = employeeId ? [monthStart, monthNext, employeeId] : empCode ? [monthStart, monthNext, empCode] : [monthStart, monthNext];

    const leaveQuery = `
      SELECT
        l.id,
        l.employee_id,
        l.start_date::date,
        l.end_date::date,
        l.reason,
        l.status,
        e.emp_code,
        e.first_name,
        e.last_name,
        e.photo_url
      FROM leave_requests l
      JOIN employees e ON e.id = l.employee_id
      WHERE l.status = 'approved'
        AND l.start_date <= $2::date
        AND l.end_date >= $1::date
        ${leaveWhereExtra}
      ORDER BY l.start_date ASC;
    `;

    const { rows: leaves } = await pool.query(leaveQuery, leaveParams);

    // Attendance query
    const attWhereExtra = employeeId ? "AND a.employee_id = $3" : empCode ? "AND e.emp_code = $3" : "";
    const attParams = employeeId ? [monthStart, monthNext, employeeId] : empCode ? [monthStart, monthNext, empCode] : [monthStart, monthNext];

    const attQuery = `
      SELECT
        a.employee_id,
        a.date::date,
        a.check_in_ts,
        a.check_out_ts,
        a.worked_minutes,
        e.emp_code,
        e.first_name,
        e.last_name,
        e.photo_url
      FROM attendance_logs a
      JOIN employees e ON e.id = a.employee_id
      WHERE a.date >= $1::date AND a.date < $2::date
        ${attWhereExtra}
      ORDER BY a.date ASC;
    `;

    const { rows: attendance } = await pool.query(attQuery, attParams);

    // Build sets for summary
    const presentDays = new Set(attendance.map((a) => (a.date ? (a.date instanceof Date ? a.date.toISOString().slice(0,10) : String(a.date).slice(0,10)) : "")));
    const leaveDays = new Set(
      leaves.flatMap((l: any) => {
        const days: string[] = [];
        let d = new Date(l.start_date);
        const end = new Date(l.end_date);
        while (d <= end) {
          days.push(d.toISOString().slice(0, 10));
          d.setDate(d.getDate() + 1);
        }
        return days;
      })
    );

    const monthTotal = new Date(y, m, 0).getDate(); // last day of month
    let workingDays = 0, leaveCount = 0, presentCount = 0, absentCount = 0;

    for (let i = 1; i <= monthTotal; i++) {
      const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const day = new Date(dateStr).getDay();
      if (day === 0) continue; // skip Sundays
      workingDays++;
      if (leaveDays.has(dateStr)) leaveCount++;
      else if (presentDays.has(dateStr)) presentCount++;
      else absentCount++;
    }

    return {
      status: 200,
      jsonBody: {
        month: monthStr,
        leaves,
        attendance,
        summary: {
          workingDays,
          presentCount,
          leaveCount,
          absentCount,
        },
      },
    };
  } catch (err: any) {
    console.error("calendar-leaves-get error:", err);
    return {
      status: 500,
      jsonBody: { error: "calendar query failed", details: String(err) },
    };
  }
}

app.http("calendar-leaves-get", {
  route: "calendar/leaves",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: calendarLeavesGet,
});
