import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API, timeout: 60000 });

export const fetchSamples = () => api.get("/samples").then((r) => r.data.samples);
export const analyzeUrl = (image_url, title) =>
  api.post("/analyze/url", { image_url, title }).then((r) => r.data);
export const analyzeUpload = (file, title) => {
  const fd = new FormData();
  fd.append("file", file);
  if (title) fd.append("title", title);
  return api.post("/analyze/upload", fd, { headers: { "Content-Type": "multipart/form-data" } })
    .then((r) => r.data);
};
export const fetchHistory = () => api.get("/history").then((r) => r.data.items);
export const fetchHistoryItem = (id) => api.get(`/history/${id}`).then((r) => r.data);
export const deleteHistoryItem = (id) => api.delete(`/history/${id}`).then((r) => r.data);
export const fetchResumeBullets = () => api.get("/resume-bullets").then((r) => r.data.markdown);
