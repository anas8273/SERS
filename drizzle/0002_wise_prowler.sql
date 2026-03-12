CREATE TABLE `report_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(128) DEFAULT 'general',
	`fields` json NOT NULL,
	`layout` json NOT NULL,
	`defaultThemeId` int,
	`thumbnailUrl` text,
	`isActive` boolean DEFAULT true,
	`isDefault` boolean DEFAULT false,
	`sortOrder` int DEFAULT 0,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `report_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`portfolioId` int,
	`reportTemplateId` int NOT NULL,
	`themeId` int,
	`title` varchar(512) NOT NULL,
	`data` json NOT NULL,
	`criterionId` varchar(128),
	`subEvidenceId` varchar(128),
	`evidenceId` varchar(128),
	`status` enum('draft','completed') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_reports_id` PRIMARY KEY(`id`)
);
