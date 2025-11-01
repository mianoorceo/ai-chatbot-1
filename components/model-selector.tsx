"use client";

import type { Session } from "next-auth";
import { startTransition, useMemo, useOptimistic, useState } from "react";
import { saveChatModelAsCookie } from "@/app/(chat)/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import {
  type ChatModelFeature,
  visibleChatModels,
} from "@/lib/ai/models";
import { cn } from "@/lib/utils";
import { CheckCircleFillIcon, ChevronDownIcon } from "./icons";

export function ModelSelector({
  session,
  selectedModelId,
  className,
}: {
  session: Session;
  selectedModelId: string;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [optimisticModelId, setOptimisticModelId] =
    useOptimistic(selectedModelId);

  const userType = session.user.type;
  const { availableChatModelIds } = entitlementsByUserType[userType];

  const availableChatModels = visibleChatModels.filter((chatModel) =>
    availableChatModelIds.includes(chatModel.id)
  );

  const selectedChatModel = useMemo(
    () =>
      availableChatModels.find(
        (chatModel) => chatModel.id === optimisticModelId
      ),
    [optimisticModelId, availableChatModels]
  );

  const featureLabels: Record<ChatModelFeature, string> = {
    reasoning: "استدلال",
    multimodal: "چندرسانه‌ای",
  } as const;

  return (
    <DropdownMenu onOpenChange={setOpen} open={open}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          "w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
          className
        )}
      >
        <Button
          className="md:h-[34px] md:px-2"
          data-testid="model-selector"
          variant="outline"
        >
          {selectedChatModel?.name}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        className="w-[calc(100vw-2rem)] max-h-[72vh] max-w-xl overflow-hidden rounded-2xl border bg-popover p-0 shadow-lg focus:outline-none sm:min-w-[340px]"
      >
        <div className="flex h-full flex-col overflow-y-auto py-2">
          {availableChatModels.map((chatModel) => {
            const { id } = chatModel;

            return (
              <DropdownMenuItem
                asChild
                data-active={id === optimisticModelId}
                data-testid={`model-selector-item-${id}`}
                key={id}
                className="px-2"
                onSelect={() => {
                  setOpen(false);

                  startTransition(() => {
                    setOptimisticModelId(id);
                    saveChatModelAsCookie(id);
                  });
                }}
              >
                <button
                  className="group/item flex w-full flex-row-reverse items-start gap-3 rounded-xl px-4 py-3 text-right transition-colors duration-150 hover:bg-accent/60"
                  type="button"
                >
                  <div className="flex flex-1 flex-col items-end gap-1.5">
                    <div className="text-sm font-semibold sm:text-base">
                      {chatModel.name}
                    </div>
                    <div className="text-muted-foreground text-xs leading-relaxed">
                      {chatModel.description}
                    </div>
                    {chatModel.features && chatModel.features.length > 0 && (
                      <div className="flex flex-row-reverse flex-wrap gap-1.5">
                        {chatModel.features.map((feature) => (
                          <span
                            className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                            key={`${id}-${feature}`}
                          >
                            {featureLabels[feature]}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 self-start text-foreground opacity-0 transition-opacity group-data-[active=true]/item:opacity-100 dark:text-foreground">
                    <CheckCircleFillIcon />
                  </div>
                </button>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
