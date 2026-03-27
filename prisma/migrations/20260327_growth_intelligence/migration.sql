CREATE TABLE `SearchQueryInsight` (
  `id` VARCHAR(191) NOT NULL,
  `query` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `pagePath` VARCHAR(191) NOT NULL DEFAULT '',
  `clicks` INTEGER NOT NULL DEFAULT 0,
  `impressions` INTEGER NOT NULL DEFAULT 0,
  `ctr` DOUBLE NOT NULL DEFAULT 0,
  `position` DOUBLE NOT NULL DEFAULT 0,
  `source` VARCHAR(64) NULL,
  `intent` ENUM('INFORMATIONAL', 'COMMERCIAL', 'INVESTIGATIONAL', 'NAVIGATIONAL') NOT NULL DEFAULT 'INFORMATIONAL',
  `clusterLabel` VARCHAR(191) NULL,
  `recommendedTemplate` VARCHAR(64) NULL,
  `recommendedCta` VARCHAR(128) NULL,
  `monetizationFit` VARCHAR(128) NULL,
  `opportunityScore` INTEGER NOT NULL DEFAULT 0,
  `clusterId` VARCHAR(191) NULL,
  `lastImportedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `SearchQueryInsight_slug_pagePath_key`(`slug`, `pagePath`),
  INDEX `SearchQueryInsight_opportunityScore_impressions_idx`(`opportunityScore`, `impressions`),
  INDEX `SearchQueryInsight_clusterId_idx`(`clusterId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `SearchQueryInsight`
  ADD CONSTRAINT `SearchQueryInsight_clusterId_fkey` FOREIGN KEY (`clusterId`) REFERENCES `TopicCluster`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;