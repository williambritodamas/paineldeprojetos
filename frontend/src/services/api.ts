// Cliente HTTP centralizado.
// Todas as chamadas Axios passam por aqui.

import axios from "axios";
import { obterToken } from "../utils/authStorage";

// Endereço base da API.
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL,
});

// Injeta o token de autenticação em todas as requisições, quando existir.
api.interceptors.request.use((config) => {
  const token = obterToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;