// src/functions/celebrations-get.ts
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { pool } from "../shared/db";

/**
 * Return upcoming celebrations within next 30 days (inclusive),
 * calculated in Asia/Kolkata timezone by generating the date series
 * and matching employee dob/join_date by month+day.
 */
export async function celebrationsGet(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const { rows } = await pool.query(`
      WITH tz AS (
        SELECT
          (now() AT TIME ZONE 'Asia/Kolkata')::date AS today_ist,
          ((now() AT TIME ZONE 'Asia/Kolkata')::date + INTERVAL '30 days')::date AS max_ist
      ),
      days AS (
        SELECT generate_series((SELECT today_ist FROM tz), (SELECT max_ist FROM tz), '1 day')::date AS dt
      )
      SELECT
        e.id,
        e.emp_code,
        e.first_name,
        e.last_name,
        e.photo_url,
        d.dt::date AS celebration_date,
        CASE
          WHEN e.dob IS NOT NULL
            AND EXTRACT(MONTH FROM e.dob) = EXTRACT(MONTH FROM d.dt)
            AND EXTRACT(DAY FROM e.dob) = EXTRACT(DAY FROM d.dt)
          THEN 'birthday'
          WHEN e.join_date IS NOT NULL
            AND EXTRACT(MONTH FROM e.join_date) = EXTRACT(MONTH FROM d.dt)
            AND EXTRACT(DAY FROM e.join_date) = EXTRACT(DAY FROM d.dt)
          THEN 'anniversary'
          ELSE NULL
        END AS celebration_type
      FROM employees e
      JOIN days d ON (
        (e.dob IS NOT NULL AND EXTRACT(MONTH FROM e.dob) = EXTRACT(MONTH FROM d.dt) AND EXTRACT(DAY FROM e.dob) = EXTRACT(DAY FROM d.dt))
        OR
        (e.join_date IS NOT NULL AND EXTRACT(MONTH FROM e.join_date) = EXTRACT(MONTH FROM d.dt) AND EXTRACT(DAY FROM e.join_date) = EXTRACT(DAY FROM d.dt))
      )
      WHERE e.status = 'active'
      ORDER BY d.dt ASC, e.first_name ASC
    `);

    // quick server-side log (helps ensure function is returning rows)
    console.log(`celebrations-get -> found ${rows.length} matching celebration rows`);

    const celebrations = rows.map((r: any) => ({
      id: r.id,
      emp_code: r.emp_code,
      name: `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim(),
      type: String(r.celebration_type || "birthday"),
      date: (r.celebration_date instanceof Date)
        ? r.celebration_date.toISOString().slice(0, 10)
        : String(r.celebration_date).slice(0, 10),
      photo_url: r.photo_url || null,
    }));

    // Build tidy response with arrays for backward compatibility
    return {
      status: 200,
      jsonBody: {
        celebrations,
        birthdays: celebrations.filter((c) => c.type === "birthday"),
        anniversaries: celebrations.filter((c) => c.type === "anniversary"),
      },
    };
  } catch (err: any) {
    console.error("celebrationsGet error:", err);
    return {
      status: 500,
      jsonBody: { error: "failed to fetch celebrations", details: String(err) },
    };
  }
}

app.http("celebrations-get", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "celebrations",
  handler: celebrationsGet,
});
