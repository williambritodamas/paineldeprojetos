// Geração dinâmica da URL dos projetos.
// Requisito crítico: o endereço nunca é fixo nem gravado no banco.
// O host é obtido do navegador no momento do acesso.

export function gerarUrlProjeto(porta: number): string {
  return `${window.location.protocol}//${window.location.hostname}:${porta}`;
}

// Abre o projeto em uma nova aba de forma segura.
export function abrirProjeto(porta: number): void {
  const url = gerarUrlProjeto(porta);
  window.open(url, "_blank", "noopener,noreferrer");
}