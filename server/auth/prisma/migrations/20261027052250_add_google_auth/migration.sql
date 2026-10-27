/*
  Warnings:

  - A unique constraint covering the columns `[googleId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `users` ADD COLUMN `avatarUrl` VARCHAR(500) NULL,
    ADD COLUMN `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `googleId` VARCHAR(191) NULL,
    MODIFY `passwordHash` VARCHAR(255) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_googleId_key` ON `users`(`googleId`);
