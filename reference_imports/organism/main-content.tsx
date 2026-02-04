import React, { useState, useEffect, useCallback, useRef } from "react";
import { BuySellSpread } from "@/components/molecules/buy-sell-spread";
import { IssuerHeader } from "@/components/molecules/issuer-header";
import { TradingFormSimple } from "@/components/molecules/trading-form-simple";
import { OwnershipHistorySection } from "@/components/molecules/ownership-history-section";
import { IssuerDetailsSkeleton } from "@/components/atoms/skeleton";
import { IssuerTagsCard } from "@/components/molecules/issuer-tags-card";
import { DiscussionSection } from "@/components/molecules/discussion-section";
import { SingleIssuerResponse } from "@/types/market";
import { LightweightChart } from "./lightweight-chart";
import { useIssuerTagHierarchy } from "@/hooks/use-issuer-tag-hierarchy";
import { NAVBAR_BG, NAVBAR_BG1, CD2, NAVBAR_BORDER1 } from "@/constants/colors";
import { Twitter, Instagram, Heart, MessageCircle, Repeat2, Loader2, Play } from "lucide-react";
import { issuersAPI } from "@/lib/api-helpers";

interface SocialPost {
  id: string;
  platform: string;
  post_id: string;
  content: string;
  media_url: string | null;
  post_url: string | null;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  posted_at: string | null;
}

interface Issuer {
  ticker: string;
  name?: string;
  issuer_id: string;
  public_display_name?: string;
  headline?: string;
  short_bio?: string;
  bio?: string;
  long_bio?: string | null;
  image_url?: string | null;
  primary_tag?: string;
  secondary_tag?: string;
  lp_id?: string;
}

interface OwnershipInstance {
  instance_id: string;
  quantity_change: string | number;
  instance_price: string | number;
  usdp_change: string | number;
  realized_pl: string | number;
  created_at: string;
}

interface MainContentProps {
  issuer: Issuer;
  singleIssuerData?: SingleIssuerResponse | null;
  singleIssuerLoading: boolean;
  showLongBio: boolean;
  onToggleLongBio: (show: boolean) => void;
  spreadItems: any[];
  ticker?: string;
  pvAmount: string;
  setPvAmount: (amount: string) => void;
  onBuy: () => void;
  onSell: () => void;
  submitting: boolean;
  selectedTradeId: string | null;
  onBackToLive: () => void;
  tradeError: string | null;
  processingInfo: { iterations: number; processed: boolean } | null;
  queuedOrders?: Set<string>;
  processingOrderType?: "buy" | "sell" | null;
  pnlProcessingOrders?: Set<string>;
}

