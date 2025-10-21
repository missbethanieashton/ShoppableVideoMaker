# Design Guidelines: Shoppable Video Platform Admin Interface

## Design Approach
**Selected Approach**: Design System (Productivity-Focused)  
**Reference Products**: Linear (workflow clarity), Figma (canvas-based editing), YouTube Studio (video management)  
**Design System Foundation**: Custom system inspired by Linear's precision + Material Design's component patterns

**Core Principle**: Maximize workspace, minimize chrome. Every pixel serves the editing workflow.

---

## Color Palette

### Dark Mode (Primary)
- **Background Layers**: 
  - Canvas: 220 15% 8%
  - Surface: 220 15% 12%
  - Elevated: 220 15% 16%
- **Primary Brand**: 250 85% 65% (vibrant purple for actions)
- **Accent**: 190 85% 55% (cyan for highlights/selections)
- **Text**: 
  - Primary: 220 10% 95%
  - Secondary: 220 10% 70%
  - Tertiary: 220 10% 50%
- **Borders**: 220 15% 20%
- **Success**: 142 70% 50%
- **Danger**: 0 70% 60%

---

## Typography
**Font Stack**: Inter (via Google Fonts CDN)  
- **Interface**: 400, 500, 600 weights
- **Hierarchy**:
  - Page Headers: 24px/600
  - Section Headers: 18px/600
  - Body: 14px/400
  - Labels: 13px/500
  - Captions: 12px/400

---

## Layout System
**Spacing Units**: Use Tailwind units **2, 3, 4, 6, 8, 12** exclusively for consistency
- Component padding: p-4 or p-6
- Section gaps: gap-4, gap-6, gap-8
- Margins between major sections: mb-8, mb-12

**Grid Structure**:
- Thin sidebar: 56px collapsed, 240px expanded
- Main canvas: flex-1 with max-w-none
- Timeline: Fixed height 120px at bottom when in editing mode
- Product inventory panel: 320px wide when open

---

## Component Library

### Navigation Sidebar
- **Collapsed state (default)**: 56px wide, icon-only with tooltips
- **Expanded state**: 240px with icon + label
- **Menu items**: Video Library, Product Inventory, Settings
- **Active state**: Subtle accent-colored left border (3px) + lighter background
- **Icons**: Heroicons outline style

### Video Canvas Editor
- **Timeline Scrubber**: Full-width, 120px tall, dark surface with playhead indicator
- **Product Markers**: Circular badges on timeline showing product thumbnails at their designated timestamps
- **Drag-and-drop zones**: Dashed borders (border-dashed) with 220 15% 25% color
- **Video player**: 16:9 aspect ratio, centered with controls overlay on hover

### Product Carousel Customization Suite
**Layout**: Right panel (400px) with tabbed sections
- **Tabs**: Appearance, Position, Content, Button Styling
- **Controls**: 
  - Thumbnail shape selector: Visual radio buttons showing shape previews
  - Corner radius slider: 0-24px with live preview
  - Toggle switches for title/price/description/button visibility
  - Position grid selector: 3x3 visual grid for carousel placement

### Product Inventory Table
- **Columns**: Thumbnail (48px square), Title, URL (truncated), Price, Actions
- **Row height**: 64px with p-4
- **Hover state**: Subtle background lift to 220 15% 14%
- **Add button**: Prominent primary-colored button at top

### Embed Code Output
- **Modal overlay**: Semi-transparent backdrop (bg-black/60)
- **Code block**: Monospace font (Monaco/Consolas), syntax highlighted
- **Copy button**: Top-right position with success state feedback

---

## Interactions & States

### Video Timeline
- **Scrubbing**: Smooth playhead movement with timestamp tooltip
- **Product placement**: Click timeline to add product, drag to adjust timing
- **Product edit**: Click marker to open quick-edit popover

### Product Carousel Preview
- **Live preview**: Real-time updates as user adjusts settings
- **Position visualization**: Outline showing carousel location on video preview

### Publishing Flow
1. Publish button (primary accent, top-right of editor)
2. Validation check (visual feedback for missing products/settings)
3. Generate code modal with copy-to-clipboard
4. Success confirmation with option to view in library

---

## Responsive Behavior
**Desktop-first design** (this is a professional tool):
- Minimum width: 1280px recommended
- Sidebar collapses to icon-only on narrower screens
- Timeline stays fixed at bottom
- Customization panel becomes overlay on smaller screens

---

## Micro-interactions
**Use sparingly** - only where they enhance understanding:
- Smooth playhead animation on timeline
- Gentle background transitions on hover (150ms)
- Product marker pulse when newly added
- Copy button checkmark transition

---

## Key Design Principles
1. **Canvas-first**: Maximize video editing space, minimize UI chrome
2. **Contextual panels**: Show customization options only when editing
3. **Visual feedback**: Clear states for drag-drop, selection, validation
4. **Workflow efficiency**: Quick access to common actions, keyboard shortcuts ready
5. **Professional precision**: Pixel-perfect alignment, consistent spacing, no visual clutter