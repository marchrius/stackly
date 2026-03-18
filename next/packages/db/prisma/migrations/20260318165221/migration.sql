-- CreateTable
CREATE TABLE "koi_user" (
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

    CONSTRAINT "koi_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "koi_collection" (
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

    CONSTRAINT "koi_collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "koi_item" (
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

    CONSTRAINT "koi_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "koi_datum" (
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

    CONSTRAINT "koi_datum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "koi_album" (
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

    CONSTRAINT "koi_album_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "koi_photo" (
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

    CONSTRAINT "koi_photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "koi_wishlist" (
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

    CONSTRAINT "koi_wishlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "koi_wish" (
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

    CONSTRAINT "koi_wish_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "koi_tag" (
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

    CONSTRAINT "koi_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "koi_tag_category" (
    "id" CHAR(36) NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "color" VARCHAR(7),
    "owner_id" CHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "koi_tag_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "koi_template" (
    "id" CHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "owner_id" CHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "koi_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "koi_field" (
    "id" CHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "type" VARCHAR(15) NOT NULL,
    "visibility" VARCHAR(10) NOT NULL DEFAULT 'public',
    "template_id" CHAR(36),
    "choice_list_id" CHAR(36),
    "owner_id" CHAR(36),

    CONSTRAINT "koi_field_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "koi_choice_list" (
    "id" CHAR(36) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "choices" JSONB NOT NULL DEFAULT '[]',
    "owner_id" CHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "koi_choice_list_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "koi_inventory" (
    "id" CHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "content" JSONB NOT NULL DEFAULT '[]',
    "owner_id" CHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "koi_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "koi_loan" (
    "id" CHAR(36) NOT NULL,
    "lent_to" TEXT NOT NULL,
    "lent_at" TIMESTAMP(3) NOT NULL,
    "returned_at" TIMESTAMP(3),
    "item_id" CHAR(36),
    "owner_id" CHAR(36),

    CONSTRAINT "koi_loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "koi_log" (
    "id" CHAR(36) NOT NULL,
    "type" VARCHAR(6),
    "logged_at" TIMESTAMP(3),
    "object_id" VARCHAR(36) NOT NULL,
    "object_label" TEXT NOT NULL,
    "object_class" TEXT NOT NULL,
    "object_deleted" BOOLEAN NOT NULL DEFAULT false,
    "owner_id" CHAR(36),

    CONSTRAINT "koi_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "koi_scraper" (
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

    CONSTRAINT "koi_scraper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "koi_path" (
    "id" CHAR(36) NOT NULL,
    "name" TEXT NOT NULL,
    "type" VARCHAR(15) NOT NULL,
    "path" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "scraper_id" CHAR(36),
    "owner_id" CHAR(36),

    CONSTRAINT "koi_path_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "koi_display_configuration" (
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

    CONSTRAINT "koi_display_configuration_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "koi_user_username_key" ON "koi_user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "koi_user_email_key" ON "koi_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "koi_user_avatar_key" ON "koi_user"("avatar");

-- CreateIndex
CREATE UNIQUE INDEX "koi_collection_image_key" ON "koi_collection"("image");

-- CreateIndex
CREATE UNIQUE INDEX "koi_collection_children_display_config_id_key" ON "koi_collection"("children_display_config_id");

-- CreateIndex
CREATE UNIQUE INDEX "koi_collection_items_display_config_id_key" ON "koi_collection"("items_display_config_id");

-- CreateIndex
CREATE INDEX "idx_collection_final_visibility" ON "koi_collection"("final_visibility");

-- CreateIndex
CREATE INDEX "idx_collection_owner" ON "koi_collection"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "koi_item_image_key" ON "koi_item"("image");

-- CreateIndex
CREATE UNIQUE INDEX "koi_item_image_small_thumbnail_key" ON "koi_item"("image_small_thumbnail");

-- CreateIndex
CREATE UNIQUE INDEX "koi_item_image_large_thumbnail_key" ON "koi_item"("image_large_thumbnail");

-- CreateIndex
CREATE INDEX "idx_item_final_visibility" ON "koi_item"("final_visibility");

-- CreateIndex
CREATE INDEX "idx_item_collection" ON "koi_item"("collection_id");

-- CreateIndex
CREATE INDEX "idx_item_owner" ON "koi_item"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "koi_datum_image_key" ON "koi_datum"("image");

-- CreateIndex
CREATE UNIQUE INDEX "koi_datum_image_small_thumbnail_key" ON "koi_datum"("image_small_thumbnail");

-- CreateIndex
CREATE UNIQUE INDEX "koi_datum_file_key" ON "koi_datum"("file");

-- CreateIndex
CREATE UNIQUE INDEX "koi_datum_video_key" ON "koi_datum"("video");

-- CreateIndex
CREATE INDEX "idx_datum_label" ON "koi_datum"("label");

-- CreateIndex
CREATE INDEX "idx_datum_final_visibility" ON "koi_datum"("final_visibility");

-- CreateIndex
CREATE INDEX "idx_datum_item" ON "koi_datum"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "koi_album_image_key" ON "koi_album"("image");

-- CreateIndex
CREATE INDEX "idx_album_final_visibility" ON "koi_album"("final_visibility");

-- CreateIndex
CREATE INDEX "idx_album_owner" ON "koi_album"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "koi_photo_image_key" ON "koi_photo"("image");

-- CreateIndex
CREATE UNIQUE INDEX "koi_photo_image_small_thumbnail_key" ON "koi_photo"("image_small_thumbnail");

-- CreateIndex
CREATE INDEX "idx_photo_final_visibility" ON "koi_photo"("final_visibility");

-- CreateIndex
CREATE INDEX "idx_photo_album" ON "koi_photo"("album_id");

-- CreateIndex
CREATE UNIQUE INDEX "koi_wishlist_image_key" ON "koi_wishlist"("image");

-- CreateIndex
CREATE INDEX "idx_wishlist_final_visibility" ON "koi_wishlist"("final_visibility");

-- CreateIndex
CREATE INDEX "idx_wishlist_owner" ON "koi_wishlist"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "koi_wish_image_key" ON "koi_wish"("image");

-- CreateIndex
CREATE UNIQUE INDEX "koi_wish_image_small_thumbnail_key" ON "koi_wish"("image_small_thumbnail");

-- CreateIndex
CREATE INDEX "idx_wish_final_visibility" ON "koi_wish"("final_visibility");

-- CreateIndex
CREATE INDEX "idx_wish_wishlist" ON "koi_wish"("wishlist_id");

-- CreateIndex
CREATE UNIQUE INDEX "koi_tag_image_key" ON "koi_tag"("image");

-- CreateIndex
CREATE UNIQUE INDEX "koi_tag_image_small_thumbnail_key" ON "koi_tag"("image_small_thumbnail");

-- CreateIndex
CREATE INDEX "idx_tag_visibility" ON "koi_tag"("visibility");

-- CreateIndex
CREATE INDEX "idx_tag_owner" ON "koi_tag"("owner_id");

-- CreateIndex
CREATE INDEX "idx_tag_category_owner" ON "koi_tag_category"("owner_id");

-- CreateIndex
CREATE INDEX "idx_template_owner" ON "koi_template"("owner_id");

-- CreateIndex
CREATE INDEX "idx_field_template" ON "koi_field"("template_id");

-- CreateIndex
CREATE INDEX "idx_choice_list_owner" ON "koi_choice_list"("owner_id");

-- CreateIndex
CREATE INDEX "idx_inventory_owner" ON "koi_inventory"("owner_id");

-- CreateIndex
CREATE INDEX "idx_loan_owner" ON "koi_loan"("owner_id");

-- CreateIndex
CREATE INDEX "idx_log_owner" ON "koi_log"("owner_id");

-- CreateIndex
CREATE INDEX "idx_log_logged_at" ON "koi_log"("logged_at");

-- CreateIndex
CREATE INDEX "idx_scraper_owner" ON "koi_scraper"("owner_id");

-- CreateIndex
CREATE INDEX "idx_path_scraper" ON "koi_path"("scraper_id");

-- CreateIndex
CREATE INDEX "_ItemTags_B_index" ON "_ItemTags"("B");

-- CreateIndex
CREATE INDEX "_RelatedItems_B_index" ON "_RelatedItems"("B");

-- AddForeignKey
ALTER TABLE "koi_collection" ADD CONSTRAINT "koi_collection_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "koi_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_collection" ADD CONSTRAINT "koi_collection_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "koi_collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_collection" ADD CONSTRAINT "koi_collection_items_default_template_id_fkey" FOREIGN KEY ("items_default_template_id") REFERENCES "koi_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_collection" ADD CONSTRAINT "koi_collection_children_display_config_id_fkey" FOREIGN KEY ("children_display_config_id") REFERENCES "koi_display_configuration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_collection" ADD CONSTRAINT "koi_collection_items_display_config_id_fkey" FOREIGN KEY ("items_display_config_id") REFERENCES "koi_display_configuration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_item" ADD CONSTRAINT "koi_item_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "koi_collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_item" ADD CONSTRAINT "koi_item_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "koi_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_datum" ADD CONSTRAINT "koi_datum_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "koi_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_datum" ADD CONSTRAINT "koi_datum_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "koi_collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_datum" ADD CONSTRAINT "koi_datum_choice_list_id_fkey" FOREIGN KEY ("choice_list_id") REFERENCES "koi_choice_list"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_album" ADD CONSTRAINT "koi_album_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "koi_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_album" ADD CONSTRAINT "koi_album_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "koi_album"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_photo" ADD CONSTRAINT "koi_photo_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "koi_album"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_photo" ADD CONSTRAINT "koi_photo_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "koi_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_wishlist" ADD CONSTRAINT "koi_wishlist_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "koi_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_wishlist" ADD CONSTRAINT "koi_wishlist_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "koi_wishlist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_wish" ADD CONSTRAINT "koi_wish_wishlist_id_fkey" FOREIGN KEY ("wishlist_id") REFERENCES "koi_wishlist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_wish" ADD CONSTRAINT "koi_wish_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "koi_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_tag" ADD CONSTRAINT "koi_tag_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "koi_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_tag" ADD CONSTRAINT "koi_tag_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "koi_tag_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_tag_category" ADD CONSTRAINT "koi_tag_category_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "koi_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_template" ADD CONSTRAINT "koi_template_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "koi_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_field" ADD CONSTRAINT "koi_field_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "koi_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_field" ADD CONSTRAINT "koi_field_choice_list_id_fkey" FOREIGN KEY ("choice_list_id") REFERENCES "koi_choice_list"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_field" ADD CONSTRAINT "koi_field_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "koi_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_choice_list" ADD CONSTRAINT "koi_choice_list_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "koi_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_inventory" ADD CONSTRAINT "koi_inventory_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "koi_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_loan" ADD CONSTRAINT "koi_loan_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "koi_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_loan" ADD CONSTRAINT "koi_loan_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "koi_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_log" ADD CONSTRAINT "koi_log_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "koi_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_scraper" ADD CONSTRAINT "koi_scraper_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "koi_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_path" ADD CONSTRAINT "koi_path_scraper_id_fkey" FOREIGN KEY ("scraper_id") REFERENCES "koi_scraper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_path" ADD CONSTRAINT "koi_path_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "koi_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koi_display_configuration" ADD CONSTRAINT "koi_display_configuration_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "koi_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ItemTags" ADD CONSTRAINT "_ItemTags_A_fkey" FOREIGN KEY ("A") REFERENCES "koi_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ItemTags" ADD CONSTRAINT "_ItemTags_B_fkey" FOREIGN KEY ("B") REFERENCES "koi_tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RelatedItems" ADD CONSTRAINT "_RelatedItems_A_fkey" FOREIGN KEY ("A") REFERENCES "koi_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RelatedItems" ADD CONSTRAINT "_RelatedItems_B_fkey" FOREIGN KEY ("B") REFERENCES "koi_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
