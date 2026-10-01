ALTER TABLE `shops` ADD `subscriptionPlan` enum('starter','growth','scale') DEFAULT 'starter' NOT NULL;--> statement-breakpoint
ALTER TABLE `shops` ADD `subscriptionStatus` enum('trialing','active','past_due') DEFAULT 'trialing' NOT NULL;--> statement-breakpoint
ALTER TABLE `shops` ADD `countryCode` varchar(8) DEFAULT 'US' NOT NULL;--> statement-breakpoint
ALTER TABLE `shops` ADD `currencyCode` varchar(8) DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE `shops` ADD `languageCode` varchar(12) DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE `shops` ADD `setupCompleted` boolean DEFAULT false NOT NULL;