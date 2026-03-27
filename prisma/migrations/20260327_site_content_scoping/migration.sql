CREATE TABLE `_multisite_site_pick` (
  `siteId` VARCHAR(191) NOT NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `_multisite_site_pick` (`siteId`)
SELECT `id` FROM `Site` ORDER BY `createdAt` ASC LIMIT 1;

ALTER TABLE `Category`
  ADD COLUMN `siteId` VARCHAR(191) NULL;
UPDATE `Category` SET `siteId` = (SELECT `siteId` FROM `_multisite_site_pick` LIMIT 1) WHERE `siteId` IS NULL;
ALTER TABLE `Category`
  MODIFY `siteId` VARCHAR(191) NOT NULL,
  DROP INDEX `Category_slug_key`,
  ADD UNIQUE INDEX `Category_siteId_slug_key`(`siteId`, `slug`),
  ADD INDEX `Category_siteId_sortOrder_idx`(`siteId`, `sortOrder`),
  ADD CONSTRAINT `Category_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Post`
  ADD COLUMN `siteId` VARCHAR(191) NULL;
UPDATE `Post` SET `siteId` = (SELECT `siteId` FROM `_multisite_site_pick` LIMIT 1) WHERE `siteId` IS NULL;
ALTER TABLE `Post`
  MODIFY `siteId` VARCHAR(191) NOT NULL,
  DROP INDEX `Post_slug_key`,
  ADD UNIQUE INDEX `Post_siteId_slug_key`(`siteId`, `slug`),
  ADD INDEX `Post_siteId_status_publishedAt_idx`(`siteId`, `status`, `publishedAt`),
  ADD CONSTRAINT `Post_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `SymbolEntry`
  ADD COLUMN `siteId` VARCHAR(191) NULL;
UPDATE `SymbolEntry` SET `siteId` = (SELECT `siteId` FROM `_multisite_site_pick` LIMIT 1) WHERE `siteId` IS NULL;
ALTER TABLE `SymbolEntry`
  MODIFY `siteId` VARCHAR(191) NOT NULL,
  DROP INDEX `SymbolEntry_slug_key`,
  DROP INDEX `SymbolEntry_letter_idx`,
  ADD UNIQUE INDEX `SymbolEntry_siteId_slug_key`(`siteId`, `slug`),
  ADD INDEX `SymbolEntry_siteId_letter_idx`(`siteId`, `letter`),
  ADD CONSTRAINT `SymbolEntry_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Redirect`
  ADD COLUMN `siteId` VARCHAR(191) NULL;
UPDATE `Redirect` SET `siteId` = (SELECT `siteId` FROM `_multisite_site_pick` LIMIT 1) WHERE `siteId` IS NULL;
ALTER TABLE `Redirect`
  MODIFY `siteId` VARCHAR(191) NOT NULL,
  DROP INDEX `Redirect_fromPath_key`,
  ADD UNIQUE INDEX `Redirect_siteId_fromPath_key`(`siteId`, `fromPath`),
  ADD INDEX `Redirect_siteId_isActive_hits_idx`(`siteId`, `isActive`, `hits`),
  ADD CONSTRAINT `Redirect_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `SeoSettings`
  ADD COLUMN `siteId` VARCHAR(191) NULL;
UPDATE `SeoSettings` SET `siteId` = (SELECT `siteId` FROM `_multisite_site_pick` LIMIT 1) WHERE `siteId` IS NULL;
ALTER TABLE `SeoSettings`
  MODIFY `siteId` VARCHAR(191) NOT NULL,
  ADD UNIQUE INDEX `SeoSettings_siteId_key`(`siteId`),
  ADD CONSTRAINT `SeoSettings_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

DROP TABLE `_multisite_site_pick`;
