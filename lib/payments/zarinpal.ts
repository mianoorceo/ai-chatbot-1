import { createHmac } from "node:crypto";

const ZARINPAL_MERCHANT_ID = process.env.ZARINPAL_MERCHANT_ID;
const ZARINPAL_API_BASE_URL =
  process.env.ZARINPAL_API_BASE_URL ??
  "https://sandbox.zarinpal.com/pg/v4/payment";
const ZARINPAL_PAYMENT_BASE_URL =
  process.env.ZARINPAL_PAYMENT_BASE_URL ??
  "https://sandbox.zarinpal.com/pg/StartPay";

const PAYMENT_REQUEST_ENDPOINT = `${ZARINPAL_API_BASE_URL}/request.json`;
const PAYMENT_VERIFICATION_ENDPOINT = `${ZARINPAL_API_BASE_URL}/verify.json`;

const CALLBACK_SECRET = process.env.ZARINPAL_CALLBACK_SECRET;
const CALLBACK_BASE_URL =
  process.env.ZARINPAL_CALLBACK_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://localhost:3000";

if (!ZARINPAL_MERCHANT_ID) {
  // eslint-disable-next-line no-console
  console.warn(
    "ZARINPAL_MERCHANT_ID is not defined. Payment initiation will fail until it is set."
  );
}

if (!CALLBACK_SECRET) {
  // eslint-disable-next-line no-console
  console.warn(
    "ZARINPAL_CALLBACK_SECRET is not defined. Set it to a random string to secure the payment callback."
  );
}

export type PaymentStatePayload = {
  userId: string;
  amountToman: number;
  timestamp: number;
};

const STATE_DELIMITER = ":";
const MAX_STATE_AGE_MS = 30 * 60 * 1000; // 30 minutes

const encodeStatePayload = (payload: PaymentStatePayload) =>
  Buffer.from(
    `${payload.userId}${STATE_DELIMITER}${payload.amountToman}${STATE_DELIMITER}${payload.timestamp}`,
    "utf8"
  ).toString("base64url");

const decodeStatePayload = (state: string): PaymentStatePayload => {
  const decoded = Buffer.from(state, "base64url").toString("utf8");
  const [userId, amountStr, timestampStr] = decoded.split(STATE_DELIMITER);

  const amountToman = Number.parseInt(amountStr, 10);
  const timestamp = Number.parseInt(timestampStr, 10);

  if (!userId || Number.isNaN(amountToman) || Number.isNaN(timestamp)) {
    throw new Error("Invalid payment state payload");
  }

  return { userId, amountToman, timestamp };
};

const signStatePayload = (payload: string) => {
  if (!CALLBACK_SECRET) {
    throw new Error("ZARINPAL_CALLBACK_SECRET is not configured");
  }

  return createHmac("sha256", CALLBACK_SECRET).update(payload).digest("hex");
};

export const createPaymentState = (payload: PaymentStatePayload) => {
  const encoded = encodeStatePayload(payload);
  const signature = signStatePayload(encoded);

  return {
    state: encoded,
    signature,
  };
};

export const verifyPaymentState = (state: string, signature: string) => {
  const expectedSignature = signStatePayload(state);

  if (expectedSignature !== signature) {
    throw new Error("Invalid payment signature");
  }

  const payload = decodeStatePayload(state);
  const age = Date.now() - payload.timestamp;

  if (age < 0 || age > MAX_STATE_AGE_MS) {
    throw new Error("Payment request expired");
  }

  return payload;
};

type RequestPaymentArgs = {
  amountToman: number;
  description: string;
  callbackUrl: string;
};

export type RequestPaymentResult = {
  authority: string;
  redirectUrl: string;
};

