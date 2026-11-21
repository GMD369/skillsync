// Central helper for calling the SkillSync backend API.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export class ApiError extends Error {
  constructor(message, status, errors = {}) {
    super(message);
    this.status = status;
    this.errors = errors; // field-level validation errors, e.g. { email: "..." }
  }
}

// Called when the server says the login is no longer valid (e.g. token expired),
// so the app can log the student out instead of showing broken pages.
let onUnauthorized = null;
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

async function send(path, { method = "GET", body, token, form } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        // For file uploads the browser sets the multipart Content-Type itself.
        ...(!form && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: form ?? (body ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new ApiError("Cannot reach the server. Is the backend running?", 0);
  }
  if (res.status === 401 && token && onUnauthorized) onUnauthorized();
  return res;
}

export async function apiRequest(path, options = {}) {
  const res = await send(path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.message || `Request failed (${res.status})`, res.status, data.errors);
  return data;
}

// Downloads a protected file (the browser cannot add the token to a normal link).
export async function apiDownload(path, token, fileName) {
  const res = await send(path, { token });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.message || "Download failed", res.status);
  }
  const url = URL.createObjectURL(await res.blob());
  const link = Object.assign(document.createElement("a"), { href: url, download: fileName });
  link.click();
  URL.revokeObjectURL(url);
}
