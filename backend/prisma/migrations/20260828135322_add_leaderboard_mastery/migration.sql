-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "leaderboardOptOut" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserQuestionMastery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "bestCorrect" BOOLEAN NOT NULL DEFAULT false,
    "firstCorrectAt" TIMESTAMP(3),
    "lastAttemptAt" TIMESTAMP(3) NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "UserQuestionMastery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserQuestionMastery_userId_bestCorrect_idx" ON "UserQuestionMastery"("userId", "bestCorrect");

-- CreateIndex
CREATE INDEX "UserQuestionMastery_questionId_bestCorrect_idx" ON "UserQuestionMastery"("questionId", "bestCorrect");

-- CreateIndex
CREATE UNIQUE INDEX "UserQuestionMastery_userId_questionId_key" ON "UserQuestionMastery"("userId", "questionId");

-- CreateIndex
CREATE INDEX "Question_difficulty_idx" ON "Question"("difficulty");

-- AddForeignKey
ALTER TABLE "UserQuestionMastery" ADD CONSTRAINT "UserQuestionMastery_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
