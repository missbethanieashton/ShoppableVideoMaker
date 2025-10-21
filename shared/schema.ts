import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Product schema
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  price: text("price").notNull(),
  description: text("description"),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Carousel configuration schema
export const carouselPositions = [
  "top-right",
  "top-center",
  "top-left",
  "side-right",
  "side-left",
  "bottom-right",
  "bottom-center",
  "bottom-left",
  "end-of-video",
] as const;

export const thumbnailShapes = ["square", "circle", "portrait"] as const;
export const carouselAnimations = ["none", "hover", "float", "pulse"] as const;
export const buttonPositions = ["below", "right", "left", "top"] as const;
export const fontStyles = ["normal", "italic", "bold", "bold-italic"] as const;
export const fontFamilies = ["default", "league-spartan", "glacial-indifference", "lacquer"] as const;

export type CarouselPosition = typeof carouselPositions[number];
export type ThumbnailShape = typeof thumbnailShapes[number];
export type CarouselAnimation = typeof carouselAnimations[number];
export type ButtonPosition = typeof buttonPositions[number];
export type FontStyle = typeof fontStyles[number];
export type FontFamily = typeof fontFamilies[number];

export interface CarouselConfig {
  position: CarouselPosition;
  thumbnailShape: ThumbnailShape;
  thumbnailSize: number; // Size in pixels (32-250px for width/height)
  carouselWidth: number; // Width of entire carousel in pixels (32-250px)
  cornerRadius: number;
  transparentBackground: boolean;
  showBorder: boolean;
  animation: CarouselAnimation;
  showTitle: boolean;
  showPrice: boolean;
  showDescription: boolean;
  showButton: boolean;
  buttonText: string;
  buttonBackgroundColor: string;
  buttonTextColor: string;
  buttonFontSize: number;
  buttonFontWeight: string;
  buttonFontStyle: FontStyle;
  buttonFontFamily: FontFamily;
  buttonBorderRadius: number;
  buttonPosition: ButtonPosition;
  titleFontStyle: FontStyle;
  titleFontFamily: FontFamily;
  priceFontFamily: FontFamily;
}

// Product placement schema (products on timeline)
export interface ProductPlacement {
  id: string;
  productId: string;
  startTime: number;
  endTime: number;
}

// Video schema
export const videos = pgTable("videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  videoUrl: text("video_url").notNull(),
  duration: integer("duration").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  published: boolean("published").notNull().default(false),
  carouselConfig: jsonb("carousel_config").notNull().$type<CarouselConfig>(),
  productPlacements: jsonb("product_placements").notNull().$type<ProductPlacement[]>(),
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
});

export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videos.$inferSelect;

// Default carousel configuration
export const defaultCarouselConfig: CarouselConfig = {
  position: "top-right",
  thumbnailShape: "square",
  thumbnailSize: 64, // Default 64px thumbnail size
  carouselWidth: 250, // Default carousel width 250px
  cornerRadius: 0,
  transparentBackground: false,
  showBorder: true,
  animation: "none",
  showTitle: false,
  showPrice: false,
  showDescription: false,
  showButton: false,
  buttonText: "Shop Now",
  buttonBackgroundColor: "#000000",
  buttonTextColor: "#FFFFFF",
  buttonFontSize: 14,
  buttonFontWeight: "500",
  buttonFontStyle: "normal",
  buttonFontFamily: "default",
  buttonBorderRadius: 4,
  buttonPosition: "below",
  titleFontStyle: "normal",
  titleFontFamily: "default",
  priceFontFamily: "default",
};

// Analytics events schema
export const analyticsEvents = pgTable("analytics_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").notNull().references(() => videos.id, { onDelete: "cascade" }),
  productId: varchar("product_id").references(() => products.id, { onDelete: "set null" }),
  eventType: varchar("event_type", { length: 50 }).notNull(), // 'view', 'product_click', 'product_ctr'
  timestamp: integer("timestamp").notNull(), // Unix timestamp
  metadata: jsonb("metadata"), // Additional event data
});

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({
  id: true,
});

export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
