import { IssuerData, IssuerListData } from "@/lib/types";
import { TagItemData } from "@/components/atoms/TagItem";

/**
 * Mock data for development - will be replaced with real API data
 */

// Extended issuer data for list view
export interface ExtendedIssuerData extends IssuerData {
  price1hChange?: number;
  price7dChange?: number;
  volume24h?: number;
  holders?: number;
  marketCap?: number;
}

// Sample issuers with realistic data (extended for list view)
export const mockIssuers: ExtendedIssuerData[] = [
  {
    ticker: "SWIFT",
    fullName: "Taylor Swift",
    imageUrl: "https://picsum.photos/seed/swift/200",
    currentPrice: 245.67,
    priceChange: 12.45,
    primaryTag: "Music",
    price1hChange: 0.85,
    price7dChange: 23.45,
    volume24h: 12500000,
    holders: 45678,
    marketCap: 890000000,
  },
  {
    ticker: "RONLD",
    fullName: "Cristiano Ronaldo",
    imageUrl: "https://picsum.photos/seed/ronaldo/200",
    currentPrice: 189.32,
    priceChange: -3.21,
    primaryTag: "Sports",
    price1hChange: -0.45,
    price7dChange: -5.67,
    volume24h: 8900000,
    holders: 34567,
    marketCap: 670000000,
  },
  {
    ticker: "MUSK",
    fullName: "Elon Musk",
    imageUrl: "https://picsum.photos/seed/musk/200",
    currentPrice: 567.89,
    priceChange: 8.76,
    primaryTag: "Business",
    price1hChange: 1.23,
    price7dChange: 15.89,
    volume24h: 25000000,
    holders: 78901,
    marketCap: 1200000000,
  },
  {
    ticker: "BONCE",
    fullName: "Beyoncé",
    imageUrl: "https://picsum.photos/seed/beyonce/200",
    currentPrice: 312.45,
    priceChange: 5.23,
    primaryTag: "Music",
    price1hChange: 0.34,
    price7dChange: 8.90,
    volume24h: 9800000,
    holders: 56789,
    marketCap: 780000000,
  },
  {
    ticker: "LEBRO",
    fullName: "LeBron James",
    imageUrl: "https://picsum.photos/seed/lebron/200",
    currentPrice: 156.78,
    priceChange: -1.89,
    primaryTag: "Sports",
    price1hChange: -0.12,
    price7dChange: 2.34,
    volume24h: 6700000,
    holders: 23456,
    marketCap: 450000000,
  },
  {
    ticker: "RIHAN",
    fullName: "Rihanna",
    imageUrl: "https://picsum.photos/seed/rihanna/200",
    currentPrice: 278.90,
    priceChange: 15.67,
    primaryTag: "Music",
    price1hChange: 2.45,
    price7dChange: 28.90,
    volume24h: 15600000,
    holders: 67890,
    marketCap: 720000000,
  },
  {
    ticker: "GATES",
    fullName: "Bill Gates",
    imageUrl: "https://picsum.photos/seed/gates/200",
    currentPrice: 445.23,
    priceChange: 2.34,
    primaryTag: "Business",
    price1hChange: 0.15,
    price7dChange: 4.56,
    volume24h: 18900000,
    holders: 89012,
    marketCap: 980000000,
  },
  {
    ticker: "MESSI",
    fullName: "Lionel Messi",
    imageUrl: "https://picsum.photos/seed/messi/200",
    currentPrice: 198.45,
    priceChange: 7.89,
    primaryTag: "Sports",
    price1hChange: 0.67,
    price7dChange: 12.34,
    volume24h: 11200000,
    holders: 45678,
    marketCap: 560000000,
  },
  {
    ticker: "OPRAH",
    fullName: "Oprah Winfrey",
    imageUrl: "https://picsum.photos/seed/oprah/200",
    currentPrice: 367.12,
    priceChange: -0.45,
    primaryTag: "Entertainment",
    price1hChange: -0.08,
    price7dChange: 1.23,
    volume24h: 7800000,
    holders: 34567,
    marketCap: 650000000,
  },
  {
    ticker: "DRAKE",
    fullName: "Drake",
    imageUrl: "https://picsum.photos/seed/drake/200",
    currentPrice: 234.56,
    priceChange: 11.23,
    primaryTag: "Music",
    price1hChange: 1.56,
    price7dChange: 18.90,
    volume24h: 13400000,
    holders: 56789,
    marketCap: 620000000,
  },
  {
    ticker: "ZBERG",
    fullName: "Mark Zuckerberg",
    imageUrl: "https://picsum.photos/seed/zuck/200",
    currentPrice: 512.34,
    priceChange: -2.67,
    primaryTag: "Tech",
    price1hChange: -0.34,
    price7dChange: -4.56,
    volume24h: 22000000,
    holders: 90123,
    marketCap: 1100000000,
  },
  {
    ticker: "ARNDG",
    fullName: "Ariana Grande",
    imageUrl: "https://picsum.photos/seed/ariana/200",
    currentPrice: 189.90,
    priceChange: 4.56,
    primaryTag: "Music",
    price1hChange: 0.23,
    price7dChange: 7.89,
    volume24h: 8900000,
    holders: 45678,
    marketCap: 520000000,
  },
];

