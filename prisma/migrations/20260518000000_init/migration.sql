CREATE TYPE "ScanStatus" AS ENUM ('RUNNING', 'SUCCESS', 'PARTIAL_SUCCESS', 'FAILED');
CREATE TYPE "SourceType" AS ENUM ('EXACT_DIVISION', 'RADAR');
CREATE TYPE "ChangeType" AS ENUM ('NEW_EVENT', 'REMOVED_EVENT', 'NEW_COMPETITOR', 'REMOVED_COMPETITOR', 'TEAM_CHANGED', 'DIVISION_CHANGED', 'NEW_RADAR_ATHLETE', 'REMOVED_RADAR_ATHLETE', 'ERROR');
CREATE TYPE "Severity" AS ENUM ('INFO', 'IMPORTANT', 'CRITICAL');

CREATE TABLE "UserSession" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WatchProfile" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "gi" BOOLEAN NOT NULL,
  "gender" TEXT NOT NULL,
  "age" TEXT NOT NULL,
  "belt" TEXT NOT NULL,
  "weight" TEXT NOT NULL,
  "exactDivision" TEXT NOT NULL,
  "alertEmailEnabled" BOOLEAN NOT NULL DEFAULT true,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WatchProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScanRun" (
  "id" TEXT NOT NULL,
  "watchProfileId" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  "status" "ScanStatus" NOT NULL DEFAULT 'RUNNING',
  "sourceBaseUrl" TEXT NOT NULL,
  "exactEventsFound" INTEGER NOT NULL DEFAULT 0,
  "exactCompetitorsFound" INTEGER NOT NULL DEFAULT 0,
  "radarAthletesFound" INTEGER NOT NULL DEFAULT 0,
  "requestsMade" INTEGER NOT NULL DEFAULT 0,
  "errorMessage" TEXT,
  "rawSummary" JSONB,
  CONSTRAINT "ScanRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventSnapshot" (
  "id" TEXT NOT NULL,
  "scanRunId" TEXT NOT NULL,
  "watchProfileId" TEXT NOT NULL,
  "eventName" TEXT NOT NULL,
  "eventStartDate" TIMESTAMP(3),
  "eventEndDate" TIMESTAMP(3),
  "registrationLink" TEXT NOT NULL,
  "eventId" TEXT,
  "exactDivisionPresent" BOOLEAN NOT NULL,
  "competitorCount" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CompetitorSnapshot" (
  "id" TEXT NOT NULL,
  "scanRunId" TEXT NOT NULL,
  "eventSnapshotId" TEXT,
  "watchProfileId" TEXT NOT NULL,
  "sourceType" "SourceType" NOT NULL,
  "athleteName" TEXT NOT NULL,
  "personalName" TEXT,
  "team" TEXT,
  "country" TEXT,
  "instagram" TEXT,
  "profileImageUrl" TEXT,
  "athleteId" TEXT,
  "slug" TEXT,
  "rating" DOUBLE PRECISION,
  "rank" INTEGER,
  "matchCount" INTEGER,
  "percentile" DOUBLE PRECISION,
  "seed" INTEGER,
  "ordinal" INTEGER,
  "registeredDivision" TEXT NOT NULL,
  "eventName" TEXT NOT NULL,
  "eventStartDate" TIMESTAMP(3),
  "eventEndDate" TIMESTAMP(3),
  "registrationLink" TEXT,
  "eventId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CompetitorSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChangeLog" (
  "id" TEXT NOT NULL,
  "watchProfileId" TEXT NOT NULL,
  "scanRunId" TEXT NOT NULL,
  "changeType" "ChangeType" NOT NULL,
  "severity" "Severity" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "athleteName" TEXT,
  "eventName" TEXT,
  "oldValue" TEXT,
  "newValue" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "acknowledged" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "ChangeLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserSession_tokenHash_key" ON "UserSession"("tokenHash");
CREATE INDEX "ScanRun_watchProfileId_status_startedAt_idx" ON "ScanRun"("watchProfileId", "status", "startedAt");
CREATE UNIQUE INDEX "EventSnapshot_scanRunId_registrationLink_eventName_key" ON "EventSnapshot"("scanRunId", "registrationLink", "eventName");
CREATE INDEX "EventSnapshot_watchProfileId_eventStartDate_idx" ON "EventSnapshot"("watchProfileId", "eventStartDate");
CREATE UNIQUE INDEX "CompetitorSnapshot_scanRunId_sourceType_athleteName_eventName_registeredDivision_key" ON "CompetitorSnapshot"("scanRunId", "sourceType", "athleteName", "eventName", "registeredDivision");
CREATE INDEX "CompetitorSnapshot_watchProfileId_sourceType_eventStartDate_idx" ON "CompetitorSnapshot"("watchProfileId", "sourceType", "eventStartDate");
CREATE INDEX "CompetitorSnapshot_athleteName_eventName_idx" ON "CompetitorSnapshot"("athleteName", "eventName");
CREATE INDEX "ChangeLog_watchProfileId_createdAt_idx" ON "ChangeLog"("watchProfileId", "createdAt");

ALTER TABLE "ScanRun" ADD CONSTRAINT "ScanRun_watchProfileId_fkey" FOREIGN KEY ("watchProfileId") REFERENCES "WatchProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventSnapshot" ADD CONSTRAINT "EventSnapshot_scanRunId_fkey" FOREIGN KEY ("scanRunId") REFERENCES "ScanRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventSnapshot" ADD CONSTRAINT "EventSnapshot_watchProfileId_fkey" FOREIGN KEY ("watchProfileId") REFERENCES "WatchProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompetitorSnapshot" ADD CONSTRAINT "CompetitorSnapshot_scanRunId_fkey" FOREIGN KEY ("scanRunId") REFERENCES "ScanRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompetitorSnapshot" ADD CONSTRAINT "CompetitorSnapshot_eventSnapshotId_fkey" FOREIGN KEY ("eventSnapshotId") REFERENCES "EventSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CompetitorSnapshot" ADD CONSTRAINT "CompetitorSnapshot_watchProfileId_fkey" FOREIGN KEY ("watchProfileId") REFERENCES "WatchProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChangeLog" ADD CONSTRAINT "ChangeLog_watchProfileId_fkey" FOREIGN KEY ("watchProfileId") REFERENCES "WatchProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChangeLog" ADD CONSTRAINT "ChangeLog_scanRunId_fkey" FOREIGN KEY ("scanRunId") REFERENCES "ScanRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
