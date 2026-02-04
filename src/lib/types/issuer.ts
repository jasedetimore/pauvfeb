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
  created_at: string;
  updated_at: string;
}

// Transformed issuer data for UI components (card view)
export interface IssuerCardData {
  ticker: string;
  fullName: string;
  imageUrl?: string;
  currentPrice: number;
  priceChange: number;
  primaryTag?: string;
  bio?: string;
  headline?: string;
}

// Extended issuer data for list view
export interface IssuerListViewData extends IssuerCardData {
  price1hChange?: number;
  price7dChange?: number;
  volume24h?: number;
  holders?: number;
  marketCap?: number;
}

// API response type
export interface IssuersApiResponse {
  issuers: IssuerCardData[];
  total: number;
  error?: string;
}

// Transform function to convert DB model to UI model
export function transformIssuerDetailsToCard(dbIssuer: IssuerDetailsDB): IssuerCardData {
  return {
    ticker: dbIssuer.ticker,
    fullName: dbIssuer.name,
    imageUrl: dbIssuer.photo || undefined,
    // Price data will be added from a different source (market data)
    // For now, we use placeholder values
    currentPrice: 0,
    priceChange: 0,
    primaryTag: dbIssuer.tag || undefined,
    bio: dbIssuer.bio || undefined,
    headline: dbIssuer.headline || undefined,
  };
}

// Transform function to convert DB model to list view model
export function transformIssuerDetailsToList(dbIssuer: IssuerDetailsDB): IssuerListViewData {
  return {
    ...transformIssuerDetailsToCard(dbIssuer),
    price1hChange: 0,
    price7dChange: 0,
    volume24h: 0,
    holders: 0,
    marketCap: 0,
  };
}