// Helper to convert extended data to list view format
export function toListViewData(issuer: ExtendedIssuerData): IssuerListData {
  return {
    ticker: issuer.ticker,
    fullName: issuer.fullName,
    primaryTag: issuer.primaryTag,
    currentPrice: issuer.currentPrice,
    price1hChange: issuer.price1hChange,
    price24hChange: issuer.priceChange,
    price7dChange: issuer.price7dChange,
    volume24h: issuer.volume24h,
    holders: issuer.holders,
    marketCap: issuer.marketCap,
  };
}

// Get all issuers in list view format
export const mockIssuersListView: IssuerListData[] = mockIssuers.map(toListViewData);

// Sample trending issuers
export const mockTrendingIssuers: ExtendedIssuerData[] = [
  mockIssuers[5], // Rihanna
  mockIssuers[0], // Taylor Swift
  mockIssuers[9], // Drake
  mockIssuers[2], // Elon Musk
  mockIssuers[7], // Messi
  mockIssuers[3], // Beyonce
];

// Sample newest issuers
export const mockNewestIssuers: ExtendedIssuerData[] = [
  {
    ticker: "HARRY",
    fullName: "Harry Styles",
    imageUrl: "https://picsum.photos/seed/harry/200",
    currentPrice: 145.67,
    priceChange: 23.45,
    primaryTag: "Music",
    price1hChange: 3.45,
    price7dChange: 45.67,
    volume24h: 5600000,
    holders: 23456,
    marketCap: 340000000,
  },
  {
    ticker: "DUALP",
    fullName: "Dua Lipa",
    imageUrl: "https://picsum.photos/seed/dualipa/200",
    currentPrice: 123.45,
    priceChange: 18.90,
    primaryTag: "Music",
    price1hChange: 2.34,
    price7dChange: 34.56,
    volume24h: 4500000,
    holders: 19876,
    marketCap: 290000000,
  },
  {
    ticker: "MBAPP",
    fullName: "Kylian Mbappé",
    imageUrl: "https://picsum.photos/seed/mbappe/200",
    currentPrice: 167.89,
    priceChange: 9.12,
    primaryTag: "Sports",
    price1hChange: 0.89,
    price7dChange: 15.67,
    volume24h: 6700000,
    holders: 28765,
    marketCap: 410000000,
  },
  {
    ticker: "SZAMR",
    fullName: "Sam Altman",
    imageUrl: "https://picsum.photos/seed/altman/200",
    currentPrice: 289.34,
    priceChange: 34.56,
    primaryTag: "Tech",
    price1hChange: 4.56,
    price7dChange: 56.78,
    volume24h: 12300000,
    holders: 45678,
    marketCap: 580000000,
  },
  {
    ticker: "EILSH",
    fullName: "Billie Eilish",
    imageUrl: "https://picsum.photos/seed/billie/200",
    currentPrice: 134.56,
    priceChange: 6.78,
    primaryTag: "Music",
    price1hChange: 0.56,
    price7dChange: 12.34,
    volume24h: 5400000,
    holders: 21098,
    marketCap: 320000000,
  },
  {
    ticker: "WEEKN",
    fullName: "The Weeknd",
    imageUrl: "https://picsum.photos/seed/weeknd/200",
    currentPrice: 178.90,
    priceChange: 12.34,
    primaryTag: "Music",
    price1hChange: 1.23,
    price7dChange: 21.45,
    volume24h: 7800000,
    holders: 34567,
    marketCap: 430000000,
  },
];

// Sample tags with market data
export const mockTags: TagItemData[] = [
  {
    id: "tag-music",
    name: "Music",
    issuerCount: 1245,
    marketCap: 2_450_000_000,
  },
  {
    id: "tag-sports",
    name: "Sports",
    issuerCount: 987,
    marketCap: 1_890_000_000,
  },
  {
    id: "tag-business",
    name: "Business",
    issuerCount: 654,
    marketCap: 3_200_000_000,
  },
  {
    id: "tag-entertainment",
    name: "Entertainment",
    issuerCount: 789,
    marketCap: 1_560_000_000,
  },
  {
    id: "tag-tech",
    name: "Tech",
    issuerCount: 432,
    marketCap: 4_500_000_000,
  },
  {
    id: "tag-influencer",
    name: "Influencer",
    issuerCount: 2134,
    marketCap: 890_000_000,
  },
  {
    id: "tag-gaming",
    name: "Gaming",
    issuerCount: 567,
    marketCap: 780_000_000,
  },
  {
    id: "tag-politics",
    name: "Politics",
    issuerCount: 234,
    marketCap: 560_000_000,
  },
];

// Market summary data
export const mockMarketSummary = {
  totalIssuers: 8542,
  totalMarketCap: 15_890_000_000,
  marketCapChange: 3.45,
};
