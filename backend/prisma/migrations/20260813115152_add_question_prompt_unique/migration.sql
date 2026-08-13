/*
  Warnings:

  - A unique constraint covering the columns `[prompt]` on the table `Question` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Question_prompt_key" ON "Question"("prompt");
