import axios from "axios";
import { env } from "../env";

/**
 * Shared axios instance for the EduStream API.
 *
 * Phase 1 adds the auth interceptor: inject the access token on each request
 * and transparently refresh on 401 (the web equivalent of the planned dio
 * interceptor).
 */
export const api = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { "Content-Type": "application/json" },
});
