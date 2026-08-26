-- AlterTable
ALTER TABLE "QuizAttempt" ADD COLUMN     "questionIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
