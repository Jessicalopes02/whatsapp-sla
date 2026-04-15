-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_responsibleUserId_fkey";

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "lastMessageAt" TIMESTAMP(3),
ADD COLUMN     "lastMessageBody" TEXT,
ADD COLUMN     "lastSenderName" TEXT,
ALTER COLUMN "responsibleUserId" DROP NOT NULL,
ALTER COLUMN "slaMinutes" SET DEFAULT 60;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
