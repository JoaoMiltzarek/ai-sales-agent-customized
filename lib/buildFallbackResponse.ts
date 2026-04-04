import type { SalesFormData } from "./buildSalesPrompt";

type CustomerIntent =
  | "hours"
  | "price"
  | "booking"
  | "availability"
  | "location"
  | "delivery"
  | "evaluation"
  | "mechanical_problem"
  | "bath_grooming"
  | "service"
  | "default";

type IntentDetails = {
  intent: CustomerIntent;
  detail?: string;
};

type ToneRule = {
  greeting: string;
  askPrefix: string;
};

const toneRules: Record<string, ToneRule> = {
  profissional: {
    greeting: "Ola!",
    askPrefix: "Me diga",
  },
  amigavel: {
    greeting: "Oi!",
    askPrefix: "Me fala",
  },
  direto: {
    greeting: "",
    askPrefix: "Me diga",
  },
  premium: {
    greeting: "Ola!",
    askPrefix: "Me diga",
  },
};

function getToneRule(tone: string) {
  return toneRules[tone] ?? toneRules.profissional;
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function withGreeting(text: string, greeting: string) {
  return greeting ? `${greeting} ${text}` : text;
}

function detectMechanicalDetail(message: string) {
  const normalizedMessage = normalizeWhitespace(message).toLowerCase();

  if (/freio/.test(normalizedMessage)) {
    return "freio";
  }

  if (/motor/.test(normalizedMessage)) {
    return "motor";
  }

  if (/bateria/.test(normalizedMessage)) {
    return "bateria";
  }

  if (/barulho|ruido/.test(normalizedMessage)) {
    return "barulho";
  }

  if (/suspensao/.test(normalizedMessage)) {
    return "suspensao";
  }

  return "carro";
}

function detectPetServiceDetail(message: string) {
  const normalizedMessage = normalizeWhitespace(message).toLowerCase();

  if (/banho/.test(normalizedMessage) && /tosa/.test(normalizedMessage)) {
    return "banho e tosa";
  }

  if (/banho/.test(normalizedMessage)) {
    return "banho";
  }

  if (/tosa/.test(normalizedMessage)) {
    return "tosa";
  }

  return "atendimento";
}

function detectCustomerIntent(
  message: string,
  businessType: string,
): IntentDetails {
  const normalizedMessage = normalizeWhitespace(message).toLowerCase();

  if (
    /(que horas|horario|horario de atendimento|abre|abrem|funciona|funcionam)/.test(
      normalizedMessage,
    )
  ) {
    return { intent: "hours" };
  }

  if (
    /(quanto custa|qual o valor|qual o preco|preco|valor|orcamento|cotacao)/.test(
      normalizedMessage,
    )
  ) {
    return { intent: "price" };
  }

  if (
    businessType === "restaurante" &&
    /(delivery|entrega|retirada|pedido|cardapio)/.test(normalizedMessage)
  ) {
    return { intent: "delivery" };
  }

  if (
    businessType === "clinica" &&
    /(avaliacao|consulta|consultar|retorno)/.test(normalizedMessage)
  ) {
    return { intent: "evaluation" };
  }

  if (
    businessType === "oficina" &&
    /(freio|motor|barulho|ruido|pane|revisao|conserto|problema|veiculo|carro|bateria|suspensao|alinhamento)/.test(
      normalizedMessage,
    )
  ) {
    return {
      intent: "mechanical_problem",
      detail: detectMechanicalDetail(message),
    };
  }

  if (
    businessType === "pet shop" &&
    /(banho|tosa|tosa higienica|hidratacao)/.test(normalizedMessage)
  ) {
    return {
      intent: "bath_grooming",
      detail: detectPetServiceDetail(message),
    };
  }

  if (
    /(agendar|agendamento|marcar|reserva|reservar|encaixe)/.test(
      normalizedMessage,
    )
  ) {
    return { intent: "booking" };
  }

  if (
    /(tem vaga|tem horario|tem disponibilidade|disponivel|disponibilidade|atendem hoje|conseguem hoje|tem encaixe)/.test(
      normalizedMessage,
    )
  ) {
    return { intent: "availability" };
  }

  if (/(onde fica|endereco|localizacao|como chegar)/.test(normalizedMessage)) {
    return { intent: "location" };
  }

  if (
    /(fazem|trabalham com|atendem|tem esse servico|faz esse servico)/.test(
      normalizedMessage,
    )
  ) {
    return { intent: "service" };
  }

  return { intent: "default" };
}

function buildRestaurantReply(
  data: SalesFormData,
  details: IntentDetails,
  toneRule: ToneRule,
) {
  switch (details.intent) {
    case "hours":
      return [
        withGreeting(
          `Para te passar o horario certinho da ${data.companyName}, preciso saber se voce quer salao, retirada ou delivery.`,
          toneRule.greeting,
        ),
        "Isso pode variar um pouco.",
        `${toneRule.askPrefix} qual dos tres voce quer que eu ja te digo.`,
      ];
    case "price":
      return [
        withGreeting(
          `Na ${data.companyName}, o valor muda conforme prato, combo ou pedido.`,
          toneRule.greeting,
        ),
        "Se eu souber o que voce quer, te passo o valor mais certo.",
        `${toneRule.askPrefix} o item que eu ja te respondo.`,
      ];
    case "booking":
      return [
        withGreeting(
          `Fazemos reserva sim na ${data.companyName}.`,
          toneRule.greeting,
        ),
        "So preciso de quantas pessoas vao e do horario que voce quer.",
        `${toneRule.askPrefix} isso que eu vejo para voce.`,
      ];
    case "availability":
      return [
        withGreeting(
          `Consigo verificar disponibilidade sim na ${data.companyName}.`,
          toneRule.greeting,
        ),
        "Se voce me disser o horario, eu vejo se ainda tenho mesa ou encaixe.",
        `${toneRule.askPrefix} o horario que eu confirmo.`,
      ];
    case "location":
      return [
        withGreeting(
          `Te mando o endereco da ${data.companyName} por aqui.`,
          toneRule.greeting,
        ),
        "Se quiser, eu envio junto um ponto de referencia.",
        `${toneRule.askPrefix} que eu ja te passo.`,
      ];
    case "delivery":
      return [
        withGreeting(
          `Fazemos delivery sim na ${data.companyName}.`,
          toneRule.greeting,
        ),
        "Consigo confirmar entrega e prazo rapidinho.",
        `${toneRule.askPrefix} seu bairro que eu vejo agora.`,
      ];
    case "service":
      return [
        withGreeting(
          `Fazemos sim na ${data.companyName}.`,
          toneRule.greeting,
        ),
        "Se eu souber o que voce quer pedir, te respondo de forma mais direta.",
        `${toneRule.askPrefix} o pedido que eu sigo com voce.`,
      ];
    default:
      return [
        withGreeting(
          `Na ${data.companyName}, eu consigo te responder isso de forma bem pratica.`,
          toneRule.greeting,
        ),
        "Se eu souber se e visita, reserva ou pedido, eu ja te direciono melhor.",
        `${toneRule.askPrefix} por onde voce quer seguir.`,
      ];
  }
}

function buildClinicReply(
  data: SalesFormData,
  details: IntentDetails,
  toneRule: ToneRule,
) {
  switch (details.intent) {
    case "hours":
      return [
        withGreeting(
          `Para te passar o horario certinho da ${data.companyName}, preciso saber qual atendimento voce quer.`,
          toneRule.greeting,
        ),
        "A agenda pode mudar conforme o profissional ou tipo de consulta.",
        `${toneRule.askPrefix} se e consulta, avaliacao ou retorno.`,
      ];
    case "price":
      return [
        withGreeting(
          `O valor na ${data.companyName} muda conforme o atendimento.`,
          toneRule.greeting,
        ),
        "Se eu souber se e consulta, avaliacao ou retorno, te passo a informacao certa.",
        `${toneRule.askPrefix} isso que eu ja te respondo.`,
      ];
    case "evaluation":
      return [
        withGreeting(
          `Fazemos sim na ${data.companyName}.`,
          toneRule.greeting,
        ),
        "Ja posso te passar os horarios disponiveis para avaliacao.",
        `${toneRule.askPrefix} se prefere manha ou tarde.`,
      ];
    case "booking":
      return [
        withGreeting(
          `Fazemos agendamento sim na ${data.companyName}.`,
          toneRule.greeting,
        ),
        "Posso te passar os horarios disponiveis do dia ou dos proximos dias.",
        `${toneRule.askPrefix} se prefere manha ou tarde.`,
      ];
    case "availability":
      return [
        withGreeting(
          `Consigo verificar disponibilidade sim na ${data.companyName}.`,
          toneRule.greeting,
        ),
        "So preciso saber o periodo que funciona melhor para voce.",
        `${toneRule.askPrefix} se prefere manha ou tarde.`,
      ];
    case "location":
      return [
        withGreeting(
          `Te mando o endereco da ${data.companyName} por aqui.`,
          toneRule.greeting,
        ),
        "Se quiser, eu envio junto um ponto de referencia.",
        `${toneRule.askPrefix} que eu ja te passo.`,
      ];
    case "service":
      return [
        withGreeting(
          `Fazemos sim esse atendimento na ${data.companyName}.`,
          toneRule.greeting,
        ),
        "Se eu souber qual atendimento voce procura, te respondo sem enrolacao.",
        `${toneRule.askPrefix} qual atendimento voce quer.`,
      ];
    default:
      return [
        withGreeting(
          `Na ${data.companyName}, eu consigo te orientar com clareza.`,
          toneRule.greeting,
        ),
        "Se eu souber qual atendimento voce procura, eu te respondo melhor.",
        `${toneRule.askPrefix} o ponto principal da sua duvida.`,
      ];
  }
}

function buildWorkshopReply(
  data: SalesFormData,
  details: IntentDetails,
  toneRule: ToneRule,
) {
  switch (details.intent) {
    case "hours":
      return [
        withGreeting(
          `Para te passar o horario certo da ${data.companyName}, preciso saber se voce quer avaliacao ou servico rapido.`,
          toneRule.greeting,
        ),
        "O encaixe muda conforme o tipo de atendimento.",
        `${toneRule.askPrefix} qual dos dois voce precisa.`,
      ];
    case "price":
      return [
        withGreeting(
          `O valor na ${data.companyName} depende do servico e do que aparecer na avaliacao.`,
          toneRule.greeting,
        ),
        "Se eu souber o modelo do carro e o problema, te passo uma base mais realista.",
        `${toneRule.askPrefix} isso que eu ja te respondo.`,
      ];
    case "booking":
      return [
        withGreeting(
          `Conseguimos encaixe sim na ${data.companyName}.`,
          toneRule.greeting,
        ),
        "Posso ver um horario bom para receber seu carro sem fazer voce perder tempo.",
        `${toneRule.askPrefix} se prefere manha ou tarde.`,
      ];
    case "availability":
      return [
        withGreeting(
          `Consigo verificar disponibilidade sim na ${data.companyName}.`,
          toneRule.greeting,
        ),
        "Se eu souber o periodo que voce quer, vejo o melhor encaixe.",
        `${toneRule.askPrefix} se prefere manha ou tarde.`,
      ];
    case "location":
      return [
        withGreeting(
          `Te mando o endereco da ${data.companyName} agora.`,
          toneRule.greeting,
        ),
        "Se quiser, eu envio junto um ponto de referencia.",
        `${toneRule.askPrefix} que eu ja te passo.`,
      ];
    case "mechanical_problem":
      return [
        withGreeting(
          `Conseguimos avaliar sim na ${data.companyName}.`,
          toneRule.greeting,
        ),
        details.detail === "freio"
          ? "Se e freio, vale ver isso quanto antes para nao rodar com risco."
          : details.detail === "motor"
            ? "Se e motor, o ideal e avaliar logo para evitar que o problema aumente."
            : details.detail === "bateria"
              ? "Se for bateria, da para te orientar rapido sobre teste ou troca."
              : details.detail === "barulho"
                ? "Se o carro esta com barulho, o ideal e olhar logo para achar a causa certa."
                : "O ideal e avaliar logo para te passar um diagnostico seguro.",
        "Posso te passar um horario de encaixe.",
      ];
    case "service":
      return [
        withGreeting(
          `Fazemos sim esse servico na ${data.companyName}.`,
          toneRule.greeting,
        ),
        "Se eu souber o modelo do carro, te explico o caminho mais direto.",
        `${toneRule.askPrefix} o modelo que eu sigo com voce.`,
      ];
    default:
      return [
        withGreeting(
          `Na ${data.companyName}, eu te respondo isso de forma objetiva.`,
          toneRule.greeting,
        ),
        "Se eu souber o modelo do carro e o ponto principal, eu consigo ser mais preciso.",
        `${toneRule.askPrefix} essas duas informacoes.`,
      ];
  }
}

function buildPetShopReply(
  data: SalesFormData,
  details: IntentDetails,
  toneRule: ToneRule,
) {
  switch (details.intent) {
    case "hours":
      return [
        withGreeting(
          `Para te passar o horario certinho da ${data.companyName}, preciso saber se e banho, tosa ou outro atendimento.`,
          toneRule.greeting || "Oi!",
        ),
        "Os horarios mudam conforme o servico.",
        `${toneRule.askPrefix} qual voce quer que eu ja te digo.`,
      ];
    case "price":
      return [
        withGreeting(
          `O valor na ${data.companyName} muda conforme o porte do pet e o servico.`,
          toneRule.greeting || "Oi!",
        ),
        "Com essas duas informacoes eu te passo certinho.",
        `${toneRule.askPrefix} o porte e o servico.`,
      ];
    case "booking":
      return [
        withGreeting(
          `Agendamos sim na ${data.companyName}.`,
          toneRule.greeting || "Oi!",
        ),
        "Se eu souber o porte do pet e o melhor periodo, eu vejo um horario bom.",
        `${toneRule.askPrefix} isso que eu confirmo.`,
      ];
    case "availability":
      return [
        withGreeting(
          `Consigo verificar disponibilidade sim na ${data.companyName}.`,
          toneRule.greeting || "Oi!",
        ),
        "So preciso do porte do pet e do periodo que voce prefere.",
        `${toneRule.askPrefix} isso que eu vejo agora.`,
      ];
    case "location":
      return [
        withGreeting(
          `Te mando o endereco da ${data.companyName} por aqui.`,
          toneRule.greeting || "Oi!",
        ),
        "Se quiser, eu envio junto um ponto de referencia.",
        `${toneRule.askPrefix} que eu ja te passo.`,
      ];
    case "bath_grooming":
      return [
        withGreeting(
          `Fazemos sim ${details.detail ?? "esse atendimento"} na ${data.companyName}.`,
          toneRule.greeting || "Oi!",
        ),
        "O valor e o horario mudam conforme o porte do pet.",
        `${toneRule.askPrefix} o porte que eu te passo certinho.`,
      ];
    case "service":
      return [
        withGreeting(
          `Fazemos sim esse atendimento na ${data.companyName}.`,
          toneRule.greeting || "Oi!",
        ),
        "Se eu souber o servico e o porte do pet, eu te respondo de forma mais direta.",
        `${toneRule.askPrefix} isso que eu sigo com voce.`,
      ];
    default:
      return [
        withGreeting(
          `Na ${data.companyName}, eu te ajudo com isso sim.`,
          toneRule.greeting || "Oi!",
        ),
        "Se eu souber o que voce quer para o seu pet, eu te direciono melhor.",
        `${toneRule.askPrefix} o ponto principal da sua duvida.`,
      ];
  }
}

function buildDefaultReply(
  data: SalesFormData,
  details: IntentDetails,
  toneRule: ToneRule,
) {
  switch (details.intent) {
    case "hours":
      return [
        withGreeting(
          `Para te passar o horario certinho da ${data.companyName}, preciso saber qual atendimento voce quer.`,
          toneRule.greeting,
        ),
        "Isso pode variar conforme o tipo de servico.",
        `${toneRule.askPrefix} qual atendimento voce procura.`,
      ];
    case "price":
      return [
        withGreeting(
          `O valor na ${data.companyName} muda conforme o servico.`,
          toneRule.greeting,
        ),
        "Se eu souber exatamente o que voce quer, eu te passo uma base melhor.",
        `${toneRule.askPrefix} o servico que eu ja te respondo.`,
      ];
    case "booking":
      return [
        withGreeting(
          `Conseguimos agendar sim na ${data.companyName}.`,
          toneRule.greeting,
        ),
        "Posso ver a melhor opcao se eu souber o periodo que voce prefere.",
        `${toneRule.askPrefix} se prefere manha ou tarde.`,
      ];
    case "availability":
      return [
        withGreeting(
          `Consigo verificar disponibilidade sim na ${data.companyName}.`,
          toneRule.greeting,
        ),
        "So preciso saber o periodo que funciona melhor para voce.",
        `${toneRule.askPrefix} se prefere manha ou tarde.`,
      ];
    case "location":
      return [
        withGreeting(
          `Te mando o endereco da ${data.companyName} por aqui.`,
          toneRule.greeting,
        ),
        "Se quiser, eu envio junto um ponto de referencia.",
        `${toneRule.askPrefix} que eu ja te passo.`,
      ];
    case "service":
      return [
        withGreeting(
          `Fazemos sim esse atendimento na ${data.companyName}.`,
          toneRule.greeting,
        ),
        "Se eu souber exatamente o que voce procura, te respondo sem rodeio.",
        `${toneRule.askPrefix} o servico que eu sigo com voce.`,
      ];
    default:
      return [
        withGreeting(
          `Na ${data.companyName}, eu sigo com voce por aqui.`,
          toneRule.greeting,
        ),
        "Se eu tiver um pouco mais de contexto, eu consigo ser mais direto.",
        `${toneRule.askPrefix} o ponto principal da sua duvida.`,
      ];
  }
}

export function buildFallbackResponse(
  data: SalesFormData,
  _prompt?: string,
) {
  const toneRule = getToneRule(data.tone);
  const details = detectCustomerIntent(data.customerMessage, data.businessType);

  const responseParts =
    data.businessType === "restaurante"
      ? buildRestaurantReply(data, details, toneRule)
      : data.businessType === "clinica"
        ? buildClinicReply(data, details, toneRule)
        : data.businessType === "oficina"
          ? buildWorkshopReply(data, details, toneRule)
          : data.businessType === "pet shop"
            ? buildPetShopReply(data, details, toneRule)
            : buildDefaultReply(data, details, toneRule);

  return responseParts.filter(Boolean).join(" ");
}
