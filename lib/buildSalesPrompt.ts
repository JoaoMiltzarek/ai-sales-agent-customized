export type SalesFormData = {
  businessType: string;
  companyName: string;
  tone: string;
  objective: string;
  customerMessage: string;
};

type BusinessPromptRule = {
  label: string;
  nicheContext: string;
  instructions: string[];
};

const businessPromptRules: Record<string, BusinessPromptRule> = {
  restaurante: {
    label: "Restaurante",
    nicheContext:
      "o negocio depende de atendimento acolhedor, agilidade e incentivo para visita ou pedido",
    instructions: [
      "Valorize experiencia, sabor, praticidade e bom atendimento.",
      "Se fizer sentido, incentive reserva, visita ao local ou pedido.",
      "Use linguagem proxima e objetiva, sem exagerar em termos tecnicos.",
    ],
  },
  oficina: {
    label: "Oficina",
    nicheContext:
      "o cliente costuma buscar confianca, clareza no servico e seguranca na decisao",
    instructions: [
      "Destaque confianca, transparencia e solucao do problema.",
      "Mostre disponibilidade para avaliar, explicar etapas e orientar o cliente.",
      "Evite promessas vagas; prefira seguranca e objetividade.",
    ],
  },
  clinica: {
    label: "Clinica",
    nicheContext:
      "o atendimento precisa transmitir cuidado, credibilidade e orientacao clara",
    instructions: [
      "Use tom respeitoso, claro e acolhedor.",
      "Reforce cuidado, acompanhamento e confianca no atendimento.",
      "Se fizer sentido, convide para agendamento ou continuidade da conversa.",
    ],
  },
  "pet shop": {
    label: "Pet shop",
    nicheContext:
      "o cliente espera atencao carinhosa, praticidade e confianca com o bem-estar do pet",
    instructions: [
      "Mostre cuidado com o pet e proximidade no atendimento.",
      "Valorize praticidade, seguranca e atencao aos detalhes.",
      "Se fizer sentido, convide para agendar servico, visita ou tirar duvidas.",
    ],
  },
  outro: {
    label: "Outro",
    nicheContext:
      "o negocio precisa responder com clareza comercial, adaptando a mensagem ao contexto informado",
    instructions: [
      "Adapte a resposta ao contexto do cliente de forma simples e profissional.",
      "Priorize clareza, utilidade e proximo passo comercial.",
      "Evite generalidades e mantenha a resposta conectada ao objetivo informado.",
    ],
  },
};

const toneInstructions: Record<string, string[]> = {
  profissional: [
    "Use linguagem clara, segura e organizada.",
    "Evite excesso de informalidade.",
  ],
  amigavel: [
    "Use linguagem calorosa, humana e acessivel.",
    "Mantenha proximidade sem perder clareza.",
  ],
  direto: [
    "Seja breve, objetivo e facil de entender.",
    "Va ao ponto sem rodeios desnecessarios.",
  ],
  premium: [
    "Use linguagem elegante, confiante e mais refinada.",
    "Transmita valor e qualidade sem parecer distante.",
  ],
};

const toneLabels: Record<string, string> = {
  profissional: "Profissional",
  amigavel: "Amigavel",
  direto: "Direto",
  premium: "Premium",
};

function getBusinessRule(businessType: string) {
  return businessPromptRules[businessType] ?? businessPromptRules.outro;
}

function getToneRules(tone: string) {
  return toneInstructions[tone] ?? toneInstructions.profissional;
}

function getToneLabel(tone: string) {
  return toneLabels[tone] ?? toneLabels.profissional;
}

function createBulletList(items: string[]) {
  return items.map((item) => `- ${item}`);
}

export function buildSalesPrompt(data: SalesFormData) {
  const businessRule = getBusinessRule(data.businessType);
  const toneRules = getToneRules(data.tone);
  const toneLabel = getToneLabel(data.tone);

  const promptSections = [
    "Voce vai escrever uma resposta comercial personalizada para um cliente.",
    "",
    "Contexto principal:",
    `- Tipo de negocio: ${businessRule.label}`,
    `- Nome da empresa: ${data.companyName}`,
    `- Tom de voz: ${toneLabel}`,
    `- Objetivo da resposta: ${data.objective}`,
    "",
    "Contexto do nicho:",
    `- Considere que ${businessRule.nicheContext}.`,
    ...createBulletList(businessRule.instructions),
    "",
    "Orientacoes de tom:",
    ...createBulletList(toneRules),
    "",
    "Mensagem original do cliente:",
    data.customerMessage,
    "",
    "Instrucao final:",
    `Crie uma resposta comercial em nome da empresa ${data.companyName}, alinhada ao nicho ${businessRule.label.toLowerCase()} e com tom ${toneLabel.toLowerCase()}.`,
    `A resposta deve buscar este objetivo: ${data.objective}.`,
    "- A resposta deve ser clara, personalizada e pronta para uso.",
    "- Evite respostas genericas e mantenha conexao direta com a mensagem do cliente.",
    "- Se fizer sentido, termine com um proximo passo comercial simples.",
  ];

  return promptSections.join("\n");
}
