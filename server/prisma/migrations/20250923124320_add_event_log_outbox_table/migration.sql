-- CreateEnum
CREATE TYPE "public"."OutboxStatus" AS ENUM ('Pending', 'Processing', 'Published', 'Failed');

-- CreateTable
CREATE TABLE "public"."event_log_outbox" (
    "id" VARCHAR(36) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "params" JSONB NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "status" "public"."OutboxStatus" NOT NULL DEFAULT 'Pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_attempt_at" TIMESTAMP(3),
    "next_attempt_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_log_outbox_pkey" PRIMARY KEY ("id")
);
