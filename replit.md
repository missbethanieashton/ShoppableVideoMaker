# Shoppable Video Platform

## Overview
A professional admin interface designed for creating interactive shoppable videos. The platform allows users to upload videos, strategically place products at specific timestamps within the video, extensively customize the appearance of product carousels, and generate embeddable code for seamless integration into any website. The core purpose is to transform passive video content into engaging, direct-to-purchase experiences.

## User Preferences
- No authentication required (single-user admin interface)
- Dark mode support via settings
- Sleek, minimal sidebar (14rem width)
- Professional, productivity-focused design system

## System Architecture

### UI/UX Decisions
The platform features a professional, productivity-focused design. The admin interface is built with React and TypeScript, leveraging Shadcn UI components and Tailwind CSS for a sleek and minimal aesthetic. Key UI elements include a compact sidebar navigation, a reusable drag-and-drop file upload component with previews, an interactive timeline for video editing, and a comprehensive carousel customization panel. The design prioritizes clear visual feedback, especially during drag-and-drop operations and real-time preview of carousel overlays.

### Technical Implementations
The frontend is built with React 18 and TypeScript, using Wouter for routing and TanStack Query for data fetching. The backend is an Express.js application connected to a PostgreSQL database (Neon serverless) via Drizzle ORM for type-safe operations. Multer handles file uploads.

### Feature Specifications
- **Video Library**: Dashboard for managing all shoppable videos.
- **Product Inventory**: System for managing product details (thumbnails, URLs, titles, prices).
- **File Upload System**: Drag-and-drop functionality for images and videos with validation, live previews, and error handling.
- **Video Editor**: Timeline-based editor enabling product placement at specific timestamps, with draggable/resizable placements (minimum 1-second duration) and real-time carousel overlay preview.
- **Carousel Customization Suite**: Extensive controls for carousel appearance, including position, thumbnail shape/size, width, corner radius, background transparency, border visibility, animation effects (None, Hover, Float, Pulse), and content visibility toggles (title, price, description, button). Button styling (text, colors, font size, font weight, border radius, layering) and precise spacing controls (carousel padding, thumbnail-content padding, content-button gap) are included, with support for negative values for overlap effects.
- **Embed Code Generator**: Produces JavaScript embed code with one-click copy functionality after publishing.
- **Embeddable Player**: Standalone player capable of rendering interactive product carousels configured by the admin interface.
- **Analytics Dashboard**: Tracks video views and product clicks in real-time, calculates CTR, and analyzes top-performing products, with filtering capabilities.

### System Design Choices
The architecture is schema-first, ensuring data consistency. The application uses a robust API for managing products, videos, uploads, publishing, and analytics events. Carousel configurations are stored persistently, with backward compatibility mechanisms for new fields. All URLs for video files and product thumbnails are converted to absolute URLs for external website compatibility, and CORS headers are explicitly configured for uploaded assets.

## External Dependencies
- **PostgreSQL**: Primary database for persistent storage (using Neon serverless).
- **Drizzle ORM**: Type-safe database interaction layer.
- **Multer**: Middleware for handling multipart/form-data, primarily for file uploads.
- **Google Fonts / CDN Fonts**: Used for custom font families in carousel typography.

## Recent Changes
- **Added Delete Video Functionality** (October 22, 2025)
  - Delete button with Trash icon added to each video card in Video Library
  - Confirmation dialog prevents accidental deletions
  - Success/error toast notifications for user feedback
  - Automatic cache invalidation refreshes video list after deletion
  - DELETE endpoint already existed in backend, connected to UI
  - E2E tested: confirmation flow, API integration, UI updates

- **Fixed Responsive Carousel Sizing in Embed Player** (October 22, 2025)
  - **ROOT CAUSE**: Carousel used fixed pixel width (250px) while video could be any size
  - On large videos (1000px+), 250px carousel appeared microscopic and unusable
  - **FIX**: Changed to percentage-based width that scales with video size
  - Formula: `(configuredWidth / 640) * 100%` with maxWidth cap and 150px minimum
  - Example: 250px config = 39% of video width, capped at 250px max, minimum 150px
  - Carousel now properly sized and visible on all video sizes

- **Fixed Missing Add Product Dialog** (October 22, 2025)
  - Add Product and Publish dialogs were missing from JSX return statement
  - Dialog components now properly rendered, making "Add Product" button functional
  - Both dialogs include proper styling, scroll areas, and user feedback

- **Complete Config-Aware Cache System** (October 22, 2025)
  - Cache key now includes full `JSON.stringify(carouselConfig)` hash
  - ANY configuration change (width, padding, colors, visibility, borders, etc.) invalidates carousel cache
  - Prevents stale styling while maintaining performance during playback
  - Config changes automatically create fresh DOM elements with updated styling

## Previous Changes
- **Fixed Carousel Sizing in Embed Player** (October 22, 2025)
  - Removed `min(95%, ...)` width constraint that was shrinking carousel
  - Applied absolute sizing: carousel now renders at exact configured width
  - Added `maxWidth: 'none'` to prevent parent CSS overrides
  - Added `minWidth` to ensure carousel never shrinks below configured size
  - Synced editor preview and embed player to use identical sizing logic
  - Carousel now displays at full configured size (250px) instead of microscopic size

- **Fixed Flashing Carousel Bug** (October 22, 2025)
  - Implemented carousel DOM element caching to prevent recreation on every frame
  - Added `carouselCache` Map to persist carousel elements by placement ID
  - Only create/remove carousels when placements actually change (not on every timeupdate event)
  - Eliminated DOM thrashing that caused flashing and micro-sizing issues

- **Auto-Refreshing Embed Code** (October 22, 2025)
  - Embed code now automatically refreshes after every save click
  - Embed code section auto-expands to show updated code
  - Timestamp display shows "Updated: [time]" for last refresh
  - Toast notification confirms "Embed code updated with latest changes"
  - All styling and modifications immediately reflected in embed code
  - Ensures external websites always have latest configuration
  
- **Pixel Adjustment Controls with Negative Values** (October 22, 2025)
  - Renamed thumbnailContentGap → thumbnailContentPadding
  - Replaced sliders with number inputs (up/down arrows)
  - All spacing controls support negative values for overlap effects
  - Database migration completed for existing videos
  - Input handlers use valueAsNumber for proper keyboard entry
  
- **Button Layering Feature** (October 22, 2025)
  - Added Button Layer dropdown (Forward/Backward)
  - Forward: Button appears on top (z-index: 10)
  - Backward: Thumbnail appears on top (z-index: 10)
  - Works in both editor preview and embedded player