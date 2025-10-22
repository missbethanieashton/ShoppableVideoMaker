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