import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Play, Code, Trash2, Video as VideoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Video } from "@shared/schema";

export default function VideoLibrary() {
  const [embedDialogOpen, setEmbedDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const { toast } = useToast();

  const { data: videos, isLoading } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (videoId: string) => {
      await apiRequest("DELETE", `/api/videos/${videoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: "Video deleted",
        description: "The video has been removed successfully.",
      });
      setDeleteDialogOpen(false);
      setSelectedVideo(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete video. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCopyEmbed = (video: Video) => {
    const embedCode = generateEmbedCode(video);
    navigator.clipboard.writeText(embedCode);
    toast({
      title: "Copied to clipboard",
      description: "Embed code has been copied successfully.",
    });
  };

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

  const showEmbedDialog = (video: Video) => {
    setSelectedVideo(video);
    setEmbedDialogOpen(true);
  };

  const showDeleteDialog = (video: Video) => {
    setSelectedVideo(video);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (selectedVideo) {
      deleteMutation.mutate(selectedVideo.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading videos...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-semibold">Video Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your shoppable videos and retrieve embed codes
          </p>
        </div>
        <Link href="/editor/new">
          <Button data-testid="button-create-video">
            <Plus className="w-4 h-4 mr-2" />
            Create Video
          </Button>
        </Link>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {!videos || videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <VideoIcon className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No videos yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Create your first shoppable video by uploading a video and adding products
              to the timeline.
            </p>
            <Link href="/editor/new">
              <Button data-testid="button-create-first-video">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Video
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <Card key={video.id} className="hover-elevate overflow-hidden">
                <div className="aspect-video bg-muted relative">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  {video.published && (
                    <Badge className="absolute top-2 right-2">Published</Badge>
                  )}
                </div>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3
                      className="font-semibold line-clamp-1"
                      data-testid={`text-video-title-${video.id}`}
                    >
                      {video.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {video.productPlacements.length} products
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/editor/${video.id}`} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm" data-testid={`button-edit-${video.id}`}>
                        <Play className="w-3 h-3 mr-2" />
                        Edit
                      </Button>
                    </Link>
                    {video.published && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => showEmbedDialog(video)}
                        data-testid={`button-embed-${video.id}`}
                      >
                        <Code className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => showDeleteDialog(video)}
                      data-testid={`button-delete-${video.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={embedDialogOpen} onOpenChange={setEmbedDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Embed Code</DialogTitle>
            <DialogDescription>
              Copy and paste this code into your website to display the shoppable video
            </DialogDescription>
          </DialogHeader>
          {selectedVideo && (
            <div className="space-y-4">
              <Textarea
                readOnly
                value={generateEmbedCode(selectedVideo)}
                className="font-mono text-xs h-48"
                data-testid="textarea-embed-code"
              />
              <Button
                onClick={() => handleCopyEmbed(selectedVideo)}
                className="w-full"
                data-testid="button-copy-embed"
              >
                <Code className="w-4 h-4 mr-2" />
                Copy Embed Code
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedVideo?.title}"? This action cannot be undone.
              All product placements and analytics data will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Video"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
