CREATE TABLE `AdminAuditLog` (
  `id` VARCHAR(191) NOT NULL,
  `actorId` VARCHAR(191) NULL,
  `actorEmail` VARCHAR(191) NULL,
  `action` VARCHAR(191) NOT NULL,
  `entityType` VARCHAR(191) NOT NULL,
  `entityId` VARCHAR(191) NULL,
  `route` VARCHAR(191) NOT NULL,
  `method` VARCHAR(191) NOT NULL,
  `ip` VARCHAR(191) NULL,
  `meta` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `AdminAuditLog_actorId_createdAt_idx`(`actorId`, `createdAt`),
  INDEX `AdminAuditLog_entityType_createdAt_idx`(`entityType`, `createdAt`),
  INDEX `AdminAuditLog_action_createdAt_idx`(`action`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `AdminAuditLog`
  ADD CONSTRAINT `AdminAuditLog_actorId_fkey`
  FOREIGN KEY (`actorId`) REFERENCES `User`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;