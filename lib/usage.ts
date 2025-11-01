import type { LanguageModelUsage } from "ai";
import type { UsageData } from "tokenlens/helpers";

export const TOMAN_PER_USD = 110_000;
export const PLATFORM_FEE_RATE = 0.05;

export const convertUsdToToman = (usd: number): number => {
  if (!Number.isFinite(usd) || Number.isNaN(usd)) {
    return 0;
  }

  const withFee = usd * (1 + PLATFORM_FEE_RATE);
  return Math.max(0, Math.round(withFee * TOMAN_PER_USD));
};

const toNumber = (value: unknown): number => {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
};

export const convertUsdValueToToman = (value: unknown): number =>
  convertUsdToToman(toNumber(value));

export const formatToman = (amountToman: number): string => {
  const formatter = new Intl.NumberFormat("fa-IR");
  return `${formatter.format(Math.round(amountToman))} تومان`;
};

// Server-merged usage: base usage + TokenLens summary + optional billing metadata
export type AppUsage = LanguageModelUsage &
  UsageData & {
    modelId?: string;
    costToman?: number;
  };

export const getUsageCostToman = (usage?: AppUsage): number => {
  if (!usage?.costUSD?.totalUSD) {
    return 0;
  }

  return convertUsdValueToToman(usage.costUSD.totalUSD);
};

export const getUsageCostBreakdownToman = (
  usage?: AppUsage
): {
  cache?: number;
  input?: number;
  output?: number;
  reasoning?: number;
} => {
  if (!usage?.costUSD) {
    return {};
  }

  return {
    cache: usage.costUSD.cacheReadUSD
      ? convertUsdValueToToman(usage.costUSD.cacheReadUSD)
      : undefined,
    input: usage.costUSD.inputUSD
      ? convertUsdValueToToman(usage.costUSD.inputUSD)
      : undefined,
    output: usage.costUSD.outputUSD
      ? convertUsdValueToToman(usage.costUSD.outputUSD)
      : undefined,
    reasoning: usage.costUSD.reasoningUSD
      ? convertUsdValueToToman(usage.costUSD.reasoningUSD)
      : undefined,
  };
};
