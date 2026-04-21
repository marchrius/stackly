-- CreateTable
CREATE TABLE "stk_configuration" (
    "id" CHAR(36) NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "stk_configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stk_search" (
    "id" CHAR(36) NOT NULL,
    "name" TEXT,
    "number_of_results" BIGINT,
    "owner_id" CHAR(36),
    "display_configuration_id" CHAR(36),

    CONSTRAINT "stk_search_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stk_search_block" (
    "id" CHAR(36) NOT NULL,
    "condition" TEXT,
    "search_id" CHAR(36),

    CONSTRAINT "stk_search_block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stk_search_filter" (
    "id" CHAR(36) NOT NULL,
    "condition" TEXT,
    "type" TEXT NOT NULL,
    "datum_label" TEXT,
    "datum_type" TEXT,
    "operator" TEXT NOT NULL,
    "value" TEXT,
    "block_id" CHAR(36),

    CONSTRAINT "stk_search_filter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stk_configuration_label_key" ON "stk_configuration"("label");

-- CreateIndex
CREATE UNIQUE INDEX "stk_search_display_configuration_id_key" ON "stk_search"("display_configuration_id");

-- CreateIndex
CREATE INDEX "idx_search_owner" ON "stk_search"("owner_id");

-- CreateIndex
CREATE INDEX "idx_search_block_search" ON "stk_search_block"("search_id");

-- CreateIndex
CREATE INDEX "idx_search_filter_block" ON "stk_search_filter"("block_id");

-- AddForeignKey
ALTER TABLE "stk_search" ADD CONSTRAINT "stk_search_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "stk_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_search" ADD CONSTRAINT "stk_search_display_configuration_id_fkey" FOREIGN KEY ("display_configuration_id") REFERENCES "stk_display_configuration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_search_block" ADD CONSTRAINT "stk_search_block_search_id_fkey" FOREIGN KEY ("search_id") REFERENCES "stk_search"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_search_filter" ADD CONSTRAINT "stk_search_filter_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "stk_search_block"("id") ON DELETE SET NULL ON UPDATE CASCADE;
