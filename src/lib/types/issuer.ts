/**
 * Issuer types - Database models and UI data structures
 */

// Database model matching Supabase issuer_details table
export interface IssuerDetailsDB {
  id: string;
  name: string;
  ticker: string;
  bio: string | null;
  headline: string | null;
  tag: string | null;
  photo: string | null;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

// Transformed issuer data for UI components (card view)
// Renamed/Aliased to match component usage
export interface IssuerData {
  ticker: string;
  fullName: string;
  imageUrl?: string;
  currentPrice: number;
  priceChange: number;
  primaryTag?: string;
  bio?: string;
  headline?: string;
  isTradable?: boolean;
}

// Alias for backward compatibility if needed, or just use IssuerData
export type IssuerCardData = IssuerData;

// Extended issuer data for list view
export interface IssuerListData {
  ticker: string;
  fullName: string;
  primaryTag?: string;
  currentPrice: number;
  price1hChange?: number;
  price24hChange: number;
  price7dChange?: number;
  volume24h?: number;
  holders?: number;
  marketCap?: number;
  isTradable?: boolean;
  imageUrl?: string; // Optional for list view too
}

export type IssuerListViewData = IssuerListData;

// API response type
export interface IssuersApiResponse {
  issuers: IssuerData[];
  total: number;
  error?: string;
}

// Transform function to convert DB model to UI model
export function transformIssuerDetailsToCard(dbIssuer: IssuerDetailsDB): IssuerData {
  return {
    ticker: dbIssuer.ticker,
    fullName: dbIssuer.name,
    imageUrl: dbIssuer.photo || undefined,
    currentPrice: 0,
    priceChange: 0,
    primaryTag: dbIssuer.tag || undefined,
    bio: dbIssuer.bio || undefined,
    headline: dbIssuer.headline || undefined,
    isTradable: false, // Default to false until enriched with stats
  };
}

// Transform function to convert DB model to list view model
export function transformIssuerDetailsToList(dbIssuer: IssuerDetailsDB): IssuerListData {
  return {
    ticker: dbIssuer.ticker,
    fullName: dbIssuer.name,
    primaryTag: dbIssuer.tag || undefined,
    currentPrice: 0,
    price1hChange: 0,
    price24hChange: 0,
    price7dChange: 0,
    volume24h: 0,
    holders: 0,
    marketCap: 0,
    isTradable: false,
    imageUrl: dbIssuer.photo || undefined,
  };
}
