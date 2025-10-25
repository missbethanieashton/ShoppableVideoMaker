# ShoppableVideoMaker to Materialized SaaS - Migration Guide

## Overview
This guide details how to integrate the working video upload, product inventory, and video editor features from ShoppableVideoMaker into your Materialized SaaS application.

## Table of Contents
1. [Database Schema Integration](#database-schema-integration)
2. [Backend Routes Integration](#backend-routes-integration)
3. [File Upload System](#file-upload-system)
4. [Frontend Components](#frontend-components)
5. [Embed Player Integration](#embed-player-integration)
6. [New Features to Add](#new-features-to-add)
7. [Testing and Verification](#testing-and-verification)

---

## 1. Database Schema Integration

### Current Differences

**ShoppableVideoMaker Schema (simplified):**
- `products`: Simple structure with `id`, `title`, `price`, `description`, `url`, `thumbnailUrl`
- `videos`: Has `carouselConfig` (jsonb) and `productPlacements` (jsonb array)
- `analyticsEvents`: Basic event tracking

**Materialized SaaS Schema (complex):**
- `products`: Has `userId`, `category`, `productType`, `color`, `style`, `isActive`, and more
- `videos`: Has `userId`, `status`, `aiAnalysis`, `distributionSettings`, affiliate tracking
- `analytics`: More comprehensive tracking

### Integration Strategy

**Option A: Keep Materialized SaaS schema** (Recommended)
The Materialized SaaS schema is more comprehensive. You just need to ensure the `videos` table has the carousel fields.

### Step 1: Update Videos Table

Add these fields to the `videos` table in `shared/schema.ts` if they're missing:

```typescript
// In videos table, ensure these fields exist:
carouselConfig: jsonb("carousel_config").$type<CarouselConfig>(),
productPlacements: jsonb("product_placements").$type<ProductPlacement[]>().default("[]"),
```

### Step 2: Add carousel configuration types

Add this to `shared/schema.ts` (before the videos table definition):

```typescript
// Carousel configuration enums and types
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
export const buttonLayers = ["forward", "backward"] as const;
export const fontStyles = ["normal", "italic", "bold", "bold-italic"] as const;
export const fontFamilies = ["default", "league-spartan", "glacial-indifference", "lacquer"] as const;
export const textAnimations = ["none", "typewriter-slow", "typewriter-medium", "typewriter-fast", "glow"] as const;

export type CarouselPosition = typeof carouselPositions[number];
export type ThumbnailShape = typeof thumbnailShapes[number];
export type CarouselAnimation = typeof carouselAnimations[number];
export type ButtonPosition = typeof buttonPositions[number];
export type ButtonLayer = typeof buttonLayers[number];
export type FontStyle = typeof fontStyles[number];
export type FontFamily = typeof fontFamilies[number];
export type TextAnimation = typeof textAnimations[number];

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
  buttonLayer: ButtonLayer;
  titleFontStyle: FontStyle;
  titleFontFamily: FontFamily;
  titleColor: string;
  priceFontFamily: FontFamily;
  priceColor: string;
  thumbnailContentPadding: number; // Padding between thumbnail and content in pixels (supports negative for overlap, e.g., -15px)
  contentButtonGap: number; // Gap between content and button in pixels (supports negative for overlap)
  carouselPadding: number; // Inner padding of carousel container (supports negative values)
  textAnimation: TextAnimation; // Animation for title, price, and button text
  enableScroll: boolean; // Enable scrolling between title, price, and button text
}

// Product placement schema (products on timeline)
export interface ProductPlacement {
  id: string;
  productId: string;
  startTime: number;
  endTime: number;
}

// Default carousel configuration
export const defaultCarouselConfig: CarouselConfig = {
  position: "top-right",
  thumbnailShape: "square",
  thumbnailSize: 64,
  carouselWidth: 250,
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
  buttonLayer: "forward",
  titleFontStyle: "normal",
  titleFontFamily: "default",
  titleColor: "#000000",
  priceFontFamily: "default",
  priceColor: "#6366f1",
  thumbnailContentPadding: 12,
  contentButtonGap: 12,
  carouselPadding: 12,
  textAnimation: "none",
  enableScroll: false,
};
```

### Step 3: Add carousel config schema

After the video table, add the Zod schema for carousel configuration:

```typescript
export const carouselConfigSchema = z.object({
  position: z.enum(carouselPositions),
  thumbnailShape: z.enum(thumbnailShapes),
  thumbnailSize: z.number().min(32).max(250),
  carouselWidth: z.number().min(32).max(500),
  cornerRadius: z.number().min(0).max(50),
  transparentBackground: z.boolean(),
  showBorder: z.boolean(),
  animation: z.enum(carouselAnimations),
  showTitle: z.boolean(),
  showPrice: z.boolean(),
  showDescription: z.boolean(),
  showButton: z.boolean(),
  buttonText: z.string(),
  buttonBackgroundColor: z.string(),
  buttonTextColor: z.string(),
  buttonFontSize: z.number().min(8).max(32),
  buttonFontWeight: z.string(),
  buttonFontStyle: z.enum(fontStyles),
  buttonFontFamily: z.enum(fontFamilies),
  buttonBorderRadius: z.number().min(0).max(50),
  buttonPosition: z.enum(buttonPositions),
  buttonLayer: z.enum(buttonLayers),
  titleFontStyle: z.enum(fontStyles),
  titleFontFamily: z.enum(fontFamilies),
  titleColor: z.string(),
  priceFontFamily: z.enum(fontFamilies),
  priceColor: z.string(),
  thumbnailContentPadding: z.number().min(-50).max(100),
  contentButtonGap: z.number().min(-50).max(100),
  carouselPadding: z.number().min(-50).max(100),
  textAnimation: z.enum(["none", "typewriter-slow", "typewriter-medium", "typewriter-fast", "glow"]),
  enableScroll: z.boolean(),
});
```

### Step 4: Run database migration

After updating the schema, run:

```bash
npm run db:push
```

If you get data-loss warnings, use:

```bash
npm run db:push --force
```

---

## 2. Backend Routes Integration

### Video Upload Routes

In `server/routes.ts`, add the multer configuration and upload endpoints.

#### Step 1: Add multer import and configuration

At the top of `routes.ts`, add:

```typescript
import multer from "multer";
import path from "path";
```

Then add these file filter functions and multer setup:

```typescript
const imageFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and WEBP images are allowed.'));
  }
};

const videoFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['video/mp4', 'video/webm', 'video/quicktime'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only MP4, WEBM, and MOV videos are allowed.'));
  }
};

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const imageUpload = multer({
  storage: diskStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const videoUpload = multer({
  storage: diskStorage,
  fileFilter: videoFileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});
```

#### Step 2: Add upload directory serving

In your `registerRoutes` function, add this before your API routes:

```typescript
// Serve uploads directory with explicit CORS headers for embed compatibility
app.use("/uploads", (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
}, express.static("uploads"));
```

#### Step 3: Add upload endpoints

```typescript
// Image upload endpoint
app.post("/api/upload/image", (req, res) => {
  imageUpload.single("image")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "File too large. Maximum size is 10MB." });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  });
});

// Video upload endpoint
app.post("/api/upload/video", (req, res) => {
  videoUpload.single("video")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "File too large. Maximum size is 100MB." });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const videoUrl = `/uploads/${req.file.filename}`;
    const duration = 0; // You can extract duration if needed

    res.json({ 
      videoUrl,
      duration,
      filename: req.file.filename
    });
  });
});
```

#### Step 4: Update video routes to support carousel config

Ensure your GET `/api/videos/:id` endpoint merges carousel config with defaults:

```typescript
app.get("/api/videos/:id", async (req, res) => {
  try {
    const video = await storage.getVideo(req.params.id);
    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }
    
    // Merge carousel config with defaults for backward compatibility
    const videoWithDefaults = {
      ...video,
      carouselConfig: { ...defaultCarouselConfig, ...video.carouselConfig }
    };
    
    // Convert relative URLs to absolute URLs for embed compatibility
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const baseUrl = `${protocol}://${host}`;
    
    const absoluteVideo = {
      ...videoWithDefaults,
      videoUrl: videoWithDefaults.videoUrl.startsWith('http') ? videoWithDefaults.videoUrl : `${baseUrl}${videoWithDefaults.videoUrl}`,
      thumbnailUrl: videoWithDefaults.thumbnailUrl && !videoWithDefaults.thumbnailUrl.startsWith('http') 
        ? `${baseUrl}${videoWithDefaults.thumbnailUrl}` 
        : videoWithDefaults.thumbnailUrl
    };
    
    res.json(absoluteVideo);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch video" });
  }
});
```

#### Step 5: Create uploads directory

Create an `uploads/` directory in your project root:

```bash
mkdir uploads
```

Add to `.gitignore`:

```
uploads/
```

---

## 3. File Upload System

### FileUpload Component

Create `client/src/components/ui/file-upload.tsx` if it doesn't exist:

```typescript
import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, X, Image as ImageIcon, Film, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  type: "image" | "video";
  value?: string;
  onChange: (url: string) => void;
  className?: string;
}

export function FileUpload({ type, value, onChange, className }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(value);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const accept = type === "image" 
    ? "image/jpeg,image/png,image/webp,image/jpg"
    : "video/mp4,video/webm,video/quicktime";

  const endpoint = type === "image" ? "/api/upload/image" : "/api/upload/video";

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append(type, file);

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      const url = type === "image" ? data.imageUrl : data.videoUrl;
      
      setPreview(url);
      onChange(url);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      setError(errorMessage);
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(undefined);
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  if (preview) {
    return (
      <div className={cn("relative rounded-md overflow-hidden border", className)}>
        {type === "image" ? (
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover"
          />
        ) : (
          <video
            src={preview}
            className="w-full h-48 object-cover"
            controls
          />
        )}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
          onClick={handleRemove}
          data-testid="button-remove-file"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-colors",
          isDragging && "border-primary bg-primary/5",
          isUploading && "opacity-50 cursor-not-allowed",
          error && "border-destructive"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        data-testid="dropzone-file-upload"
      >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
        data-testid="input-file-upload"
      />
      
      <div className="flex flex-col items-center gap-2">
        {type === "image" ? (
          <ImageIcon className="w-10 h-10 text-muted-foreground" />
        ) : (
          <Film className="w-10 h-10 text-muted-foreground" />
        )}
        
        {isUploading ? (
          <div className="text-sm">
            <p className="font-medium">Uploading...</p>
            <p className="text-muted-foreground">Please wait</p>
          </div>
        ) : (
          <div className="text-sm">
            <p className="font-medium">
              Drop {type} here or click to browse
            </p>
            <p className="text-muted-foreground mt-1">
              {type === "image" ? "PNG, JPG, WEBP up to 10MB" : "MP4, WEBM up to 100MB"}
            </p>
          </div>
        )}
        
        <Upload className="w-4 h-4 text-muted-foreground" />
      </div>
      </div>
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive" data-testid="text-upload-error">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
```

---

## 4. Frontend Components

### Video Editor Integration

You need to copy the entire `video-editor.tsx` component from ShoppableVideoMaker to Materialized SaaS.

**File to copy:** `client/src/pages/video-editor.tsx` (1668 lines)

**Location:** Place it in `client/src/pages/VideoEditor.tsx` (or appropriate naming for your project)

**Key features this component provides:**
- Video upload with drag-and-drop
- Timeline-based product placement editor
- Carousel customization panel
- Live preview of carousel overlay
- Embed code generation
- Download preview functionality

**Important adjustments needed:**

1. **Authentication integration**: Add user context if needed:

```typescript
// At top of component
import { useUser } from "@/contexts/UserContext"; // If you have this

// Inside component
const { user } = useUser();

// Then when creating video:
const data: InsertVideo = {
  userId: user?.id, // Add user ID
  title: videoTitle,
  videoUrl: videoFile || "",
  // ... rest of fields
};
```

2. **Routing adjustment**: Update imports to match your routing setup.

### Product Inventory Integration

The existing Materialized SaaS `ProductInventory.tsx` page should work, but you may want to add the simpler product creation form from ShoppableVideoMaker if needed.

**Key change needed:**

Ensure products can be created with just the essential fields (`title`, `price`, `url`, `thumbnailUrl`). The ShoppableVideoMaker version is simpler and works well for the video editor use case.

---

## 5. Embed Player Integration

### Step 1: Copy embed.js file

Copy `public/embed.js` from ShoppableVideoMaker to your Materialized SaaS `public/` directory.

This file provides:
- Carousel rendering with full configuration support
- Product click tracking
- Animation support (hover, float, pulse)
- Text animations (typewriter, glow)
- Responsive carousel sizing
- Font loading for custom typography

### Step 2: Update embed.js if using different API structure

If your Materialized SaaS uses different API endpoints, update the URLs in `embed.js`:

```javascript
// Change this line (around line 195):
fetch(`${apiUrl}/videos/${videoId}`)

// And this line (around line 320):
fetch(`${this.apiUrl}/products/${placement.productId}`)

// And analytics (around line 212):
fetch(`${this.apiUrl}/analytics/events`, {
```

Make sure these match your actual API routes.

### Step 3: Test embed code generation

The embed code format is:

```html
<div id="shoppable-video-container"></div>
<script src="https://your-domain.com/embed.js"></script>
<script>
  ShoppableVideo.init({
    containerId: 'shoppable-video-container',
    videoId: 'your-video-id',
    apiUrl: 'https://your-domain.com/api'
  });
</script>
```

---

## 6. New Features to Add

You mentioned wanting these additional features. Here's the specification for each:

### 6.1 Live Preview Panel with iPhone/Desktop Views

**Location:** `client/src/pages/video-editor.tsx`

**Implementation:** Add a preview mode selector and responsive preview container.

```typescript
// Add state for preview mode
const [previewMode, setPreviewMode] = useState<"desktop" | "iphone">("desktop");

// Add preview container with device frames
<div className="space-y-4">
  <div className="flex items-center gap-2">
    <Label>Preview Mode</Label>
    <Select value={previewMode} onValueChange={(v) => setPreviewMode(v as "desktop" | "iphone")}>
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="desktop">Desktop</SelectItem>
        <SelectItem value="iphone">iPhone</SelectItem>
      </SelectContent>
    </Select>
  </div>
  
  <div className={cn(
    "mx-auto bg-background rounded-lg overflow-hidden",
    previewMode === "iphone" ? "max-w-[375px]" : "max-w-full"
  )}>
    {previewMode === "iphone" && (
      <div className="bg-slate-900 h-8 rounded-t-2xl flex items-center justify-center">
        <div className="w-24 h-5 bg-slate-950 rounded-full" /> {/* Notch */}
      </div>
    )}
    
    {/* Your existing video preview */}
    <div className="video-preview-container relative">
      {/* Video and carousel */}
    </div>
  </div>
</div>
```

### 6.2 Video Player Border Customization

**Add to CarouselConfig interface:**

```typescript
export interface CarouselConfig {
  // ... existing fields ...
  
  // Video player border options
  playerBorderWidth: number; // 0-20px
  playerBorderColor: string; // Hex color
  playerBorderRadius: number; // 0-50px
  playerShadow: boolean; // Enable/disable shadow
}
```

**Add to defaultCarouselConfig:**

```typescript
playerBorderWidth: 0,
playerBorderColor: "#000000",
playerBorderRadius: 0,
playerShadow: false,
```

**Add controls in video editor:**

```typescript
<div className="space-y-4">
  <h3 className="font-semibold">Video Player Border</h3>
  
  <div className="space-y-2">
    <Label>Border Width: {carouselConfig.playerBorderWidth}px</Label>
    <Slider
      value={[carouselConfig.playerBorderWidth]}
      onValueChange={([value]) => setCarouselConfig({...carouselConfig, playerBorderWidth: value})}
      min={0}
      max={20}
      step={1}
    />
  </div>
  
  <div className="space-y-2">
    <Label>Border Color</Label>
    <Input
      type="color"
      value={carouselConfig.playerBorderColor}
      onChange={(e) => setCarouselConfig({...carouselConfig, playerBorderColor: e.target.value})}
    />
  </div>
  
  <div className="space-y-2">
    <Label>Corner Radius: {carouselConfig.playerBorderRadius}px</Label>
    <Slider
      value={[carouselConfig.playerBorderRadius]}
      onValueChange={([value]) => setCarouselConfig({...carouselConfig, playerBorderRadius: value})}
      min={0}
      max={50}
      step={1}
    />
  </div>
  
  <div className="flex items-center space-x-2">
    <Switch
      checked={carouselConfig.playerShadow}
      onCheckedChange={(checked) => setCarouselConfig({...carouselConfig, playerShadow: checked})}
    />
    <Label>Drop Shadow</Label>
  </div>
</div>
```

**Apply to video preview:**

```typescript
// In video preview section
<video
  ref={videoRef}
  src={videoFile || ""}
  className="w-full"
  style={{
    borderWidth: `${carouselConfig.playerBorderWidth}px`,
    borderColor: carouselConfig.playerBorderColor,
    borderStyle: 'solid',
    borderRadius: `${carouselConfig.playerBorderRadius}px`,
    boxShadow: carouselConfig.playerShadow ? '0 10px 40px rgba(0,0,0,0.3)' : 'none'
  }}
  onTimeUpdate={handleTimeUpdate}
  onLoadedMetadata={() => {
    if (videoRef.current) {
      setVideoDuration(Math.round(videoRef.current.duration));
    }
  }}
/>
```

### 6.3 Brand Logo Upload and Positioning

**Add to CarouselConfig interface:**

```typescript
export interface CarouselConfig {
  // ... existing fields ...
  
  // Brand logo options
  logoUrl: string | null;
  logoPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  logoSize: number; // 20-200px
  logoOpacity: number; // 0-100
}
```

**Add controls:**

```typescript
<div className="space-y-4">
  <h3 className="font-semibold">Brand Logo</h3>
  
  <div className="space-y-2">
    <Label>Logo Image</Label>
    <FileUpload
      type="image"
      value={carouselConfig.logoUrl || ""}
      onChange={(url) => setCarouselConfig({...carouselConfig, logoUrl: url})}
    />
  </div>
  
  {carouselConfig.logoUrl && (
    <>
      <div className="space-y-2">
        <Label>Position</Label>
        <Select 
          value={carouselConfig.logoPosition} 
          onValueChange={(v) => setCarouselConfig({...carouselConfig, logoPosition: v})}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="top-left">Top Left</SelectItem>
            <SelectItem value="top-right">Top Right</SelectItem>
            <SelectItem value="bottom-left">Bottom Left</SelectItem>
            <SelectItem value="bottom-right">Bottom Right</SelectItem>
            <SelectItem value="center">Center</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>Size: {carouselConfig.logoSize}px</Label>
        <Slider
          value={[carouselConfig.logoSize]}
          onValueChange={([value]) => setCarouselConfig({...carouselConfig, logoSize: value})}
          min={20}
          max={200}
          step={5}
        />
      </div>
      
      <div className="space-y-2">
        <Label>Opacity: {carouselConfig.logoOpacity}%</Label>
        <Slider
          value={[carouselConfig.logoOpacity]}
          onValueChange={([value]) => setCarouselConfig({...carouselConfig, logoOpacity: value})}
          min={0}
          max={100}
          step={5}
        />
      </div>
    </>
  )}
</div>
```

**Render logo overlay:**

```typescript
// Add this after the video element
{carouselConfig.logoUrl && (
  <div 
    className="absolute pointer-events-none"
    style={{
      ...(carouselConfig.logoPosition === "top-left" && { top: '16px', left: '16px' }),
      ...(carouselConfig.logoPosition === "top-right" && { top: '16px', right: '16px' }),
      ...(carouselConfig.logoPosition === "bottom-left" && { bottom: '16px', left: '16px' }),
      ...(carouselConfig.logoPosition === "bottom-right" && { bottom: '16px', right: '16px' }),
      ...(carouselConfig.logoPosition === "center" && { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }),
    }}
  >
    <img
      src={carouselConfig.logoUrl}
      alt="Brand logo"
      style={{
        width: `${carouselConfig.logoSize}px`,
        height: 'auto',
        opacity: carouselConfig.logoOpacity / 100
      }}
    />
  </div>
)}
```

### 6.4 Enhanced Text Effects (Glow, Backlit)

Text animations already support "glow" effect. To add more effects:

**Update textAnimations in schema:**

```typescript
export const textAnimations = [
  "none", 
  "typewriter-slow", 
  "typewriter-medium", 
  "typewriter-fast", 
  "glow",
  "backlit", // New
  "neon", // New
  "shimmer" // New
] as const;
```

**Add CSS animations to embed.js:**

```css
@keyframes backlit {
  0%, 100% {
    text-shadow: 0 0 10px rgba(255,255,255,0.5), 0 2px 4px rgba(0,0,0,0.8);
  }
  50% {
    text-shadow: 0 0 20px rgba(255,255,255,0.8), 0 4px 8px rgba(0,0,0,0.9);
  }
}

@keyframes neon {
  0%, 100% {
    text-shadow: 0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor;
  }
  50% {
    text-shadow: 0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor, 0 0 40px currentColor;
  }
}

@keyframes shimmer {
  0% {
    background-position: -100% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.text-backlit {
  animation: backlit 3s ease-in-out infinite;
}

.text-neon {
  animation: neon 1.5s ease-in-out infinite;
}

.text-shimmer {
  background: linear-gradient(90deg, currentColor 0%, rgba(255,255,255,0.8) 50%, currentColor 100%);
  background-size: 200% auto;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer 3s linear infinite;
}
```

### 6.5 Advanced Carousel Transparency

You already have `transparentBackground` boolean. To add more control:

**Update interface:**

```typescript
export interface CarouselConfig {
  // ... existing fields ...
  
  // Replace transparentBackground with opacity control
  carouselOpacity: number; // 0-100 (percentage)
  thumbnailOpacity: number; // 0-100
  buttonOpacity: number; // 0-100
}
```

**Add controls:**

```typescript
<div className="space-y-4">
  <h3 className="font-semibold">Transparency Controls</h3>
  
  <div className="space-y-2">
    <Label>Carousel Opacity: {carouselConfig.carouselOpacity}%</Label>
    <Slider
      value={[carouselConfig.carouselOpacity]}
      onValueChange={([value]) => setCarouselConfig({...carouselConfig, carouselOpacity: value})}
      min={0}
      max={100}
      step={5}
    />
  </div>
  
  <div className="space-y-2">
    <Label>Thumbnail Opacity: {carouselConfig.thumbnailOpacity}%</Label>
    <Slider
      value={[carouselConfig.thumbnailOpacity]}
      onValueChange={([value]) => setCarouselConfig({...carouselConfig, thumbnailOpacity: value})}
      min={0}
      max={100}
      step={5}
    />
  </div>
  
  <div className="space-y-2">
    <Label>Button Opacity: {carouselConfig.buttonOpacity}%</Label>
    <Slider
      value={[carouselConfig.buttonOpacity]}
      onValueChange={([value]) => setCarouselConfig({...carouselConfig, buttonOpacity: value})}
      min={0}
      max={100}
      step={5}
    />
  </div>
</div>
```

---

## 7. Testing and Verification

### Checklist

1. **Database Migration**
   - [ ] Schema updated with carousel fields
   - [ ] `npm run db:push` successful
   - [ ] Can create videos with carousel config

2. **File Upload**
   - [ ] Image upload works (drag-and-drop and click)
   - [ ] Video upload works
   - [ ] Files saved in `uploads/` directory
   - [ ] URLs returned correctly

3. **Video Editor**
   - [ ] Can create new video
   - [ ] Can upload video file
   - [ ] Can add products to timeline
   - [ ] Can drag/resize product placements
   - [ ] Carousel customization works
   - [ ] Live preview shows carousel overlay
   - [ ] Can save video

4. **Embed Code**
   - [ ] Embed code generated correctly
   - [ ] Copy to clipboard works
   - [ ] Embed code works on external website
   - [ ] Product clicks tracked in analytics

5. **New Features**
   - [ ] Live preview with iPhone/Desktop modes
   - [ ] Video player border customization
   - [ ] Logo upload and positioning
   - [ ] Enhanced text effects
   - [ ] Advanced transparency controls

---

## Summary

This migration guide provides:
1. Complete database schema updates
2. Backend route integration for file uploads
3. Frontend components (FileUpload, VideoEditor)
4. Embed player integration
5. Specifications for new features

**Estimated time:** 4-8 hours depending on your familiarity with the codebase.

**Key files to modify in Materialized SaaS:**
- `shared/schema.ts` - Add carousel types and interfaces
- `server/routes.ts` - Add upload endpoints
- `client/src/components/ui/file-upload.tsx` - Create component
- `client/src/pages/VideoEditor.tsx` - Copy from ShoppableVideoMaker
- `public/embed.js` - Copy from ShoppableVideoMaker

**Testing priority:**
1. File uploads (core functionality)
2. Video editor with product placements
3. Carousel customization and preview
4. Embed code generation and external playback
5. New features (Live Preview, branding, etc.)

Good luck with the migration! Let me know if you need clarification on any step.
