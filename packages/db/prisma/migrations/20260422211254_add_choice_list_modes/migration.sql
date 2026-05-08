/*
  Warnings:

  - Two new non-null columns will be added to `stk_choice_list`. Existing rows will use default values.
*/

-- AlterTable
ALTER TABLE "stk_choice_list"
ADD COLUMN     "display_mode" VARCHAR(10) NOT NULL DEFAULT 'pill',
ADD COLUMN     "selection_mode" VARCHAR(10) NOT NULL DEFAULT 'multiple';
