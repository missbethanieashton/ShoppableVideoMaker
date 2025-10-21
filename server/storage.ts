import { type Product, type InsertProduct, type Video, type InsertVideo, products, videos } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

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
}

export const storage = new DbStorage();
