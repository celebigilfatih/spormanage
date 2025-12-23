-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "branchId" TEXT;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
