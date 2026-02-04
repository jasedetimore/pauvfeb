import React from 'react';
import { Skeleton } from './skeleton';
import {
  Instagram,
  Facebook,
  Twitter,
  Music2,
  Linkedin,
  MessageCircle,
  Clapperboard,
  ChevronLeft 
} from "lucide-react";

import { NAVBAR_BG1,NAVBAR_BORDER1 } from '@/constants/colors';

interface IssuerData {
  instagram_url?: string | null;
  facebook_url?: string | null;
  twitter_url?: string | null;
  tiktok_url?: string | null;
  spotify_url?: string | null;
  linkedin_url?: string | null;
  whatsapp_url?: string | null;
  [key: string]: any;
}

interface PriceDisplayProps {
  price?: number | null;
  ticker?: string;
  loading?: boolean;
  data?: IssuerData;
  showHeaderRow?: boolean;
  condensed?: boolean;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  ticker,
  loading,
  data,
  showHeaderRow = true,
  condensed = false,
}) => {
  // Show skeleton when loading and no price data available
  if (loading && price == null) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <Skeleton width="100px" height="1.5rem" />
        </div>
        <div className="p-4 bg-neutral-900 border border-neutral-700 rounded-md">
          <div className="text-xs uppercase opacity-60">
            Current Price
          </div>
          <Skeleton width="70%" height="2rem" className="mt-2" />
          <div className="mt-3 flex items-center gap-3 text-neutral-500">
            <Skeleton width="80px" height="0.75rem" />
          </div>
        </div>
      </div>
    );
  }
  const socialLinks = [
    { name: "facebook", url: data?.facebook_url, icon: <Facebook size={18} /> },
    { name: "twitter", url: data?.twitter_url, icon: <Twitter size={18} /> },
    { name: "tiktok", url: data?.tiktok_url, icon: <Clapperboard size={18} /> },
    { name: "spotify", url: data?.spotify_url, icon: <Music2 size={18} /> },
    { name: "linkedin", url: data?.linkedin_url, icon: <Linkedin size={18} /> },
    { name: "whatsapp", url: data?.whatsapp_url, icon: <MessageCircle size={18} /> },
  ];

  const availableLinks = socialLinks.filter(link => link.url && link.url !== null && link.url.trim() !== '');

  return (
    <div>
      {showHeaderRow && (
        <div className="flex items-center justify-between mb-2 px-1">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-lg font-fira font-medium hover:opacity-80 transition-opacity"
            style={{ color: '#E1CB8A' }}
          >
            <ChevronLeft size={18} />
            ${ticker}
          </button>
        </div>
      )}

      {/* Price Box - styles adapt for condensed/mobile */}
      <div
        className={`p-4 pb-1.5 rounded-[10px] transition-colors ${condensed ? "hover:bg-transparent" : "hover:bg-neutral-800"}`}
        style={
          condensed
            ? { background: "transparent", border: "none" }
            : { background: NAVBAR_BG1, border: `1px solid ${NAVBAR_BORDER1}` }
        }
      >
        <div className="font-light text-xs uppercase opacity-90">
          Current Price
        </div>
        <div className="font-mono font-bold truncate text-[1.5rem] md:text-[1.7rem]">
          {price != null
            ? `$${Number(price).toLocaleString('en-US', { minimumFractionDigits: 8, maximumFractionDigits: 8 })}`
            : "—"}
        </div>
      </div>
    </div>
  );
};