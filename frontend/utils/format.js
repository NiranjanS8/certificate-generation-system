export function filterRows(rows, query, keys) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return rows;
  return rows.filter((row) => keys.some((key) => String(row[key] || "").toLowerCase().includes(normalized)));
}

export function normalizeStatus(status = "issued") {
  const value = String(status).toLowerCase();
  if (value === "issued") return "issued";
  if (value === "revoked") return "revoked";
  if (value === "active") return "issued";
  if (value === "inactive") return "inactive";
  return "issued";
}

export function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

export function formatDate(value) {
  if (!value) return "--";
  const stringValue = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(stringValue)) return stringValue.slice(0, 10);
  try {
    return new Intl.DateTimeFormat("en-CA").format(new Date(value));
  } catch {
    return stringValue;
  }
}

export function displayCertificateId(cert) {
  return String(cert.id || "").startsWith("CERT-") ? cert.id : cert.uniqueCode || shortId(cert.id);
}

export function courseName(courses, id) {
  return courses.find((course) => String(course.id) === String(id))?.name || "Unassigned";
}

export function shortId(value = "") {
  return value ? `${String(value).slice(0, 4)}...${String(value).slice(-4)}` : "CERT-0000";
}

export function capitalize(value) {
  const text = String(value || "");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function readError(error) {
  if (!error?.message) return "Something went wrong.";
  try {
    const parsed = JSON.parse(error.message);
    return parsed.message || parsed.error || error.message;
  } catch {
    return error.message;
  }
}
