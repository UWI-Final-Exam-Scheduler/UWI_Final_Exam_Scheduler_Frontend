import { apiFetch } from "./apiFetch";

export async function apiPut(path: string, body: unknown) {
  return apiFetch(path, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
