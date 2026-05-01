DROP INDEX "idx_medicine_timings_medicine_id";--> statement-breakpoint
DROP INDEX "idx_notification_settings_user_id";--> statement-breakpoint
ALTER TABLE "medicine_timings" ADD CONSTRAINT "uq_medicine_timings_medicine_id_timing" UNIQUE("medicine_id","timing");--> statement-breakpoint
ALTER TABLE "notification_settings" ADD CONSTRAINT "uq_notification_settings_user_id_timing" UNIQUE("user_id","timing");