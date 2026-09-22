ALTER TABLE "stk_scraper"
ADD COLUMN "item_urls_path" TEXT,
ADD COLUMN "item_scraper_id" CHAR(36);

CREATE INDEX "idx_scraper_item_scraper" ON "stk_scraper"("item_scraper_id");

ALTER TABLE "stk_scraper"
ADD CONSTRAINT "stk_scraper_item_scraper_id_fkey"
FOREIGN KEY ("item_scraper_id") REFERENCES "stk_scraper"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
