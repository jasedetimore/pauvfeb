'use client';

import Link from 'next/link';
import { sendGAEvent } from '@next/third-parties/google';
import { colors } from '@/lib/constants/colors';

export interface AnalyticsLinkProps {
  href: string;
  /** Human-readable label (used as fallback issuer_name) */
  label: string;
  /** Issuer ticker — maps to GA4 dimension issuer_id */
  issuerId?: string;
  /** Issuer display name — maps to GA4 dimension issuer_name */
  issuerName?: string;
  /** Category/tag — maps to GA4 dimension tag_name */
  tagName?: string;
  /** Where the link is rendered, e.g. "home_grid", "tag_page", "recommended" */
  source?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * AnalyticsLink - A wrapper around Next.js Link that fires a GA event on click.
 * Parameters map directly to GA4 custom dimensions (issuer_id, issuer_name, tag_name)
 * and are safe to use with 1000+ issuers — GA4 stores values, not event names.
 */
export const AnalyticsLink = ({
  href,
  label,
  issuerId,
  issuerName,
  tagName,
  source,
  children,
  className,
  style,
}: AnalyticsLinkProps) => {
  const handleClick = () => {
    sendGAEvent('event', 'issuer_card_click', {
      issuer_id: issuerId || 'none',
      issuer_name: issuerName || label,
      tag_name: tagName || 'none',
      source: source || 'unknown',
      destination: href,
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
