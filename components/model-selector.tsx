"use client";

import type { Session } from "next-auth";
import {
  startTransition,
  useEffect,
  useMemo,
  useOptimistic,
  useState,
} from "react";
import { saveChatModelAsCookie } from "@/app/(chat)/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import {
  type ChatModelFeature,
  filterChatModels,
  groupChatModelsByProvider,
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
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!open) {
      setSearchTerm("");
    }
  }, [open]);

  const userType = session.user.type;
  const { availableChatModelIds } = entitlementsByUserType[userType];

  const availableChatModels = visibleChatModels.filter((chatModel) =>
    availableChatModelIds.includes(chatModel.id)
  );

  const filteredChatModels = useMemo(
    () => filterChatModels(availableChatModels, searchTerm),
    [availableChatModels, searchTerm]
  );

  const groupedChatModels = useMemo(
    () => groupChatModelsByProvider(filteredChatModels),
    [filteredChatModels]
  );

  const hasResults = groupedChatModels.some(
    (group) => group.models.length > 0
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
        <div className="border-b border-border/60 p-3">
          <label className="sr-only" htmlFor="model-selector-search">
            جستجوی مدل
          </label>
          <input
            autoComplete="off"
            className="flex w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm outline-hidden focus:border-primary focus:outline-none"
            dir="rtl"
            id="model-selector-search"
            onChange={(event) => setSearchTerm(event.target.value)}
            onKeyDown={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            placeholder="جستجو در میان مدل‌ها..."
            type="search"
            value={searchTerm}
          />
        </div>

        <div className="flex h-full flex-col overflow-y-auto py-2">
          {groupedChatModels.map((group, groupIndex) => (
            <div key={group.providerSlug} className="flex flex-col">
              <DropdownMenuLabel className="px-4 pb-2 text-xs font-semibold text-muted-foreground">
                {group.providerName}
              </DropdownMenuLabel>

              <div className="flex flex-col gap-1">
                {group.models.map((chatModel) => {
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
                          {chatModel.features &&
                            chatModel.features.length > 0 && (
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

              {groupIndex !== groupedChatModels.length - 1 && (
                <DropdownMenuSeparator className="my-3" />
              )}
            </div>
          ))}

          {!hasResults && (
            <div className="px-6 py-10 text-center text-xs text-muted-foreground">
              هیچ مدلی با این عبارت پیدا نشد.
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
