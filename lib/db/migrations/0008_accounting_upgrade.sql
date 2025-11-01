ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "balanceToman" bigint NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "UserTransaction" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "amountToman" bigint NOT NULL,
  "type" varchar(32) NOT NULL,
  "reference" varchar(128),
  "description" text,
  "metadata" jsonb,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "UserTransaction_userId_idx"
ON "UserTransaction"("userId");

CREATE UNIQUE INDEX IF NOT EXISTS "UserTransaction_reference_unique_idx"
ON "UserTransaction"("reference")
WHERE "reference" IS NOT NULL;