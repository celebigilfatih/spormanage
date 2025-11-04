-- AlterTable
ALTER TABLE "users" ADD COLUMN     "trainerId" TEXT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "trainers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
