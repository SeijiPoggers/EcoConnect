// ── Rotas de Objetivos ────────────────────────────────
const router = require('express').Router();
const { z }  = require('zod');
const { PrismaClient } = require('@prisma/client');
const { auth, requirePro } = require('../middleware/auth');

const prisma = new PrismaClient();

// ── Dicas por categoria ───────────────────────────────
// Retorna dicas práticas baseadas na categoria do objetivo
const TIPS = {
  SLEEP: {
    title: '💤 Dicas para melhorar o sono',
    tips: [
      'Mantenha o mesmo horário de dormir e acordar todos os dias, inclusive fins de semana.',
      'Desligue telas (celular, TV) pelo menos 1 hora antes de dormir.',
      'Deixe o quarto escuro, silencioso e com temperatura agradável (em torno de 22°C).',
      'Evite cafeína (café, refrigerante) depois das 15h.',
      'Crie uma rotina relaxante antes de dormir: banho morno, leitura leve, respiração profunda.',
    ],
    motivation: '🌙 Um sono de qualidade é a base de tudo. Cada noite bem dormida é uma vitória!',
  },
  EMOTIONAL: {
    title: '💚 Dicas para regulação emocional',
    tips: [
      'Respire fundo: inspire por 4 segundos, segure 4, expire por 6. Repita 3 vezes.',
      'Use um diário para registrar como você se sentiu durante o dia — sem julgamentos.',
      'Identifique seus gatilhos: o que normalmente te deixa ansioso ou sobrecarregado?',
      'Quando sentir sobrecarga, faça uma pausa de 5 minutos num lugar tranquilo.',
      'O app Calm ou Headspace tem meditações guiadas gratuitas de apenas 5 minutos.',
    ],
    motivation: '💛 Suas emoções são válidas. Reconhecê-las já é um grande passo!',
  },
  SOCIAL: {
    title: '🤝 Dicas para habilidades sociais',
    tips: [
      'Comece com interações pequenas: cumprimentar alguém, fazer um elogio sincero.',
      'Grupos com interesses em comum (jogos, livros, hobbies) são ótimos para praticar.',
      'Não tem problema sair de situações sociais quando precisar de uma pausa.',
      'Pratique conversas na frente do espelho — parece estranho mas funciona!',
      'Scripts sociais ajudam: prepare frases prontas para situações comuns.',
    ],
    motivation: '🌟 Cada interação é uma oportunidade de crescimento. No seu ritmo!',
  },
  MOTOR: {
    title: '🏃 Dicas para coordenação motora',
    tips: [
      'Atividades como argila, origami e pintar melhoram a coordenação fina.',
      'Jogar bola, pular corda ou dançar trabalham a coordenação grossa de forma divertida.',
      'Videogames de movimento (como Wii Sports) são aliados surpreendentes.',
      'Faça os exercícios recomendados pelo terapeuta por pelo menos 10 minutos diários.',
      'Nadar é uma das melhores atividades para desenvolver coordenação geral.',
    ],
    motivation: '🎯 O corpo aprende com a prática. Cada dia você fica mais habilidoso!',
  },
  COGNITIVE: {
    title: '🧠 Dicas para foco e cognição',
    tips: [
      'Técnica Pomodoro: 25 min de foco + 5 min de pausa. Repita 4 vezes, depois pausa longa.',
      'Elimine distrações: use modo "não perturbe" no celular e feche abas desnecessárias.',
      'Uma tarefa por vez. Multitasking é mito — prejudica a qualidade e o foco.',
      'Listas escritas aliviam a carga mental. Use papel ou apps como Todoist.',
      'Exercício físico de 20 minutos aumenta significativamente o foco por horas.',
    ],
    motivation: '🚀 Cada sessão de foco é seu cérebro ficando mais forte. Continue!',
  },
  ROUTINE: {
    title: '📅 Dicas para rotina e organização',
    tips: [
      'Use alarmes e lembretes visuais — post-its, calendário visível, notificações.',
      'Prepare o que precisa na noite anterior: roupa, mochila, lista de tarefas.',
      'Divida tarefas grandes em passos pequenos. "Estudar" vira "ler página 1 a 5".',
      'Reserve um horário fixo para cada atividade — o cérebro neurodivergente ama previsibilidade.',
      'Recompense-se após completar blocos de tarefas — positivo funciona!',
    ],
    motivation: '📌 Uma boa rotina reduz decisões e libera energia mental para o que importa!',
  },
  COMMUNICATION: {
    title: '🗣️ Dicas para comunicação',
    tips: [
      'Escrever antes de falar ajuda a organizar as ideias — tente fazer isso em situações importantes.',
      'Leitura regular amplia vocabulário e facilita a expressão.',
      'Não hesite em pedir para a pessoa repetir ou explicar diferente — todos precisam disso às vezes.',
      'Praticar em voz alta (mesmo sozinho) reduz a ansiedade de comunicar.',
      'Comunicação alternativa (gestos, escrita, apps) são ferramentas válidas e poderosas.',
    ],
    motivation: '💬 Comunicar-se do seu jeito é completamente válido. Cada progresso importa!',
  },
  OTHER: {
    title: '💡 Dicas gerais',
    tips: [
      'Celebre cada pequena conquista — o progresso é feito de passos pequenos.',
      'Peça ajuda quando precisar. Isso é força, não fraqueza.',
      'Mantenha-se hidratado e cuide da alimentação — afetam diretamente humor e foco.',
      'Encontre atividades que te trazem prazer e inclua-as na rotina.',
      'Lembre-se: neurodivergência é uma forma diferente de ser, não um déficit.',
    ],
    motivation: '🌈 Você está no caminho certo. Cada dia é uma nova oportunidade!',
  },
};

