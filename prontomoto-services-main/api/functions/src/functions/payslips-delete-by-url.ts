// src/functions/payslips-delete-by-url.ts
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || "";
const PAYSPLIPS_CONTAINER = "payslips";

async function streamToString(readableStream: NodeJS.ReadableStream | null): Promise<string> {
  if (!readableStream) return "";
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    readableStream.on("data", (d) => chunks.push(d instanceof Buffer ? d : Buffer.from(d)));
    readableStream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    readableStream.on("error", reject);
  });
}

function stripQuery(urlStr: string) {
  try {
    const u = new URL(urlStr);
    // keep origin + pathname only
    return `${u.origin}${u.pathname}`;
  } catch {
    return urlStr;
  }
}

export async function payslipsDeleteByUrl(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    if (!AZURE_STORAGE_CONNECTION_STRING) {
      console.error("Missing AZURE_STORAGE_CONNECTION_STRING");
      return { status: 500, jsonBody: { error: "missing storage connection string" } };
    }

    const body = (await req.json().catch(() => ({}))) as { pdf_url?: string };
    const pdf_url = body?.pdf_url;
    if (!pdf_url) return { status: 400, jsonBody: { error: "pdf_url required" } };

    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const payslipsContainer = blobServiceClient.getContainerClient(PAYSPLIPS_CONTAINER);
    await payslipsContainer.createIfNotExists();

    const normalizedTarget = stripQuery(pdf_url);

    // iterate payslips metadata JSON blobs and find matching pdf_url
    for await (const blob of payslipsContainer.listBlobsFlat()) {
      if (!blob.name.endsWith(".json")) continue;

      try {
        const blobClient = payslipsContainer.getBlockBlobClient(blob.name);
        const dl = await blobClient.download();
        const text = await streamToString(dl.readableStreamBody);
        if (!text) continue;

        let data: any;
        try {
          data = JSON.parse(text);
        } catch {
          // skip invalid JSON
          continue;
        }

        const recordPdfUrl = data?.pdf_url;
        if (!recordPdfUrl) continue;

        // Compare normalized (strip query)
        if (stripQuery(String(recordPdfUrl)) === normalizedTarget) {
          // delete metadata JSON
          await blobClient.deleteIfExists();
          console.log(`🗑 Deleted metadata blob ${blob.name}`);

          // Attempt to delete the PDF blob if it looks like an Azure blob URL
          try {
            const parsed = new URL(recordPdfUrl);
            const hostname = parsed.hostname || "";
            // quick heuristic: azure blob hostnames contain ".blob.core.windows.net"
            if (hostname.includes(".blob.core.windows.net")) {
              const pathname = decodeURIComponent(parsed.pathname || "").replace(/^\//, ""); // container/blobPath
              const idx = pathname.indexOf("/");
              if (idx > 0) {
                const containerName = pathname.slice(0, idx);
                const blobPath = pathname.slice(idx + 1);
                const targetContainer = blobServiceClient.getContainerClient(containerName);
                const targetBlob = targetContainer.getBlockBlobClient(blobPath);
                const delResp = await targetBlob.deleteIfExists();
                console.log(`Deleted PDF blob?`, { containerName, blobPath, deleted: delResp.succeeded });
              } else {
                console.warn("Could not parse container/blob from pdf_url (no / found):", recordPdfUrl);
              }
            } else {
              console.log("PDF URL is not an Azure blob (skipping deletion of PDF):", recordPdfUrl);
            }
          } catch (blobErr) {
            console.warn("PDF blob deletion error (non-fatal):", blobErr);
          }

          return { status: 200, jsonBody: { ok: true, message: "Deleted metadata (and PDF if in same storage)" } };
        }
      } catch (err) {
        console.warn("Error reading payslip blob", blob.name, err);
        // continue scanning others
      }
    }

    return { status: 404, jsonBody: { error: "payslip not found for given pdf_url" } };
  } catch (err: any) {
    console.error("delete-by-url error:", err);
    return { status: 500, jsonBody: { error: "delete failed", details: String(err) } };
  }
}

app.http("payslips-delete-by-url", {
  route: "payslips/delete-by-url",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: payslipsDeleteByUrl,
});
