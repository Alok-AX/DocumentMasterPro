import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("viewer"), // Admin, Editor, Viewer
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Document model
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // PDF, DOCX, TXT, XLSX
  size: integer("size").notNull(), // Size in bytes
  path: text("path").notNull(),
  userId: integer("user_id").notNull(), // Owner of the document
  starred: boolean("starred").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  modifiedAt: timestamp("modified_at").defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  modifiedAt: true,
});

// Activity model
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // upload, edit, delete, query
  documentId: integer("document_id"),
  userId: integer("user_id").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

// Ingestion model
export const ingestions = pgTable("ingestions", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  status: text("status").notNull(), // pending, processing, completed, failed
  logs: text("logs"),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertIngestionSchema = createInsertSchema(ingestions).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type Ingestion = typeof ingestions.$inferSelect;
export type InsertIngestion = z.infer<typeof insertIngestionSchema>;
