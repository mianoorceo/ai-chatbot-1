import { gateway, type GatewayModelId } from "@ai-sdk/gateway";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import type { LanguageModel } from "ai";
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

  const languageModels = new Map<string, LanguageModel>();

  for (const model of chatModels) {
    languageModels.set(
      model.id,
      isReasoningChatModel(model.id) ? reasoningModel : chatModel
    );
  }

  languageModels.set("title-model", titleModel);
  languageModels.set("artifact-model", artifactModel);

  return Object.fromEntries(languageModels) as Record<string, LanguageModel>;
};

const createProductionLanguageModels = () => {
  const languageModels = new Map<string, LanguageModel>();

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
      languageModels.set(model.id, baseModel as LanguageModel);
    }
  }

  const utilityModel = gateway.languageModel(UTILITY_MODEL_ID);

  languageModels.set("title-model", utilityModel as LanguageModel);
  languageModels.set("artifact-model", utilityModel as LanguageModel);

  return Object.fromEntries(languageModels) as Record<string, LanguageModel>;
};

export const myProvider = customProvider({
  languageModels: isTestEnvironment
    ? createTestLanguageModels()
    : createProductionLanguageModels(),
});
