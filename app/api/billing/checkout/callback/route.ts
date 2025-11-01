import { NextRequest, NextResponse } from "next/server";
import { adjustUserBalance, getUserBalanceById } from "@/lib/db/queries";
import {
  verifyPayment,
  verifyPaymentState,
} from "@/lib/payments/zarinpal";
import { formatToman } from "@/lib/usage";

const RESULT_REDIRECT_BASE =
  process.env.ZARINPAL_RESULT_REDIRECT ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://localhost:3000";

const htmlResponse = (title: string, body: string) =>
  `<!DOCTYPE html><html lang="fa"><head><meta charset="utf-8" /><title>${title}</title><style>body{font-family:sans-serif;max-width:480px;margin:48px auto;padding:0 16px;color:#111;background:#fafafa;direction:rtl;text-align:right;} .card{background:#fff;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.08);padding:24px;} h1{font-size:1.25rem;margin-bottom:16px;} p{margin:8px 0;} a.button{display:inline-block;margin-top:16px;padding:10px 18px;border-radius:8px;background:#111;color:#fff;text-decoration:none;} </style></head><body><div class="card"><h1>${title}</h1>${body}<a class="button" href="${RESULT_REDIRECT_BASE}">بازگشت به برنامه</a></div></body></html>`;

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const status = url.searchParams.get("Status");
  const authority = url.searchParams.get("Authority");
  const stateParam = url.searchParams.get("state");
  const signature = url.searchParams.get("sig");

  if (!authority || !stateParam || !signature) {
    return new NextResponse(
      htmlResponse("تراکنش نامعتبر", "<p>اطلاعات بازگشت از درگاه ناقص است.</p>"),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  if (status !== "OK") {
    return new NextResponse(
      htmlResponse(
        "تراکنش ناموفق",
        "<p>پرداخت توسط کاربر لغو شد یا تایید نشد.</p>"
      ),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  try {
    const { userId, amountToman } = verifyPaymentState(stateParam, signature);

    const verification = await verifyPayment({ authority, amountToman });

    const paidToman = Math.round(verification.amountRial / 10);
    const creditedAmount = paidToman > 0 ? paidToman : amountToman;

    await adjustUserBalance({
      userId,
      amountToman: creditedAmount,
      type: "topup",
      description: "شارژ حساب از طریق زرین پال",
      reference: authority,
      metadata: {
        gateway: "zarinpal",
        authority,
        refId: verification.refId,
        cardPan: verification.cardPan,
        cardHash: verification.cardHash,
        status: verification.status,
        reportedAmountRial: verification.amountRial,
      },
    });

    const balance = await getUserBalanceById(userId);

    return new NextResponse(
      htmlResponse(
        "پرداخت موفق",
        `<p>مبلغ ${formatToman(creditedAmount)} با موفقیت به کیف پول شما افزوده شد.</p><p>کد پیگیری: <strong>${verification.refId}</strong></p><p>موجودی فعلی: <strong>${formatToman(balance)}</strong></p>`
      ),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "بروز خطا در تایید پرداخت";

    return new NextResponse(
      htmlResponse(
        "تایید پرداخت ناموفق",
        `<p>${message}</p><p>در صورت کسر مبلغ از حساب، لطفاً پشتیبانی را مطلع کنید.</p>`
      ),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

