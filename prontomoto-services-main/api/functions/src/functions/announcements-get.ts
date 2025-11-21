// src/functions/announcements-get.ts
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { pool } from "../shared/db";

export async function announcementsGet(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, body, announced_on, created_at
       FROM announcements
       ORDER BY announced_on NULLS LAST, created_at DESC`
    );
    return { status: 200, jsonBody: rows };
  } catch (err: any) {
    console.error("announcementsGet error:", err);
    return { status: 500, jsonBody: { error: "failed to fetch announcements", details: String(err) } };
  }
}

app.http("announcements-get", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "announcements",
  handler: announcementsGet,
});
