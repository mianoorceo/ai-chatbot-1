import type { GatewayModelId } from "@ai-sdk/gateway";

export const DEFAULT_CHAT_MODEL = "xai-grok-2-vision";

export type ChatModelFeature = "reasoning" | "multimodal";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
  providerSlug: string;
  providerName: string;
  gatewayModelId: GatewayModelId;
  features?: ChatModelFeature[];
  hidden?: boolean;
  searchText: string;
};

const providerDisplayNames: Record<string, string> = {
  alibaba: "Alibaba",
  amazon: "Amazon",
  anthropic: "Anthropic",
  cohere: "Cohere",
  deepseek: "DeepSeek",
  google: "Google",
  inception: "Inception",
  meta: "Meta",
  mistral: "Mistral",
  moonshotai: "Moonshot AI",
  morph: "Morph",
  openai: "OpenAI",
  perplexity: "Perplexity",
  vercel: "Vercel",
  xai: "xAI",
  zai: "Zhipu AI",
};

const featureSearchKeywords: Record<ChatModelFeature, string[]> = {
  reasoning: ["reasoning", "reason", "استدلال"],
  multimodal: ["multimodal", "multi modal", "چندرسانه ای", "چندرسانه‌ای"],
};

const uppercaseSegments = new Set([
  "ai",
  "gpt",
  "md",
  "o1",
  "o3",
  "o4",
  "r1",
  "v0",
]);

const sanitizeChatModelId = (modelId: GatewayModelId) =>
  modelId.replace(/[^a-z0-9]+/gi, "-");

const normalizeSearchValue = (value: string) =>
  value
    .toLocaleLowerCase("fa-IR")
    .replace(/\s+/g, " ")
    .trim();

const buildChatModelSearchText = (options: {
  id: string;
  name: string;
  description: string;
  providerName: string;
  providerSlug: string;
  features?: ChatModelFeature[];
}) => {
  const { id, name, description, providerName, providerSlug, features } = options;
  const featureKeywords = (features ?? []).flatMap(
    (feature) => featureSearchKeywords[feature] ?? []
  );

  return normalizeSearchValue(
    [
      id,
      name,
      description,
      providerName,
      providerSlug,
      ...featureKeywords,
    ]
      .filter(Boolean)
      .join(" ")
  );
};

const formatSegment = (segment: string) => {
  const normalized = segment.toLowerCase();

  if (uppercaseSegments.has(normalized)) {
    return segment.toUpperCase();
  }

  if (/^\d/.test(segment)) {
    return segment;
  }

  if (/^llama/.test(normalized)) {
    return segment.replace(/^l/, "L");
  }

  return segment.charAt(0).toUpperCase() + segment.slice(1);
};

const formatModelName = (modelId: GatewayModelId) => {
  const [providerSlug, modelSlug] = modelId.split("/");
  const providerName = providerDisplayNames[providerSlug] ??
    formatSegment(providerSlug);

  const segments = modelSlug
    .split(/[-_]/)
    .flatMap((segment) => segment.split(/\s+/))
    .filter(Boolean)
    .map((segment) => segment.replace(/\./g, "."));

  const formattedModel = segments
    .map((segment) => formatSegment(segment))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return `${providerName} ${formattedModel}`.trim();
};

const formatModelDescription = (modelId: GatewayModelId) => {
  const name = formatModelName(modelId);
  return `${name} via Vercel AI Gateway (${modelId}).`;
};

