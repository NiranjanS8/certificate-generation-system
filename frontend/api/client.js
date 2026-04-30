export const storageKey = "certificate-authority-session";
export const appName = "CertifyX";
export const appTagline = "Certificate Authority System";

export const emptySession = {
  token: "",
  refreshToken: "",
  email: "",
  orgId: "",
};

export async function api(path, options = {}, session = emptySession) {
  const headers = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(session.token ? { Authorization: `Bearer ${session.token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(path, { ...options, headers });
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
