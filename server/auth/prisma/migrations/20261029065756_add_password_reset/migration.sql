-- AlterTable
ALTER TABLE `users` ADD COLUMN `resetPasswordExpires` DATETIME(3) NULL,
    ADD COLUMN `resetPasswordTokenHash` CHAR(64) NULL;

-- CreateIndex
CREATE INDEX `users_resetPasswordTokenHash_idx` ON `users`(`resetPasswordTokenHash`);
