import { BlobServiceClient, ContainerClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } from "@azure/storage-blob";

const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING || "";
const containerName = process.env.TEMPLATES_CONTAINER || "templates";

export function getContainerClient(): ContainerClient {
  const client = BlobServiceClient.fromConnectionString(connStr);
  return client.getContainerClient(containerName);
}

// Generate SAS url for a blob (validMinutes)
export async function getBlobSasUrl(blobName: string, validMinutes = 60): Promise<string> {
  const connStrRaw = connStr;
  // quick path: if connection string provides accountName & key we can create SAS
  const match = /AccountName=([^;]+);AccountKey=([^;]+);/.exec(connStrRaw);
  const blobClient = getContainerClient().getBlobClient(blobName);
  if (!match) {
    // fallback — return url (may require public container or private with no SAS)
    return blobClient.url;
  }
  const account = match[1];
  const key = match[2];
  const sharedKey = new StorageSharedKeyCredential(account, key);
  const expiresOn = new Date(new Date().getTime() + validMinutes * 60 * 1000);
  const sas = generateBlobSASQueryParameters(
    {
      containerName: getContainerClient().containerName,
      blobName,
      permissions: BlobSASPermissions.parse("r"),
      expiresOn,
    },
    sharedKey
  ).toString();
  return `${blobClient.url}?${sas}`;
}
