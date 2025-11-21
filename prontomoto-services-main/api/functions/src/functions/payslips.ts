// src/functions/payslips.ts
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";
import { randomUUID } from "crypto";

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING!;
const CONTAINER_NAME = "payslips";

type PayslipRecord = {
  id: string;
  employee_id: string;
  month: string;
  year: number;
  salary: number;
  pf: number;
  totalWorkedDays: number;
  totalHours: number;
  netPay: number;
  pdf_url: string;
  created_at: string;
};

export async function payslips(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    await containerClient.createIfNotExists({ access: "container" });

    // GET all payslips for an employee
    if (req.method === "GET") {
      const employeeId = req.query.get("employeeId");
      if (!employeeId)
        return { status: 400, jsonBody: { error: "employeeId required" } };

      const payslips: PayslipRecord[] = [];

      for await (const blob of containerClient.listBlobsFlat()) {
        if (blob.name.endsWith(".json")) {
          const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
          const download = await blockBlobClient.download();
          const text = await streamToString(download.readableStreamBody);
          try {
            const record = JSON.parse(text) as PayslipRecord;
            if (record.employee_id === employeeId) payslips.push(record);
          } catch (e) {
            console.warn("Skipping malformed payslip JSON:", blob.name);
          }
        }
      }

      return { status: 200, jsonBody: payslips.sort((a, b) => b.created_at.localeCompare(a.created_at)) };
    }

    // POST (save payslip metadata)
    if (req.method === "POST") {
      const body = (await req.json()) as Partial<PayslipRecord>;
      if (!body.employee_id) return { status: 400, jsonBody: { error: "employee_id required" } };

      // generate stable id (UUID) and use <id>.json as blob name
      const id = randomUUID();
      const blobName = `${id}.json`;

      const record: PayslipRecord = {
        id,
        employee_id: body.employee_id!,
        month: body.month ?? "",
        year: body.year ?? new Date().getFullYear(),
        salary: body.salary ?? 0,
        pf: body.pf ?? 0,
        totalWorkedDays: body.totalWorkedDays ?? 0,
        totalHours: body.totalHours ?? 0,
        netPay: body.netPay ?? 0,
        pdf_url: body.pdf_url ?? "",
        created_at: new Date().toISOString(),
      };

      const payloadText = JSON.stringify(record, null, 2);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.uploadData(Buffer.from(payloadText, "utf8"), {
        blobHTTPHeaders: { blobContentType: "application/json" },
      });

      return { status: 200, jsonBody: { ok: true, id, pdf_url: record.pdf_url } };
    }

    return { status: 405, jsonBody: { error: "Method not allowed" } };
  } catch (err: any) {
    console.error("payslips error:", err);
    return { status: 500, jsonBody: { error: "Server error", details: err.message } };
  }
}

// Helper function: stream → string
async function streamToString(readableStream: NodeJS.ReadableStream | null): Promise<string> {
  if (!readableStream) return "";
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    readableStream.on("data", (data) => chunks.push(data instanceof Buffer ? data : Buffer.from(data)));
    readableStream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    readableStream.on("error", reject);
  });
}

app.http("payslips", {
  route: "payslips",
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: payslips,
});
