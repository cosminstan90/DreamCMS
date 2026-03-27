CREATE TABLE `_growth_site_pick` (
  `siteId` VARCHAR(191) NOT NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `_growth_site_pick` (`siteId`)
SELECT `id` FROM `Site` ORDER BY `createdAt` ASC LIMIT 1;

ALTER TABLE `TopicCluster`
  ADD COLUMN `siteId` VARCHAR(191) NULL;
UPDATE `TopicCluster` tc
LEFT JOIN `Category` c ON c.id = tc.categoryId
LEFT JOIN `Post` p ON p.id = tc.pillarPostId
SET tc.siteId = COALESCE(c.siteId, p.siteId, (SELECT `siteId` FROM `_growth_site_pick` LIMIT 1))
WHERE tc.siteId IS NULL;
ALTER TABLE `TopicCluster`
  MODIFY `siteId` VARCHAR(191) NOT NULL,
  DROP INDEX `TopicCluster_slug_key`,
  ADD UNIQUE INDEX `TopicCluster_siteId_slug_key`(`siteId`, `slug`),
  ADD INDEX `TopicCluster_siteId_status_priority_idx`(`siteId`, `status`, `priority`),
  ADD CONSTRAINT `TopicCluster_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ContentOpportunity`
  ADD COLUMN `siteId` VARCHAR(191) NULL;
UPDATE `ContentOpportunity` co
LEFT JOIN `TopicCluster` tc ON tc.id = co.clusterId
LEFT JOIN `Category` c ON c.id = co.categoryId
LEFT JOIN `SymbolEntry` s ON s.id = co.symbolId
LEFT JOIN `Post` p ON p.id = co.postId
SET co.siteId = COALESCE(tc.siteId, c.siteId, s.siteId, p.siteId, (SELECT `siteId` FROM `_growth_site_pick` LIMIT 1))
WHERE co.siteId IS NULL;
ALTER TABLE `ContentOpportunity`
  MODIFY `siteId` VARCHAR(191) NOT NULL,
  DROP INDEX `ContentOpportunity_slug_key`,
  ADD UNIQUE INDEX `ContentOpportunity_siteId_slug_key`(`siteId`, `slug`),
  ADD INDEX `ContentOpportunity_siteId_status_priority_idx`(`siteId`, `status`, `priority`),
  ADD CONSTRAINT `ContentOpportunity_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `TopicBrief`
  ADD COLUMN `siteId` VARCHAR(191) NULL;
UPDATE `TopicBrief` tb
LEFT JOIN `TopicCluster` tc ON tc.id = tb.clusterId
LEFT JOIN `ContentOpportunity` co ON co.id = tb.opportunityId
LEFT JOIN `Post` p ON p.id = tb.postId
SET tb.siteId = COALESCE(tc.siteId, co.siteId, p.siteId, (SELECT `siteId` FROM `_growth_site_pick` LIMIT 1))
WHERE tb.siteId IS NULL;
ALTER TABLE `TopicBrief`
  MODIFY `siteId` VARCHAR(191) NOT NULL,
  DROP INDEX `TopicBrief_slug_key`,
  ADD UNIQUE INDEX `TopicBrief_siteId_slug_key`(`siteId`, `slug`),
  ADD INDEX `TopicBrief_siteId_status_priority_idx`(`siteId`, `status`, `priority`),
  ADD CONSTRAINT `TopicBrief_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `SearchQueryInsight`
  ADD COLUMN `siteId` VARCHAR(191) NULL;
UPDATE `SearchQueryInsight` sqi
LEFT JOIN `TopicCluster` tc ON tc.id = sqi.clusterId
SET sqi.siteId = COALESCE(tc.siteId, (SELECT `siteId` FROM `_growth_site_pick` LIMIT 1))
WHERE sqi.siteId IS NULL;
ALTER TABLE `SearchQueryInsight`
  MODIFY `siteId` VARCHAR(191) NOT NULL,
  DROP INDEX `SearchQueryInsight_slug_pagePath_key`,
  DROP INDEX `SearchQueryInsight_opportunityScore_impressions_idx`,
  ADD UNIQUE INDEX `SearchQueryInsight_siteId_slug_pagePath_key`(`siteId`, `slug`, `pagePath`),
  ADD INDEX `SearchQueryInsight_siteId_opportunityScore_impressions_idx`(`siteId`, `opportunityScore`, `impressions`),
  ADD CONSTRAINT `SearchQueryInsight_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

DROP TABLE `_growth_site_pick`;
