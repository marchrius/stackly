/*
  Warnings:

  - Two new non-null columns will be added. Existing rows will use default values.
*/

-- AlterTable
ALTER TABLE "stk_datum"
ADD COLUMN     "display_mode" VARCHAR(10) NOT NULL DEFAULT 'list';

-- AlterTable
ALTER TABLE "stk_field"
ADD COLUMN     "display_mode" VARCHAR(10) NOT NULL DEFAULT 'list';