export const MainContent: React.FC<MainContentProps> = ({
  issuer,
  singleIssuerData,
  singleIssuerLoading,
  showLongBio,
  onToggleLongBio,
  spreadItems,
  ticker,
  pvAmount,
  setPvAmount,
  onBuy,
  onSell,
  submitting,
  selectedTradeId,
  onBackToLive,
  tradeError,
  processingInfo,
  queuedOrders,
  processingOrderType,
  pnlProcessingOrders,
}) => {
  const [activeTab, setActiveTab] = useState("overview");

  // Social posts state
  const [twitterPosts, setTwitterPosts] = useState<SocialPost[]>([]);
  const [instagramPosts, setInstagramPosts] = useState<SocialPost[]>([]);
  const [twitterLoading, setTwitterLoading] = useState(false);
  const [instagramLoading, setInstagramLoading] = useState(false);
  const [twitterHasMore, setTwitterHasMore] = useState(true);
  const [instagramHasMore, setInstagramHasMore] = useState(true);
  const [twitterOffset, setTwitterOffset] = useState(0);
  const [instagramOffset, setInstagramOffset] = useState(0);
  const twitterScrollRef = useRef<HTMLDivElement>(null);
  const instagramScrollRef = useRef<HTMLDivElement>(null);

  // Get the primary tag name (could be string or object)
  const primaryTagName = typeof singleIssuerData?.primary_tag === 'string'
    ? singleIssuerData.primary_tag
    : (singleIssuerData?.primary_tag as any)?.tag_name || issuer?.primary_tag;

  // Fetch the full tag hierarchy for the primary tag
  const { data: tagHierarchy, isLoading: tagHierarchyLoading } = useIssuerTagHierarchy(primaryTagName);

  // Format number for display
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Format date for display
  const formatTimeAgo = (dateStr: string | null): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Check if URL is a video
  const isVideoUrl = (url: string | null): boolean => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();

    // Check for video file extensions
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.m3u8'];
    if (videoExtensions.some(ext => lowerUrl.includes(ext))) return true;

    // Check for Twitter video CDN
    if (lowerUrl.includes('video.twimg.com')) return true;

    // Check for Instagram video CDN (videos use /o1/v/t16/ path, images use /v/t51/)
    if (lowerUrl.includes('cdninstagram.com/o1/v/')) return true;

    return false;
  };

  // Proxy social media images through our backend to avoid CORS issues
  const getProxiedUrl = (url: string | null): string => {
    if (!url) return '';
    // Check if URL needs proxying (Instagram or Twitter CDN)
    const needsProxy = url.includes('cdninstagram.com') ||
                       url.includes('fbcdn.net') ||
                       url.includes('twimg.com');
    if (needsProxy) {
      return `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/issuers/media-proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  // Fetch Twitter posts
  const fetchTwitterPosts = useCallback(async (reset = false) => {
    if (!ticker || twitterLoading || (!reset && !twitterHasMore)) return;

    setTwitterLoading(true);
    try {
      const offset = reset ? 0 : twitterOffset;
      const result = await issuersAPI.getSocialPosts(ticker, 'twitter', 10, offset);

      if (reset) {
        setTwitterPosts(result.posts);
        setTwitterOffset(10);
      } else {
        setTwitterPosts(prev => [...prev, ...result.posts]);
        setTwitterOffset(prev => prev + 10);
      }
      setTwitterHasMore(result.pagination.has_more);
    } catch (err) {
      console.error('Failed to fetch Twitter posts:', err);
    } finally {
      setTwitterLoading(false);
    }
  }, [ticker, twitterOffset, twitterLoading, twitterHasMore]);

  // Fetch Instagram posts
  const fetchInstagramPosts = useCallback(async (reset = false) => {
    if (!ticker || instagramLoading || (!reset && !instagramHasMore)) return;

    setInstagramLoading(true);
    try {
      const offset = reset ? 0 : instagramOffset;
      const result = await issuersAPI.getSocialPosts(ticker, 'instagram', 10, offset);

      if (reset) {
        setInstagramPosts(result.posts);
        setInstagramOffset(10);
      } else {
        setInstagramPosts(prev => [...prev, ...result.posts]);
        setInstagramOffset(prev => prev + 10);
      }
      setInstagramHasMore(result.pagination.has_more);
    } catch (err) {
      console.error('Failed to fetch Instagram posts:', err);
    } finally {
      setInstagramLoading(false);
    }
  }, [ticker, instagramOffset, instagramLoading, instagramHasMore]);

  // Fetch posts when tab changes
  useEffect(() => {
    if (activeTab === 'twitter' && twitterPosts.length === 0) {
      fetchTwitterPosts(true);
    } else if (activeTab === 'instagram' && instagramPosts.length === 0) {
      fetchInstagramPosts(true);
    }
  }, [activeTab]);

  // Infinite scroll handler
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>, platform: 'twitter' | 'instagram') => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      if (platform === 'twitter') {
        fetchTwitterPosts();
      } else {
        fetchInstagramPosts();
      }
    }
  }, [fetchTwitterPosts, fetchInstagramPosts]);

  return (
    <div className="lg:col-span-1  md:pb-18 lg:mt-0 w-full min-w-0 overflow-hidden ">
      {/* Issuer Details */}
      <div className="px-2 py-0 flex flex-col gap-2 bg-black" style={{ border: 'none' }}>
            {singleIssuerLoading ? (
              <IssuerDetailsSkeleton />
            ) : (
              <IssuerHeader
                issuer={issuer}
                singleIssuerData={singleIssuerData}
                showLongBio={showLongBio}
                onToggleLongBio={onToggleLongBio}
              />
            )}
          </div>

          {/* Chart */}
          <div className="w-full min-w-0 overflow-hidden">
            {ticker && (
              <LightweightChart
                height={550}
                title="Price Chart"
                ticker={ticker}
                initialRange="24h"
              />
            )}
          </div>

          {/* Issuer Tags */}
          <IssuerTagsCard
            tags={tagHierarchy || []}
            isLoading={singleIssuerLoading || tagHierarchyLoading}
          />

          {/* Discussion Section */}
          <DiscussionSection ticker={ticker} />

      {false && (
        <div className="space-y-4">{/* Twitter placeholder */}
          <div
            className="p-4 border rounded-xl bg-neutral-900 border-neutral-700 max-h-[600px] overflow-y-auto"
            onScroll={(e) => handleScroll(e, 'twitter')}
            ref={twitterScrollRef}
          >
            <div className="flex items-center gap-2 mb-4">
              <Twitter className="w-5 h-5 text-[#1DA1F2]" />
              <h3 className="font-mono text-lg font-semibold text-white">Latest Tweets</h3>
            </div>
            <div className="space-y-3">
              {twitterPosts.length === 0 && !twitterLoading && (
                <div className="text-center py-8 text-neutral-500 font-mono">
                  No tweets available
                </div>
              )}
              {twitterPosts.map((post) => (
                <a
                  key={post.id}
                  href={post.post_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 bg-neutral-800/50 border border-neutral-700 rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0">
                      {issuer?.image_url ? (
                        <img
                          src={issuer.image_url}
                          alt={issuer.public_display_name || issuer.ticker}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-neutral-400 font-mono text-sm">
                          {issuer?.ticker?.charAt(0) || "?"}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white font-mono text-sm">
                          {issuer?.public_display_name || issuer?.ticker}
                        </span>
                        <svg className="w-4 h-4 text-[#1DA1F2]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                        </svg>
                        <span className="text-neutral-500 text-xs">@{issuer?.ticker?.toLowerCase()}</span>
                        <span className="text-neutral-500 text-xs">· {formatTimeAgo(post.posted_at)}</span>
                      </div>
                      <div className="flex gap-3">
                        <p className="text-white text-sm leading-relaxed flex-1">{post.content}</p>
                        {post.media_url && (
                          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 relative">
                            {isVideoUrl(post.media_url) ? (
                              <>
                                <video
                                  src={getProxiedUrl(post.media_url)}
                                  className="w-full h-full object-cover"
                                  muted
                                  playsInline
                                  preload="metadata"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                  <Play className="w-6 h-6 text-white fill-white" />
                                </div>
                              </>
                            ) : (
                              <img
                                src={getProxiedUrl(post.media_url)}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-5 text-neutral-500 mt-3">
                        <div className="flex items-center gap-1.5">
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-xs">{formatNumber(post.comments)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Repeat2 className="w-4 h-4" />
                          <span className="text-xs">{formatNumber(post.shares)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Heart className="w-4 h-4" />
                          <span className="text-xs">{formatNumber(post.likes)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
              {twitterLoading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-[#1DA1F2]" />
                </div>
              )}
              {!twitterHasMore && twitterPosts.length > 0 && (
                <div className="text-center py-4 text-neutral-500 text-sm font-mono">
                  No more tweets
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "instagram" && (
        <div className="space-y-4">
          <div
            className="p-4 border rounded-xl bg-neutral-900 border-neutral-700 max-h-[600px] overflow-y-auto"
            onScroll={(e) => handleScroll(e, 'instagram')}
            ref={instagramScrollRef}
          >
            <div className="flex items-center gap-2 mb-4">
              <Instagram className="w-5 h-5 text-[#E4405F]" />
              <h3 className="font-mono text-lg font-semibold text-white">Instagram Feed</h3>
            </div>
            <div className="space-y-3">
              {instagramPosts.length === 0 && !instagramLoading && (
                <div className="text-center py-8 text-neutral-500 font-mono">
                  No Instagram posts available
                </div>
              )}
              {instagramPosts.map((post) => (
                <a
                  key={post.id}
                  href={post.post_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 bg-neutral-800/50 border border-neutral-700 rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0">
                      {issuer?.image_url ? (
                        <img
                          src={issuer.image_url}
                          alt={issuer.public_display_name || issuer.ticker}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-neutral-400 font-mono text-sm">
                          {issuer?.ticker?.charAt(0) || "?"}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white font-mono text-sm">
                          {issuer?.public_display_name || issuer?.ticker}
                        </span>
                        <svg className="w-4 h-4 text-[#E4405F]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                        </svg>
                        <span className="text-neutral-500 text-xs">@{issuer?.ticker?.toLowerCase()}</span>
                        <span className="text-neutral-500 text-xs">· {formatTimeAgo(post.posted_at)}</span>
                      </div>
                      <div className="flex gap-3">
                        <p className="text-white text-sm leading-relaxed flex-1">{post.content}</p>
                        {post.media_url && (
                          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 relative">
                            {isVideoUrl(post.media_url) ? (
                              <>
                                <video
                                  src={getProxiedUrl(post.media_url)}
                                  className="w-full h-full object-cover"
                                  muted
                                  playsInline
                                  preload="metadata"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                  <Play className="w-6 h-6 text-white fill-white" />
                                </div>
                              </>
                            ) : (
                              <img
                                src={getProxiedUrl(post.media_url)}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-5 text-neutral-500 mt-3">
                        <div className="flex items-center gap-1.5">
                          <Heart className="w-4 h-4" />
                          <span className="text-xs">{formatNumber(post.likes)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-xs">{formatNumber(post.comments)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
              {instagramLoading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-[#E4405F]" />
                </div>
              )}
              {!instagramHasMore && instagramPosts.length > 0 && (
                <div className="text-center py-4 text-neutral-500 text-sm font-mono">
                  No more posts
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
