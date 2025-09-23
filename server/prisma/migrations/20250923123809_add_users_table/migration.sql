-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(100) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_user_id_key" ON "public"."users"("user_id");
