"use client";

import { useState } from "react";
import { ChevronUp, PlusIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { User } from "next-auth";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import useSWR from "swr";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { guestRegex } from "@/lib/constants";
import { fetcher } from "@/lib/utils";
import { formatToman } from "@/lib/usage";
import { LoaderIcon } from "./icons";
import { toast } from "./toast";

export function SidebarUserNav({ user }: { user: User }) {
  const router = useRouter();
  const { data, status } = useSession();
  const { setTheme, resolvedTheme } = useTheme();

  const isGuest = guestRegex.test(data?.user?.email ?? "");
  const [isToppingUp, setIsToppingUp] = useState(false);
  const { data: balanceData, isLoading: isBalanceLoading, mutate } = useSWR<
    { balanceToman: number }
  >(isGuest ? null : "/api/billing/balance", fetcher);

  const formattedBalance = isBalanceLoading
    ? "در حال بارگذاری..."
    : formatToman(balanceData?.balanceToman ?? 0);

  const topUpAmounts = [500_000, 1_000_000, 2_000_000];

  const handleTopUp = async (amountToman: number) => {
    try {
      setIsToppingUp(true);
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amountToman }),
      });

      if (!response.ok) {
        const { code, cause, message } = await response.json();
        throw new Error(cause ?? message ?? code ?? "Gateway error");
      }

      const json: { redirectUrl: string } = await response.json();

      toast({
        type: "default",
        description: "در حال انتقال به درگاه پرداخت...",
      });

      window.location.href = json.redirectUrl;
    } catch (error: any) {
      toast({
        type: "error",
        description:
          error?.message ?? "شارژ حساب با خطا مواجه شد. لطفاً دوباره تلاش کنید.",
      });
      setIsToppingUp(false);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {status === "loading" ? (
              <SidebarMenuButton className="h-10 justify-between bg-background data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                <div className="flex flex-row gap-2">
                  <div className="size-6 animate-pulse rounded-full bg-zinc-500/30" />
                  <span className="animate-pulse rounded-md bg-zinc-500/30 text-transparent">
                    Loading auth status
                  </span>
                </div>
                <div className="animate-spin text-zinc-500">
                  <LoaderIcon />
                </div>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                className="h-10 bg-background data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                data-testid="user-nav-button"
              >
                <Image
                  alt={user.email ?? "User Avatar"}
                  className="rounded-full"
                  height={24}
                  src={`https://avatar.vercel.sh/${user.email}`}
                  width={24}
                />
                <span className="truncate" data-testid="user-email">
                  {isGuest ? "Guest" : user?.email}
                </span>
                <ChevronUp className="ml-auto" />
              </SidebarMenuButton>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-popper-anchor-width)"
            data-testid="user-nav-menu"
            side="top"
          >
            {!isGuest && (
              <div className="space-y-3 px-3 py-2">
                <div>
                  <span className="text-xs text-muted-foreground">
                    اعتبار فعلی
                  </span>
                  <p className="mt-1 font-medium" data-testid="user-balance">
                    {formattedBalance}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {topUpAmounts.map((amount) => (
                    <button
                      className="flex items-center gap-1 rounded-lg border border-border/60 px-2.5 py-1 text-xs transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
                      disabled={isToppingUp}
                      key={amount}
                      onClick={() => handleTopUp(amount)}
                      type="button"
                    >
                      <PlusIcon className="size-3" />
                      {formatToman(amount)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {!isGuest && <DropdownMenuSeparator />}
            <DropdownMenuItem
              className="cursor-pointer"
              data-testid="user-nav-item-theme"
              onSelect={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              {`Toggle ${resolvedTheme === "light" ? "dark" : "light"} mode`}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild data-testid="user-nav-item-auth">
              <button
                className="w-full cursor-pointer"
                onClick={() => {
                  if (status === "loading") {
                    toast({
                      type: "error",
                      description:
                        "Checking authentication status, please try again!",
                    });

                    return;
                  }

                  if (isGuest) {
                    router.push("/login");
                  } else {
                    signOut({
                      redirectTo: "/",
                    });
                  }
                }}
                type="button"
              >
                {isGuest ? "Login to your account" : "Sign out"}
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
