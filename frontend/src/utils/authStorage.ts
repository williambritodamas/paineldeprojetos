// Utilitários gerais do frontend.

// Lê o token de autenticação armazenado.
export function obterToken(): string | null {
  return localStorage.getItem("painel_projetos_token");
}

// Guarda o token de autenticação.
export function salvarToken(token: string): void {
  localStorage.setItem("painel_projetos_token", token);
}

// Remove o token de autenticação (logout).
export function removerToken(): void {
  localStorage.removeItem("painel_projetos_token");
}