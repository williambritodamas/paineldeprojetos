// Configuração do frontend.
// Valores exibidos e dados de ambiente.

// Informações do rodapé institucional.
// Preferencialmente definidas via VITE_AUTOR_SISTEMA e VITE_GESTOR_SETOR.
export const configRodape = {
  autor:
    import.meta.env.VITE_AUTOR_SISTEMA || "Nome do Desenvolvedor",
  gestor:
    import.meta.env.VITE_GESTOR_SETOR || "Nome do Gestor",
};