export const VERCEL_CHAT_MODEL_IDS = [
  "alibaba/qwen-3-14b",
  "alibaba/qwen-3-235b",
  "alibaba/qwen-3-30b",
  "alibaba/qwen-3-32b",
  "alibaba/qwen3-coder",
  "amazon/nova-lite",
  "amazon/nova-micro",
  "amazon/nova-pro",
  "anthropic/claude-3-haiku",
  "anthropic/claude-3-opus",
  "anthropic/claude-3.5-haiku",
  "anthropic/claude-3.5-sonnet",
  "anthropic/claude-3.7-sonnet",
  "anthropic/claude-opus-4",
  "anthropic/claude-opus-4.1",
  "anthropic/claude-sonnet-4",
  "cohere/command-a",
  "cohere/command-r",
  "cohere/command-r-plus",
  "deepseek/deepseek-r1",
  "deepseek/deepseek-r1-distill-llama-70b",
  "deepseek/deepseek-v3",
  "deepseek/deepseek-v3.1",
  "deepseek/deepseek-v3.1-base",
  "deepseek/deepseek-v3.1-thinking",
  "google/gemini-2.0-flash",
  "google/gemini-2.0-flash-lite",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-image-preview",
  "google/gemini-2.5-flash-lite",
  "google/gemini-2.5-pro",
  "google/gemma-2-9b",
  "inception/mercury-coder-small",
  "meta/llama-3-70b",
  "meta/llama-3-8b",
  "meta/llama-3.1-70b",
  "meta/llama-3.1-8b",
  "meta/llama-3.2-11b",
  "meta/llama-3.2-1b",
  "meta/llama-3.2-3b",
  "meta/llama-3.2-90b",
  "meta/llama-3.3-70b",
  "meta/llama-4-maverick",
  "meta/llama-4-scout",
  "mistral/codestral",
  "mistral/devstral-small",
  "mistral/magistral-medium",
  "mistral/magistral-small",
  "mistral/ministral-3b",
  "mistral/ministral-8b",
  "mistral/mistral-large",
  "mistral/mistral-medium",
  "mistral/mistral-saba-24b",
  "mistral/mistral-small",
  "mistral/mixtral-8x22b-instruct",
  "mistral/pixtral-12b",
  "mistral/pixtral-large",
  "moonshotai/kimi-k2",
  "morph/morph-v3-fast",
  "morph/morph-v3-large",
  "openai/gpt-3.5-turbo",
  "openai/gpt-3.5-turbo-instruct",
  "openai/gpt-4-turbo",
  "openai/gpt-4.1",
  "openai/gpt-4.1-mini",
  "openai/gpt-4.1-nano",
  "openai/gpt-4o",
  "openai/gpt-4o-mini",
  "openai/gpt-5",
  "openai/gpt-5-mini",
  "openai/gpt-5-nano",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "openai/o1",
  "openai/o3",
  "openai/o3-mini",
  "openai/o4-mini",
  "perplexity/sonar",
  "perplexity/sonar-pro",
  "perplexity/sonar-reasoning",
  "perplexity/sonar-reasoning-pro",
  "vercel/v0-1.0-md",
  "vercel/v0-1.5-md",
  "xai/grok-2",
  "xai/grok-2-vision",
  "xai/grok-3",
  "xai/grok-3-fast",
  "xai/grok-3-mini",
  "xai/grok-3-mini-fast",
  "xai/grok-4",
  "xai/grok-code-fast-1",
  "zai/glm-4.5",
  "zai/glm-4.5-air",
  "zai/glm-4.5v",
] as const satisfies readonly GatewayModelId[];

const reasoningGatewayModelIds = new Set<GatewayModelId>([
  "deepseek/deepseek-r1",
  "deepseek/deepseek-r1-distill-llama-70b",
  "deepseek/deepseek-v3.1-thinking",
  "openai/o1",
  "openai/o3",
  "openai/o3-mini",
  "openai/o4-mini",
  "perplexity/sonar-reasoning",
  "perplexity/sonar-reasoning-pro",
  "xai/grok-3-mini",
]);

const multimodalGatewayModelIds = new Set<GatewayModelId>([
  "amazon/nova-lite",
  "amazon/nova-micro",
  "amazon/nova-pro",
  "google/gemini-2.0-flash",
  "google/gemini-2.0-flash-lite",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-image-preview",
  "google/gemini-2.5-flash-lite",
  "mistral/pixtral-12b",
  "mistral/pixtral-large",
  "openai/gpt-4o",
  "openai/gpt-4o-mini",
  "xai/grok-2",
  "xai/grok-2-vision",
  "xai/grok-3",
  "xai/grok-3-fast",
  "xai/grok-3-mini",
  "xai/grok-3-mini-fast",
  "xai/grok-4",
  "xai/grok-code-fast-1",
  "zai/glm-4.5v",
]);

const getFeaturesForGatewayModel = (
  gatewayModelId: GatewayModelId
): ChatModelFeature[] => {
  const features: ChatModelFeature[] = [];

  if (reasoningGatewayModelIds.has(gatewayModelId)) {
    features.push("reasoning");
  }

  if (multimodalGatewayModelIds.has(gatewayModelId)) {
    features.push("multimodal");
  }

  return features;
};

const aliasChatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "Grok Vision",
    description:
      "Advanced multimodal model with vision and text capabilities",
    providerSlug: "xai",
    providerName: providerDisplayNames.xai,
    gatewayModelId: "xai/grok-2-vision",
    features: ["multimodal"],
    hidden: true,
    searchText: buildChatModelSearchText({
      id: "chat-model",
      name: "Grok Vision",
      description:
        "Advanced multimodal model with vision and text capabilities",
      providerName: providerDisplayNames.xai,
      providerSlug: "xai",
      features: ["multimodal"],
    }),
  },
  {
    id: "chat-model-reasoning",
    name: "Grok Reasoning",
    description:
      "Uses advanced chain-of-thought reasoning for complex problems",
    providerSlug: "xai",
    providerName: providerDisplayNames.xai,
    gatewayModelId: "xai/grok-3-mini",
    features: ["reasoning", "multimodal"],
    hidden: true,
    searchText: buildChatModelSearchText({
      id: "chat-model-reasoning",
      name: "Grok Reasoning",
      description:
        "Uses advanced chain-of-thought reasoning for complex problems",
      providerName: providerDisplayNames.xai,
      providerSlug: "xai",
      features: ["reasoning", "multimodal"],
    }),
  },
];

const vercelChatModels: ChatModel[] = VERCEL_CHAT_MODEL_IDS.map(
  (gatewayModelId) => {
    const features = getFeaturesForGatewayModel(gatewayModelId);
    const [providerSlug] = gatewayModelId.split("/");
    const providerName = providerDisplayNames[providerSlug] ??
      formatSegment(providerSlug);

    return {
      id: sanitizeChatModelId(gatewayModelId),
      name: formatModelName(gatewayModelId),
      description: formatModelDescription(gatewayModelId),
      providerSlug,
      providerName,
      gatewayModelId,
      features: features.length > 0 ? features : undefined,
      searchText: buildChatModelSearchText({
        id: sanitizeChatModelId(gatewayModelId),
        name: formatModelName(gatewayModelId),
        description: formatModelDescription(gatewayModelId),
        providerName,
        providerSlug,
        features: features.length > 0 ? features : undefined,
      }),
    } satisfies ChatModel;
  }
);

export const chatModels: ChatModel[] = [...aliasChatModels, ...vercelChatModels];

const chatModelById = new Map(chatModels.map((model) => [model.id, model]));

export const chatModelIds = chatModels.map((model) => model.id);

export const chatModelIdSet = new Set(chatModelIds);

const legacyModelIdMap = new Map<string, string>([
  ["chat-model", sanitizeChatModelId("xai/grok-2-vision")],
  ["chat-model-reasoning", sanitizeChatModelId("xai/grok-3-mini")],
]);

export const resolveChatModelId = (modelId: string): string => {
  if (chatModelIdSet.has(modelId)) {
    return modelId;
  }

  const mappedModelId = legacyModelIdMap.get(modelId);
  if (mappedModelId) {
    return mappedModelId;
  }

  if ((VERCEL_CHAT_MODEL_IDS as readonly string[]).includes(modelId)) {
    return sanitizeChatModelId(modelId as GatewayModelId);
  }

  return DEFAULT_CHAT_MODEL;
};

export const getGatewayModelIdByChatModelId = (
  chatModelId: string
): GatewayModelId | undefined => chatModelById.get(chatModelId)?.gatewayModelId;

export const isReasoningChatModel = (chatModelId: string): boolean =>
  chatModelById.get(chatModelId)?.features?.includes("reasoning") ?? false;

export const isSupportedChatModelId = (
  modelId: string
): modelId is ChatModel["id"] => chatModelIdSet.has(modelId);

export const visibleChatModels = chatModels.filter((model) => !model.hidden);

export type ChatModelGroup = {
  providerSlug: string;
  providerName: string;
  models: ChatModel[];
};

export const groupChatModelsByProvider = (
  models: ChatModel[]
): ChatModelGroup[] => {
  const groups = new Map<string, ChatModelGroup>();

  for (const model of models) {
    const existingGroup = groups.get(model.providerSlug);

    if (existingGroup) {
      existingGroup.models.push(model);
      continue;
    }

    groups.set(model.providerSlug, {
      providerSlug: model.providerSlug,
      providerName: model.providerName,
      models: [model],
    });
  }

  return Array.from(groups.values());
};

export const filterChatModels = (
  models: ChatModel[],
  query: string
): ChatModel[] => {
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) {
    return models;
  }

  const terms = normalizedQuery.split(" ").filter(Boolean);

  if (terms.length === 0) {
    return models;
  }

  return models.filter((model) =>
    terms.every((term) => model.searchText.includes(term))
  );
};
