// src/functions/photo-upload.ts
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";

export async function photoUpload(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    // 🔹 Use your explicit container name here
    const containerName = "photos";
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;

    // Connect to Azure Blob Storage
    const blobService = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobService.getContainerClient(containerName);
    await containerClient.createIfNotExists({ access: "container" }); 
    // 👆 use "container" if you want public access to view images directly in browser

    // Read image bytes from request
    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate a unique name for each photo
    const blobName = `employee_photos/${uuidv4()}.jpg`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload to Azure Blob
    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: "image/jpeg" },
    });

    // Return the accessible URL
    return {
      status: 200,
      jsonBody: { url: blockBlobClient.url },
    };
  } catch (err: any) {
    console.error("photo-upload error:", err);
    return {
      status: 500,
      jsonBody: { error: "Failed to upload photo", details: String(err) },
    };
  }
}

app.http("photo-upload", {
  route: "photos",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: photoUpload,
});
