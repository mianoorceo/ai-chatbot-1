import type { UserType } from "@/app/(auth)/auth";
import { visibleChatModels } from "./models";

type Entitlements = {
  maxMessagesPerDay: number;
  availableChatModelIds: string[];
};

const visibleChatModelIds = visibleChatModels.map((model) => model.id);

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: 20,
    availableChatModelIds: visibleChatModelIds,
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 100,
    availableChatModelIds: visibleChatModelIds,
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};
