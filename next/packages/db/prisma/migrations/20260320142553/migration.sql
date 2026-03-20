-- CreateTable
CREATE TABLE "koi_configuration" (
    "id" CHAR(36) NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "koi_configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "koi_search" (
    "id" CHAR(36) NOT NULL,
    "name" TEXT,
    "number_of_results" BIGINT,
    "owner_id" CHAR(36),
    "display_configuration_id" CHAR(36),

    CONSTRAINT "koi_search_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "koi_search_block" (
    "id" CHAR(36) NOT NULL,
    "condition" TEXT,
    "search_id" CHAR(36),

    CONSTRAINT "koi_search_block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "koi_search_filter" (
    "id" CHAR(36) NOT NULL,
    "condition" TEXT,
    "type" TEXT NOT NULL,
    "datum_label" TEXT,
    "datum_type" TEXT,
    "operator" TEXT NOT NULL,
    "value" TEXT,
    "block_id" CHAR(36),

    CONSTRAINT "koi_search_filter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "koi_configuration_label_key" ON "koi_configuration"("label");

-- CreateIndex
CREATE UNIQUE INDEX "koi_search_display_configuration_id_key" ON "koi_search"("display_configuration_id");

-- CreateIndex
CREATE INDEX "idx_search_owner" ON "koi_search"("owner_id");

-- CreateIndex
CREATE INDEX "idx_search_block_search" ON "koi_search_block"("search_id");

-- CreateIndex
CREATE INDEX "idx_search_filter_block" ON "koi_search_filter"("block_id");

-- AddForeignKey
ALTER TABLE "koi_search" ADD CONSTRAINT "koi_search_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "koi_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_search" ADD CONSTRAINT "koi_search_display_configuration_id_fkey" FOREIGN KEY ("display_configuration_id") REFERENCES "koi_display_configuration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_search_block" ADD CONSTRAINT "koi_search_block_search_id_fkey" FOREIGN KEY ("search_id") REFERENCES "koi_search"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_search_filter" ADD CONSTRAINT "koi_search_filter_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "koi_search_block"("id") ON DELETE SET NULL ON UPDATE CASCADE;
