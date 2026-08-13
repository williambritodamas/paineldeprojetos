// Validações de entrada da API.
// Mantém as regras de validação isoladas para uso nos controllers.

// Valida os dados de login e retorna a mensagem de erro, ou null se válido.
export function validarLogin(dados: {
  username?: unknown;
  password?: unknown;
}): string | null {
  const { username, password } = dados;

  if (!username || !password) {
    return "Informe usuário e senha.";
  }

  if (typeof username !== "string" || typeof password !== "string") {
    return "Usuário e senha devem ser textos.";
  }

  if (username.trim().length === 0 || password.length === 0) {
    return "Informe usuário e senha.";
  }

  return null;
}

// Valida o papel informado.
export function validarRole(role: unknown): string | null {
  if (role !== undefined && role !== "admin" && role !== "user") {
    return 'O papel deve ser "admin" ou "user".';
  }
  return null;
}

// Valida os dados de criação de um usuário.
export function validarCriarUsuario(dados: {
  name?: unknown;
  username?: unknown;
  password?: unknown;
  role?: unknown;
}): string | null {
  const { name, username, password } = dados;

  if (typeof name !== "string" || name.trim().length === 0) {
    return "O nome do usuário é obrigatório.";
  }

  if (typeof username !== "string" || username.trim().length === 0) {
    return "O usuário é obrigatório.";
  }
  if (username.trim().length < 3) {
    return "O usuário deve ter pelo menos 3 caracteres.";
  }

  if (typeof password !== "string" || password.length === 0) {
    return "A senha é obrigatória.";
  }
  if (password.length < 6) {
    return "A senha deve ter pelo menos 6 caracteres.";
  }

  const erroRole = validarRole(dados.role);
  if (erroRole) {
    return erroRole;
  }

  return null;
}

// Valida os dados de atualização de um usuário.
export function validarAtualizarUsuario(dados: {
  name?: unknown;
  username?: unknown;
  password?: unknown;
  role?: unknown;
}): string | null {
  const { name, username, password } = dados;

  if (name !== undefined && (typeof name !== "string" || name.trim().length === 0)) {
    return "O nome do usuário é obrigatório.";
  }

  if (username !== undefined) {
    if (typeof username !== "string" || username.trim().length === 0) {
      return "O usuário é obrigatório.";
    }
    if (username.trim().length < 3) {
      return "O usuário deve ter pelo menos 3 caracteres.";
    }
  }

  if (password !== undefined) {
    if (typeof password !== "string" || password.length === 0) {
      return "A senha é obrigatória.";
    }
    if (password.length < 6) {
      return "A senha deve ter pelo menos 6 caracteres.";
    }
  }

  const erroRole = validarRole(dados.role);
  if (erroRole) {
    return erroRole;
  }

  return null;
}

// Valida a porta informada.
export function validarPorta(porta: unknown): string | null {
  if (typeof porta !== "number" || !Number.isInteger(porta)) {
    return "A porta deve ser um número inteiro.";
  }
  if (porta < 1 || porta > 65535) {
    return "A porta deve estar entre 1 e 65535.";
  }
  return null;
}

// Valida os dados de criação/atualização de um projeto.
export function validarProjeto(dados: {
  name?: unknown;
  description?: unknown;
  icon?: unknown;
  port?: unknown;
  active?: unknown;
  folderPath?: unknown;
  script?: unknown;
  autostart?: unknown;
  pm2Name?: unknown;
  processes?: unknown;
}): string | null {
  const { name, description, icon, port, active, folderPath, script, autostart, pm2Name, processes } =
    dados;

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length === 0) {
      return "O nome do projeto é obrigatório.";
    }
  }

  if (description !== undefined && description !== null) {
    if (typeof description !== "string") {
      return "A descrição deve ser um texto.";
    }
  }

  if (icon !== undefined && icon !== null) {
    if (typeof icon !== "string") {
      return "O ícone deve ser um texto.";
    }
  }

  if (port !== undefined) {
    const erroPorta = validarPorta(port);
    if (erroPorta) {
      return erroPorta;
    }
  }

  if (active !== undefined && typeof active !== "boolean") {
    return "O campo ativo deve ser verdadeiro ou falso.";
  }

  if (folderPath !== undefined && folderPath !== null) {
    if (typeof folderPath !== "string") {
      return "O caminho da pasta deve ser um texto.";
    }
  }

  if (script !== undefined && script !== null) {
    if (typeof script !== "string" || script.trim().length === 0) {
      return "O comando de execução deve ser um texto.";
    }
  }

  if (autostart !== undefined && typeof autostart !== "boolean") {
    return "O campo de inicialização automática deve ser verdadeiro ou falso.";
  }

  if (pm2Name !== undefined && pm2Name !== null) {
    if (typeof pm2Name !== "string") {
      return "O nome do processo PM2 deve ser um texto.";
    }
    if (pm2Name.trim().length === 0) {
      return "O nome do processo PM2 deve ser um texto.";
    }
  }

  if (processes !== undefined) {
    const erroProcessos = validarProcessos(processes);
    if (erroProcessos) {
      return erroProcessos;
    }
  }

  return null;
}

// Valida a lista de processos adicionais do projeto.
export function validarProcessos(processos: unknown): string | null {
  if (!Array.isArray(processos)) {
    return "Os processos adicionais devem ser uma lista.";
  }

  const rotulosVistos = new Set<string>();

  for (const processo of processos) {
    if (typeof processo !== "object" || processo === null) {
      return "Cada processo adicional deve ser um objeto.";
    }

    const corpo = processo as Record<string, unknown>;

    if (
      corpo.id !== undefined &&
      (typeof corpo.id !== "number" || !Number.isInteger(corpo.id))
    ) {
      return "O identificador de um processo adicional é inválido.";
    }

    if (typeof corpo.label !== "string" || corpo.label.trim().length === 0) {
      return "Informe o nome de cada processo adicional.";
    }

    const rotulo = corpo.label.trim();
    if (rotulosVistos.has(rotulo.toLowerCase())) {
      return "Os processos adicionais precisam ter nomes diferentes.";
    }
    rotulosVistos.add(rotulo.toLowerCase());

    if (typeof corpo.folderPath !== "string" || corpo.folderPath.trim().length === 0) {
      return `Informe o caminho da pasta do processo "${rotulo}".`;
    }

    if (
      corpo.script !== undefined &&
      corpo.script !== null &&
      (typeof corpo.script !== "string" || corpo.script.trim().length === 0)
    ) {
      return `O comando de execução do processo "${rotulo}" deve ser um texto.`;
    }

    const erroPorta = validarPorta(corpo.port);
    if (erroPorta) {
      return `Porta do processo "${rotulo}": ${erroPorta}`;
    }
  }

  return null;
}