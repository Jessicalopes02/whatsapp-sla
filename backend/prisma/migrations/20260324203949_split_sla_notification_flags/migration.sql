-- AlterTable
ALTER TABLE "SlaTicket" ADD COLUMN     "delayNotificationSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "warningNotificationSent" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_slaTicketId_fkey" FOREIGN KEY ("slaTicketId") REFERENCES "SlaTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
