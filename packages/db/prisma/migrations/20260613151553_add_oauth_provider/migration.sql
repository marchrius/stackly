-- AlterTable
ALTER TABLE "stk_user" ADD COLUMN     "primary_auth_method" VARCHAR(20) NOT NULL DEFAULT 'credentials';

-- CreateTable
CREATE TABLE "stk_oauth_provider" (
    "id" CHAR(36) NOT NULL,
    "user_id" CHAR(36) NOT NULL,
    "issuer" VARCHAR(255) NOT NULL,
    "provider_name" VARCHAR(50) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "display_name" VARCHAR(255),
    "picture" TEXT,
    "access_token_expiry" TIMESTAMP(3),
    "refresh_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "stk_oauth_provider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_oauth_provider_user" ON "stk_oauth_provider"("user_id");

-- CreateIndex
CREATE INDEX "idx_oauth_provider_issuer_subject" ON "stk_oauth_provider"("issuer", "subject");

-- CreateIndex
CREATE UNIQUE INDEX "stk_oauth_provider_issuer_subject_key" ON "stk_oauth_provider"("issuer", "subject");

-- CreateIndex
CREATE UNIQUE INDEX "stk_oauth_provider_user_id_provider_name_key" ON "stk_oauth_provider"("user_id", "provider_name");

-- AddForeignKey
ALTER TABLE "stk_oauth_provider" ADD CONSTRAINT "stk_oauth_provider_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "stk_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
