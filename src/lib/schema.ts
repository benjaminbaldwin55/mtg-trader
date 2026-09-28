import { pgTable, serial, text, integer, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  listType: text("list_type").notNull(), // "inventory" | "wishlist"
  name: text("name").notNull(),
  edition: text("edition"),
  quantity: integer("quantity").notNull().default(1),
  foil: boolean("foil").notNull().default(false),
  condition: text("condition"),
  language: text("language"),
  collectorNumber: text("collector_number"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;
