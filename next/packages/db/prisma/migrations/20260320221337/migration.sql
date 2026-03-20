/*
  Warnings:

  - A unique constraint covering the columns `[collections_display_configuration_id]` on the table `koi_user` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "koi_user" ADD COLUMN     "collections_display_configuration_id" CHAR(36);

-- CreateIndex
CREATE UNIQUE INDEX "koi_user_collections_display_configuration_id_key" ON "koi_user"("collections_display_configuration_id");

-- AddForeignKey
ALTER TABLE "koi_user" ADD CONSTRAINT "koi_user_collections_display_configuration_id_fkey" FOREIGN KEY ("collections_display_configuration_id") REFERENCES "koi_display_configuration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
