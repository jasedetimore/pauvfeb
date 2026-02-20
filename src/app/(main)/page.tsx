import { MainPageTemplate } from "@/components/templates";
import { getIssuersAndStats, getTags } from "@/lib/server/issuers";
import { IssuerData, IssuerListData } from "@/lib/types";

/**
 * Home Page (Server Component)
 * 
 * Fetches data on the server to prevent waterfalls and improve SEO.
 * Passes initial data to the Client Component template.
 */

interface HomeProps {
  searchParams?: Promise<{
    tag?: string;
    search?: string;
  }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const tagFilter = params?.tag;
  const searchFilter = params?.search;

  // 1. Fetch Data in Parallel (Server-Side)
  // We explicitly fetch 50 items. Pagination could be added via more searchParams.
  const [issuersData, tagsData] = await Promise.all([
    getIssuersAndStats({
      tag: tagFilter,
      search: searchFilter,
      limit: 50
    }),
    getTags()
  ]);

  const { issuers: dbIssuers, statsMap, stats } = issuersData;

  // 2. Compute Derived Data (Server-Side)
  // This logic is moved from client to server to reduce client bundle size and CPU

  // Compute total market cap
  const totalMarketCap = stats.reduce((sum, s) => sum + (s.marketCap || 0), 0);

  // Transform DB issuers to include market data
  const issuersWithMarketData: IssuerData[] = dbIssuers.map((issuer) => {
    const cachedStats = statsMap.get(issuer.ticker);

    if (cachedStats && cachedStats.currentPrice > 0) {
      return {
        ticker: issuer.ticker,
        fullName: issuer.fullName,
        imageUrl: issuer.imageUrl,
        currentPrice: cachedStats.currentPrice,
        priceChange: cachedStats.price24hChange ?? 0,
        primaryTag: issuer.primaryTag,
        isTradable: true,
      };
    }

    return {
      ticker: issuer.ticker,
      fullName: issuer.fullName,
      imageUrl: issuer.imageUrl,
      currentPrice: 0,
      priceChange: 0,
      primaryTag: issuer.primaryTag,
      isTradable: false,
    };
  });

  // Create list view data
  const listViewIssuers: IssuerListData[] = dbIssuers.map((issuer) => {
    const cachedStats = statsMap.get(issuer.ticker);

    if (cachedStats && cachedStats.currentPrice > 0) {
      return {
        ticker: issuer.ticker,
        fullName: issuer.fullName,
        primaryTag: issuer.primaryTag,
        currentPrice: cachedStats.currentPrice,
        price1hChange: cachedStats.price1hChange ?? 0,
        price24hChange: cachedStats.price24hChange ?? 0,
        price7dChange: cachedStats.price7dChange ?? 0,
        volume24h: cachedStats.volume24h,
        holders: cachedStats.holders,
        marketCap: cachedStats.marketCap,
        isTradable: true,
      };
    }

    return {
      ticker: issuer.ticker,
      fullName: issuer.fullName,
      primaryTag: issuer.primaryTag,
      currentPrice: 0,
      price1hChange: 0,
      price24hChange: 0,
      price7dChange: 0,
      volume24h: 0,
      holders: 0,
      marketCap: 0,
      isTradable: false,
    };
  });

  // Pre-sort lists (can be done on client too, but doing it here saves client CPU on init)
  // Note: Client still needs to re-sort if user changes sort mode, so we pass raw lists mostly?
  // Actually MainPageTemplate expects pre-sorted lists.

  const biggestIssuers = [...issuersWithMarketData].sort((a, b) => {
    const aStats = statsMap.get(a.ticker);
    const bStats = statsMap.get(b.ticker);
    return (bStats?.marketCap ?? 0) - (aStats?.marketCap ?? 0);
  });

  const trendingIssuers = [...issuersWithMarketData].sort((a, b) => b.priceChange - a.priceChange);

  // Using reverse as proxy for newest for now (assuming DB returns created_at desc if not sorted by name)
  // The getIssuersAndStats sorts by created_at DESC by default if no search.
  const newestIssuers = [...issuersWithMarketData]; // Already sorted by created_at DESC from DB

  const alphabeticalIssuers = [...issuersWithMarketData].sort((a, b) =>
    a.fullName.localeCompare(b.fullName)
  );

  // derived data
  const selectedTag = tagsData?.find(t => t.name.toLowerCase() === tagFilter?.toLowerCase());

  // Prepare selectedTagInfo for Hero if needed
  const selectedTagInfo = selectedTag ? {
    name: selectedTag.name,
    description: selectedTag.description,
    issuerCount: selectedTag.issuerCount,
    marketCap: selectedTag.marketCap,
    photoUrl: selectedTag.photoUrl,
  } : null;

  return (
    <MainPageTemplate
      // Market summary data
      issuerCount={dbIssuers.length}
      marketCap={totalMarketCap}
      marketCapChange={0} // TODO: Calculate global change
      tags={tagsData || []}

      // Selected tag state
      initialTagId={selectedTag?.id}
      selectedTag={selectedTagInfo}

      // Issuers for card view
      biggestIssuers={biggestIssuers}
      trendingIssuers={trendingIssuers}
      newestIssuers={newestIssuers}
      alphabeticalIssuers={alphabeticalIssuers}

      // Issuers for list view
      listViewIssuers={listViewIssuers}

      // Loading states (Server Component is always "done" loading when rendered)
      tagsLoading={false}
      issuersLoading={false}

      // Auth state (Middleware handles auth for protected routes, but for UI we might check session)
      // For public home page, we can treat as guest or fetch session if needed. 
      // Passing false for now as per original code.
      isAuthenticated={false}
    />
  );
}
