import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { ChatSDKError } from "@/lib/errors";
import {
  buildCallbackUrl,
  createPaymentState,
  requestPayment,
} from "@/lib/payments/zarinpal";
import { formatToman } from "@/lib/usage";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:auth").toResponse();
  }

  let payload: { amountToman?: number; description?: string };

  try {
    payload = await request.json();
  } catch {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  const rawAmount = Number(payload.amountToman);
  const amountToman = Math.round(rawAmount);

  if (!Number.isFinite(amountToman) || amountToman <= 0) {
    return new ChatSDKError("bad_request:api", "Invalid amount").toResponse();
  }

  const minAmount = Number(
    process.env.ZARINPAL_MIN_TOPUP_TOMAN ?? 1000
  );

  if (amountToman < minAmount) {
    return new ChatSDKError(
      "bad_request:api",
      `حداقل مبلغ قابل شارژ ${formatToman(minAmount)} است.`
    ).toResponse();
  }

  try {
    const callbackUrl = buildCallbackUrl();
    const { state, signature } = createPaymentState({
      userId: session.user.id,
      amountToman,
      timestamp: Date.now(),
    });

    callbackUrl.searchParams.set("state", state);
    callbackUrl.searchParams.set("sig", signature);

    const description = (payload.description ?? `شارژ حساب ${formatToman(amountToman)}`).slice(0, 255);

    const { authority, redirectUrl } = await requestPayment({
      amountToman,
      description,
      callbackUrl: callbackUrl.toString(),
    });

    return NextResponse.json(
      {
        authority,
        redirectUrl,
        amountToman,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Payment gateway error";
    return new ChatSDKError("bad_request:api", message).toResponse();
  }
}

