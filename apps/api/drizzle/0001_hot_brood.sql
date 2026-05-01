ALTER TABLE "medication_logs" RENAME COLUMN "taken_at" TO "recorded_at";--> statement-breakpoint
DROP INDEX "idx_medication_logs_taken_at";--> statement-breakpoint
CREATE INDEX "idx_medication_logs_recorded_at" ON "medication_logs" USING btree ("recorded_at");