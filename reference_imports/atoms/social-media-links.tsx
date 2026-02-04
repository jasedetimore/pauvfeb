import React from 'react';
import { NAVBAR_BG1, NAVBAR_BORDER1 } from '@/constants/colors';

interface SocialMediaLinksProps {
  twitter_url?: string | null;
  instagram_url?: string | null;
  tiktok_url?: string | null;
}

export const SocialMediaLinks: React.FC<SocialMediaLinksProps> = () => {
  return (
    <div 
      className="p-2 rounded-[10px] flex items-center justify-center gap-4"
      style={{ background: NAVBAR_BG1, border: `1px solid ${NAVBAR_BORDER1}` }}
    >
      <div className="opacity-70">
        <img src="/x.png" alt="X" className="w-5 h-5" />
      </div>
      <div className="opacity-70">
        <img src="/Instagram.png" alt="Instagram" className="w-5 h-5" />
      </div>
      <div className="opacity-70">
        <img src="/tiktok.png" alt="TikTok" className="w-5 h-5" />
      </div>
    </div>
  );
};
