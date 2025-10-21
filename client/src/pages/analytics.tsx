import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Eye, MousePointerClick, TrendingUp, Package } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import type { Video } from "@shared/schema";

interface AnalyticsSummary {
  totalViews: number;
  totalClicks: number;
  clickThroughRate: number;
  topProducts: Array<{ productId: string; clicks: number; productTitle?: string }>;
}

export default function Analytics() {
  const [selectedVideoId, setSelectedVideoId] = useState<string>("all");

  const { data: videos } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  const summaryQueryKey = selectedVideoId === "all"
    ? "/api/analytics/summary"
    : `/api/analytics/summary?videoId=${selectedVideoId}`;
    
  const { data: summary, isLoading } = useQuery<AnalyticsSummary>({
    queryKey: [summaryQueryKey],
  });

  const selectedVideo = videos?.find(v => v.id === selectedVideoId);
  const videoTitle = selectedVideo?.title || "All Videos";

  return (
    <div className="flex flex-col h-full" data-testid="page-analytics">
      <div className="border-b p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-analytics-title">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Track video views, product clicks, and conversion metrics
            </p>
          </div>
          <div className="w-64">
            <Select value={selectedVideoId} onValueChange={setSelectedVideoId}>
              <SelectTrigger data-testid="select-video-filter">
                <SelectValue placeholder="Select video" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Videos</SelectItem>
                {videos?.map((video) => (
                  <SelectItem key={video.id} value={video.id}>
                    {video.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-views">
                  {isLoading ? "..." : summary?.totalViews.toLocaleString() || "0"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Video plays tracked
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Product Clicks</CardTitle>
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-clicks">
                  {isLoading ? "..." : summary?.totalClicks.toLocaleString() || "0"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total product interactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-ctr">
                  {isLoading ? "..." : `${summary?.clickThroughRate.toFixed(2) || "0"}%`}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Clicks per view
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Analyzed Video</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold truncate" data-testid="text-selected-video">
                  {videoTitle}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedVideoId === "all" ? "All published videos" : "Single video analysis"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Top Performing Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : summary?.topProducts && summary.topProducts.length > 0 ? (
                <div className="space-y-4">
                  {summary.topProducts.map((product, index) => (
                    <div
                      key={product.productId}
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`product-stat-${index}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-medium" data-testid={`product-title-${index}`}>
                            {product.productTitle || "Unknown Product"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Product ID: {product.productId.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold" data-testid={`product-clicks-${index}`}>
                          {product.clicks}
                        </p>
                        <p className="text-sm text-muted-foreground">clicks</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12" data-testid="empty-state-analytics">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No analytics data yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Analytics will appear once your embedded videos start receiving views and clicks
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
