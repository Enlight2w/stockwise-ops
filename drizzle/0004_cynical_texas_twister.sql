CREATE TABLE `teamInvites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shopId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`permissionRole` enum('manager','sales','inventory','support') NOT NULL DEFAULT 'sales',
	`inviteToken` varchar(96) NOT NULL,
	`status` enum('pending','accepted','revoked') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`acceptedAt` timestamp,
	CONSTRAINT `teamInvites_id` PRIMARY KEY(`id`),
	CONSTRAINT `teamInvites_inviteToken_unique` UNIQUE(`inviteToken`)
);
--> statement-breakpoint
ALTER TABLE `teamMembers` ADD `permissionRole` enum('manager','sales','inventory','support') DEFAULT 'sales' NOT NULL;