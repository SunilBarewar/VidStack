import axios from "axios";
import { env } from "./env";

export const uploadApiClient = axios.create({
  baseURL: env.UPLOAD_API_ENDPOINT ?? "http://localhost:8000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function getApiData<T>(request: Promise<{ data: T }>): Promise<T> {
  const { data } = await request;
  return data;
}
