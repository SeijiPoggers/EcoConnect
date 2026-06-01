// ═══════════════════════════════════════════════════════
//  EcoConnect — Seed de Produção (mínimo)
//  Apenas cria um admin inicial para primeiro acesso.
//  Nenhum dado fictício ou de demonstração.
//  Execute: npm run db:seed
// ═══════════════════════════════════════════════════════

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de produção...\n');

  // Verifica se já existe algum usuário — não sobrescreve
  const count = await prisma.user.count();
  if (count > 0) {
    console.log(`⚠️  Banco já possui ${count} usuário(s). Seed ignorado para não sobrescrever dados reais.`);
    console.log('   Para recriar, execute: npm run db:reset\n');
    return;
  }

  // Cria o primeiro profissional administrador
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@ecoconnect.com';
  const adminPass  = process.env.ADMIN_PASSWORD || 'EcoConnect@2025!';

  const admin = await prisma.user.create({
    data: {
      email:    adminEmail,
      password: bcrypt.hashSync(adminPass, 12),
      name:     'Administrador EcoConnect',
      avatar:   'AD',
      role:     'PROFESSIONAL',
      professionalProfile: {
        create: {
          specialty:       'Administrador do Sistema',
          bio:             'Conta administrativa inicial do EcoConnect.',
          institutionMode: true,  // Admin pode criar instituições
        },
      },
    },
  });

  console.log('✅ Seed concluído!\n');
  console.log('🔑 Primeiro acesso:');
  console.log(`   E-mail: ${adminEmail}`);
  console.log(`   Senha:  ${adminPass}`);
  console.log('\n⚠️  IMPORTANTE: Altere a senha no primeiro login!');
  console.log('   Configure ADMIN_EMAIL e ADMIN_PASSWORD no .env para personalizar.\n');
}

main()
  .catch(e => { console.error('❌ Erro no seed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
