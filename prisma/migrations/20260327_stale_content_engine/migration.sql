ALTER TABLE `Post`
  ADD COLUMN `lastReviewedAt` DATETIME(3) NULL,
  ADD COLUMN `contentDecayScore` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `contentHealthScore` INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN `refreshPriority` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `refreshStatus` ENUM('FRESH', 'WATCH', 'REFRESH_NEEDED', 'IN_REFRESH', 'REFRESHED') NOT NULL DEFAULT 'FRESH',
  ADD COLUMN `refreshNotes` TEXT NULL;

CREATE INDEX `Post_refreshStatus_refreshPriority_idx` ON `Post`(`refreshStatus`, `refreshPriority`);
