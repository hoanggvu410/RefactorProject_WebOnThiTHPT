export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://refactorproject-webonthithpt.onrender.com";

export function resolveApiUrl(path) {
  if (!path) return "";
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:") || path.startsWith("blob:")) {
    return path;
  }
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export async function apiFetch(path, options = {}, token = "") {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch (error) {
    throw new Error(`Không kết nối được API ${API_BASE_URL}${path}. Kiểm tra backend/CORS hoặc VITE_API_BASE_URL.`);
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const errorCode = typeof payload === "object"
      ? payload?.error?.code || payload?.detail?.code || payload?.code || ""
      : "";
    const message = typeof payload === "object"
      ? payload?.error?.message || payload?.detail?.message || payload?.detail || payload?.message || "Request failed"
      : payload || "Request failed";
    const error = new Error(message);
    error.status = response.status;
    error.code = errorCode;
    error.payload = payload;
    throw error;
  }

  return payload;
}
