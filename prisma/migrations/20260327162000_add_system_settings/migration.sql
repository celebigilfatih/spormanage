-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL DEFAULT 'Futbol Okulu',
    "schoolAddress" TEXT NOT NULL DEFAULT 'İstanbul, Türkiye',
    "schoolPhone" TEXT NOT NULL DEFAULT '+90 212 555 0000',
    "schoolEmail" TEXT NOT NULL DEFAULT 'info@futbolokulu.com',
    "schoolLogo" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "timeZone" TEXT NOT NULL DEFAULT 'Europe/Istanbul',
    "language" TEXT NOT NULL DEFAULT 'tr',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "autoBackup" BOOLEAN NOT NULL DEFAULT true,
    "backupFrequency" TEXT NOT NULL DEFAULT 'daily',
    "sessionTimeout" INTEGER NOT NULL DEFAULT 24,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);