// GET /api/objectives?patientId=...  — lista objetivos
router.get('/', auth, async (req, res) => {
  const patientId = req.query.patientId || req.user.patientProfile?.id;

  if (!patientId) return res.status(400).json({ error: 'patientId necessário.' });

  const where = { patientId };
  if (req.user.role === 'PATIENT') where.isVisible = true; // paciente só vê visíveis

  const objectives = await prisma.objective.findMany({
    where,
    orderBy: [{ done: 'asc' }, { createdAt: 'desc' }],
  });

  // Adiciona dicas a cada objetivo
  const withTips = objectives.map(obj => ({
    ...obj,
    tips: TIPS[obj.category] || TIPS.OTHER,
  }));

  res.json(withTips);
});

// GET /api/objectives/tips/:category  — dicas de uma categoria específica
router.get('/tips/:category', (req, res) => {
  const cat = req.params.category.toUpperCase();
  const tips = TIPS[cat] || TIPS.OTHER;
  res.json(tips);
});

// POST /api/objectives  — criar objetivo (profissional)
router.post('/', auth, requirePro, async (req, res) => {
  const schema = z.object({
    patientId: z.string().uuid(),
    text:      z.string().min(3, 'Descreva o objetivo'),
    category:  z.enum(['SLEEP','EMOTIONAL','SOCIAL','MOTOR','COGNITIVE','ROUTINE','COMMUNICATION','OTHER']).optional(),
    xpReward:  z.number().int().min(5).max(100).optional(),
    deadline:  z.string().optional(),
    isVisible: z.boolean().optional(),
    notes:     z.string().optional(),
  });

  const data = schema.parse(req.body);

  const objective = await prisma.objective.create({
    data: {
      patientId:   data.patientId,
      createdById: req.user.id,
      text:        data.text,
      category:    data.category || 'OTHER',
      xpReward:    data.xpReward || 15,
      deadline:    data.deadline ? new Date(data.deadline) : null,
      isVisible:   data.isVisible !== false,
      notes:       data.notes,
    },
  });

  res.status(201).json({ ...objective, tips: TIPS[objective.category] || TIPS.OTHER });
});

// PATCH /api/objectives/:id  — atualizar objetivo
router.patch('/:id', auth, requirePro, async (req, res) => {
  const schema = z.object({
    text:      z.string().optional(),
    category:  z.enum(['SLEEP','EMOTIONAL','SOCIAL','MOTOR','COGNITIVE','ROUTINE','COMMUNICATION','OTHER']).optional(),
    xpReward:  z.number().int().optional(),
    deadline:  z.string().nullable().optional(),
    isVisible: z.boolean().optional(),
    notes:     z.string().optional(),
  });

  const data = schema.parse(req.body);
  const updated = await prisma.objective.update({
    where: { id: req.params.id },
    data: { ...data, deadline: data.deadline ? new Date(data.deadline) : undefined },
  });

  res.json({ ...updated, tips: TIPS[updated.category] || TIPS.OTHER });
});

// PATCH /api/objectives/:id/toggle  — marcar/desmarcar como concluído
router.patch('/:id/toggle', auth, requirePro, async (req, res) => {
  const obj = await prisma.objective.findUnique({ where: { id: req.params.id } });
  if (!obj) return res.status(404).json({ error: 'Objetivo não encontrado.' });

  const newDone = !obj.done;

  const [updated] = await prisma.$transaction([
    prisma.objective.update({
      where: { id: req.params.id },
      data: { done: newDone, doneAt: newDone ? new Date() : null },
    }),
    prisma.patientProfile.update({
      where: { id: obj.patientId },
      data: { xp: { increment: newDone ? obj.xpReward : -obj.xpReward } },
    }),
  ]);

  // Recalcula nível
  const patient = await prisma.patientProfile.findUnique({ where: { id: obj.patientId } });
  const newLevel = Math.floor(Math.max(0, patient.xp) / 25) + 1;
  await prisma.patientProfile.update({ where: { id: obj.patientId }, data: { level: newLevel } });

  res.json({
    ...updated,
    tips: TIPS[updated.category] || TIPS.OTHER,
    xpChange: newDone ? obj.xpReward : -obj.xpReward,
  });
});

// DELETE /api/objectives/:id
router.delete('/:id', auth, requirePro, async (req, res) => {
  await prisma.objective.delete({ where: { id: req.params.id } });
  res.json({ ok: true, message: 'Objetivo removido.' });
});

module.exports = router;
