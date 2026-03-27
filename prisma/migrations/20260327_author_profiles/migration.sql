ALTER TABLE `User`
  ADD COLUMN `slug` VARCHAR(191) NULL,
  ADD COLUMN `headline` VARCHAR(191) NULL,
  ADD COLUMN `bio` TEXT NULL,
  ADD COLUMN `credentials` TEXT NULL,
  ADD COLUMN `methodology` TEXT NULL,
  ADD COLUMN `expertise` JSON NULL,
  ADD COLUMN `avatarUrl` VARCHAR(191) NULL,
  ADD COLUMN `trustStatement` TEXT NULL,
  ADD COLUMN `publicProfile` BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX `User_slug_key` ON `User`(`slug`);
