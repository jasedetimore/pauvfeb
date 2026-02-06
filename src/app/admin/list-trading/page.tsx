"use client";

import React, { useState, useEffect, useCallback } from "react";
import { colors } from "@/lib/constants/colors";
import { createClient } from "@/lib/supabase/client";
import { AdminSearchBar } from "@/components/atoms/AdminSearchBar";

interface IssuerDetails {
  id: string;
  name: string;
  ticker: string;
  tag: string | null;
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

export default function AdminListTradingPage() {
  // Form state
  const [tradingForm, setTradingForm] = useState({
    ticker: "",
    base_price: "0.01",
    price_step: "0.001",
  });
  const [tradingLoading, setTradingLoading] = useState(false);
  const [tradingError, setTradingError] = useState<string | null>(null);
  const [tradingSuccess, setTradingSuccess] = useState<string | null>(null);

  // Data
  const [issuers, setIssuers] = useState<IssuerDetails[]>([]);
  const [tradingRecords, setTradingRecords] = useState<IssuerTrading[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<IssuerTrading[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Unlisted issuers
  const unlistedIssuers = React.useMemo(() => {
    const listedTickers = new Set(tradingRecords.map((t) => t.ticker));
    return issuers.filter((i) => !listedTickers.has(i.ticker));
  }, [issuers, tradingRecords]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      // Fetch issuers
      const issuerRes = await fetch("/api/admin/issuers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const issuerJson = await issuerRes.json();
      if (issuerJson.success && issuerJson.data) {
        setIssuers(issuerJson.data);
      }

      // Fetch trading records
      const tradingRes = await fetch("/api/admin/issuer-trading", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const tradingJson = await tradingRes.json();
      if (tradingJson.success) {
        setTradingRecords(tradingJson.data || []);
        setFilteredRecords(tradingJson.data || []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Search handler – filter trading records by ticker (matches issuer name too)
  const handleSearch = useCallback(
    (query: string) => {
      if (!query) {
        setFilteredRecords(tradingRecords);
        return;
      }
      const q = query.toLowerCase();
      // Build map of ticker → issuer name for broader matching
      const nameMap = new Map(issuers.map((i) => [i.ticker, i.name.toLowerCase()]));
      setFilteredRecords(
        tradingRecords.filter(
          (r) =>
            r.ticker.toLowerCase().includes(q) ||
            (nameMap.get(r.ticker) || "").includes(q)
        )
      );
    },
    [tradingRecords, issuers]
  );

  // Create trading entry
  const handleCreateTrading = async (e: React.FormEvent) => {
    e.preventDefault();
    setTradingLoading(true);
    setTradingError(null);
    setTradingSuccess(null);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

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
          current_price: parseFloat(tradingForm.base_price),
          current_supply: 0,
          total_usdp: 0,
        }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "Failed to create trading entry");

      setTradingSuccess(`Successfully listed ${tradingForm.ticker} for trading!`);
      setTradingForm({ ticker: "", base_price: "0.01", price_step: "0.001" });
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
  const labelStyle = { color: colors.textSecondary };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: colors.gold }}>
        List for Trading
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left – Form */}
        <div
          className="p-6 rounded-lg"
          style={{ backgroundColor: colors.box, border: `1px solid ${colors.boxOutline}` }}
        >
          <p className="text-sm mb-6" style={{ color: colors.textSecondary }}>
            Enable trading for an existing issuer. This creates a row in issuer_trading.
          </p>

          <form onSubmit={handleCreateTrading} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={labelStyle}>
                Select Issuer * {loadingData && "(Loading...)"}
              </label>
              <select
                required
                value={tradingForm.ticker}
                onChange={(e) => setTradingForm({ ...tradingForm, ticker: e.target.value })}
                className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-1"
                style={{ ...inputStyle, "--tw-ring-color": colors.gold } as React.CSSProperties}
                disabled={loadingData}
              >
                <option value="">
                  {loadingData
                    ? "Loading issuers..."
                    : unlistedIssuers.length === 0
                    ? "No unlisted issuers"
                    : "Select an unlisted issuer..."}
                </option>
                {unlistedIssuers.map((issuer) => (
                  <option key={issuer.id} value={issuer.ticker}>
                    {issuer.name} ({issuer.ticker})
                  </option>
                ))}
              </select>
              {unlistedIssuers.length === 0 && !loadingData && issuers.length === 0 && (
                <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                  No issuers found. Create an issuer first.
                </p>
              )}
              {unlistedIssuers.length === 0 && !loadingData && issuers.length > 0 && (
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
              <div
                className="p-3 rounded"
                style={{ backgroundColor: `${colors.red}20`, border: `1px solid ${colors.red}` }}
              >
                <p className="text-sm" style={{ color: colors.red }}>
                  {tradingError}
                </p>
              </div>
            )}

            {tradingSuccess && (
              <div
                className="p-3 rounded"
                style={{ backgroundColor: `${colors.green}20`, border: `1px solid ${colors.green}` }}
              >
                <p className="text-sm" style={{ color: colors.green }}>
                  {tradingSuccess}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={tradingLoading || unlistedIssuers.length === 0}
              className="w-full py-3 rounded font-semibold transition-colors disabled:opacity-50"
              style={{ backgroundColor: colors.gold, color: colors.textDark }}
            >
              {tradingLoading ? "Creating..." : "List for Trading"}
            </button>
          </form>
        </div>

        {/* Right – Trading Records */}
        <div
          className="p-6 rounded-lg"
          style={{ backgroundColor: colors.box, border: `1px solid ${colors.boxOutline}` }}
        >
          <h2 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
            Trading Records ({tradingRecords.length})
          </h2>

          <AdminSearchBar onSearch={handleSearch} placeholder="Search trading records by name or ticker…" />

          {loadingData ? (
            <p style={{ color: colors.textSecondary }}>Loading...</p>
          ) : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.boxOutline}` }}>
                    <th className="text-left py-2 px-2" style={{ color: colors.textSecondary }}>
                      Ticker
                    </th>
                    <th className="text-right py-2 px-2" style={{ color: colors.textSecondary }}>
                      Price
                    </th>
                    <th className="text-right py-2 px-2" style={{ color: colors.textSecondary }}>
                      Step
                    </th>
                    <th className="text-right py-2 px-2" style={{ color: colors.textSecondary }}>
                      Supply
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((trading) => (
                    <tr
                      key={trading.id}
                      style={{ borderBottom: `1px solid ${colors.boxOutline}` }}
                    >
                      <td className="py-2 px-2 font-mono" style={{ color: colors.gold }}>
                        {trading.ticker}
                      </td>
                      <td
                        className="py-2 px-2 text-right font-mono"
                        style={{ color: colors.textPrimary }}
                      >
                        ${Number(trading.current_price).toFixed(2)}
                      </td>
                      <td
                        className="py-2 px-2 text-right font-mono"
                        style={{ color: colors.textSecondary }}
                      >
                        ${Number(trading.price_step).toFixed(3)}
                      </td>
                      <td
                        className="py-2 px-2 text-right font-mono"
                        style={{ color: colors.textSecondary }}
                      >
                        {Number(trading.current_supply).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-4 text-center"
                        style={{ color: colors.textSecondary }}
                      >
                        {tradingRecords.length === 0 ? "No trading records yet" : "No matches"}
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
  );
}
