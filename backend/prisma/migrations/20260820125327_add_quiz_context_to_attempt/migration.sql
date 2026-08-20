-- AlterTable
ALTER TABLE "QuizAttempt" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "difficulty" TEXT,
ADD COLUMN     "sessionId" TEXT,
ADD COLUMN     "topic" TEXT;
