// src/shared/signalr.ts
import fetch from "node-fetch";

function parseEndpoint(connStr: string) {
  // Connection string looks like: Endpoint=https://xxx.service.signalr.net;AccessKey=...;Version=1.0;
  const parts = connStr.split(";");
  const endpointPart = parts.find(p => p.startsWith("Endpoint="));
  const keyPart = parts.find(p => p.startsWith("AccessKey="));
  if (!endpointPart || !keyPart) throw new Error("Invalid SignalR connection string");
  const endpoint = endpointPart.replace("Endpoint=", "").replace(/\/$/, "");
  const key = keyPart.replace("AccessKey=", "");
  return { endpoint, key };
}

/**
 * Sends a message to all clients connected to the given hub.
 * method => the client event name (e.g., "announcementAdded" or "presenceChanged")
 * payload => any JSON serializable data
 */
export async function sendSignalrMessage(hub: string, method: string, payload: any) {
  const conn = process.env["AZURE_SIGNALR_CONNECTION_STRING"];
  if (!conn) {
    console.warn("SignalR not configured (AZURE_SIGNALR_CONNECTION_STRING missing). Skipping broadcast.");
    return;
  }
  const { endpoint, key } = parseEndpoint(conn);
  const url = `${endpoint}/api/v1/hubs/${encodeURIComponent(hub)}/:send`;
  const body = { target: method, arguments: [payload] };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Dev-friendly auth. For production, use official negotiate/SDK bindings.
      "Authorization": `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error("SignalR send failed:", res.status, txt);
  }
}
