import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Save, Code, Upload, ArrowLeft, Play, Pause, Plus, X, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Video, Product, InsertVideo, ProductPlacement, CarouselConfig, CarouselPosition, ThumbnailShape, CarouselAnimation, ButtonPosition, FontStyle } from "@shared/schema";
import { defaultCarouselConfig, carouselPositions, thumbnailShapes, carouselAnimations, buttonPositions, fontStyles } from "@shared/schema";

export default function VideoEditor() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [videoTitle, setVideoTitle] = useState("");
  const [videoFile, setVideoFile] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [carouselConfig, setCarouselConfig] = useState<CarouselConfig>(defaultCarouselConfig);
  const [productPlacements, setProductPlacements] = useState<ProductPlacement[]>([]);
  const [selectedPlacement, setSelectedPlacement] = useState<ProductPlacement | null>(null);
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishedVideo, setPublishedVideo] = useState<Video | null>(null);
  const [draggingPlacement, setDraggingPlacement] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [resizingPlacement, setResizingPlacement] = useState<{ id: string; edge: 'left' | 'right' } | null>(null);
  const [savedVideo, setSavedVideo] = useState<Video | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const isNew = params.id === "new";

  const { data: video } = useQuery<Video>({
    queryKey: ["/api/videos", params.id],
    enabled: !isNew,
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  useEffect(() => {
    if (video && !isNew) {
      setVideoTitle(video.title);
      setVideoFile(video.videoUrl);
      setVideoDuration(video.duration);
      setCarouselConfig({ ...defaultCarouselConfig, ...video.carouselConfig });
      setProductPlacements(video.productPlacements);
      setSavedVideo(video);
    }
  }, [video, isNew]);

  const handleVideoUpload = (url: string) => {
    setVideoFile(url);
    const video = document.createElement("video");
    video.src = url;
    video.onloadedmetadata = () => {
      setVideoDuration(Math.round(video.duration));
    };
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const addProductPlacement = (productId: string) => {
    const newPlacement: ProductPlacement = {
      id: `placement-${Date.now()}`,
      productId,
      startTime: currentTime,
      endTime: Math.min(currentTime + 5, videoDuration),
    };
    setProductPlacements([...productPlacements, newPlacement]);
    setAddProductDialogOpen(false);
  };

  const removePlacement = (placementId: string) => {
    setProductPlacements(productPlacements.filter(p => p.id !== placementId));
    if (selectedPlacement?.id === placementId) {
      setSelectedPlacement(null);
    }
  };

  const updatePlacement = (placementId: string, updates: Partial<ProductPlacement>) => {
    setProductPlacements(productPlacements.map(p =>
      p.id === placementId ? { ...p, ...updates } : p
    ));
    if (selectedPlacement?.id === placementId) {
      setSelectedPlacement(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (): Promise<Video> => {
      const data: InsertVideo = {
        title: videoTitle,
        videoUrl: videoFile || "",
        duration: Math.round(videoDuration),
        thumbnailUrl: "",
        published: false,
        carouselConfig,
        productPlacements,
      };

      if (isNew) {
        const response = await apiRequest("POST", "/api/videos", data);
        return response.json();
      } else {
        const response = await apiRequest("PATCH", `/api/videos/${params.id}`, data);
        return response.json();
      }
    },
    onSuccess: (data: Video) => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      if (!isNew) {
        queryClient.invalidateQueries({ queryKey: ["/api/videos", params.id] });
      }
      setSavedVideo(data);
      toast({
        title: "Video saved",
        description: "Your video has been saved successfully.",
      });
      if (isNew && data?.id) {
        navigate(`/editor/${data.id}`);
      }
    },
    onError: (error) => {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save video",
        variant: "destructive",
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (): Promise<Video> => {
      const response = await apiRequest("PATCH", `/api/videos/${params.id}/publish`, {});
      return response.json();
    },
    onSuccess: (data: Video) => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      setPublishedVideo(data);
      setPublishDialogOpen(true);
    },
  });

  const generateEmbedCode = (video: Video) => {
    const baseUrl = window.location.origin;
    return `<div id="shoppable-video-${video.id}"></div>
<script src="${baseUrl}/embed.js"></script>
<script>
  ShoppableVideo.init({
    containerId: 'shoppable-video-${video.id}',
    videoId: '${video.id}',
    apiUrl: '${baseUrl}/api'
  });
</script>`;
  };

  const handleCopyEmbed = () => {
    if (publishedVideo) {
      const embedCode = generateEmbedCode(publishedVideo);
      navigator.clipboard.writeText(embedCode);
      toast({
        title: "Copied to clipboard",
        description: "Embed code has been copied successfully.",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getActiveProducts = () => {
    return productPlacements.filter(
      p => currentTime >= p.startTime && currentTime <= p.endTime
    );
  };

  const handlePlacementDragStart = (e: React.MouseEvent, placementId: string) => {
    e.stopPropagation();
    if (!timelineRef.current) return;

    const placement = productPlacements.find(p => p.id === placementId);
    if (!placement) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const timeAtCursor = (x / rect.width) * videoDuration;
    
    setDragOffset(timeAtCursor - placement.startTime);
    setDraggingPlacement(placementId);
  };

  const handleResizeStart = (e: React.MouseEvent, placementId: string, edge: 'left' | 'right') => {
    e.stopPropagation();
    setResizingPlacement({ id: placementId, edge });
  };

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || (!draggingPlacement && !resizingPlacement)) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const timeAtCursor = (x / rect.width) * videoDuration;

    if (draggingPlacement) {
      const placement = productPlacements.find(p => p.id === draggingPlacement);
      if (placement) {
        const duration = placement.endTime - placement.startTime;
        const newStartTime = Math.max(0, Math.min(videoDuration - duration, timeAtCursor - dragOffset));
        const newEndTime = newStartTime + duration;
        
        updatePlacement(draggingPlacement, {
          startTime: newStartTime,
          endTime: newEndTime,
        });
      }
    } else if (resizingPlacement) {
      const placement = productPlacements.find(p => p.id === resizingPlacement.id);
      if (placement) {
        if (resizingPlacement.edge === 'left') {
          const newStartTime = Math.max(0, Math.min(placement.endTime - 1, timeAtCursor));
          updatePlacement(resizingPlacement.id, { startTime: newStartTime });
        } else {
          const newEndTime = Math.max(placement.startTime + 1, Math.min(videoDuration, timeAtCursor));
          updatePlacement(resizingPlacement.id, { endTime: newEndTime });
        }
      }
    }
  };

  const handleTimelineMouseUp = () => {
    setDraggingPlacement(null);
    setResizingPlacement(null);
    setDragOffset(0);
  };

  useEffect(() => {
    if (draggingPlacement || resizingPlacement) {
      const handleGlobalMouseUp = () => {
        setDraggingPlacement(null);
        setResizingPlacement(null);
        setDragOffset(0);
      };
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [draggingPlacement, resizingPlacement]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Input
            value={videoTitle}
            onChange={(e) => setVideoTitle(e.target.value)}
            placeholder="Untitled Video"
            className="max-w-md"
            data-testid="input-video-title"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => saveMutation.mutate()} 
            disabled={!videoFile || !videoTitle || saveMutation.isPending} 
            data-testid="button-save"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? "Saving..." : "Save"}
          </Button>
          {!isNew && (
            <Button 
              onClick={() => publishMutation.mutate()} 
              disabled={productPlacements.length === 0 || publishMutation.isPending} 
              data-testid="button-publish"
            >
              <Code className="w-4 h-4 mr-2" />
              {publishMutation.isPending ? "Publishing..." : "Publish"}
            </Button>
          )}
        </div>
      </div>

      {savedVideo && (
        <div className="px-4 py-3 bg-muted/50 border-b">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <Label className="text-xs font-medium text-muted-foreground">Embed Code</Label>
              <div className="mt-1 p-3 bg-background border rounded-md font-mono text-xs overflow-x-auto">
                {generateEmbedCode(savedVideo)}
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const embedCode = generateEmbedCode(savedVideo);
                navigator.clipboard.writeText(embedCode);
                toast({
                  title: "Copied to clipboard",
                  description: "Embed code has been copied successfully.",
                });
              }}
              data-testid="button-copy-embed"
              className="mt-5"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 bg-muted/30 flex items-center justify-center p-6 overflow-auto">
            {!videoFile ? (
              <Card className="w-full max-w-md">
                <CardContent className="p-12 space-y-4">
                  <div className="text-center space-y-2 mb-6">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                    <h3 className="text-lg font-semibold">Upload Video</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose a video file to start creating your shoppable video
                    </p>
                  </div>
                  <FileUpload
                    type="video"
                    value={videoFile || ""}
                    onChange={handleVideoUpload}
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="relative max-w-[19rem] w-full">
                <video
                  ref={videoRef}
                  src={videoFile}
                  className="w-full rounded-md shadow-lg"
                  onTimeUpdate={handleTimeUpdate}
                  data-testid="video-player"
                />
                {getActiveProducts().map((placement) => {
                  const product = products?.find(p => p.id === placement.productId);
                  if (!product) return null;

                  return (
                    <ProductCarouselOverlay
                      key={placement.id}
                      product={product}
                      config={carouselConfig}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {videoFile && (
            <div className="border-t bg-card p-4 space-y-3">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlayPause}
                  data-testid="button-play-pause"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <div className="flex-1">
                  <Slider
                    value={[currentTime]}
                    max={videoDuration}
                    step={0.1}
                    onValueChange={([value]) => handleSeek(value)}
                    data-testid="slider-timeline"
                  />
                </div>
                <span className="text-sm text-muted-foreground min-w-20 text-right">
                  {formatTime(currentTime)} / {formatTime(videoDuration)}
                </span>
              </div>

              <div 
                ref={timelineRef}
                className="relative h-20 bg-muted/50 rounded-md overflow-hidden select-none"
                onMouseMove={handleTimelineMouseMove}
                onMouseUp={handleTimelineMouseUp}
              >
                <div className="absolute inset-0 flex items-center px-2">
                  {productPlacements.map((placement) => {
                    const product = products?.find(p => p.id === placement.productId);
                    const left = (placement.startTime / videoDuration) * 100;
                    const width = ((placement.endTime - placement.startTime) / videoDuration) * 100;
                    const isSelected = selectedPlacement?.id === placement.id;
                    const isDragging = draggingPlacement === placement.id;
                    const isResizing = resizingPlacement?.id === placement.id;

                    return (
                      <div
                        key={placement.id}
                        className={`absolute h-12 bg-primary/20 border-2 rounded-md flex items-center justify-center group ${
                          isSelected ? 'border-primary ring-2 ring-primary/50' : 'border-primary'
                        } ${isDragging || isResizing ? 'cursor-grabbing' : 'cursor-grab'}`}
                        style={{ left: `${left}%`, width: `${width}%` }}
                        onMouseDown={(e) => handlePlacementDragStart(e, placement.id)}
                        onClick={() => setSelectedPlacement(placement)}
                        data-testid={`placement-${placement.id}`}
                      >
                        <div
                          className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-primary/50 transition-colors"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleResizeStart(e, placement.id, 'left');
                          }}
                          data-testid={`resize-left-${placement.id}`}
                        />
                        
                        {product && (
                          <img
                            src={product.thumbnailUrl}
                            alt={product.title}
                            className="h-full w-auto object-cover rounded pointer-events-none"
                          />
                        )}
                        
                        <div
                          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-primary/50 transition-colors"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleResizeStart(e, placement.id, 'right');
                          }}
                          data-testid={`resize-right-${placement.id}`}
                        />
                      </div>
                    );
                  })}
                </div>
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-accent pointer-events-none z-10"
                  style={{ left: `${(currentTime / videoDuration) * 100}%` }}
                />
              </div>

              <Button
                onClick={() => setAddProductDialogOpen(true)}
                variant="outline"
                className="w-full"
                disabled={!products || products.length === 0}
                data-testid="button-add-product-placement"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product at {formatTime(currentTime)}
              </Button>
            </div>
          )}
        </div>

        <div className="w-96 border-l bg-card flex flex-col overflow-hidden">
          <Tabs defaultValue="carousel" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="m-4 grid grid-cols-2">
              <TabsTrigger value="carousel" data-testid="tab-carousel">Carousel</TabsTrigger>
              <TabsTrigger value="products" data-testid="tab-products">Products</TabsTrigger>
            </TabsList>

            <TabsContent value="carousel" className="flex-1 m-0 overflow-y-auto">
              <div className="h-full">
                <div className="p-4 space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Position</h3>
                    <Select
                      value={carouselConfig.position}
                      onValueChange={(value: CarouselPosition) =>
                        setCarouselConfig({ ...carouselConfig, position: value })
                      }
                    >
                      <SelectTrigger data-testid="select-position">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {carouselPositions.map((pos) => (
                          <SelectItem key={pos} value={pos}>
                            {pos.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Thumbnail Shape</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {thumbnailShapes.map((shape) => (
                        <Button
                          key={shape}
                          variant={carouselConfig.thumbnailShape === shape ? "default" : "outline"}
                          onClick={() => setCarouselConfig({ ...carouselConfig, thumbnailShape: shape })}
                          className="capitalize"
                          data-testid={`button-shape-${shape}`}
                        >
                          {shape}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Thumbnail Size</Label>
                      <span className="text-sm text-muted-foreground">{carouselConfig.thumbnailSize}px</span>
                    </div>
                    <Slider
                      value={[carouselConfig.thumbnailSize]}
                      min={32}
                      max={250}
                      step={4}
                      onValueChange={([value]) =>
                        setCarouselConfig({ ...carouselConfig, thumbnailSize: value })
                      }
                      data-testid="slider-thumbnail-size"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Carousel Width</Label>
                      <span className="text-sm text-muted-foreground">{carouselConfig.carouselWidth}px</span>
                    </div>
                    <Slider
                      value={[carouselConfig.carouselWidth]}
                      min={32}
                      max={250}
                      step={4}
                      onValueChange={([value]) =>
                        setCarouselConfig({ ...carouselConfig, carouselWidth: value })
                      }
                      data-testid="slider-carousel-width"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Corner Radius</Label>
                      <span className="text-sm text-muted-foreground">{carouselConfig.cornerRadius}px</span>
                    </div>
                    <Slider
                      value={[carouselConfig.cornerRadius]}
                      max={24}
                      step={1}
                      onValueChange={([value]) =>
                        setCarouselConfig({ ...carouselConfig, cornerRadius: value })
                      }
                      data-testid="slider-corner-radius"
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Carousel Styling</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="transparent-bg">Transparent Background</Label>
                        <Switch
                          id="transparent-bg"
                          checked={carouselConfig.transparentBackground}
                          onCheckedChange={(checked) =>
                            setCarouselConfig({ ...carouselConfig, transparentBackground: checked })
                          }
                          data-testid="switch-transparent-bg"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="show-border">Show Border</Label>
                        <Switch
                          id="show-border"
                          checked={carouselConfig.showBorder}
                          onCheckedChange={(checked) =>
                            setCarouselConfig({ ...carouselConfig, showBorder: checked })
                          }
                          data-testid="switch-show-border"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Animation</h3>
                    <Select
                      value={carouselConfig.animation}
                      onValueChange={(value) =>
                        setCarouselConfig({ ...carouselConfig, animation: value as CarouselAnimation })
                      }
                    >
                      <SelectTrigger data-testid="select-animation">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {carouselAnimations.map((anim) => (
                          <SelectItem key={anim} value={anim}>
                            {anim.charAt(0).toUpperCase() + anim.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Content Visibility</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="show-title">Show Title</Label>
                        <Switch
                          id="show-title"
                          checked={carouselConfig.showTitle}
                          onCheckedChange={(checked) =>
                            setCarouselConfig({ ...carouselConfig, showTitle: checked })
                          }
                          data-testid="switch-show-title"
                        />
                      </div>
                      {carouselConfig.showTitle && (
                        <div>
                          <Label>Title Font Style</Label>
                          <Select
                            value={carouselConfig.titleFontStyle}
                            onValueChange={(value: FontStyle) =>
                              setCarouselConfig({ ...carouselConfig, titleFontStyle: value })
                            }
                          >
                            <SelectTrigger data-testid="select-title-font-style">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {fontStyles.map((style) => (
                                <SelectItem key={style} value={style}>
                                  {style.charAt(0).toUpperCase() + style.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <Label htmlFor="show-price">Show Price</Label>
                        <Switch
                          id="show-price"
                          checked={carouselConfig.showPrice}
                          onCheckedChange={(checked) =>
                            setCarouselConfig({ ...carouselConfig, showPrice: checked })
                          }
                          data-testid="switch-show-price"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="show-description">Show Description</Label>
                        <Switch
                          id="show-description"
                          checked={carouselConfig.showDescription}
                          onCheckedChange={(checked) =>
                            setCarouselConfig({ ...carouselConfig, showDescription: checked })
                          }
                          data-testid="switch-show-description"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="show-button">Show Button</Label>
                        <Switch
                          id="show-button"
                          checked={carouselConfig.showButton}
                          onCheckedChange={(checked) =>
                            setCarouselConfig({ ...carouselConfig, showButton: checked })
                          }
                          data-testid="switch-show-button"
                        />
                      </div>
                    </div>
                  </div>

                  {carouselConfig.showButton && (
                    <div className="space-y-4">
                      <h3 className="font-semibold">Button Styling</h3>
                      <div className="space-y-3">
                        <div>
                          <Label>Button Text</Label>
                          <Input
                            value={carouselConfig.buttonText}
                            onChange={(e) =>
                              setCarouselConfig({ ...carouselConfig, buttonText: e.target.value })
                            }
                            data-testid="input-button-text"
                          />
                        </div>
                        <div>
                          <Label>Background Color</Label>
                          <Input
                            type="color"
                            value={carouselConfig.buttonBackgroundColor}
                            onChange={(e) =>
                              setCarouselConfig({ ...carouselConfig, buttonBackgroundColor: e.target.value })
                            }
                            data-testid="input-button-bg-color"
                          />
                        </div>
                        <div>
                          <Label>Text Color</Label>
                          <Input
                            type="color"
                            value={carouselConfig.buttonTextColor}
                            onChange={(e) =>
                              setCarouselConfig({ ...carouselConfig, buttonTextColor: e.target.value })
                            }
                            data-testid="input-button-text-color"
                          />
                        </div>
                        <div>
                          <Label>Font Size</Label>
                          <Input
                            type="number"
                            value={carouselConfig.buttonFontSize}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              if (!isNaN(value) && value > 0) {
                                setCarouselConfig({ ...carouselConfig, buttonFontSize: value });
                              }
                            }}
                            data-testid="input-button-font-size"
                          />
                        </div>
                        <div>
                          <Label>Font Weight</Label>
                          <Select
                            value={carouselConfig.buttonFontWeight}
                            onValueChange={(value) =>
                              setCarouselConfig({ ...carouselConfig, buttonFontWeight: value })
                            }
                          >
                            <SelectTrigger data-testid="select-button-font-weight">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="400">Normal</SelectItem>
                              <SelectItem value="500">Medium</SelectItem>
                              <SelectItem value="600">Semibold</SelectItem>
                              <SelectItem value="700">Bold</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Font Style</Label>
                          <Select
                            value={carouselConfig.buttonFontStyle}
                            onValueChange={(value: FontStyle) =>
                              setCarouselConfig({ ...carouselConfig, buttonFontStyle: value })
                            }
                          >
                            <SelectTrigger data-testid="select-button-font-style">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {fontStyles.map((style) => (
                                <SelectItem key={style} value={style}>
                                  {style.charAt(0).toUpperCase() + style.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Button Position</Label>
                          <Select
                            value={carouselConfig.buttonPosition}
                            onValueChange={(value: ButtonPosition) =>
                              setCarouselConfig({ ...carouselConfig, buttonPosition: value })
                            }
                          >
                            <SelectTrigger data-testid="select-button-position">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {buttonPositions.map((pos) => (
                                <SelectItem key={pos} value={pos}>
                                  {pos.charAt(0).toUpperCase() + pos.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Border Radius</Label>
                          <Input
                            type="number"
                            value={carouselConfig.buttonBorderRadius}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              if (!isNaN(value) && value >= 0) {
                                setCarouselConfig({ ...carouselConfig, buttonBorderRadius: value });
                              }
                            }}
                            data-testid="input-button-border-radius"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="products" className="flex-1 m-0 overflow-y-auto">
              <div className="h-full">
                <div className="p-4 space-y-3">
                  {selectedPlacement && (() => {
                    const product = products?.find(p => p.id === selectedPlacement.productId);
                    return (
                      <Card>
                        <CardHeader className="p-4">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">Edit Product Timing</CardTitle>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removePlacement(selectedPlacement.id)}
                              data-testid="button-remove-placement"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-3">
                          {product && (
                            <div className="flex items-center gap-3 mb-3">
                              <img
                                src={product.thumbnailUrl}
                                alt={product.title}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium line-clamp-1">{product.title}</p>
                                <p className="text-xs text-muted-foreground">{product.price}</p>
                              </div>
                            </div>
                          )}
                          <div>
                            <Label>Start Time (seconds)</Label>
                            <Input
                              type="number"
                              value={selectedPlacement.startTime.toFixed(1)}
                              onChange={(e) =>
                                updatePlacement(selectedPlacement.id, {
                                  startTime: parseFloat(e.target.value),
                                })
                              }
                              step="0.1"
                              data-testid="input-start-time"
                            />
                          </div>
                          <div>
                            <Label>End Time (seconds)</Label>
                            <Input
                              type="number"
                              value={selectedPlacement.endTime.toFixed(1)}
                              onChange={(e) =>
                                updatePlacement(selectedPlacement.id, {
                                  endTime: parseFloat(e.target.value),
                                })
                              }
                              step="0.1"
                              data-testid="input-end-time"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()}

                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">All Products ({productPlacements.length})</h3>
                    {productPlacements.map((placement) => {
                      const product = products?.find(p => p.id === placement.productId);
                      return (
                        <Card
                          key={placement.id}
                          className={`cursor-pointer hover-elevate ${selectedPlacement?.id === placement.id ? "border-primary" : ""}`}
                          onClick={() => setSelectedPlacement(placement)}
                        >
                          <CardContent className="p-3 flex items-center gap-3">
                            {product && (
                              <>
                                <img
                                  src={product.thumbnailUrl}
                                  alt={product.title}
                                  className="w-10 h-10 object-cover rounded"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium line-clamp-1">{product.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatTime(placement.startTime)} - {formatTime(placement.endTime)}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removePlacement(placement.id);
                                  }}
                                  data-testid={`button-delete-placement-${placement.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={addProductDialogOpen} onOpenChange={setAddProductDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
            <DialogDescription>
              Select a product to add to the timeline at {formatTime(currentTime)}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            <div className="space-y-2">
              {products?.map((product) => (
                <Card
                  key={product.id}
                  className="cursor-pointer hover-elevate"
                  onClick={() => addProductPlacement(product.id)}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <img
                      src={product.thumbnailUrl}
                      alt={product.title}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{product.title}</p>
                      <p className="text-xs text-muted-foreground">{product.price}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Video Published!</DialogTitle>
            <DialogDescription>
              Your video has been published. Copy the embed code below to add it to your website.
            </DialogDescription>
          </DialogHeader>
          {publishedVideo && (
            <div className="space-y-4">
              <Textarea
                readOnly
                value={generateEmbedCode(publishedVideo)}
                className="font-mono text-xs h-48"
                data-testid="textarea-embed-code"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleCopyEmbed}
                  className="flex-1"
                  data-testid="button-copy-embed"
                >
                  <Code className="w-4 h-4 mr-2" />
                  Copy Embed Code
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate("/")} 
                  data-testid="button-go-to-library"
                >
                  Go to Library
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductCarouselOverlay({ product, config }: { product: Product; config: CarouselConfig }) {
  const getPositionClasses = () => {
    switch (config.position) {
      case "top-right":
        return "top-4 right-4";
      case "top-center":
        return "top-4 left-1/2 -translate-x-1/2";
      case "top-left":
        return "top-4 left-4";
      case "side-right":
        return "right-4 top-1/2 -translate-y-1/2";
      case "side-left":
        return "left-4 top-1/2 -translate-y-1/2";
      case "bottom-right":
        return "bottom-4 right-4";
      case "bottom-center":
        return "bottom-4 left-1/2 -translate-x-1/2";
      case "bottom-left":
        return "bottom-4 left-4";
      default:
        return "top-4 right-4";
    }
  };

  const getThumbnailStyle = () => {
    const size = config.thumbnailSize || 64;
    switch (config.thumbnailShape) {
      case "circle":
        return { width: `${size}px`, height: `${size}px`, borderRadius: '50%' };
      case "portrait":
        return { width: `${size * 0.75}px`, height: `${size}px`, borderRadius: `${config.cornerRadius}px` };
      case "square":
      default:
        return { width: `${size}px`, height: `${size}px`, borderRadius: `${config.cornerRadius}px` };
    }
  };

  const getAnimationClass = () => {
    switch (config.animation) {
      case 'hover':
        return 'animate-[slow-drift_6s_ease-in-out_infinite]';
      case 'float':
        return 'animate-[gentle-float_3s_ease-in-out_infinite]';
      case 'pulse':
        return 'animate-[soft-pulse_2s_ease-in-out_infinite]';
      default:
        return '';
    }
  };

  const buttonPos = config.buttonPosition || 'below';
  
  const getButtonFontStyles = (fontStyle: FontStyle | undefined) => {
    const baseWeight = config.buttonFontWeight || '400';
    switch (fontStyle) {
      case 'bold':
        return { fontWeight: 'bold', fontStyle: 'normal' };
      case 'italic':
        return { fontWeight: baseWeight, fontStyle: 'italic' };
      case 'bold-italic':
        return { fontWeight: 'bold', fontStyle: 'italic' };
      default:
        return { fontWeight: baseWeight, fontStyle: 'normal' };
    }
  };

  const getTitleFontStyles = (fontStyle: FontStyle | undefined) => {
    switch (fontStyle) {
      case 'bold':
        return { fontWeight: 'bold', fontStyle: 'normal' };
      case 'italic':
        return { fontWeight: '600', fontStyle: 'italic' };
      case 'bold-italic':
        return { fontWeight: 'bold', fontStyle: 'italic' };
      default:
        return { fontWeight: '600', fontStyle: 'normal' };
    }
  };

  const renderButton = () => {
    if (!config.showButton) return null;
    const buttonFontStyles = getButtonFontStyles(config.buttonFontStyle);
    return (
      <button
        style={{
          backgroundColor: config.buttonBackgroundColor,
          color: config.buttonTextColor,
          fontSize: `${config.buttonFontSize}px`,
          fontWeight: buttonFontStyles.fontWeight,
          fontStyle: buttonFontStyles.fontStyle,
          borderRadius: `${config.buttonBorderRadius}px`,
        }}
        className="px-3 py-1"
      >
        {config.buttonText}
      </button>
    );
  };

  const renderContent = () => {
    return (
      <>
        <img
          src={product.thumbnailUrl}
          alt={product.title}
          className="object-cover"
          style={getThumbnailStyle()}
        />
        <div className="flex-1 min-w-0 space-y-1">
          {config.showTitle && (
            <p className="text-sm line-clamp-2" style={getTitleFontStyles(config.titleFontStyle)}>{product.title}</p>
          )}
          {config.showPrice && (
            <p className="text-sm font-semibold text-primary">{product.price}</p>
          )}
          {config.showDescription && product.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
          )}
          {buttonPos === 'below' && renderButton()}
        </div>
      </>
    );
  };

  return (
    <div 
      className={`absolute ${getPositionClasses()} p-3 ${getAnimationClass()} ${config.transparentBackground ? 'bg-transparent' : 'bg-card/95 backdrop-blur-sm'} ${config.showBorder ? 'shadow-lg border border-border' : ''}`} 
      style={{ 
        borderRadius: `${config.cornerRadius}px`,
        maxWidth: `${config.carouselWidth || 250}px`
      }}
    >
      {buttonPos === 'top' && (
        <div className="mb-2 w-full">
          {renderButton()}
        </div>
      )}
      <div className={`flex gap-3 ${buttonPos === 'left' || buttonPos === 'right' ? 'items-center' : ''}`}>
        {buttonPos === 'left' && <div>{renderButton()}</div>}
        {renderContent()}
        {buttonPos === 'right' && <div>{renderButton()}</div>}
      </div>
    </div>
  );
}
