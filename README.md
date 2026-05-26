# 🌿 EcoConnect

Plataforma de conexão entre pessoas neurodivergentes e organizações especializadas.

## Início Rápido

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env   # edite com suas credenciais
npm run db:migrate
npm run db:seed
npm run dev            # porta 3001

# 2. Frontend (outro terminal)
cd frontend
npm install
cp .env.example .env
npm run dev            # porta 5173
```

Acesse **http://localhost:5173**

**Contas de teste:**
- Paciente: `maria@email.com` / `123456`
- Profissional: `paulo@ecoconnect.com` / `admin123`

> Para instruções detalhadas, consulte [BANCO_DE_DADOS_GUIA.md](./BANCO_DE_DADOS_GUIA.md)
