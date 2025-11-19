const BASE_URL = import.meta.env.VITE_BACKEND_URL as string;
const API_PREFIX = "/api/files";

const ensureLeadingSlash = (value: string) => (value.startsWith("/") ? value : `/${value}`);

const getBaseOrigin = () => {
  if (!BASE_URL) {
    throw new Error("VITE_BACKEND_URL is not configured");
  }
  return BASE_URL.replace(/\/+$/, "");
};

const getApiBase = () => {
  const origin = getBaseOrigin();
  return origin.endsWith(API_PREFIX) ? origin : `${origin}${API_PREFIX}`;
};

const withApi = (path: string) => `${getApiBase()}${ensureLeadingSlash(path)}`;

const handleResponse = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  // Read response body once (can't read it twice)
  const text = await response.text().catch(() => "");

  if (!response.ok) {
    let message = text;
    if (isJson) {
      try {
        const json = JSON.parse(text) as { message?: string; error?: string };
        message = json.message || json.error || text;
      } catch {
        // Not valid JSON, use text as-is
      }
    }
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (!isJson) {
    throw new Error(
      `Expected JSON response but received ${contentType}. Response preview: ${text.substring(0, 200)}`,
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch (err) {
    throw new Error(
      `Failed to parse JSON response. Response preview: ${text.substring(0, 200)}`,
    );
  }
};

type RemoteFile = {
  id?: string;
  name?: string;
};

export type UploadResponse = {
  files?: RemoteFile[];
  data?: RemoteFile[];
};

type AccessLinkPayload =
  | string
  | {
      link?: string;
      url?: string;
      data?: { link?: string } | string;
    };

const extractAccessLink = (payload: AccessLinkPayload): string | undefined => {
  if (!payload) return undefined;
  if (typeof payload === "string") return payload;
  if (payload.link) return payload.link;
  if (payload.url) return payload.url;
  if (typeof payload.data === "string") return payload.data;
  if (payload.data && typeof payload.data === "object") {
    return payload.data.link;
  }
  return undefined;
};

export const uploadFiles = async (
  files: File[],
): Promise<UploadResponse> => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const response = await fetch(withApi("/upload"), {
    method: "POST",
    body: formData,
  });

  return handleResponse(response);
};

export const requestAccessLink = async (fileId: string): Promise<string> => {
  const response = await fetch(withApi(`/${encodeURIComponent(fileId)}/access`));
  const payload = await handleResponse<AccessLinkPayload>(response);
  const link = extractAccessLink(payload);

  if (!link) {
    throw new Error("Access endpoint did not return a link");
  }

  return link;
};

export const getAccessInfo = async (
  token: string,
): Promise<{ files: { id: string; name: string }[] }> => {
  // Try /access?token={token} endpoint first (returns JSON with file list)
  // If that doesn't work, fall back to other patterns
  let response: Response;
  let payload: { files?: RemoteFile[]; data?: RemoteFile[] };

  try {
    // Try query parameter format
    response = await fetch(withApi(`/access?token=${encodeURIComponent(token)}`));
    payload = await handleResponse<{ files?: RemoteFile[]; data?: RemoteFile[] }>(response);
  } catch (err) {
    // If query param fails, try path format
    try {
      response = await fetch(withApi(`/access/${token}`));
      payload = await handleResponse<{ files?: RemoteFile[]; data?: RemoteFile[] }>(response);
    } catch (err2) {
      throw new Error(
        `Failed to fetch file list. Tried /access?token=... and /access/{token}. Error: ${(err as Error).message}`,
      );
    }
  }

  const files = payload.files ?? payload.data ?? [];

  return {
    files: files
      .filter((file): file is RemoteFile & { id: string } => Boolean(file?.id))
      .map((file) => ({
        id: file.id,
        name: file.name ?? "Secure PDF",
      })),
  };
};

export const getPdfStreamUrl = (token: string, fileId?: string) => {
  const base = `${getApiBase()}/secureStream`;
  const url = new URL(base);
  url.searchParams.set("token", token);
  if (fileId) {
    url.searchParams.set("fileId", fileId);
  }
  return url.toString();
};
