import axios from "axios";

/** Dev: proxy do Vite usa /api; build sem proxy pode usar URL absoluta no .env. */
const configuredBase = import.meta.env.VITE_API_URL;
if (!import.meta.env.DEV && !configuredBase) {
  throw new Error("VITE_API_URL é obrigatório no build de produção.");
}
const base = configuredBase || "/api";

const authRedirect = (err: unknown) => {
  if (axios.isAxiosError(err) && err.response?.status === 401) {
    const path = window.location.pathname;
    if (path !== "/login") {
      window.location.href = "/login";
    }
  }
  return Promise.reject(err);
};

/** Rotas normais (config, status, arquivos). */
export const api = axios.create({
  baseURL: base,
  withCredentials: true,
  timeout: 45_000
});

/** Health checks de IA (várias chamadas externas; pode levar > 1 min). */
export const apiLong = axios.create({
  baseURL: base,
  withCredentials: true,
  timeout: 120_000
});

api.interceptors.response.use((res) => res, authRedirect);
apiLong.interceptors.response.use((res) => res, authRedirect);
