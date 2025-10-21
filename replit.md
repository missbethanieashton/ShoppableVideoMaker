# Shoppable Video Platform

## Overview
A professional admin interface for creating interactive shoppable videos with customizable product carousels. Users can upload videos, place products at specific timestamps, customize the product carousel appearance, and generate embeddable code for any website.

## Core Features
- **Video Library**: Dashboard for managing all shoppable videos
- **Product Inventory**: Product management system with thumbnails, URLs, titles, and prices
- **File Upload System**: 
  - Drag-and-drop file upload for product thumbnails, videos, and video thumbnails
  - File type validation (images: jpg/png/webp; videos: mp4/webm/mov)
  - File size limits (10MB for images, 100MB for videos)
  - Live preview of uploaded files
  - Error handling with user-friendly messages
- **Video Editor**: 
  - Timeline-based editor for placing products at specific timestamps
  - Drag-and-drop product placements to adjust timing
  - Resizable placements with left/right edge handles
  - Real-time preview of carousel overlay on video
  - Visual timeline with product thumbnails
  - Minimum 1-second placement duration enforced
- **Carousel Customization Suite**: 
  - Position selector (9 positions including top-right, top-center, side-right, etc.)
  - Thumbnail shape options (square, circle, portrait)
  - Thumbnail size slider (32-128px, default 64px)
  - Corner radius control (0-24px)
  - Content visibility toggles (title, price, description, button)
  - Button styling (text, colors, font size, font weight, border radius)
- **Embed Code Generator**: 
  - Generates JavaScript embed code after publishing
  - Shows embed code in publish dialog
  - One-click copy to clipboard functionality
  - Embed code includes video player initialization script
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
  - FileUpload component (reusable drag-and-drop with previews)
  - Interactive timeline with draggable/resizable product placements
  - Product carousel overlay preview
  - Carousel customization panel
  - Publish dialog with embed code display

### Backend (Express + PostgreSQL)
- **API Endpoints**:
  - Products: GET/POST/DELETE `/api/products`
  - Videos: GET/POST/PATCH/DELETE `/api/videos`
  - Video publishing: PATCH `/api/videos/:id/publish`
  - File uploads: POST `/api/upload/image`, POST `/api/upload/video`
  - Analytics events: POST `/api/analytics/events`
  - Analytics retrieval: GET `/api/analytics/events`, GET `/api/analytics/summary`

### Data Models
- **Product**: id, title, price, description, url, thumbnailUrl
- **Video**: id, title, videoUrl, duration, thumbnailUrl, published, carouselConfig, productPlacements
- **ProductPlacement**: id, productId, startTime, endTime
- **CarouselConfig**: position, thumbnailShape, thumbnailSize, cornerRadius, visibility flags, button styling (including buttonBorderRadius)
- **AnalyticsEvent**: id, videoId, productId, eventType (view/product_click), timestamp, metadata

## Recent Changes
- Carousel Styling Bug Fixes & Enhancements (October 21, 2025)
  - **Critical Bug Fix**: Added NaN validation to number inputs (buttonFontSize, buttonBorderRadius, thumbnailSize) to prevent app crashes when inputs are cleared
  - **New Feature**: Thumbnail size slider (32-128px, step 4px, default 64px) with real-time preview
  - **New Feature**: Button border radius control added to UI (was in schema but missing from interface)
  - **Bug Fix**: Fixed query cache invalidation - save now properly refreshes UI with latest backend data
  - **Bug Fix**: Carousel config now merges with defaults on load, ensuring backward compatibility for videos created before new fields were added
  - Dynamic thumbnail sizing applies to all shapes (square, circle, portrait) in both editor preview and embed player
  - Database migration: All existing videos updated with thumbnailSize field (default 64px)
- Video Editor Enhancements (October 21, 2025)
  - Draggable product placements on timeline with smooth cursor tracking
  - Resizable placements via edge handles (minimum 1 second duration)
  - Selected placement syncs with sidebar for live timing updates
  - Publish dialog shows embed code with copy-to-clipboard
  - Visual feedback for drag/resize operations (cursor changes, selection ring)
- File Upload System (October 21, 2025)
  - Replaced URL inputs with drag-and-drop file upload
  - FileUpload component with preview and error handling
  - Backend validation for file types and sizes
  - Files stored in uploads/ directory
  - Multer configured with separate instances for images/videos
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
- Thumbnail Size: 64px
- Corner Radius: 0px
- Show Title: No
- Show Price: No
- Show Description: No
- Show Button: No
- Button Border Radius: 4px
- Only thumbnails visible by default
