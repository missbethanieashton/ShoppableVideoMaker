import { type Product, type InsertProduct, type Video, type InsertVideo } from "@shared/schema";
import { randomUUID } from "crypto";

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

export class MemStorage implements IStorage {
  private products: Map<string, Product>;
  private videos: Map<string, Video>;

  constructor() {
    this.products = new Map();
    this.videos = new Map();
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = { 
      ...insertProduct, 
      id,
      description: insertProduct.description ?? null 
    };
    this.products.set(id, product);
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    this.products.delete(id);
  }

  async getVideos(): Promise<Video[]> {
    return Array.from(this.videos.values());
  }

  async getVideo(id: string): Promise<Video | undefined> {
    return this.videos.get(id);
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const id = randomUUID();
    const video: Video = { 
      ...insertVideo, 
      id,
      thumbnailUrl: insertVideo.thumbnailUrl ?? null 
    };
    this.videos.set(id, video);
    return video;
  }

  async updateVideo(id: string, updates: Partial<InsertVideo>): Promise<Video> {
    const existing = this.videos.get(id);
    if (!existing) {
      throw new Error("Video not found");
    }
    const updated: Video = { ...existing, ...updates };
    this.videos.set(id, updated);
    return updated;
  }

  async publishVideo(id: string): Promise<Video> {
    const existing = this.videos.get(id);
    if (!existing) {
      throw new Error("Video not found");
    }
    const updated: Video = { ...existing, published: true };
    this.videos.set(id, updated);
    return updated;
  }

  async deleteVideo(id: string): Promise<void> {
    this.videos.delete(id);
  }
}

export const storage = new MemStorage();
