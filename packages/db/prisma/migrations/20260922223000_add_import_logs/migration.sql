CREATE TABLE "stk_import_log" (
    "id" CHAR(36) NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "status" VARCHAR(12) NOT NULL,
    "collection_id" CHAR(36),
    "collection_label" TEXT,
    "scraper_id" CHAR(36),
    "scraper_label" TEXT,
    "total" INTEGER NOT NULL DEFAULT 0,
    "created" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "owner_id" CHAR(36),

    CONSTRAINT "stk_import_log_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stk_import_log_entry" (
    "id" CHAR(36) NOT NULL,
    "status" VARCHAR(12) NOT NULL,
    "source_url" TEXT NOT NULL,
    "item_id" CHAR(36),
    "item_label" TEXT,
    "message" TEXT,
    "logged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "import_log_id" CHAR(36) NOT NULL,

    CONSTRAINT "stk_import_log_entry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_import_log_owner" ON "stk_import_log"("owner_id");
CREATE INDEX "idx_import_log_started_at" ON "stk_import_log"("started_at");
CREATE INDEX "idx_import_log_entry_import" ON "stk_import_log_entry"("import_log_id");

ALTER TABLE "stk_import_log"
ADD CONSTRAINT "stk_import_log_owner_id_fkey"
FOREIGN KEY ("owner_id") REFERENCES "stk_user"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "stk_import_log_entry"
ADD CONSTRAINT "stk_import_log_entry_import_log_id_fkey"
FOREIGN KEY ("import_log_id") REFERENCES "stk_import_log"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
