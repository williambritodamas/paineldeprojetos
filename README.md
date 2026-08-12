# Painel de Projetos

Painel administrativo para centralizar, acessar e gerenciar projetos e sistemas que rodam em diferentes portas no computador ou servidor.

A aplicação funciona como um **launchpad central**: a página pública visualiza os projetos disponíveis e permite acessar cada um em uma nova aba. Na área administrativa, além do cadastro de projetos, o **administrador** pode:

- cadastrar/editar/excluir **usuários** do painel (com papéis admin ou usuário comum);
- configurar o **caminho da pasta** e o **comando de execução** de cada projeto;
- gerenciar os processos via **PM2** diretamente no painel: habilitar/desabilitar a inicialização automática no boot, iniciar, parar, reiniciar e ver o status de cada projeto.

---

## Objetivo

```text
PAINEL DE PROJETOS
        │
        ├── Projeto 1 → porta 3002
        ├── Projeto 2 → porta 3004
        ├── Projeto 3 → porta 3006
        └── Projeto 4 → porta 3008
```

Cada projeto é exibido com:

- nome;
- descrição;
- ícone;
- status (ativo/inativo);
- porta;
- botão para acessar em nova aba.

---

## Regra importante: URL dinâmica dos projetos

O painel **não armazena** `localhost`, IP ou hostname fixo para os projetos.

O endereço é montado dinamicamente a partir do endereço pelo qual o usuário acessou o painel:

```typescript
const urlProjeto = `${window.location.protocol}//${window.location.hostname}:${project.port}`;
```

### Acesso via localhost

```text
Painel:   http://localhost:3000
Projeto:  http://localhost:3002
```

### Acesso via IP

```text
Painel:   http://192.168.1.50:3000
Projeto:  http://192.168.1.50:3002
```

### Acesso via hostname

```text
Painel:   http://servidor-escola:3000
Projeto:  http://servidor-escola:3002
```

O banco de dados guarda apenas a **porta** de cada projeto.

---

## Tecnologias

### Frontend

- React
- Vite
- TypeScript (strict)
- Tailwind CSS
- React Router
- Axios
- Lucide React

### Backend

- Node.js
- Express
- TypeScript
- Prisma ORM
- SQLite
- CORS
- dotenv
- bcrypt
- JWT
- PM2 (gerenciamento programático dos processos no servidor)

### Gerenciamento

- npm workspaces

---

## Estrutura do projeto

```text
painel-projetos/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── layouts/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   │
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── index.html
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middlewares/
│   │   ├── types/
│   │   ├── utils/
│   │   └── server.ts
│   │
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── package.json
├── .gitignore
├── .env.example
└── README.md
```

---

## Instalação

Requisitos:

- Node.js 18 ou superior
- npm

```bash
# instala as dependências de todos os workspaces
npm install
```

## Configuração

### 1. Copie os arquivos de ambiente

```bash
cp .env.example backend/.env
cp .env.example frontend/.env
```

Ajuste os valores conforme necessário.

### 2. Configure as variáveis de ambiente

**Backend (`backend/.env`):**

```env
PORT=3001
DATABASE_URL="file:./dev.db"
FRONTEND_URL="http://localhost:3000"

JWT_SECRET="alterar_esta_chave"

ADMIN_NAME="Administrador"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="alterar_esta_senha"

AUTOR_SISTEMA="Nome do Desenvolvedor"
GESTOR_SETOR="Nome do Gestor"
```

**Frontend (`frontend/.env`):**

```env
VITE_API_URL=""
VITE_AUTOR_SISTEMA="Nome do Desenvolvedor"
VITE_GESTOR_SETOR="Nome do Gestor"
```

> `VITE_API_URL` vazio faz o frontend montar o endereço da API dinamicamente
> (`http://HOST_ACESSADO:3001/api`), permitindo acesso por localhost, IP ou
> hostname sem ajustes.

> Nunca versionar arquivos `.env` — eles estão no `.gitignore`.

### 3. Inicialize o banco de dados

```bash
npm run db:migrate
npm run db:seed
```

Ou, de dentro da pasta `backend`:

```bash
npx prisma migrate dev
npx prisma db seed
```

O comando de migration cria as tabelas e o seed:

- cria o usuário administrador (com senha protegida por bcrypt);
- cria 4 projetos de exemplo.

### 4. Execute

```bash
npm run dev
```

Este comando inicia o **backend** e o **frontend** simultaneamente.

Também é possível executar separadamente:

```bash
npm run dev:backend
npm run dev:frontend
```

### Portas

| Serviço   | Endereço                       |
| --------- | ------------------------------ |
| Frontend  | http://localhost:3000          |
| Backend   | http://localhost:3001          |
| Health    | http://localhost:3001/api/health |

