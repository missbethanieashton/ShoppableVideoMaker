import { 
  type Product, 
  type InsertProduct, 
  type Video, 
  type InsertVideo, 
  type AnalyticsEvent,
  type InsertAnalyticsEvent,
  products, 
  videos,
  analyticsEvents
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  deleteProduct(id: string): Promise<void>;

  getVideos(): Promise<Video[]>;
  getVideo(id: string): Promise<Video | undefined>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideo(id: string, video: Partial<InsertVideo>): Promise<Video>;
  publishVideo(id: string): Promise<Video>;
  deleteVideo(id: string): Promise<void>;

  createAnalyticsEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent>;
  getAnalyticsEvents(videoId?: string, startTime?: number, endTime?: number): Promise<AnalyticsEvent[]>;
  getAnalyticsSummary(videoId?: string): Promise<{
    totalViews: number;
    totalClicks: number;
    clickThroughRate: number;
    topProducts: Array<{ productId: string; clicks: number; productTitle?: string }>;
  }>;
}

export class DbStorage implements IStorage {
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result[0];
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values(insertProduct).returning();
    return result[0];
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getVideos(): Promise<Video[]> {
    return await db.select().from(videos);
  }

  async getVideo(id: string): Promise<Video | undefined> {
    const result = await db.select().from(videos).where(eq(videos.id, id));
    return result[0];
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const result = await db.insert(videos).values(insertVideo).returning();
    return result[0];
  }

  async updateVideo(id: string, updates: Partial<InsertVideo>): Promise<Video> {
    const result = await db.update(videos)
      .set(updates)
      .where(eq(videos.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("Video not found");
    }
    
    return result[0];
  }

  async publishVideo(id: string): Promise<Video> {
    const result = await db.update(videos)
      .set({ published: true })
      .where(eq(videos.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("Video not found");
    }
    
    return result[0];
  }

  async deleteVideo(id: string): Promise<void> {
    await db.delete(videos).where(eq(videos.id, id));
  }

  async createAnalyticsEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent> {
    const result = await db.insert(analyticsEvents).values(event).returning();
    return result[0];
  }

  async getAnalyticsEvents(videoId?: string, startTime?: number, endTime?: number): Promise<AnalyticsEvent[]> {
    let query = db.select().from(analyticsEvents);
    
    const conditions = [];
    if (videoId) {
      conditions.push(eq(analyticsEvents.videoId, videoId));
    }
    if (startTime) {
      conditions.push(gte(analyticsEvents.timestamp, startTime));
    }
    if (endTime) {
      conditions.push(lte(analyticsEvents.timestamp, endTime));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(analyticsEvents.timestamp));
  }

  async getAnalyticsSummary(videoId?: string): Promise<{
    totalViews: number;
    totalClicks: number;
    clickThroughRate: number;
    topProducts: Array<{ productId: string; clicks: number; productTitle?: string }>;
  }> {
    const viewConditions = videoId 
      ? and(eq(analyticsEvents.videoId, videoId), eq(analyticsEvents.eventType, 'view'))
      : eq(analyticsEvents.eventType, 'view');
    
    const clickConditions = videoId
      ? and(eq(analyticsEvents.videoId, videoId), eq(analyticsEvents.eventType, 'product_click'))
      : eq(analyticsEvents.eventType, 'product_click');

    const viewResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(analyticsEvents)
      .where(viewConditions);
    
    const clickResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(analyticsEvents)
      .where(clickConditions);

    const totalViews = Number(viewResult[0]?.count || 0);
    const totalClicks = Number(clickResult[0]?.count || 0);
    const clickThroughRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

    const topProductsConditions = videoId
      ? and(
          eq(analyticsEvents.videoId, videoId),
          eq(analyticsEvents.eventType, 'product_click'),
          sql`${analyticsEvents.productId} IS NOT NULL`
        )
      : and(
          eq(analyticsEvents.eventType, 'product_click'),
          sql`${analyticsEvents.productId} IS NOT NULL`
        );

    const topProductsResult = await db
      .select({
        productId: analyticsEvents.productId,
        clicks: sql<number>`count(*)`,
        productTitle: products.title,
      })
      .from(analyticsEvents)
      .leftJoin(products, eq(analyticsEvents.productId, products.id))
      .where(topProductsConditions)
      .groupBy(analyticsEvents.productId, products.title)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    const topProducts = topProductsResult.map(row => ({
      productId: row.productId!,
      clicks: Number(row.clicks),
      productTitle: row.productTitle || undefined,
    }));

    return {
      totalViews,
      totalClicks,
      clickThroughRate,
      topProducts,
    };
  }
}

export const storage = new DbStorage();
