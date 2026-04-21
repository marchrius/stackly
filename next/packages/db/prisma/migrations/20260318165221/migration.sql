-- CreateTable
CREATE TABLE "stk_user" (
    "id" CHAR(36) NOT NULL,
    "username" VARCHAR(32) NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "roles" JSONB NOT NULL DEFAULT '["ROLE_USER"]',
    "currency" VARCHAR(3) NOT NULL DEFAULT 'EUR',
    "locale" VARCHAR(5) NOT NULL DEFAULT 'en',
    "timezone" VARCHAR(50),
    "dateFormat" VARCHAR(10) NOT NULL DEFAULT 'Y-m-d',
    "diskSpaceAllowed" BIGINT NOT NULL DEFAULT 536870912,
    "diskSpaceUsed" BIGINT NOT NULL DEFAULT 0,
    "theme" VARCHAR(10) NOT NULL DEFAULT 'auto',
    "displayMode" VARCHAR(4) NOT NULL DEFAULT 'grid',
    "wishlistDisplayMode" VARCHAR(4) NOT NULL DEFAULT 'grid',
    "albumDisplayMode" VARCHAR(4) NOT NULL DEFAULT 'grid',
    "visibility" VARCHAR(10) NOT NULL DEFAULT 'public',
    "avatar" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "stk_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stk_collection" (
    "id" CHAR(36) NOT NULL,
    "title" TEXT NOT NULL,
    "color" VARCHAR(7),
    "image" TEXT,
    "visibility" VARCHAR(10) NOT NULL DEFAULT 'public',
    "parent_visibility" VARCHAR(10) NOT NULL DEFAULT 'public',
    "final_visibility" VARCHAR(10) NOT NULL DEFAULT 'public',
    "seen_counter" INTEGER NOT NULL DEFAULT 0,
    "children_count" INTEGER NOT NULL DEFAULT 0,
    "cached_values" JSONB,
    "owner_id" CHAR(36),
    "parent_id" CHAR(36),
    "items_default_template_id" CHAR(36),
    "children_display_config_id" CHAR(36),
    "items_display_config_id" CHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "stk_collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stk_item" (
    "id" CHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "visibility" VARCHAR(10) NOT NULL DEFAULT 'public',
    "parent_visibility" VARCHAR(10) NOT NULL DEFAULT 'public',
    "final_visibility" VARCHAR(10) NOT NULL DEFAULT 'public',
    "image" TEXT,
    "image_small_thumbnail" TEXT,
    "image_large_thumbnail" TEXT,
    "seen_counter" INTEGER NOT NULL DEFAULT 0,
    "cached_values" JSONB,
    "collection_id" CHAR(36),
    "owner_id" CHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "stk_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stk_datum" (
    "id" CHAR(36) NOT NULL,
    "type" VARCHAR(15) NOT NULL,
    "label" TEXT,
    "value" TEXT,
    "position" INTEGER,
    "currency" VARCHAR(3),
    "image" TEXT,
    "image_small_thumbnail" TEXT,
    "file" TEXT,
    "video" TEXT,
    "original_filename" TEXT,
    "visibility" VARCHAR(10) NOT NULL DEFAULT 'public',
    "parent_visibility" VARCHAR(10) NOT NULL DEFAULT 'public',
    "final_visibility" VARCHAR(10) NOT NULL DEFAULT 'public',
    "item_id" CHAR(36),
    "collection_id" CHAR(36),
    "choice_list_id" CHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "stk_datum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stk_album" (
    "id" CHAR(36) NOT NULL,
    "title" TEXT NOT NULL,
    "color" VARCHAR(7),
    "image" TEXT,
    "visibility" VARCHAR(10) NOT NULL DEFAULT 'public',
    "parent_visibility" VARCHAR(10) NOT NULL DEFAULT 'public',
    "final_visibility" VARCHAR(10) NOT NULL DEFAULT 'public',
    "seen_counter" INTEGER NOT NULL DEFAULT 0,
    "children_count" INTEGER NOT NULL DEFAULT 0,
    "photos_count" INTEGER NOT NULL DEFAULT 0,
    "owner_id" CHAR(36),
    "parent_id" CHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "stk_album_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stk_photo" (
    "id" CHAR(36) NOT NULL,
    "title" TEXT NOT NULL,
    "comment" TEXT,
    "place" TEXT,
    "image" TEXT,
    "image_small_thumbnail" TEXT,
    "taken_at" TIMESTAMP(3),
    "visibility" VARCHAR(10) NOT NULL DEFAULT 'public',
    "parent_visibility" VARCHAR(10) NOT NULL DEFAULT 'public',
    "final_visibility" VARCHAR(10) NOT NULL DEFAULT 'public',
    "seen_counter" INTEGER NOT NULL DEFAULT 0,
    "album_id" CHAR(36),
    "owner_id" CHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "stk_photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stk_wishlist" (
    "id" CHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "color" VARCHAR(7),
    "image" TEXT,
    "visibility" VARCHAR(10) NOT NULL DEFAULT 'public',
    "parent_visibility" VARCHAR(10) NOT NULL DEFAULT 'public',
    "final_visibility" VARCHAR(10) NOT NULL DEFAULT 'public',
    "seen_counter" INTEGER NOT NULL DEFAULT 0,
    "children_count" INTEGER NOT NULL DEFAULT 0,
    "wishes_count" INTEGER NOT NULL DEFAULT 0,
    "owner_id" CHAR(36),
    "parent_id" CHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "stk_wishlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stk_wish" (
    "id" CHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "price" TEXT,
    "currency" VARCHAR(6),
    "image" TEXT,
    "image_small_thumbnail" TEXT,
    "comment" TEXT,
    "visibility" VARCHAR(10) NOT NULL DEFAULT 'public',
    "parent_visibility" VARCHAR(10) NOT NULL DEFAULT 'public',
    "final_visibility" VARCHAR(10) NOT NULL DEFAULT 'public',
    "seen_counter" INTEGER NOT NULL DEFAULT 0,
    "wishlist_id" CHAR(36),
    "owner_id" CHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "stk_wish_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stk_tag" (
    "id" CHAR(36) NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "image_small_thumbnail" TEXT,
    "visibility" VARCHAR(10) NOT NULL DEFAULT 'public',
    "seen_counter" INTEGER NOT NULL DEFAULT 0,
    "owner_id" CHAR(36),
    "category_id" CHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "stk_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stk_tag_category" (
    "id" CHAR(36) NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "color" VARCHAR(7),
    "owner_id" CHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "stk_tag_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stk_template" (
    "id" CHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "owner_id" CHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "stk_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stk_field" (
    "id" CHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "type" VARCHAR(15) NOT NULL,
    "visibility" VARCHAR(10) NOT NULL DEFAULT 'public',
    "template_id" CHAR(36),
    "choice_list_id" CHAR(36),
    "owner_id" CHAR(36),

    CONSTRAINT "stk_field_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stk_choice_list" (
    "id" CHAR(36) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "choices" JSONB NOT NULL DEFAULT '[]',
    "owner_id" CHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "stk_choice_list_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stk_inventory" (
    "id" CHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "content" JSONB NOT NULL DEFAULT '[]',
    "owner_id" CHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "stk_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stk_loan" (
    "id" CHAR(36) NOT NULL,
    "lent_to" TEXT NOT NULL,
    "lent_at" TIMESTAMP(3) NOT NULL,
    "returned_at" TIMESTAMP(3),
    "item_id" CHAR(36),
    "owner_id" CHAR(36),

    CONSTRAINT "stk_loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stk_log" (
    "id" CHAR(36) NOT NULL,
    "type" VARCHAR(6),
    "logged_at" TIMESTAMP(3),
    "object_id" VARCHAR(36) NOT NULL,
    "object_label" TEXT NOT NULL,
    "object_class" TEXT NOT NULL,
    "object_deleted" BOOLEAN NOT NULL DEFAULT false,
    "owner_id" CHAR(36),

    CONSTRAINT "stk_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stk_scraper" (
    "id" CHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "type" VARCHAR(15),
    "url_pattern" TEXT,
    "name_path" TEXT,
    "image_path" TEXT,
    "price_path" TEXT,
    "headers" JSONB DEFAULT '[]',
    "owner_id" CHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "stk_scraper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stk_path" (
    "id" CHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "type" VARCHAR(15) NOT NULL,
    "path" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "scraper_id" CHAR(36),
    "owner_id" CHAR(36),

    CONSTRAINT "stk_path_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stk_display_configuration" (
    "id" CHAR(36) NOT NULL,
    "label" TEXT,
    "display_mode" VARCHAR(4) NOT NULL DEFAULT 'grid',
    "sorting_property" VARCHAR(255),
    "sorting_type" VARCHAR(15),
    "sorting_direction" VARCHAR(255),
    "show_visibility" BOOLEAN NOT NULL DEFAULT true,
    "show_actions" BOOLEAN NOT NULL DEFAULT true,
    "show_number_of_children" BOOLEAN NOT NULL DEFAULT true,
    "show_number_of_items" BOOLEAN NOT NULL DEFAULT true,
    "show_item_quantities" BOOLEAN NOT NULL DEFAULT false,
    "columns" JSONB DEFAULT '[]',
    "owner_id" CHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "stk_display_configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ItemTags" (
    "A" CHAR(36) NOT NULL,
    "B" CHAR(36) NOT NULL,

    CONSTRAINT "_ItemTags_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_RelatedItems" (
    "A" CHAR(36) NOT NULL,
    "B" CHAR(36) NOT NULL,

    CONSTRAINT "_RelatedItems_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "stk_user_username_key" ON "stk_user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "stk_user_email_key" ON "stk_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "stk_user_avatar_key" ON "stk_user"("avatar");

-- CreateIndex
CREATE UNIQUE INDEX "stk_collection_image_key" ON "stk_collection"("image");

-- CreateIndex
CREATE UNIQUE INDEX "stk_collection_children_display_config_id_key" ON "stk_collection"("children_display_config_id");

-- CreateIndex
CREATE UNIQUE INDEX "stk_collection_items_display_config_id_key" ON "stk_collection"("items_display_config_id");

-- CreateIndex
CREATE INDEX "idx_collection_final_visibility" ON "stk_collection"("final_visibility");

-- CreateIndex
CREATE INDEX "idx_collection_owner" ON "stk_collection"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "stk_item_image_key" ON "stk_item"("image");

-- CreateIndex
CREATE UNIQUE INDEX "stk_item_image_small_thumbnail_key" ON "stk_item"("image_small_thumbnail");

-- CreateIndex
CREATE UNIQUE INDEX "stk_item_image_large_thumbnail_key" ON "stk_item"("image_large_thumbnail");

-- CreateIndex
CREATE INDEX "idx_item_final_visibility" ON "stk_item"("final_visibility");

-- CreateIndex
CREATE INDEX "idx_item_collection" ON "stk_item"("collection_id");

-- CreateIndex
CREATE INDEX "idx_item_owner" ON "stk_item"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "stk_datum_image_key" ON "stk_datum"("image");

-- CreateIndex
CREATE UNIQUE INDEX "stk_datum_image_small_thumbnail_key" ON "stk_datum"("image_small_thumbnail");

-- CreateIndex
CREATE UNIQUE INDEX "stk_datum_file_key" ON "stk_datum"("file");

-- CreateIndex
CREATE UNIQUE INDEX "stk_datum_video_key" ON "stk_datum"("video");

-- CreateIndex
CREATE INDEX "idx_datum_label" ON "stk_datum"("label");

-- CreateIndex
CREATE INDEX "idx_datum_final_visibility" ON "stk_datum"("final_visibility");

-- CreateIndex
CREATE INDEX "idx_datum_item" ON "stk_datum"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "stk_album_image_key" ON "stk_album"("image");

-- CreateIndex
CREATE INDEX "idx_album_final_visibility" ON "stk_album"("final_visibility");

-- CreateIndex
CREATE INDEX "idx_album_owner" ON "stk_album"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "stk_photo_image_key" ON "stk_photo"("image");

-- CreateIndex
CREATE UNIQUE INDEX "stk_photo_image_small_thumbnail_key" ON "stk_photo"("image_small_thumbnail");

-- CreateIndex
CREATE INDEX "idx_photo_final_visibility" ON "stk_photo"("final_visibility");

-- CreateIndex
CREATE INDEX "idx_photo_album" ON "stk_photo"("album_id");

-- CreateIndex
CREATE UNIQUE INDEX "stk_wishlist_image_key" ON "stk_wishlist"("image");

-- CreateIndex
CREATE INDEX "idx_wishlist_final_visibility" ON "stk_wishlist"("final_visibility");

-- CreateIndex
CREATE INDEX "idx_wishlist_owner" ON "stk_wishlist"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "stk_wish_image_key" ON "stk_wish"("image");

-- CreateIndex
CREATE UNIQUE INDEX "stk_wish_image_small_thumbnail_key" ON "stk_wish"("image_small_thumbnail");

-- CreateIndex
CREATE INDEX "idx_wish_final_visibility" ON "stk_wish"("final_visibility");

-- CreateIndex
CREATE INDEX "idx_wish_wishlist" ON "stk_wish"("wishlist_id");

-- CreateIndex
CREATE UNIQUE INDEX "stk_tag_image_key" ON "stk_tag"("image");

-- CreateIndex
CREATE UNIQUE INDEX "stk_tag_image_small_thumbnail_key" ON "stk_tag"("image_small_thumbnail");

-- CreateIndex
CREATE INDEX "idx_tag_visibility" ON "stk_tag"("visibility");

-- CreateIndex
CREATE INDEX "idx_tag_owner" ON "stk_tag"("owner_id");

-- CreateIndex
CREATE INDEX "idx_tag_category_owner" ON "stk_tag_category"("owner_id");

-- CreateIndex
CREATE INDEX "idx_template_owner" ON "stk_template"("owner_id");

-- CreateIndex
CREATE INDEX "idx_field_template" ON "stk_field"("template_id");

-- CreateIndex
CREATE INDEX "idx_choice_list_owner" ON "stk_choice_list"("owner_id");

-- CreateIndex
CREATE INDEX "idx_inventory_owner" ON "stk_inventory"("owner_id");

-- CreateIndex
CREATE INDEX "idx_loan_owner" ON "stk_loan"("owner_id");

-- CreateIndex
CREATE INDEX "idx_log_owner" ON "stk_log"("owner_id");

-- CreateIndex
CREATE INDEX "idx_log_logged_at" ON "stk_log"("logged_at");

-- CreateIndex
CREATE INDEX "idx_scraper_owner" ON "stk_scraper"("owner_id");

-- CreateIndex
CREATE INDEX "idx_path_scraper" ON "stk_path"("scraper_id");

-- CreateIndex
CREATE INDEX "_ItemTags_B_index" ON "_ItemTags"("B");

-- CreateIndex
CREATE INDEX "_RelatedItems_B_index" ON "_RelatedItems"("B");

-- AddForeignKey
ALTER TABLE "stk_collection" ADD CONSTRAINT "stk_collection_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "stk_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_collection" ADD CONSTRAINT "stk_collection_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "stk_collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_collection" ADD CONSTRAINT "stk_collection_items_default_template_id_fkey" FOREIGN KEY ("items_default_template_id") REFERENCES "stk_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_collection" ADD CONSTRAINT "stk_collection_children_display_config_id_fkey" FOREIGN KEY ("children_display_config_id") REFERENCES "stk_display_configuration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_collection" ADD CONSTRAINT "stk_collection_items_display_config_id_fkey" FOREIGN KEY ("items_display_config_id") REFERENCES "stk_display_configuration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_item" ADD CONSTRAINT "stk_item_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "stk_collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_item" ADD CONSTRAINT "stk_item_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "stk_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_datum" ADD CONSTRAINT "stk_datum_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "stk_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_datum" ADD CONSTRAINT "stk_datum_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "stk_collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_datum" ADD CONSTRAINT "stk_datum_choice_list_id_fkey" FOREIGN KEY ("choice_list_id") REFERENCES "stk_choice_list"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_album" ADD CONSTRAINT "stk_album_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "stk_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_album" ADD CONSTRAINT "stk_album_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "stk_album"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_photo" ADD CONSTRAINT "stk_photo_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "stk_album"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_photo" ADD CONSTRAINT "stk_photo_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "stk_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_wishlist" ADD CONSTRAINT "stk_wishlist_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "stk_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_wishlist" ADD CONSTRAINT "stk_wishlist_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "stk_wishlist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_wish" ADD CONSTRAINT "stk_wish_wishlist_id_fkey" FOREIGN KEY ("wishlist_id") REFERENCES "stk_wishlist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_wish" ADD CONSTRAINT "stk_wish_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "stk_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_tag" ADD CONSTRAINT "stk_tag_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "stk_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_tag" ADD CONSTRAINT "stk_tag_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "stk_tag_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_tag_category" ADD CONSTRAINT "stk_tag_category_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "stk_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_template" ADD CONSTRAINT "stk_template_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "stk_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_field" ADD CONSTRAINT "stk_field_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "stk_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_field" ADD CONSTRAINT "stk_field_choice_list_id_fkey" FOREIGN KEY ("choice_list_id") REFERENCES "stk_choice_list"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_field" ADD CONSTRAINT "stk_field_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "stk_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_choice_list" ADD CONSTRAINT "stk_choice_list_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "stk_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_inventory" ADD CONSTRAINT "stk_inventory_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "stk_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_loan" ADD CONSTRAINT "stk_loan_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "stk_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_loan" ADD CONSTRAINT "stk_loan_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "stk_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_log" ADD CONSTRAINT "stk_log_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "stk_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_scraper" ADD CONSTRAINT "stk_scraper_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "stk_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_path" ADD CONSTRAINT "stk_path_scraper_id_fkey" FOREIGN KEY ("scraper_id") REFERENCES "stk_scraper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_path" ADD CONSTRAINT "stk_path_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "stk_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stk_display_configuration" ADD CONSTRAINT "stk_display_configuration_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "stk_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ItemTags" ADD CONSTRAINT "_ItemTags_A_fkey" FOREIGN KEY ("A") REFERENCES "stk_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ItemTags" ADD CONSTRAINT "_ItemTags_B_fkey" FOREIGN KEY ("B") REFERENCES "stk_tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RelatedItems" ADD CONSTRAINT "_RelatedItems_A_fkey" FOREIGN KEY ("A") REFERENCES "stk_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RelatedItems" ADD CONSTRAINT "_RelatedItems_B_fkey" FOREIGN KEY ("B") REFERENCES "stk_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
