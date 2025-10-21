# Shoppable Video Platform

## Overview
A professional admin interface for creating interactive shoppable videos with customizable product carousels. Users can upload videos, place products at specific timestamps, customize the product carousel appearance, and generate embeddable code for any website.

## Core Features
- **Video Library**: Dashboard for managing all shoppable videos
- **Product Inventory**: Product management system with thumbnails, URLs, titles, and prices
- **Video Editor**: Timeline-based editor for placing products at specific timestamps
- **Carousel Customization Suite**: 
  - Position selector (9 positions including top-right, top-center, side-right, etc.)
  - Thumbnail shape options (square, circle, portrait)
  - Corner radius control (0-24px)
  - Content visibility toggles (title, price, description, button)
  - Button styling (text, colors, font size, font weight)
- **Embed Code Generator**: Generates JavaScript embed code for external websites
- **Embeddable Player**: Standalone player with interactive product carousels
- **Analytics Dashboard**: 
  - Real-time tracking of video views and product clicks
  - Click-through rate (CTR) calculation
  - Top performing products analysis
  - Filter analytics by individual video or all videos
  - Automatic event tracking in embed player

## Architecture

### Frontend (React + TypeScript)
- **Pages**:
  - `/` - Video Library (dashboard)
  - `/products` - Product Inventory
  - `/editor/:id` - Video Editor
  - `/analytics` - Analytics Dashboard
  - `/settings` - Application settings
  
- **Components**:
  - Sidebar navigation (sleek, minimal design)
  - Video timeline editor with drag-and-drop
  - Product carousel overlay preview
  - Carousel customization panel

### Backend (Express + PostgreSQL)
- **API Endpoints**:
  - Products: GET/POST/DELETE `/api/products`
  - Videos: GET/POST/PATCH/DELETE `/api/videos`
  - Video publishing: PATCH `/api/videos/:id/publish`
  - File upload: POST `/api/upload/video`
  - Analytics events: POST `/api/analytics/events`
  - Analytics retrieval: GET `/api/analytics/events`, GET `/api/analytics/summary`

### Data Models
- **Product**: id, title, price, description, url, thumbnailUrl
- **Video**: id, title, videoUrl, duration, thumbnailUrl, published, carouselConfig, productPlacements
- **ProductPlacement**: id, productId, startTime, endTime
- **CarouselConfig**: position, thumbnailShape, cornerRadius, visibility flags, button styling
- **AnalyticsEvent**: id, videoId, productId, eventType (view/product_click), timestamp, metadata

## Recent Changes
- Database migration from in-memory to PostgreSQL (October 21, 2025)
  - Neon serverless PostgreSQL with Drizzle ORM
  - Tables: products, videos, analytics_events
  - Persistent storage with auto-generated UUIDs
- Analytics Dashboard implementation (October 21, 2025)
  - Real-time event tracking in embed player
  - Video views and product click tracking
  - CTR calculation and top products analysis
  - Filter by individual video or all videos
- Initial MVP implementation (October 21, 2025)
  - Complete schema-first architecture
  - All frontend components with professional design
  - Timeline-based video editor
  - Carousel customization suite
  - Embed code generation system

## User Preferences
- No authentication required (single-user admin interface)
- Dark mode support via settings
- Sleek, minimal sidebar (14rem width)
- Professional, productivity-focused design system

## Technical Stack
- React 18 with TypeScript
- Wouter for routing
- TanStack Query for data fetching
- Shadcn UI components
- Tailwind CSS for styling
- Express.js backend
- PostgreSQL database (Neon serverless)
- Drizzle ORM for type-safe database operations
- Multer for file uploads

## Default Carousel Configuration
- Position: Top Right
- Thumbnail Shape: Square
- Corner Radius: 0px
- Show Title: No
- Show Price: No
- Show Description: No
- Show Button: No
- Only thumbnails visible by default
