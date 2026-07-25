import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const http = axios.create({ baseURL: API, timeout: 30000 });

// Serializer for arrays -> repeated params (?categories=A&categories=B)
function serializeParams(params) {
  const parts = [];
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    if (Array.isArray(v)) {
      if (v.length === 0) return;
      v.forEach((item) => parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(item)}`));
    } else {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
    }
  });
  return parts.join("&");
}

export function buildQS(params) {
  return serializeParams(params);
}

export async function fetchFilters() {
  const { data } = await http.get("/filters/options");
  return data;
}

export async function fetchSummary(params) {
  const qs = serializeParams(params);
  const { data } = await http.get(`/analytics/summary?${qs}`);
  return data;
}

export async function fetchTimeseries(params) {
  const qs = serializeParams(params);
  const { data } = await http.get(`/analytics/timeseries?${qs}`);
  return data;
}

export async function fetchStatus(params) {
  const qs = serializeParams(params);
  const { data } = await http.get(`/analytics/status?${qs}`);
  return data;
}

export async function fetchCategories(params) {
  const qs = serializeParams(params);
  const { data } = await http.get(`/analytics/categories?${qs}`);
  return data;
}

export async function fetchPic(params) {
  const qs = serializeParams(params);
  const { data } = await http.get(`/analytics/pic?${qs}`);
  return data;
}

export async function fetchChannels(params) {
  const qs = serializeParams(params);
  const { data } = await http.get(`/analytics/channels?${qs}`);
  return data;
}

export async function fetchInsights(params) {
  const qs = serializeParams(params);
  const { data } = await http.get(`/analytics/insights?${qs}`);
  return data;
}

export async function fetchRecords(params) {
  const qs = serializeParams(params);
  const { data } = await http.get(`/records?${qs}`);
  return data;
}

export async function fetchComparison(params) {
  const qs = serializeParams(params);
  const { data } = await http.get(`/analytics/comparison?${qs}`);
  return data;
}

export async function fetchBackups() {
  const { data } = await http.get("/import/backups");
  return data;
}

export async function restoreBackup(filename) {
  const { data } = await http.post("/import/restore", { filename });
  return data;
}

export function exportCsvUrl(params) {
  const qs = serializeParams(params);
  return `${API}/records/export?${qs}`;
}
