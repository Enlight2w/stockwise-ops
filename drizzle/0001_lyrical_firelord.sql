CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shopId` int NOT NULL,
	`sku` varchar(48) NOT NULL,
	`name` varchar(160) NOT NULL,
	`category` varchar(96) NOT NULL,
	`unit` varchar(32) NOT NULL DEFAULT 'unit',
	`stockOnHand` int NOT NULL DEFAULT 0,
	`reorderLevel` int NOT NULL DEFAULT 10,
	`costPriceCents` int NOT NULL DEFAULT 0,
	`salePriceCents` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shopId` int NOT NULL,
	`customerName` varchar(120) NOT NULL,
	`productRating` int NOT NULL,
	`serviceRating` int NOT NULL,
	`comment` text,
	`status` enum('new','reviewed','archived') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shopId` int NOT NULL,
	`productId` int NOT NULL,
	`employeeId` int,
	`quantity` int NOT NULL,
	`revenueCents` int NOT NULL,
	`profitCents` int NOT NULL,
	`soldAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sales_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shops` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerUserId` int,
	`name` varchar(160) NOT NULL,
	`businessType` enum('retail','wholesale','hybrid') NOT NULL DEFAULT 'retail',
	`address` varchar(240),
	`latitude` varchar(32),
	`longitude` varchar(32),
	`beaconEnabled` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shops_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teamMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shopId` int NOT NULL,
	`userId` int,
	`name` varchar(120) NOT NULL,
	`email` varchar(320),
	`role` enum('owner','employee') NOT NULL DEFAULT 'employee',
	`avatarColor` varchar(20) NOT NULL DEFAULT '#ef8354',
	`monthlyUnits` int NOT NULL DEFAULT 0,
	`yearlyUnits` int NOT NULL DEFAULT 0,
	`targetUnits` int NOT NULL DEFAULT 1000,
	`active` boolean NOT NULL DEFAULT true,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `teamMembers_id` PRIMARY KEY(`id`)
);
