-- CreateTable
CREATE TABLE "PendingGroup" (
    "id" TEXT NOT NULL,
    "groupExternalId" TEXT NOT NULL,
    "groupName" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PendingGroup_groupExternalId_key" ON "PendingGroup"("groupExternalId");