---

## Acesso

### Usuário administrativo inicial

| Campo    | Valor padrão  |
| -------- | ------------- |
| Usuário  | `admin`       |
| Senha    | `alterar_esta_senha` |

> Os valores são definidos pelas variáveis `ADMIN_USERNAME` e `ADMIN_PASSWORD` no `backend/.env`.

### Como alterar a senha inicial

1. Edite o arquivo `backend/.env` e altere `ADMIN_PASSWORD`;
2. Execute novamente o seed:

```bash
npm run db:seed
```

O seed atualiza a senha do usuário administrador existente usando bcrypt.

> Nunca utilize a senha padrão em produção.

---

## Áreas do sistema

### Área pública (`/`)

Vitrine de projetos ativos. Qualquer visitante pode:

- visualizar nome, descrição, ícone, status e porta;
- abrir o projeto em uma nova aba.

Não possui botões de edição, exclusão ou cadastro.

### Área administrativa (`/admin`)

Somente usuário autenticado:

- cadastrar projetos;
- editar projetos;
- excluir projetos (com confirmação);
- ativar/desativar projetos;
- buscar e filtrar projetos;
- visualizar estatísticas.

**Apenas administradores** (papel `admin`):

- página `/admin/usuarios` para cadastrar, editar e excluir usuários do painel;
- configurar o caminho da pasta e o comando de execução dos projetos;
- gerenciar os processos via PM2 (inicialização automática, iniciar/parar/reiniciar e status).

Usuários com papel `user` acessam `/admin` e gerenciam os projetos normalmente, mas não veem os campos PM2, a página de usuários nem executam operações no PM2.

Usuários não autenticados que acessarem `/admin` são redirecionados para `/login`.

---

## Papéis de usuário

| Papel   | Gerencia projetos | Gerencia PM2 | Gerencia usuários |
| ------- | ----------------- | ------------ | ----------------- |
| `admin` | Sim               | Sim          | Sim               |
| `user`  | Sim               | Não          | Não               |

O usuário administrador inicial é criado pelo seed (variáveis `ADMIN_NAME`, `ADMIN_USERNAME` e `ADMIN_PASSWORD` do `backend/.env`) e recebe o papel `admin`.

---

## Inicialização automática com PM2

O painel gerencia os processos dos projetos via PM2 usando a **pasta** e o **comando** cadastrados (ex.: `npm start`, `npm run dev`, `node server.js`).

- **Habilitar "Início automático"** no card do projeto: registra o processo no PM2 (`pm2 start`) e executa o `pm2 save`, garantindo que ele volte a subir no boot do sistema.
- **Desabilitar "Início automático"**: remove o processo do PM2 (`pm2 delete`) e executa o `pm2 save` novamente. O processo também é encerrado — para manter rodando apenas naquele momento, use o botão **Iniciar** (sem registrar no boot).
- As ações **Iniciar**, **Reiniciar** e **Parar** atuam sobre o processo já registrado.

> O `pm2 startup` (registro do serviço de boot do sistema) deve estar configurado de antemão, como normalmente é feito em servidores Linux. O painel apenas persiste a lista de processos com o `pm2 save`.

O nome do processo no PM2 é estável (`proj-<id>`), então renomear o projeto no painel não quebra o gerenciamento. A pasta e o comando são usados apenas no momento de registrar o processo.

---

## Como adicionar novos projetos

1. Acesse `http://localhost:3000/login`;
2. Entre com um usuário do painel;
3. Clique em **Novo Projeto**;
4. Informe:

   - nome;
   - descrição;
   - ícone;
   - porta (ex.: `3002`);
   - ativo.

   Para administradores, também fica disponível no formulário:

   - caminho da pasta no servidor (ex.: `/home/usuario/apps/plataforma-videos`);
   - comando de execução (ex.: `npm start`).

Não é informada URL. O endereço é montado dinamicamente.

---

## Como criar usuários

1. Acesse `/admin` e entre como usuário com papel `admin`;
2. Clique em **Usuários** (página `/admin/usuarios`);
3. Clique em **Novo Usuário** e informe nome, usuário, senha (mínimo 6 caracteres) e papel (`admin` ou `user`).

Regras de segurança:

- não é possível excluir o próprio usuário logado;
- não é possível excluir ou rebaixar o último administrador;
- o administrador não pode remover o próprio papel de admin.

---

## API REST

