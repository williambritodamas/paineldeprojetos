// Controller de usuários.
// Apenas usuários com papel "admin" acessam estas rotas.

import type { Response } from "express";
import type { RequisicaoAutenticada } from "../middlewares/authMiddleware";
import * as userService from "../services/userService";
import { ErroNegocio } from "../services/userService";
import { erroHttp, lerCorpo, sucessoHttp } from "../utils/helpers";
import {
  validarAtualizarUsuario,
  validarCriarUsuario,
} from "../utils/validators";

// GET /api/admin/users
export async function listar(
  req: RequisicaoAutenticada,
  res: Response
): Promise<void> {
  try {
    const usuarios = await userService.listarUsuarios();
    sucessoHttp(res, usuarios);
  } catch {
    erroHttp(res, 500, "Erro ao listar usuários.");
  }
}

// POST /api/admin/users
export async function criar(req: RequisicaoAutenticada, res: Response): Promise<void> {
  const corpo = lerCorpo(req);
  const role = corpo.role === "admin" ? "admin" : "user";

  const erro = validarCriarUsuario({
    name: corpo.name,
    username: corpo.username,
    password: corpo.password,
    role,
  });

  if (erro) {
    erroHttp(res, 400, erro);
    return;
  }

  try {
    const usuario = await userService.criarUsuario({
      name: String(corpo.name),
      username: String(corpo.username),
      password: String(corpo.password),
      role,
    });

    sucessoHttp(res, usuario);
  } catch (erroCriar) {
    if (erroCriar instanceof ErroNegocio) {
      erroHttp(res, erroCriar.status, erroCriar.message);
      return;
    }
    erroHttp(res, 500, "Erro ao criar o usuário.");
  }
}

// PUT /api/admin/users/:id
export async function atualizar(req: RequisicaoAutenticada, res: Response): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    erroHttp(res, 400, "Identificador inválido.");
    return;
  }

  const corpo = lerCorpo(req);
  const role = corpo.role === "admin" ? "admin" : "user";

  const erro = validarAtualizarUsuario({
    name: corpo.name,
    username: corpo.username,
    password: corpo.password,
    role: corpo.role !== undefined ? role : undefined,
  });

  if (erro) {
    erroHttp(res, 400, erro);
    return;
  }

  if (!req.userId) {
    erroHttp(res, 401, "Autenticação necessária.");
    return;
  }

  try {
    const usuario = await userService.atualizarUsuario(
      id,
      {
        name:
          corpo.name !== undefined ? String(corpo.name) : undefined,
        username:
          corpo.username !== undefined ? String(corpo.username) : undefined,
        password:
          corpo.password !== undefined ? String(corpo.password) : undefined,
        role: corpo.role !== undefined ? role : undefined,
      },
      req.userId
    );

    sucessoHttp(res, usuario);
  } catch (erroAtualizar) {
    if (erroAtualizar instanceof ErroNegocio) {
      erroHttp(res, erroAtualizar.status, erroAtualizar.message);
      return;
    }
    erroHttp(res, 500, "Erro ao atualizar o usuário.");
  }
}

// DELETE /api/admin/users/:id
export async function excluir(req: RequisicaoAutenticada, res: Response): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    erroHttp(res, 400, "Identificador inválido.");
    return;
  }

  if (!req.userId) {
    erroHttp(res, 401, "Autenticação necessária.");
    return;
  }

  try {
    await userService.excluirUsuario(id, req.userId);
    res.status(204).send();
  } catch (erroExcluir) {
    if (erroExcluir instanceof ErroNegocio) {
      erroHttp(res, erroExcluir.status, erroExcluir.message);
      return;
    }
    erroHttp(res, 500, "Erro ao excluir o usuário.");
  }
}