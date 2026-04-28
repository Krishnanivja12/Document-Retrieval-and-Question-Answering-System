const BASE = "/api/v1";

const parseJson = async <T>(response: Response): Promise<T> => {
  const data = (await response.json()) as T & { detail?: string };
  if (!response.ok) {
    throw new Error(data.detail || "Request failed");
  }
  return data;
};

export const uploadFile = async (file: File): Promise<{ id: number; filename: string }> => {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/ingest/file`, { method: "POST", body: form });
  return parseJson<{ id: number; filename: string }>(res);
};

export const ingestURL = async (url: string): Promise<{ id: number; filename: string }> => {
  const form = new FormData();
  form.append("url", url);
  const res = await fetch(`${BASE}/ingest/url`, { method: "POST", body: form });
  return parseJson<{ id: number; filename: string }>(res);
};

export const buildIndex = async (): Promise<{ indexed_count: number }> => {
  const res = await fetch(`${BASE}/admin/index/build`, { method: "POST" });
  return parseJson<{ indexed_count: number }>(res);
};

export const resetDatabase = async (): Promise<{
  status: string;
  message: string;
  cleared: {
    faiss_vectors: number;
    chunks: number;
    evaluations: number;
  };
}> => {
  const res = await fetch(`${BASE}/admin/reset-db`, { method: "DELETE" });
  return parseJson(res);
};

export const deleteDocument = async (documentId: number): Promise<{
  status: string;
  message: string;
  deleted: {
    document_id: number;
    chunks: number;
    files: number;
  };
}> => {
  const res = await fetch(`${BASE}/ingest/document/${documentId}`, { method: "DELETE" });
  return parseJson(res);
};


