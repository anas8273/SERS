ALTER TABLE `pdf_templates` ADD `shareToken` varchar(128);--> statement-breakpoint
ALTER TABLE `pdf_templates` ADD `isShared` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `pdf_templates` ADD CONSTRAINT `pdf_templates_shareToken_unique` UNIQUE(`shareToken`);