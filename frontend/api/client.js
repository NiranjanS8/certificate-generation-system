export const storageKey = "certificate-authority-session";
export const appName = "CertifyX";
export const appTagline = "Certificate Authority System";

export const emptySession = {
  token: "",
  refreshToken: "",
  email: "",
  orgId: "",
};

let authSessionHandler = null;
let refreshPromise = null;

export function setAuthSessionHandler(handler) {
  authSessionHandler = handler;
}

export async function api(path, options = {}, session = emptySession) {
  const activeSession = latestSession(session);
  const headers = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(activeSession.token ? { Authorization: `Bearer ${activeSession.token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(path, { ...options, headers });
  if ((response.status === 401 || response.status === 403) && activeSession.refreshToken && !options.skipAuthRefresh) {
    const refreshedSession = await refreshSession(activeSession);
    return api(path, { ...options, skipAuthRefresh: true }, refreshedSession);
  }

  return parseResponse(response);
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!response.ok) {
    if (contentType.includes("application/json")) {
      const payload = await response.json();
      const fieldErrors = payload.errors ? Object.values(payload.errors).join(" ") : "";
      throw new Error(payload.message || payload.error || fieldErrors || `Request failed with ${response.status}`);
    }
    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }
  if (response.status === 204) return null;
  if (contentType.includes("application/pdf") || contentType.startsWith("image/") || contentType.includes("application/octet-stream")) return response.blob();
  return response.json();
}

export function pageContent(payload) {
  return Array.isArray(payload) ? payload : payload?.content || [];
}

function latestSession(session) {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    if (stored?.refreshToken) {
      return stored;
    }
  } catch {
    // Fall back to the in-memory session if storage is unavailable or malformed.
  }
  return session || emptySession;
}

async function refreshSession(session) {
  if (!refreshPromise) {
    refreshPromise = fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Session expired. Please sign in again.");
        }
        const auth = await parseResponse(response);
        const nextSession = {
          token: auth.token,
          refreshToken: auth.refreshToken,
          email: auth.email,
          orgId: auth.orgId,
        };
        localStorage.setItem(storageKey, JSON.stringify(nextSession));
        authSessionHandler?.(nextSession);
        return nextSession;
      })
      .catch((error) => {
        localStorage.removeItem(storageKey);
        authSessionHandler?.(emptySession);
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}
