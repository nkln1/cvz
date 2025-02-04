import { pgTable, text, serial, integer, boolean, timestamp, foreignKey, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
});

export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").notNull().references(() => users.id),
  clientId: integer("client_id").notNull().references(() => users.id),
  offerId: text("offer_id").notNull(),
  rating: decimal("rating", { precision: 2, scale: 1 }).notNull(),
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

export const insertRatingSchema = createInsertSchema(ratings);
export const selectRatingSchema = createSelectSchema(ratings);
export type InsertRating = typeof ratings.$inferInsert;
export type SelectRating = typeof ratings.$inferSelect;