# EcoConnect — Guia de Configuração e Banco de Dados

> Guia passo a passo completo para instalar, configurar e executar o EcoConnect localmente.

---

## Índice

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Pré-requisitos](#2-pré-requisitos)
3. [Estrutura do Projeto](#3-estrutura-do-projeto)
4. [Configurar o Banco de Dados (PostgreSQL)](#4-configurar-o-banco-de-dados-postgresql)
5. [Configurar o Backend](#5-configurar-o-backend)
6. [Configurar o Frontend](#6-configurar-o-frontend)
7. [Executar o Projeto](#7-executar-o-projeto)
8. [Esquema do Banco de Dados](#8-esquema-do-banco-de-dados)
9. [Endpoints da API](#9-endpoints-da-api)
10. [Usuários de Teste](#10-usuários-de-teste)
11. [Deploy em Produção](#11-deploy-em-produção)
12. [Solução de Problemas](#12-solução-de-problemas)

---

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                    ECOCONNECT                        │
│                                                     │
│  ┌──────────────┐    HTTP/JSON    ┌───────────────┐ │
│  │   Frontend   │ ◄────────────► │    Backend    │ │
│  │  React+Vite  │                │  Node+Express │ │
│  │  Porta 5173  │                │  Porta 3001   │ │
│  └──────────────┘                └───────┬───────┘ │
│                                          │ Prisma  │
│                                  ┌───────▼───────┐ │
│                                  │  PostgreSQL   │ │
│                                  │  Porta 5432   │ │
│                                  └───────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Stack tecnológico:**
- **Frontend:** React 18 + Vite + React Router v6
- **Backend:** Node.js + Express + JWT + Zod
- **ORM:** Prisma 5
- **Banco:** PostgreSQL 15+
- **Autenticação:** JWT (JSON Web Tokens) com bcryptjs

---

## 2. Pré-requisitos

Instale os seguintes programas **antes** de começar:

### Node.js (v18 ou superior)
```bash
# Verificar versão instalada
node --version   # deve exibir v18.x.x ou superior

# Se não tiver, baixe em: https://nodejs.org
# Ou via nvm (recomendado):
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### PostgreSQL (v14 ou superior)

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Windows:**
- Baixe o instalador em: https://www.postgresql.org/download/windows/
- Siga o assistente de instalação
- Anote a senha do usuário `postgres` que você definir

### Git
```bash
git --version   # verificar se está instalado
# Se não: https://git-scm.com/downloads
```

---

## 3. Estrutura do Projeto

```
ecoconnect/
├── frontend/                    # React SPA
│   ├── src/
│   │   ├── components/          # UI reutilizável (Avatar, Button, Card…)
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Estado global de autenticação
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx    # Tela de login com toggle paciente/profissional
│   │   │   ├── PatientApp.jsx   # Shell do app do paciente
│   │   │   ├── ProfessionalApp.jsx # Shell do app do profissional
│   │   │   ├── patient/         # Páginas do paciente
│   │   │   └── professional/    # Páginas do profissional
│   │   ├── services/
│   │   │   └── api.js           # Todas as chamadas HTTP para o backend
│   │   └── styles/
│   │       └── global.css       # Variáveis CSS e estilos base
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── backend/                     # Node.js API
│   ├── prisma/
│   │   ├── schema.prisma        # Definição do banco de dados
│   │   └── seed.js              # Dados de teste
│   ├── src/
│   │   ├── middleware/
│   │   │   ├── auth.js          # Verificação JWT
│   │   │   └── errorHandler.js  # Tratamento de erros
│   │   ├── routes/
│   │   │   ├── auth.js          # POST /login, /register, GET /me
│   │   │   ├── patients.js      # CRUD de pacientes
│   │   │   ├── professionals.js # Perfil e stats do profissional
│   │   │   ├── organizations.js # Listagem de organizações
│   │   │   ├── appointments.js  # Agendamentos
│   │   │   ├── objectives.js    # Objetivos/checklist
│   │   │   ├── logs.js          # Logs clínicos
│   │   │   └── contact.js       # Mensagens de contato
│   │   └── index.js             # Entry point do servidor
│   ├── .env.example
│   └── package.json
│
└── BANCO_DE_DADOS_GUIA.md       # Este arquivo
```

---

## 4. Configurar o Banco de Dados (PostgreSQL)

### Passo 4.1 — Acessar o PostgreSQL

**Linux/macOS:**
```bash
sudo -u postgres psql
```

**Windows (via PowerShell como Administrador):**
```bash
psql -U postgres
```

### Passo 4.2 — Criar o banco e o usuário

Dentro do prompt do PostgreSQL (`postgres=#`), execute:

```sql
-- Criar usuário para a aplicação
CREATE USER ecoconnect WITH PASSWORD 'ecoconnect123';

-- Criar o banco de dados
CREATE DATABASE ecoconnect_db OWNER ecoconnect;

-- Conceder todos os privilégios
GRANT ALL PRIVILEGES ON DATABASE ecoconnect_db TO ecoconnect;

-- Verificar criação
\l

-- Sair
\q
```

### Passo 4.3 — Testar a conexão

```bash
psql -U ecoconnect -d ecoconnect_db -h localhost
# Digite a senha: ecoconnect123
# Se conectar com sucesso, o banco está pronto!
\q
```

> **⚠️ Segurança:** Em produção, use uma senha forte e variáveis de ambiente. Nunca commit o arquivo `.env` real.

---

## 5. Configurar o Backend

### Passo 5.1 — Entrar na pasta e instalar dependências

```bash
cd ecoconnect/backend
npm install
```

### Passo 5.2 — Criar o arquivo `.env`

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Conexão com o banco
DATABASE_URL="postgresql://ecoconnect:ecoconnect123@localhost:5432/ecoconnect_db"

# JWT — gere um segredo forte:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET="seu_segredo_aqui_mude_em_producao"
JWT_EXPIRES_IN="7d"

# Servidor
PORT=3001
NODE_ENV=development

# URL do frontend (para CORS)
FRONTEND_URL="http://localhost:5173"
```

### Passo 5.3 — Rodar as migrations (criar tabelas)

```bash
# Gera o cliente Prisma
npm run db:generate

# Cria todas as tabelas no banco
npm run db:migrate
# Quando perguntar o nome da migration, digite: init
```

Você verá algo como:
```
✔ Generated Prisma Client
✔ Applied migration `20240401000000_init`
```

### Passo 5.4 — Popular com dados de teste

```bash
npm run db:seed
```

Saída esperada:
```
🌱 Seeding EcoConnect database...

👨‍⚕️ Creating professional users...
🏢 Creating organizations...
👤 Creating patient users...
🎯 Creating objectives...
📝 Creating clinical logs...
📅 Creating appointments...

✅ Seed completed successfully!

📋 Test accounts:
   Patient:      maria@email.com      / 123456
   Patient:      joao@email.com       / 123456
   Patient:      ana@email.com        / 123456
   Professional: paulo@ecoconnect.com  / admin123
   Professional: beatriz@ecoconnect.com / admin123
```

### Passo 5.5 — (Opcional) Visualizar o banco no Prisma Studio

```bash
npm run db:studio
# Abre em http://localhost:5555
```

---

## 6. Configurar o Frontend

### Passo 6.1 — Instalar dependências

```bash
cd ../frontend   # ou: cd ecoconnect/frontend
npm install
```

### Passo 6.2 — Criar o arquivo `.env`

```bash
cp .env.example .env
```

Conteúdo do `.env`:
```env
VITE_API_URL=http://localhost:3001/api
```

---

## 7. Executar o Projeto

### Opção A — Dois terminais separados (desenvolvimento)

**Terminal 1 — Backend:**
```bash
cd ecoconnect/backend
npm run dev
# Servidor rodando em http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd ecoconnect/frontend
npm run dev
# App rodando em http://localhost:5173
```

Acesse: **http://localhost:5173**

### Opção B — Script único (Linux/macOS)

Crie um arquivo `start.sh` na raiz do projeto:
```bash
#!/bin/bash
echo "🌿 Iniciando EcoConnect..."
cd backend  && npm run dev &
cd frontend && npm run dev &
wait
```
```bash
chmod +x start.sh
./start.sh
```

---

## 8. Esquema do Banco de Dados

### Diagrama de Entidades

```
┌──────────┐      ┌──────────────────┐      ┌───────────────────┐
│  User    │      │  PatientProfile  │      │ ProfessionalProfile│
├──────────┤      ├──────────────────┤      ├───────────────────┤
│ id       │──┐   │ id               │  ┌──│ id                │
│ email    │  ├──►│ userId           │  │  │ userId            │
│ password │  │   │ condition        │  │  │ crp               │
│ name     │  │   │ xp               │  │  │ specialty         │
│ avatar   │  │   │ level            ├──┘  │ bio               │
│ role     │  │   │ professionalId ──┘     └───────────────────┘
│ isActive │  └──►└──────────────────┘              │
└──────────┘         │         │                    │
                     │         │           ┌────────▼──────────┐
              ┌──────▼──┐  ┌───▼───────┐   │   Organization    │
              │Objective│  │Appointment│   ├───────────────────┤
              ├─────────┤  ├───────────┤   │ id                │
              │ text    │  │ date      │   │ name              │
              │ done    │  │ time      │   │ type              │
              │ xpReward│  │ status    │   │ city              │
              │ deadline│  │ notes     │   │ rating            │
              │isVisible│  └───────────┘   │ slots             │
              └─────────┘                  │ emoji             │
                                           └───────────────────┘
              ┌──────────────────┐
              │      Log         │
              ├──────────────────┤
              │ type             │
              │ title            │
              │ content          │
              │ isVisible        │
              └──────────────────┘
```

### Tabelas e campos principais

| Tabela | Campos chave | Descrição |
|--------|-------------|-----------|
| `users` | id, email, password, name, avatar, role | Todos os usuários (pacientes e profissionais) |
| `patient_profiles` | userId, condition, xp, level, professionalId | Dados clínicos do paciente |
| `professional_profiles` | userId, crp, specialty, bio | Credenciais do profissional |
| `organizations` | name, type, city, rating, slots | Clínicas e centros parceiros |
| `organization_tags` | organizationId, tag | Tags de especialidade (TEA, TDAH…) |
| `objectives` | patientId, text, done, xpReward, deadline, isVisible | Checklist de objetivos |
| `logs` | patientId, type, title, content, isVisible | Registros clínicos |
| `appointments` | patientId, organizationId, date, time, status | Consultas agendadas |
| `contact_messages` | name, email, message, read | Formulário de contato |

### Enums

```sql
-- Papel do usuário
UserRole: PATIENT | PROFESSIONAL

-- Condição neurodivergente
NeurodivergenceType: TEA | ADHD | DYSLEXIA | DYSPRAXIA | OTHER | UNSPECIFIED

-- Status da consulta
AppointmentStatus: SCHEDULED | COMPLETED | CANCELLED | NO_SHOW

-- Tipo de log clínico
LogType: OBSERVATION | SESSION | PROGRESS | NOTE
```

---

## 9. Endpoints da API

### Autenticação

| Método | Endpoint | Body | Descrição |
|--------|----------|------|-----------|
| POST | `/api/auth/login` | `{email, password, role}` | Login (role: PATIENT ou PROFESSIONAL) |
| POST | `/api/auth/register` | `{email, password, name, condition}` | Cadastro de paciente |
| GET  | `/api/auth/me` | — (precisa de token) | Dados do usuário logado |
| POST | `/api/auth/logout` | — | Logout |

**Exemplo de login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maria@email.com","password":"123456","role":"PATIENT"}'
```

**Resposta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "maria@email.com",
    "name": "Maria Clara Santos",
    "role": "PATIENT",
    "patientProfile": { "id": "...", "xp": 68, "level": 3 }
  }
}
```

### Pacientes (requer token)

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| GET | `/api/patients/me` | Paciente | Perfil do paciente logado |
| GET | `/api/patients` | Profissional | Lista pacientes do profissional |
| GET | `/api/patients/:id` | Profissional | Paciente específico |

### Organizações (público)

| Método | Endpoint | Query Params | Descrição |
|--------|----------|--------------|-----------|
| GET | `/api/organizations` | `?tag=TEA&q=busca` | Lista organizações ativas |

### Consultas (requer token)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/appointments` | Lista consultas (filtra por role) |
| POST | `/api/appointments` | Cria agendamento |
| PATCH | `/api/appointments/:id/cancel` | Cancela consulta |

### Objetivos (requer token)

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| GET | `/api/objectives?patientId=` | Ambos | Lista objetivos |
| POST | `/api/objectives` | Profissional | Cria objetivo |
| PATCH | `/api/objectives/:id/toggle` | Profissional | Marca/desmarca como concluído |
| DELETE | `/api/objectives/:id` | Profissional | Remove objetivo |

### Logs (requer token)

| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| GET | `/api/logs?patientId=` | Ambos | Lista logs (paciente vê só visíveis) |
| POST | `/api/logs` | Profissional | Cria registro clínico |
| PATCH | `/api/logs/:id/visibility` | Profissional | Alterna visibilidade |

---

## 10. Usuários de Teste

Após rodar `npm run db:seed`:

| Tipo | E-mail | Senha | Nome |
|------|--------|-------|------|
| 👤 Paciente | maria@email.com | 123456 | Maria Clara Santos (TEA, 68 XP) |
| 👤 Paciente | joao@email.com | 123456 | João Pedro Silva (TDAH, 42 XP) |
| 👤 Paciente | ana@email.com | 123456 | Ana Luísa Lima (Dislexia, 95 XP) |
| ⚕️ Profissional | paulo@ecoconnect.com | admin123 | Dr. Paulo Henrique |
| ⚕️ Profissional | beatriz@ecoconnect.com | admin123 | Dra. Ana Beatriz |

> Na tela de login, use o **toggle** para alternar entre modo Paciente e Profissional antes de entrar.

---

## 11. Deploy em Produção

### Backend (Railway / Render / Heroku)

1. Crie um banco PostgreSQL no serviço escolhido
2. Configure as variáveis de ambiente:
   ```
   DATABASE_URL=<string de conexão do serviço>
   JWT_SECRET=<segredo longo e aleatório>
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   FRONTEND_URL=https://seu-frontend.vercel.app
   PORT=3001
   ```
3. No deploy, rode:
   ```bash
   npm install
   npx prisma generate
   npx prisma migrate deploy
   node src/index.js
   ```

### Frontend (Vercel / Netlify)

1. Conecte o repositório
2. Configure:
   - **Build command:** `npm run build`
   - **Output dir:** `dist`
   - **Environment variable:** `VITE_API_URL=https://sua-api.railway.app/api`
3. Deploy automático ao fazer push

### Checklist de segurança para produção

- [ ] `JWT_SECRET` com pelo menos 64 caracteres aleatórios
- [ ] `NODE_ENV=production`
- [ ] `FRONTEND_URL` apontando para o domínio real
- [ ] HTTPS habilitado
- [ ] Banco com senha forte e acesso restrito
- [ ] Rate limiting configurado (já incluído no código)
- [ ] Helmet.js habilitado (já incluído)

---

## 12. Solução de Problemas

### ❌ `ECONNREFUSED` ao conectar no banco

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solução:**
```bash
# Linux
sudo systemctl status postgresql
sudo systemctl start postgresql

# macOS
brew services start postgresql@15

# Windows — abra o Services e inicie o serviço PostgreSQL
```

### ❌ `P1001` Prisma não consegue conectar

Verifique o `DATABASE_URL` no `.env`:
```bash
# Tente conectar manualmente
psql "postgresql://ecoconnect:ecoconnect123@localhost:5432/ecoconnect_db"
```

### ❌ Erro de CORS no frontend

Verifique no `backend/.env`:
```env
FRONTEND_URL=http://localhost:5173
```
Confirme que o frontend está rodando na porta correta.

### ❌ `Module not found` no backend

```bash
cd backend
npm install
npx prisma generate
```

### ❌ Token JWT inválido / 401

- Verifique se `JWT_SECRET` é o mesmo no `.env` em todos os ambientes
- Faça logout e login novamente para obter um token fresco

### 🔄 Resetar o banco de dados

```bash
cd backend
npx prisma migrate reset   # apaga tudo e roda as migrations novamente
npm run db:seed             # recarrega os dados de teste
```

---

## Referências

- [Prisma Docs](https://www.prisma.io/docs)
- [Express.js](https://expressjs.com)
- [React Router v6](https://reactrouter.com)
- [JWT.io](https://jwt.io)
- [PostgreSQL Docs](https://www.postgresql.org/docs)

---

*EcoConnect — Plataforma para conexão de pessoas neurodivergentes com organizações especializadas.*
