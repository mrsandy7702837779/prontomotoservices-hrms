import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { pool } from "../shared/db";
import { randomUUID } from "crypto";

type AnnBody = { title?: string; body?: string; announced_on?: string };

export async function announcementsPost(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const body = (await req.json().catch(() => ({}))) as AnnBody;
    if (!body.title || !String(body.title).trim()) {
      return { status: 400, jsonBody: { error: "title required" } };
    }

    const id = randomUUID();
    const { rows } = await pool.query(
      `INSERT INTO announcements (id, title, body, announced_on)
       VALUES ($1,$2,$3,$4)
       RETURNING id, title, body, announced_on, created_at`,
      [id, String(body.title).trim(), body.body ?? "", body.announced_on ?? null]
    );

    const row = rows[0];

    // dynamically import SignalR helper (optional)
    try {
      const mod = await import("../shared/signalr").catch(() => null);
      const sendSignalrMessage = mod?.sendSignalrMessage;
      if (typeof sendSignalrMessage === "function") {
        await sendSignalrMessage("pms-hub", "announcementAdded", row).catch((e: any) => {
          console.warn("SignalR broadcast failed (announcementAdded):", String(e));
        });
      }
    } catch (bErr) {
      console.warn("SignalR broadcast attempt failed:", String(bErr));
    }

    return { status: 201, jsonBody: row };
  } catch (err: any) {
    console.error("announcementsPost error:", err);
    return { status: 500, jsonBody: { error: "failed to create announcement", details: String(err) } };
  }
}

app.http("announcements-post", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "announcements",
  handler: announcementsPost,
});
