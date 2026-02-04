"use client";

import React, { useState, useEffect, useCallback } from "react";
import { colors } from "@/lib/constants/colors";
import { useAuth } from "@/lib/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

interface IssuerDetails {
  id: string;
  name: string;
  ticker: string;
  bio: string | null;
  headline: string | null;
  tag: string | null;
  photo: string | null;
  created_at: string;
}

interface IssuerTrading {
  id: string;
  ticker: string;
  current_supply: number;
  base_price: number;
  price_step: number;
  current_price: number;
  total_usdp: number;
  created_at: string;
}

interface TagData {
  id: string;
  tag: string;
}

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"create-issuer" | "list-trading">("create-issuer");
  
  // Issuer form state
  const [issuerForm, setIssuerForm] = useState({
    name: "",
    ticker: "",
    bio: "",
    headline: "",
    tag: "",
    photo: "",
  });
  const [issuerLoading, setIssuerLoading] = useState(false);
  const [issuerError, setIssuerError] = useState<string | null>(null);
  const [issuerSuccess, setIssuerSuccess] = useState<string | null>(null);

  // Trading form state
  const [tradingForm, setTradingForm] = useState({
    ticker: "",
    base_price: "1.00",
    price_step: "0.01",
  });
  const [tradingLoading, setTradingLoading] = useState(false);
  const [tradingError, setTradingError] = useState<string | null>(null);
  const [tradingSuccess, setTradingSuccess] = useState<string | null>(null);

  // Data lists
  const [issuers, setIssuers] = useState<IssuerDetails[]>([]);
  const [tradingRecords, setTradingRecords] = useState<IssuerTrading[]>([]);
  const [tags, setTags] = useState<TagData[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Calculate unlisted issuers (in issuer_details but not in issuer_trading)
  const unlistedIssuers = React.useMemo(() => {
    const listedTickers = new Set(tradingRecords.map(t => t.ticker));
    return issuers.filter(i => !listedTickers.has(i.ticker));
  }, [issuers, tradingRecords]);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!user) return;
    
    setLoadingData(true);
    const supabase = createClient();
    
    try {
      // Get session for auth header
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Fetch issuers
      const { data: issuerData, error: issuerError } = await supabase
        .from("issuer_details")
        .select("*")
        .order("name");
      
      console.log("[Admin] Fetched issuers:", issuerData?.length, issuerError);
      if (issuerData) {
        setIssuers(issuerData);
      }

      // Fetch trading records (admin API)
      let tradingData: IssuerTrading[] = [];
      if (token) {
        const tradingRes = await fetch("/api/admin/issuer-trading", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const tradingJson = await tradingRes.json();
        console.log("[Admin] Fetched trading:", tradingJson);
        if (tradingJson.success) {
          tradingData = tradingJson.data || [];
          setTradingRecords(tradingData);
        }
      }

      // Fetch tags
      const { data: tagData, error: tagError } = await supabase
        .from("tags")
        .select("id, tag")
        .order("tag");
      
      console.log("[Admin] Fetched tags:", tagData?.length, tagError);
      if (tagData) {
        setTags(tagData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create issuer
  const handleCreateIssuer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIssuerLoading(true);
    setIssuerError(null);
    setIssuerSuccess(null);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/admin/issuers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(issuerForm),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to create issuer");
      }

      setIssuerSuccess(`Successfully created issuer: ${issuerForm.ticker}`);
      setIssuerForm({
        name: "",
        ticker: "",
        bio: "",
        headline: "",
        tag: "",
        photo: "",
      });
      
      // Refresh data
      fetchData();
    } catch (error) {
      setIssuerError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIssuerLoading(false);
    }
  };

  // Create trading entry
  const handleCreateTrading = async (e: React.FormEvent) => {
    e.preventDefault();
    setTradingLoading(true);
    setTradingError(null);
    setTradingSuccess(null);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/admin/issuer-trading", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ticker: tradingForm.ticker,
          base_price: parseFloat(tradingForm.base_price),
          price_step: parseFloat(tradingForm.price_step),
          current_price: parseFloat(tradingForm.base_price), // Start at base price
          current_supply: 0,
          total_usdp: 0,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to create trading entry");
      }

      setTradingSuccess(`Successfully listed ${tradingForm.ticker} for trading!`);
      setTradingForm({
        ticker: "",
        base_price: "1.00",
        price_step: "0.01",
      });
      
      // Refresh data
      fetchData();
    } catch (error) {
      setTradingError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setTradingLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: colors.box,
    borderColor: colors.boxOutline,
    color: colors.textPrimary,
  };

  const labelStyle = {
    color: colors.textSecondary,
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8" style={{ color: colors.gold }}>
        Admin Dashboard
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("create-issuer")}
          className="px-4 py-2 rounded font-medium transition-colors"
          style={{
            backgroundColor: activeTab === "create-issuer" ? colors.gold : colors.box,
            color: activeTab === "create-issuer" ? colors.textDark : colors.textPrimary,
            border: `1px solid ${activeTab === "create-issuer" ? colors.gold : colors.boxOutline}`,
          }}
        >
          Create Issuer
        </button>
        <button
          onClick={() => setActiveTab("list-trading")}
          className="px-4 py-2 rounded font-medium transition-colors"
          style={{
            backgroundColor: activeTab === "list-trading" ? colors.gold : colors.box,
            color: activeTab === "list-trading" ? colors.textDark : colors.textPrimary,
            border: `1px solid ${activeTab === "list-trading" ? colors.gold : colors.boxOutline}`,
          }}
        >
          List for Trading
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Forms */}
        <div
          className="p-6 rounded-lg"
          style={{
            backgroundColor: colors.box,
            border: `1px solid ${colors.boxOutline}`,
          }}
        >
          {activeTab === "create-issuer" && (
            <div>
              <h2 className="text-xl font-semibold mb-4" style={{ color: colors.textPrimary }}>
                Create New Issuer
              </h2>
              <p className="text-sm mb-6" style={{ color: colors.textSecondary }}>
                Add a new issuer to the platform. They will be added to issuer_details.
              </p>

              <form onSubmit={handleCreateIssuer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={labelStyle}>
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={issuerForm.name}
                    onChange={(e) => setIssuerForm({ ...issuerForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-1"
                    style={{ ...inputStyle, "--tw-ring-color": colors.gold } as React.CSSProperties}
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={labelStyle}>
                    Ticker * (uppercase, unique)
                  </label>
                  <input
                    type="text"
                    required
                    value={issuerForm.ticker}
                    onChange={(e) => setIssuerForm({ ...issuerForm, ticker: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-1 uppercase"
                    style={{ ...inputStyle, "--tw-ring-color": colors.gold } as React.CSSProperties}
                    placeholder="JDOE"
                    maxLength={10}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={labelStyle}>
                    Headline
                  </label>
                  <input
                    type="text"
                    value={issuerForm.headline}
                    onChange={(e) => setIssuerForm({ ...issuerForm, headline: e.target.value })}
                    className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-1"
                    style={{ ...inputStyle, "--tw-ring-color": colors.gold } as React.CSSProperties}
                    placeholder="Software Engineer & Content Creator"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={labelStyle}>
                    Bio
                  </label>
                  <textarea
                    value={issuerForm.bio}
                    onChange={(e) => setIssuerForm({ ...issuerForm, bio: e.target.value })}
                    className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-1"
                    style={{ ...inputStyle, "--tw-ring-color": colors.gold } as React.CSSProperties}
                    rows={3}
                    placeholder="A brief bio about the issuer..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={labelStyle}>
                    Tag
                  </label>
                  <select
                    value={issuerForm.tag}
                    onChange={(e) => setIssuerForm({ ...issuerForm, tag: e.target.value })}
                    className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-1"
                    style={{ ...inputStyle, "--tw-ring-color": colors.gold } as React.CSSProperties}
                  >
                    <option value="">Select a tag...</option>
                    {tags.map((tag) => (
                      <option key={tag.id} value={tag.tag}>
                        {tag.tag}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={labelStyle}>
                    Photo URL
                  </label>
                  <input
                    type="url"
                    value={issuerForm.photo}
                    onChange={(e) => setIssuerForm({ ...issuerForm, photo: e.target.value })}
                    className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-1"
                    style={{ ...inputStyle, "--tw-ring-color": colors.gold } as React.CSSProperties}
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>

                {issuerError && (
                  <div className="p-3 rounded" style={{ backgroundColor: `${colors.red}20`, border: `1px solid ${colors.red}` }}>
                    <p className="text-sm" style={{ color: colors.red }}>{issuerError}</p>
                  </div>
                )}

                {issuerSuccess && (
                  <div className="p-3 rounded" style={{ backgroundColor: `${colors.green}20`, border: `1px solid ${colors.green}` }}>
                    <p className="text-sm" style={{ color: colors.green }}>{issuerSuccess}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={issuerLoading}
                  className="w-full py-3 rounded font-semibold transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: colors.gold,
                    color: colors.textDark,
                  }}
                >
                  {issuerLoading ? "Creating..." : "Create Issuer"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "list-trading" && (
            <div>
              <h2 className="text-xl font-semibold mb-4" style={{ color: colors.textPrimary }}>
                List Issuer for Trading
              </h2>
              <p className="text-sm mb-6" style={{ color: colors.textSecondary }}>
                Enable trading for an existing issuer. This creates a row in issuer_trading.
              </p>

              <form onSubmit={handleCreateTrading} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={labelStyle}>
                    Select Issuer *
                  </label>
                  <select
                    required
                    value={tradingForm.ticker}
                    onChange={(e) => setTradingForm({ ...tradingForm, ticker: e.target.value })}
                    className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-1"
                    style={{ ...inputStyle, "--tw-ring-color": colors.gold } as React.CSSProperties}
                  >
                    <option value="">Select an unlisted issuer...</option>
                    {unlistedIssuers.map((issuer) => (
                      <option key={issuer.id} value={issuer.ticker}>
                        {issuer.name} ({issuer.ticker})
                      </option>
                    ))}
                  </select>
                  {unlistedIssuers.length === 0 && !loadingData && (
                    <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                      All issuers are already listed for trading.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={labelStyle}>
                    Starting Price (USDP) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={tradingForm.base_price}
                    onChange={(e) => setTradingForm({ ...tradingForm, base_price: e.target.value })}
                    className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-1"
                    style={{ ...inputStyle, "--tw-ring-color": colors.gold } as React.CSSProperties}
                    placeholder="1.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={labelStyle}>
                    Price Step *
                  </label>
                  <input
                    type="number"
                    required
                    min="0.001"
                    step="0.001"
                    value={tradingForm.price_step}
                    onChange={(e) => setTradingForm({ ...tradingForm, price_step: e.target.value })}
                    className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-1"
                    style={{ ...inputStyle, "--tw-ring-color": colors.gold } as React.CSSProperties}
                    placeholder="0.01"
                  />
                  <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                    How much the price increases per PV purchased (bonding curve slope).
                  </p>
                </div>

                {tradingError && (
                  <div className="p-3 rounded" style={{ backgroundColor: `${colors.red}20`, border: `1px solid ${colors.red}` }}>
                    <p className="text-sm" style={{ color: colors.red }}>{tradingError}</p>
                  </div>
                )}

                {tradingSuccess && (
                  <div className="p-3 rounded" style={{ backgroundColor: `${colors.green}20`, border: `1px solid ${colors.green}` }}>
                    <p className="text-sm" style={{ color: colors.green }}>{tradingSuccess}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={tradingLoading || unlistedIssuers.length === 0}
                  className="w-full py-3 rounded font-semibold transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: colors.gold,
                    color: colors.textDark,
                  }}
                >
                  {tradingLoading ? "Creating..." : "List for Trading"}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column - Data Tables */}
        <div className="space-y-6">
          {/* Issuers Table */}
          <div
            className="p-6 rounded-lg"
            style={{
              backgroundColor: colors.box,
              border: `1px solid ${colors.boxOutline}`,
            }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
              All Issuers ({issuers.length})
            </h2>
            {loadingData ? (
              <p style={{ color: colors.textSecondary }}>Loading...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${colors.boxOutline}` }}>
                      <th className="text-left py-2 px-2" style={{ color: colors.textSecondary }}>Ticker</th>
                      <th className="text-left py-2 px-2" style={{ color: colors.textSecondary }}>Name</th>
                      <th className="text-left py-2 px-2" style={{ color: colors.textSecondary }}>Tag</th>
                      <th className="text-left py-2 px-2" style={{ color: colors.textSecondary }}>Listed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issuers.map((issuer) => {
                      const isListed = tradingRecords.some(t => t.ticker === issuer.ticker);
                      return (
                        <tr
                          key={issuer.id}
                          style={{ borderBottom: `1px solid ${colors.boxOutline}` }}
                        >
                          <td className="py-2 px-2 font-mono" style={{ color: colors.gold }}>
                            {issuer.ticker}
                          </td>
                          <td className="py-2 px-2" style={{ color: colors.textPrimary }}>
                            {issuer.name}
                          </td>
                          <td className="py-2 px-2" style={{ color: colors.textSecondary }}>
                            {issuer.tag || "-"}
                          </td>
                          <td className="py-2 px-2">
                            {isListed ? (
                              <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: `${colors.green}20`, color: colors.green }}>
                                Listed
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: `${colors.red}20`, color: colors.red }}>
                                Unlisted
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {issuers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-4 text-center" style={{ color: colors.textSecondary }}>
                          No issuers yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Trading Records Table */}
          <div
            className="p-6 rounded-lg"
            style={{
              backgroundColor: colors.box,
              border: `1px solid ${colors.boxOutline}`,
            }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
              Trading Records ({tradingRecords.length})
            </h2>
            {loadingData ? (
              <p style={{ color: colors.textSecondary }}>Loading...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${colors.boxOutline}` }}>
                      <th className="text-left py-2 px-2" style={{ color: colors.textSecondary }}>Ticker</th>
                      <th className="text-right py-2 px-2" style={{ color: colors.textSecondary }}>Price</th>
                      <th className="text-right py-2 px-2" style={{ color: colors.textSecondary }}>Step</th>
                      <th className="text-right py-2 px-2" style={{ color: colors.textSecondary }}>Supply</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradingRecords.map((trading) => (
                      <tr
                        key={trading.id}
                        style={{ borderBottom: `1px solid ${colors.boxOutline}` }}
                      >
                        <td className="py-2 px-2 font-mono" style={{ color: colors.gold }}>
                          {trading.ticker}
                        </td>
                        <td className="py-2 px-2 text-right font-mono" style={{ color: colors.textPrimary }}>
                          ${Number(trading.current_price).toFixed(2)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono" style={{ color: colors.textSecondary }}>
                          ${Number(trading.price_step).toFixed(3)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono" style={{ color: colors.textSecondary }}>
                          {Number(trading.current_supply).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {tradingRecords.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-4 text-center" style={{ color: colors.textSecondary }}>
                          No trading records yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
