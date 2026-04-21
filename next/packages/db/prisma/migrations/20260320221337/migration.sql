/*
  Warnings:

  - A unique constraint covering the columns `[collections_display_configuration_id]` on the table `stk_user` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "stk_user" ADD COLUMN     "collections_display_configuration_id" CHAR(36);

-- CreateIndex
CREATE UNIQUE INDEX "stk_user_collections_display_configuration_id_key" ON "stk_user"("collections_display_configuration_id");

-- AddForeignKey
ALTER TABLE "stk_user" ADD CONSTRAINT "stk_user_collections_display_configuration_id_fkey" FOREIGN KEY ("collections_display_configuration_id") REFERENCES "stk_display_configuration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
