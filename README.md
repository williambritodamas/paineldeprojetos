# Painel de Projetos

Painel administrativo simples para centralizar e acessar projetos e sistemas que ficam rodando em diferentes portas no computador ou servidor.

A aplicação funciona como um **launchpad central**: uma única página visualiza os projetos disponíveis e permite acessar cada um deles em uma nova aba.

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

Usuários não autenticados que acessarem `/admin` são redirecionados para `/login`.

---

## Como adicionar novos projetos

1. Acesse `http://localhost:3000/login`;
2. Entre com o usuário administrador;
3. Clique em **Novo Projeto**;
4. Informe:

   - nome;
   - descrição;
   - ícone;
   - porta (ex.: `3002`);
   - ativo.

Não é informada URL. O endereço é montado dinamicamente.

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
| GET    | `/api/admin/projects`   | Autenticado   | Lista com busca e filtro         |

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
- middleware que protege as rotas administrativas;
- validação de entrada nos controllers;
- CORS configurado pela porta do frontend: aceita qualquer host
  (localhost, IP ou hostname) desde que a origem esteja na porta do frontend
  configurada em `FRONTEND_URL`. Origem em outra porta é negada;
- JWT secret e demais credenciais apenas no `.env`;
- confirmação antes da exclusão de projetos.

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