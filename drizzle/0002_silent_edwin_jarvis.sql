CREATE TABLE `inventoryAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shopId` int NOT NULL,
	`productId` int NOT NULL,
	`type` enum('low_stock') NOT NULL DEFAULT 'low_stock',
	`title` varchar(180) NOT NULL,
	`message` text NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventoryAlerts_id` PRIMARY KEY(`id`)
);