| Método | Rota                    | Acesso        | Descrição                        |
| ------ | ----------------------- | ------------- | -------------------------------- |
| GET    | `/api/health`           | Público       | Verificação de saúde da API      |
| POST   | `/api/auth/login`       | Público       | Realiza a autenticação           |
| GET    | `/api/auth/me`          | Autenticado   | Dados do usuário autenticado     |
| GET    | `/api/projects`         | Público       | Lista projetos ativos            |
| GET    | `/api/projects/:id`     | Público       | Detalhe de um projeto            |
| POST   | `/api/projects`         | Autenticado   | Cria um projeto                  |
| PUT    | `/api/projects/:id`     | Autenticado   | Atualiza um projeto              |
| DELETE | `/api/projects/:id`     | Autenticado   | Exclui um projeto                |
| GET    | `/api/admin/projects`   | Autenticado   | Lista com busca, filtro e status PM2 |
| GET    | `/api/admin/users`      | Admin         | Lista usuários do painel         |
| POST   | `/api/admin/users`      | Admin         | Cria um usuário                  |
| PUT    | `/api/admin/users/:id`  | Admin         | Atualiza um usuário              |
| DELETE | `/api/admin/users/:id`  | Admin         | Exclui um usuário                |
| POST   | `/api/admin/pm2/:id/enable`    | Admin   | Registra no PM2 + `pm2 save` (início automático) |
| POST   | `/api/admin/pm2/:id/disable`   | Admin   | Remove do PM2 + `pm2 save`       |
| POST   | `/api/admin/pm2/:id/iniciar`   | Admin   | Inicia o processo                |
| POST   | `/api/admin/pm2/:id/reiniciar` | Admin   | Reinicia o processo              |
| POST   | `/api/admin/pm2/:id/parar`     | Admin   | Para o processo                  |

### Exemplo de health check

```bash
curl http://localhost:3001/api/health
```

Resposta:

```json
{ "status": "ok" }
```

### Exemplo de login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"alterar_esta_senha"}'
```

Resposta:

```json
{
  "token": "eyJhbGciOi...",
  "user": {
    "id": 1,
    "name": "Administrador",
    "username": "admin"
  }
}
```

### Autenticação das rotas administrativas

Envie o token no cabeçalho:

```text
Authorization: Bearer SEU_TOKEN
```

---

## Segurança

- senha armazenada apenas como hash (bcrypt);
- autenticação por JWT com expiração;
- **controle de papéis** (`admin`/`user`): rotas de usuários e de PM2 exigem `admin` (middleware de permissão);
- o papel do usuário é consultado no banco a cada requisição, então mudanças de papel valem imediatamente;
- middleware que protege as rotas administrativas;
- validação de entrada nos controllers;
- campos de execução (pasta, comando e autostart) são aceitos apenas para administradores;
- a API pública não expõe a pasta nem o comando dos projetos;
- CORS configurado pela porta do frontend: aceita qualquer host
  (localhost, IP ou hostname) desde que a origem esteja na porta do frontend
  configurada em `FRONTEND_URL`. Origem em outra porta é negada;
- JWT secret e demais credenciais apenas no `.env`;
- confirmação antes da exclusão de projetos e usuários.

---

## Rodapé institucional

As informações do rodapé são configuráveis:

```env
# Frontend (.env)
VITE_AUTOR_SISTEMA="Nome do Desenvolvedor"
VITE_GESTOR_SETOR="Nome do Gestor"
```

Exibição:

```text
Desenvolvido por: Nome do Desenvolvedor
Gestor do setor: Nome do Gestor
```

---

## Build de produção

```bash
npm run build
```

Compila o backend (TypeScript) e o frontend (Vite).

Para rodar o backend compilado:

```bash
npm run dev:backend   # desenvolvimento
npm start --workspace backend   # produção
```

Para servir o frontend de produção:

```bash
npm run preview --workspace frontend
```

---

## Estrutura da URL dinâmica

A lógica está centralizada em `frontend/src/utils/projectUrl.ts`:

```typescript
export function gerarUrlProjeto(porta: number): string {
  return `${window.location.protocol}//${window.location.hostname}:${porta}`;
}
```

Cada botão "Acessar" usa essa função. Assim, o mesmo projeto continua funcionando em:

- `localhost`;
- IP da máquina;
- hostname do servidor.

Sem necessidade de alterar o cadastro.

---

## Planejamento futuro (não implementado)

- monitoramento de portas (online/verificando/off-line);
- categorias (Educação, Audiovisual, Oficina, Sistemas, Testes);
- ambientes (Desenvolvimento, Homologação, Produção);
- servidores (Local, Escola, Cloud);
- favoritos;
- ordenação;
- seletor de ícones.

---

## Licença

Este projeto é de uso interno. As informações de autoria e gestão são configuráveis através das variáveis de ambiente.