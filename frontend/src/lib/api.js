// Central helper for calling the SkillSync backend API.
// The base URL comes from NEXT_PUBLIC_API_URL (frontend/.env.local), so the same code works
// locally and after deployment.
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Requests that take longer than this are cancelled, so a hanging server never leaves a page
// loading forever. Resume uploads get more time because the AI service analyses the PDF (up to 15 s).
const TIMEOUT_MS = 15000;
const UPLOAD_TIMEOUT_MS = 30000;

export class ApiError extends Error {
  constructor(message, status, errors = {}) {
    super(message);
    this.status = status; // HTTP status code, or 0 when the server could not be reached
    this.errors = errors; // field-level validation errors, e.g. { email: "..." }
  }
}

// Called when the server says the login is no longer valid (e.g. token expired),
// so the app can log the student out instead of showing broken pages.
let onUnauthorized = null;
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

async function send(path, { method = "GET", body, token, form, timeout } = {}) {
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
      signal: AbortSignal.timeout(timeout ?? (form ? UPLOAD_TIMEOUT_MS : TIMEOUT_MS)),
    });
  } catch (err) {
    if (err.name === "TimeoutError") {
      throw new ApiError("The server is taking too long to respond. Please try again.", 0);
    }
    throw new ApiError("Cannot reach the server. Check your connection or make sure the backend is running.", 0);
  }
  if (res.status === 401 && token && onUnauthorized) onUnauthorized();
  return res;
}

// Turns a failed response into a readable message, even when the body is not JSON
// (for example an HTML error page from a proxy).
function errorFrom(res, data) {
  if (data.message) return new ApiError(data.message, res.status, data.errors);
  if (res.status >= 500) return new ApiError("The server had a problem. Please try again in a moment.", res.status);
  return new ApiError(`Request failed (${res.status})`, res.status);
}

export async function apiRequest(path, options = {}) {
  const res = await send(path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw errorFrom(res, data);
  return data;
}

// Downloads a protected file (the browser cannot add the token to a normal link).
export async function apiDownload(path, token, fileName) {
  const res = await send(path, { token });
  if (!res.ok) throw errorFrom(res, await res.json().catch(() => ({})));
  const url = URL.createObjectURL(await res.blob());
  const link = Object.assign(document.createElement("a"), { href: url, download: fileName });
  link.click();
  URL.revokeObjectURL(url);
}
