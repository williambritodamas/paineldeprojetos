// Cliente HTTP centralizado.
// Todas as chamadas Axios passam por aqui.

import axios from "axios";
import { obterToken } from "../utils/authStorage";

// Endereço base da API.
// Se VITE_API_URL não for informado, monta dinamicamente
// usando o mesmo host pelo qual o painel foi acessado.
const baseURL =
  import.meta.env.VITE_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:3001/api`;

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