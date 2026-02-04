'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { LoadingSpinner } from '@/components/atoms/loading-spinner';
import { PublicIssuerProfile } from '@/types';
import { getGradientForText } from '@/constants/gradients';
import { issuersAPI } from '@/lib/api-helpers';
import { getPreviewUrl, getProxyUrl, getFallbackUrl } from '@/lib/utils';

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

export default function PublicIssuerProfilePage() {
  const params = useParams();
  const ticker = params.ticker as string;

  const [profile, setProfile] = useState<PublicIssuerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Social posts state
  const [activeTab, setActiveTab] = useState<'profile' | 'twitter' | 'instagram'>('profile');
  const [twitterPosts, setTwitterPosts] = useState<SocialPost[]>([]);
  const [instagramPosts, setInstagramPosts] = useState<SocialPost[]>([]);
  const [twitterLoading, setTwitterLoading] = useState(false);
  const [instagramLoading, setInstagramLoading] = useState(false);
  const [twitterHasMore, setTwitterHasMore] = useState(true);
  const [instagramHasMore, setInstagramHasMore] = useState(true);
  const [twitterOffset, setTwitterOffset] = useState(0);
  const [instagramOffset, setInstagramOffset] = useState(0);

  useEffect(() => {
    const fetchPublicProfile = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        const response = await issuersAPI.getPublicProfile(ticker);
        
        if (response.success && response.data) {
          setProfile(response.data);
        } else {
          setError('Issuer profile not found');
        }
      } catch (err: any) {
        console.error('Failed to fetch public profile:', err);
        if (err.message?.includes('404') || err.message?.includes('not found')) {
          setError('Issuer profile not found');
        } else {
          setError('Failed to load issuer profile');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (ticker) {
      fetchPublicProfile();
    }
  }, [ticker]);

  // Fetch Twitter posts
  const fetchTwitterPosts = useCallback(async (reset = false) => {
    if (twitterLoading || (!reset && !twitterHasMore)) return;

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
    if (instagramLoading || (!reset && !instagramHasMore)) return;

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
    if (activeTab === 'twitter' && twitterPosts.length === 0 && profile?.twitter_url) {
      fetchTwitterPosts(true);
    } else if (activeTab === 'instagram' && instagramPosts.length === 0 && profile?.instagram_url) {
      fetchInstagramPosts(true);
    }
  }, [activeTab, profile]);

  // Format number for display
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Format date for display
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getInitialsColor = () => {
    const name = profile?.full_name || ticker;
    return getGradientForText(name, false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'suspended':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'pending':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      default:
        return 'text-canvas-foreground bg-box-bg border-box-border';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-canvas-foreground font-mono">Loading issuer profile...</span>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-canvas-foreground font-mono mb-2">Profile Not Found</h1>
          <p className="text-canvas-foreground opacity-70 font-mono">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Hero Section */}
          <div className="!bg-black rounded-xl p-8 mb-8 shadow-lg">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="relative">
                <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-box-border overflow-hidden bg-gradient-to-br ${getInitialsColor()} flex items-center justify-center shadow-lg`}>
                  {profile.image_url && profile.image_url !== 'blank' ? (
                    <img 
                      src={getPreviewUrl(profile.image_url || '')} 
                      alt="Profile" 
                      className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => {
                        if (profile.image_url) {
                          window.open(getProxyUrl(profile.image_url || ''), '_blank');
                        }
                      }}
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        if (img.src !== getFallbackUrl(profile.image_url || '')) {
                          img.src = getFallbackUrl(profile.image_url || '');
                        }
                      }}
                    />
                  ) : (
                    <span className="text-3xl md:text-4xl font-bold text-white font-mono drop-shadow-sm">
                      {getInitials(profile.full_name)}
                    </span>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-canvas-background flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
                  <h1 className="text-3xl md:text-4xl font-bold font-mono text-canvas-foreground">{profile.full_name}</h1>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold font-mono border ${getStatusColor(profile.status)}`}>
                    {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
                  </span>
                </div>
                {profile.headline && (
                  <p className="text-lg text-canvas-foreground opacity-90 font-mono">{profile.headline}</p>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-6 border-t border-box-border">
              <div className="text-center md:text-left">
                <p className="text-sm text-canvas-foreground opacity-70 font-mono mb-1">Primary Category</p>
                <p className="font-semibold text-canvas-foreground font-mono">
                  {typeof profile.primary_tag === 'object' && profile.primary_tag ? (profile.primary_tag as any).tag_name : profile.primary_tag}
                </p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-sm text-canvas-foreground opacity-70 font-mono mb-1">Member Since</p>
                <p className="font-semibold text-canvas-foreground font-mono">
                  {new Date(profile.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long' 
                  })}
                </p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-sm text-canvas-foreground opacity-70 font-mono mb-1">Status</p>
                <p className="font-semibold text-canvas-foreground font-mono capitalize">{profile.status}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* About Section */}
            <div className="!bg-black rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-[#E5C68D]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#E5C68D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-canvas-foreground font-mono">About</h3>
              </div>
              {profile.short_bio ? (
                <p className="text-canvas-foreground font-mono leading-relaxed">{profile.short_bio}</p>
              ) : (
                <p className="text-canvas-foreground opacity-50 font-mono italic">No bio available</p>
              )}
            </div>

            {/* Tags Section */}
            <div className="!bg-black rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-canvas-foreground font-mono">Categories</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-canvas-foreground opacity-70 font-mono mb-2">Primary Category</p>
                  <span className="inline-block px-4 py-2 text-sm bg-[#E5C68D]/10 text-[#E5C68D] rounded-lg border border-[#E5C68D]/20 font-mono font-medium">
                    {typeof profile.primary_tag === 'object' && profile.primary_tag ? (profile.primary_tag as any).tag_name : profile.primary_tag}
                  </span>
                </div>
                {profile.secondary_tag && (
                  <div>
                    <p className="text-sm text-canvas-foreground opacity-70 font-mono mb-2">Additional Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        let tags: string[] = [];
                        
                        if (typeof profile.secondary_tag === 'string') {
                          tags = profile.secondary_tag.split(',').map(t => t.trim());
                        } else if (Array.isArray(profile.secondary_tag)) {
                          tags = profile.secondary_tag.map(tag => {
                            if (typeof tag === 'object' && tag && (tag as any).tag_name) {
                              return (tag as any).tag_name;
                            }
                            return String(tag).trim();
                          });
                        }
                        
                        return tags.filter(t => t && t.trim()).map((tag, index) => (
                          <span 
                            key={index}
                            className="inline-block px-3 py-1 text-xs bg-green-500/10 text-green-500 rounded-lg border border-green-500/20 font-mono"
                          >
                            {String(tag).trim()}
                          </span>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {(profile.instagram_url || profile.twitter_url || profile.tiktok_url || profile.spotify_url) && (
            <div className="!bg-black rounded-xl p-6 mt-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-canvas-foreground font-mono">Connect</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {profile.instagram_url && (
                  <a 
                    href={profile.instagram_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-all duration-200 hover:scale-105 cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    <span className="font-mono font-medium">Instagram</span>
                  </a>
                )}
                {profile.twitter_url && (
                  <a 
                    href={profile.twitter_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 bg-[#E5C68D] text-white rounded-lg hover:opacity-90 transition-all duration-200 hover:scale-105 cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                    <span className="font-mono font-medium">Twitter</span>
                  </a>
                )}
                {profile.tiktok_url && (
                  <a 
                    href={profile.tiktok_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 bg-black text-white rounded-lg hover:opacity-90 transition-all duration-200 hover:scale-105 cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                    </svg>
                    <span className="font-mono font-medium">TikTok</span>
                  </a>
                )}
                {profile.spotify_url && (
                  <a 
                    href={profile.spotify_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 bg-green-500 text-white rounded-lg hover:opacity-90 transition-all duration-200 hover:scale-105 cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                    <span className="font-mono font-medium">Spotify</span>
                  </a>
                )}
              </div>
            </div>
          )}
    </div>
  );
}
