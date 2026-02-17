'use client';

import Link from 'next/link';
import { sendGAEvent } from '@next/third-parties/google';
import { colors } from '@/lib/constants/colors';

export interface AnalyticsLinkProps {
  href: string;
  label: string;
  profileId?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * AnalyticsLink - A wrapper around Next.js Link that fires a GA event on click.
 * Tracks which issuers / PVs are being clicked by users.
 */
export const AnalyticsLink = ({
  href,
  label,
  profileId,
  children,
  className,
  style,
}: AnalyticsLinkProps) => {
  const handleClick = () => {
    sendGAEvent('event', 'issuer_click', {
      destination: href,
      label,
      target_issuer_id: profileId || 'none',
      currency: 'USDP',
    });
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      style={{ color: colors.gold, ...style }}
      className={className ?? 'hover:opacity-80 transition-opacity'}
    >
      {children}
    </Link>
  );
};
