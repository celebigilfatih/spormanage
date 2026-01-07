/*
  Warnings:

  - You are about to drop the column `createdById` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the column `locationId` on the `groups` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[sessionId,studentId]` on the table `attendances` will be added. If there are existing duplicate values, this will fail.
  - Made the column `totalSessions` on table `attendance_analytics` required. This step will fail if there are existing NULL values in that column.
  - Made the column `presentCount` on table `attendance_analytics` required. This step will fail if there are existing NULL values in that column.
  - Made the column `absentCount` on table `attendance_analytics` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lateCount` on table `attendance_analytics` required. This step will fail if there are existing NULL values in that column.
  - Made the column `excusedCount` on table `attendance_analytics` required. This step will fail if there are existing NULL values in that column.
  - Made the column `attendancePercentage` on table `attendance_analytics` required. This step will fail if there are existing NULL values in that column.
  - Made the column `consecutiveAbsences` on table `attendance_analytics` required. This step will fail if there are existing NULL values in that column.
  - Made the column `hasWarning` on table `attendance_analytics` required. This step will fail if there are existing NULL values in that column.
  - Made the column `isActive` on table `fields` required. This step will fail if there are existing NULL values in that column.
  - Made the column `isActive` on table `locations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `training_sessions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `attendanceTaken` on table `training_sessions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `generatedAutomatically` on table `training_sessions` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."attendances" DROP CONSTRAINT "attendances_createdById_fkey";

-- DropForeignKey
ALTER TABLE "public"."attendances" DROP CONSTRAINT "attendances_studentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."groups" DROP CONSTRAINT "Group_locationId_fkey";

-- DropIndex
DROP INDEX "public"."attendances_studentId_sessionId_key";

-- AlterTable
ALTER TABLE "attendance_analytics" ALTER COLUMN "totalSessions" SET NOT NULL,
ALTER COLUMN "presentCount" SET NOT NULL,
ALTER COLUMN "absentCount" SET NOT NULL,
ALTER COLUMN "lateCount" SET NOT NULL,
ALTER COLUMN "excusedCount" SET NOT NULL,
ALTER COLUMN "attendancePercentage" SET NOT NULL,
ALTER COLUMN "consecutiveAbsences" SET NOT NULL,
ALTER COLUMN "hasWarning" SET NOT NULL;

-- AlterTable
ALTER TABLE "attendances" DROP COLUMN "createdById",
ADD COLUMN     "markedAt" TIMESTAMP(3),
ADD COLUMN     "markedBy" TEXT;

-- AlterTable
ALTER TABLE "fields" ALTER COLUMN "isActive" SET NOT NULL;

-- AlterTable
ALTER TABLE "groups" DROP COLUMN "locationId";

-- AlterTable
ALTER TABLE "locations" ALTER COLUMN "isActive" SET NOT NULL;

-- AlterTable
ALTER TABLE "training_sessions" ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "attendanceTaken" SET NOT NULL,
ALTER COLUMN "generatedAutomatically" SET NOT NULL;

-- CreateIndex
CREATE INDEX "attendances_sessionId_idx" ON "attendances"("sessionId");

-- CreateIndex
CREATE INDEX "attendances_studentId_idx" ON "attendances"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_sessionId_studentId_key" ON "attendances"("sessionId", "studentId");

-- RenameForeignKey
ALTER TABLE "groups" RENAME CONSTRAINT "Group_fieldId_fkey" TO "groups_fieldId_fkey";

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "training_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_markedBy_fkey" FOREIGN KEY ("markedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
