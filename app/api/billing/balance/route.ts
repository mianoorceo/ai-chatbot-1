import { auth } from "@/app/(auth)/auth";
import {
  adjustUserBalance,
  getUserBalanceById,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:auth").toResponse();
  }

  const balanceToman = await getUserBalanceById(session.user.id);

  return Response.json({ balanceToman });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:auth").toResponse();
  }

  let body: { amountToman?: number };

  try {
    body = await request.json();
  } catch (_error) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  const amount = Number(body.amountToman);

  if (!Number.isFinite(amount) || amount <= 0) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  const roundedAmount = Math.round(amount);

  const balanceToman = await adjustUserBalance({
    userId: session.user.id,
    amountToman: roundedAmount,
    type: "topup",
    description: "Manual balance top-up",
  });

  return Response.json({ balanceToman });
}

