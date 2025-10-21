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
