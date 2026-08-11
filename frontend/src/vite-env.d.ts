/// <reference types="vite/client" />

// Tipos adicionais para as variáveis de ambiente do Vite.
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_AUTOR_SISTEMA?: string;
  readonly VITE_GESTOR_SETOR?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}