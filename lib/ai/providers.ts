import { gateway, type GatewayModelId } from "@ai-sdk/gateway";
import type { LanguageModelV2 } from "@ai-sdk/provider";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import {
  chatModels,
  getGatewayModelIdByChatModelId,
  isReasoningChatModel,
} from "./models";
import { isTestEnvironment } from "../constants";

const UTILITY_MODEL_ID: GatewayModelId = "openai/gpt-4o-mini";

const createTestLanguageModels = () => {
  const {
    artifactModel,
    chatModel,
    reasoningModel,
    titleModel,
  } = require("./models.mock");

  const languageModels = new Map<string, LanguageModelV2>();

  for (const model of chatModels) {
    languageModels.set(
      model.id,
      isReasoningChatModel(model.id) ? reasoningModel : chatModel
    );
  }

  languageModels.set("title-model", titleModel);
  languageModels.set("artifact-model", artifactModel);

  return Object.fromEntries(languageModels) as Record<string, LanguageModelV2>;
};

const createProductionLanguageModels = () => {
  const languageModels = new Map<string, LanguageModelV2>();

  for (const model of chatModels) {
    const gatewayModelId = getGatewayModelIdByChatModelId(model.id);

    if (!gatewayModelId) {
      throw new Error(`Unsupported chat model id: ${model.id}`);
    }

    const baseModel = gateway.languageModel(gatewayModelId);

    if (gatewayModelId === "xai/grok-3-mini") {
      languageModels.set(
        model.id,
        wrapLanguageModel({
          model: baseModel,
          middleware: extractReasoningMiddleware({ tagName: "think" }),
        })
      );
    } else {
      languageModels.set(model.id, baseModel);
    }
  }

  const utilityModel = gateway.languageModel(UTILITY_MODEL_ID);

  languageModels.set("title-model", utilityModel);
  languageModels.set("artifact-model", utilityModel);

  return Object.fromEntries(languageModels) as Record<string, LanguageModelV2>;
};

export const myProvider = customProvider({
  languageModels: isTestEnvironment
    ? createTestLanguageModels()
    : createProductionLanguageModels(),
});
