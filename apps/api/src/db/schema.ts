import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const timingEnum = pgEnum("timing_enum", ["morning", "afternoon", "evening"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const medicines = pgTable(
  "medicines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    photoUrl: text("photo_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("idx_medicines_user_id").on(table.userId)],
);

export const medicineTimings = pgTable(
  "medicine_timings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    medicineId: uuid("medicine_id")
      .notNull()
      .references(() => medicines.id, { onDelete: "cascade" }),
    timing: timingEnum("timing").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [unique("uq_medicine_timings_medicine_id_timing").on(table.medicineId, table.timing)],
);

export const medicationLogs = pgTable(
  "medication_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    medicineId: uuid("medicine_id")
      .notNull()
      .references(() => medicines.id, { onDelete: "cascade" }),
    timing: timingEnum("timing").notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull(),
    isTaken: boolean("is_taken").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_medication_logs_medicine_id").on(table.medicineId),
    index("idx_medication_logs_recorded_at").on(table.recordedAt),
    index("idx_medication_logs_medicine_recorded_at").on(table.medicineId, table.recordedAt),
  ],
);

export const notificationSettings = pgTable(
  "notification_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    timing: timingEnum("timing").notNull(),
    notifyTime: time("notify_time").notNull(),
    isEnabled: boolean("is_enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [unique("uq_notification_settings_user_id_timing").on(table.userId, table.timing)],
);
