"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { CG, CR } from "../../constants/colors";
import { PercentageChange } from "../atoms";
import { getPreviewUrl } from "../../lib/utils";

interface SimpleIssuerCardProps {
  ticker: string;
  fullName: string;
  imageUrl?: string;
  currentPrice: number;
  priceChange: number;
  primaryTag?: string;
  backgroundColor?: string;
  hoverBackgroundColor?: string;
}

export function SimpleIssuerCard({
  ticker,
  fullName,
  imageUrl,
  currentPrice,
  priceChange,
  primaryTag,
  backgroundColor = '#000',
  hoverBackgroundColor = '#1a1a1a',
}: SimpleIssuerCardProps) {
  // Get first 3 letters of the full name
  const initials = fullName
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .slice(0, 3)
    .toUpperCase() || ticker.slice(0, 3).toUpperCase();

  const [imageError, setImageError] = React.useState(false);

  const formatPrice = (price: number): string => {
    if (!isFinite(price)) return "—";
    if (price >= 10000) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
    }
    if (price >= 100) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`;
    }
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 5, maximumFractionDigits: 5 })}`;
  };

  const isPositiveChange = priceChange >= 0;

  return (
    <div
      onClick={() => {
        window.location.href = `/issuers/${encodeURIComponent(ticker.toLowerCase())}`;
      }}
      style={{
        backgroundColor,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        height: '132px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        gap: '12px',
        padding: '12px'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = hoverBackgroundColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = backgroundColor;
      }}
    >
      {/* Left side - Square image */}
      <div style={{
        width: '88px',
        height: '88px',
        backgroundColor: '#ffffff',
        flexShrink: 0,
        borderRadius: '5px',
        overflow: 'hidden'
      }}>
        {imageUrl && !imageError ? (
          <img
            src={getPreviewUrl(imageUrl)}
            alt={`${ticker} logo`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover"
            }}
            onError={() => setImageError(true)}
          />
        ) : null}
      </div>

      {/* Right side - Information */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: '88px'
      }}>
        {/* Top section */}
        <div>
          {/* Ticker */}
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#E5C68D',
            marginBottom: '5px',
            fontFamily: 'monospace'
          }}>
            ${ticker}
          </div>

          {/* Stock Name */}
          <div style={{
            fontSize: '16px',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '5px',
            lineHeight: '1.2',
            wordWrap: 'break-word',
            overflowWrap: 'break-word'
          }}>
            {fullName}
          </div>

          {/* Industry */}
          <div style={{
            fontSize: '11px',
            color: '#999',
            fontWeight: '400'
          }}>
            {primaryTag || "—"}
          </div>
        </div>

        {/* Bottom section - Price and Change */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '8px'
        }}>
          {/* Price */}
          <div style={{
            fontSize: '16px',
            fontWeight: '400',
            color: '#fff',
            letterSpacing: '-0.5px',
            flexShrink: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {formatPrice(currentPrice)}
          </div>

          {/* 24hr Change with triangle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            flexShrink: 0
          }}>
            {isPositiveChange && (
              <span style={{ 
                width: 0, 
                height: 0, 
                borderLeft: '4px solid transparent', 
                borderRight: '4px solid transparent', 
                borderBottom: `5px solid ${CG}` 
              }}></span>
            )}
            {!isPositiveChange && (
              <span style={{ 
                width: 0, 
                height: 0, 
                borderLeft: '4px solid transparent', 
                borderRight: '4px solid transparent', 
                borderTop: `5px solid ${CR}` 
              }}></span>
            )}
            <div style={{
              fontSize: '13px',
              fontWeight: '700',
              color: isPositiveChange ? CG : CR,
              whiteSpace: 'nowrap'
            }}>
              {isPositiveChange ? '+' : ''}{priceChange.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
