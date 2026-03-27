ALTER TABLE `Post`
  ADD COLUMN `topicClusterId` VARCHAR(191) NULL;

CREATE TABLE `TopicCluster` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `intent` ENUM('INFORMATIONAL', 'COMMERCIAL', 'INVESTIGATIONAL', 'NAVIGATIONAL') NOT NULL DEFAULT 'INFORMATIONAL',
  `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  `status` ENUM('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED') NOT NULL DEFAULT 'PLANNING',
  `monetizationPotential` INTEGER NOT NULL DEFAULT 50,
  `geoPotential` INTEGER NOT NULL DEFAULT 50,
  `difficulty` INTEGER NOT NULL DEFAULT 50,
  `description` TEXT NULL,
  `pillarTitle` VARCHAR(191) NULL,
  `pillarMetaTitle` VARCHAR(191) NULL,
  `pillarMetaDescription` TEXT NULL,
  `outlineTemplate` JSON NULL,
  `supportAngles` JSON NULL,
  `pillarPostId` VARCHAR(191) NULL,
  `categoryId` VARCHAR(191) NULL,
  `createdById` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `TopicCluster_slug_key`(`slug`),
  INDEX `TopicCluster_status_priority_idx`(`status`, `priority`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `TopicKeyword` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `intent` ENUM('INFORMATIONAL', 'COMMERCIAL', 'INVESTIGATIONAL', 'NAVIGATIONAL') NOT NULL DEFAULT 'INFORMATIONAL',
  `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  `status` ENUM('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED') NOT NULL DEFAULT 'ACTIVE',
  `monetizationPotential` INTEGER NOT NULL DEFAULT 50,
  `geoPotential` INTEGER NOT NULL DEFAULT 50,
  `difficulty` INTEGER NOT NULL DEFAULT 50,
  `clusterId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `TopicKeyword_clusterId_slug_key`(`clusterId`, `slug`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `TopicBrief` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `intent` ENUM('INFORMATIONAL', 'COMMERCIAL', 'INVESTIGATIONAL', 'NAVIGATIONAL') NOT NULL DEFAULT 'INFORMATIONAL',
  `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  `status` ENUM('READY_TO_WRITE', 'IN_PROGRESS', 'PUBLISHED', 'REFRESH_NEEDED', 'DISMISSED') NOT NULL DEFAULT 'READY_TO_WRITE',
  `monetizationPotential` INTEGER NOT NULL DEFAULT 50,
  `geoPotential` INTEGER NOT NULL DEFAULT 50,
  `difficulty` INTEGER NOT NULL DEFAULT 50,
  `title` VARCHAR(191) NULL,
  `metaTitle` VARCHAR(191) NULL,
  `metaDescription` TEXT NULL,
  `outline` JSON NULL,
  `faq` JSON NULL,
  `internalLinks` JSON NULL,
  `geoBlocks` JSON NULL,
  `monetizationNotes` TEXT NULL,
  `opportunityId` VARCHAR(191) NULL,
  `clusterId` VARCHAR(191) NULL,
  `postId` VARCHAR(191) NULL,
  `createdById` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `TopicBrief_slug_key`(`slug`),
  INDEX `TopicBrief_status_priority_idx`(`status`, `priority`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ContentOpportunity` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `intent` ENUM('INFORMATIONAL', 'COMMERCIAL', 'INVESTIGATIONAL', 'NAVIGATIONAL') NOT NULL DEFAULT 'INFORMATIONAL',
  `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  `status` ENUM('READY_TO_WRITE', 'IN_PROGRESS', 'PUBLISHED', 'REFRESH_NEEDED', 'DISMISSED') NOT NULL DEFAULT 'READY_TO_WRITE',
  `monetizationPotential` INTEGER NOT NULL DEFAULT 50,
  `geoPotential` INTEGER NOT NULL DEFAULT 50,
  `difficulty` INTEGER NOT NULL DEFAULT 50,
  `opportunityType` VARCHAR(191) NULL,
  `summary` TEXT NULL,
  `recommendedTitle` VARCHAR(191) NULL,
  `recommendedMeta` TEXT NULL,
  `outline` JSON NULL,
  `faq` JSON NULL,
  `internalLinks` JSON NULL,
  `geoBlocks` JSON NULL,
  `monetizationNotes` TEXT NULL,
  `clusterId` VARCHAR(191) NULL,
  `categoryId` VARCHAR(191) NULL,
  `symbolId` VARCHAR(191) NULL,
  `postId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `ContentOpportunity_slug_key`(`slug`),
  INDEX `ContentOpportunity_status_priority_idx`(`status`, `priority`),
  INDEX `ContentOpportunity_clusterId_idx`(`clusterId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `Post_topicClusterId_idx` ON `Post`(`topicClusterId`);

ALTER TABLE `Post`
  ADD CONSTRAINT `Post_topicClusterId_fkey` FOREIGN KEY (`topicClusterId`) REFERENCES `TopicCluster`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `TopicCluster`
  ADD CONSTRAINT `TopicCluster_pillarPostId_fkey` FOREIGN KEY (`pillarPostId`) REFERENCES `Post`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `TopicCluster_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `TopicCluster_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `TopicKeyword`
  ADD CONSTRAINT `TopicKeyword_clusterId_fkey` FOREIGN KEY (`clusterId`) REFERENCES `TopicCluster`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `TopicBrief`
  ADD CONSTRAINT `TopicBrief_opportunityId_fkey` FOREIGN KEY (`opportunityId`) REFERENCES `ContentOpportunity`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `TopicBrief_clusterId_fkey` FOREIGN KEY (`clusterId`) REFERENCES `TopicCluster`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `TopicBrief_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `TopicBrief_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `ContentOpportunity`
  ADD CONSTRAINT `ContentOpportunity_clusterId_fkey` FOREIGN KEY (`clusterId`) REFERENCES `TopicCluster`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ContentOpportunity_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ContentOpportunity_symbolId_fkey` FOREIGN KEY (`symbolId`) REFERENCES `SymbolEntry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ContentOpportunity_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
