// src/functions/payslips-delete.ts
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || "";
const PAYSPLIPS_CONTAINER = "payslips";

// helper: read blob stream to string
async function streamToString(readableStream: NodeJS.ReadableStream | null): Promise<string> {
  if (!readableStream) return "";
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    readableStream.on("data", (data) => chunks.push(data instanceof Buffer ? data : Buffer.from(data)));
    readableStream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    readableStream.on("error", reject);
  });
}

export async function payslipsDelete(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const id = req.params?.id;
    if (!id) return { status: 400, jsonBody: { error: "missing id" } };
    if (!AZURE_STORAGE_CONNECTION_STRING)
      return { status: 500, jsonBody: { error: "server misconfigured (no storage connection string)" } };

    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(PAYSPLIPS_CONTAINER);
    await containerClient.createIfNotExists();

    // In the new payslips.ts we store metadata as <uuid>.json
    const blobName = id.endsWith(".json") ? id : `${id}.json`;
    const payslipBlobClient = containerClient.getBlockBlobClient(blobName);

    // check existence
    const exists = await payslipBlobClient.exists();
    if (!exists)
      return { status: 404, jsonBody: { error: "payslip not found" } };

    // try to delete linked PDF if mentioned in the JSON
    try {
      const dl = await payslipBlobClient.download();
      const text = await streamToString(dl.readableStreamBody);
      const record = JSON.parse(text || "{}");

      if (record?.pdf_url && typeof record.pdf_url === "string") {
        try {
          const parsed = new URL(record.pdf_url);
          const pathname = decodeURIComponent(parsed.pathname || "").replace(/^\//, "");
          const idx = pathname.indexOf("/");
          if (idx > 0) {
            const containerName = pathname.slice(0, idx);
            const blobPath = pathname.slice(idx + 1);
            const targetContainer = blobServiceClient.getContainerClient(containerName);
            const targetBlob = targetContainer.getBlockBlobClient(blobPath);
            const delResp = await targetBlob.deleteIfExists();
            console.log(`Deleted linked PDF blob:`, {
              containerName,
              blobPath,
              deleted: delResp.succeeded,
            });
          }
        } catch (err) {
          console.warn("Failed to delete linked pdf_url blob:", err);
        }
      }
    } catch (downloadErr) {
      console.warn("Failed to read payslip JSON (continuing delete):", downloadErr);
    }

    // finally delete JSON metadata blob
    await payslipBlobClient.deleteIfExists();
    console.log(`Deleted payslip JSON blob: ${blobName}`);

    return { status: 200, jsonBody: { ok: true, message: "Payslip and linked PDF deleted" } };
  } catch (err: any) {
    console.error("payslipsDelete error:", err);
    return { status: 500, jsonBody: { error: "delete failed", details: String(err) } };
  }
}

app.http("payslips-delete", {
  route: "payslips/{id}",
  methods: ["DELETE"],
  authLevel: "anonymous",
  handler: payslipsDelete,
});