export const requestPayment = async ({
  amountToman,
  description,
  callbackUrl,
}: RequestPaymentArgs): Promise<RequestPaymentResult> => {
  if (!ZARINPAL_MERCHANT_ID) {
    throw new Error("ZarinPal merchant id is not configured");
  }

  const amountRial = Math.round(amountToman * 10);

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.info("[ZarinPal] PaymentRequest", {
      endpoint: PAYMENT_REQUEST_ENDPOINT,
      amountRial,
      description,
      callbackUrl,
    });
  }

  const response = await fetch(PAYMENT_REQUEST_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      merchant_id: ZARINPAL_MERCHANT_ID,
      amount: amountRial,
      callback_url: callbackUrl,
      description,
    }),
  });

  let data: any;
  let rawBody: string | undefined;

  try {
    data = await response.json();
  } catch {
    rawBody = await response.text();
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn("[ZarinPal] non-JSON PaymentRequest response", rawBody);
    }
  }

  const result = data?.data;
  const errors = data?.errors;

  if (
    !response.ok ||
    !result ||
    typeof result.code !== "number" ||
    result.code !== 100 ||
    (Array.isArray(errors) && errors.length > 0)
  ) {
    const errorMessage =
      errors?.[0]?.message ??
      result?.message ??
      rawBody ??
      "Payment request failed";

    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[ZarinPal] PaymentRequest failed", {
        status: response.status,
        gatewayCode: result?.code,
        message: errorMessage,
        errors,
        rawBody,
      });
    }

    throw new Error(String(errorMessage));
  }

  const authority = result.authority as string;
  const directFlag = process.env.ZARINPAL_DIRECT === "true" ? "?direct=true" : "";
  const redirectUrl = `${ZARINPAL_PAYMENT_BASE_URL}/${authority}${directFlag}`;

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.info("[ZarinPal] PaymentRequest successful", {
      authority,
      redirectUrl,
    });
  }

  return {
    authority,
    redirectUrl,
  };
};

type VerifyPaymentArgs = {
  authority: string;
  amountToman: number;
};

export type VerifyPaymentResult = {
  status: number;
  refId: number;
  cardPan?: string;
  cardHash?: string;
  amountRial: number;
};

export const verifyPayment = async ({
  authority,
  amountToman,
}: VerifyPaymentArgs): Promise<VerifyPaymentResult> => {
  if (!ZARINPAL_MERCHANT_ID) {
    throw new Error("ZarinPal merchant id is not configured");
  }

  const amountRial = Math.round(amountToman * 10);

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.info("[ZarinPal] PaymentVerification", {
      endpoint: PAYMENT_VERIFICATION_ENDPOINT,
      authority,
      amountRial,
    });
  }

  const response = await fetch(PAYMENT_VERIFICATION_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      merchant_id: ZARINPAL_MERCHANT_ID,
      authority,
      amount: amountRial,
    }),
  });

  let data: any;
  let rawBody: string | undefined;

  try {
    data = await response.json();
  } catch {
    rawBody = await response.text();
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn("[ZarinPal] non-JSON PaymentVerification response", rawBody);
    }
  }

  const result = data?.data;
  const errors = data?.errors;

  if (!response.ok || !result || Array.isArray(errors) && errors.length > 0) {
    const message =
      errors?.[0]?.message ??
      result?.message ??
      rawBody ??
      "Payment verification failed";

    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[ZarinPal] PaymentVerification failed", {
        status: response.status,
        gatewayCode: result?.code,
        message,
        errors,
        rawBody,
      });
    }

    throw new Error(String(message));
  }

  if (result.code !== 100 && result.code !== 101) {
    const message =
      result?.message ??
      rawBody ??
      "Payment was not successful";

    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[ZarinPal] PaymentVerification status not successful", {
        status: response.status,
        gatewayCode: result?.code,
        message,
        result,
      });
    }

    throw new Error(String(message));
  }

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.info("[ZarinPal] PaymentVerification successful", result);
  }

  return {
    status: result.code,
    refId: result.ref_id,
    cardPan: result.card_mask,
    cardHash: result.card_hash,
    amountRial: result.amount,
  };
};

export const buildCallbackUrl = () => {
  const url = new URL(
    "/api/billing/checkout/callback",
    CALLBACK_BASE_URL
  );

  return url;
};

