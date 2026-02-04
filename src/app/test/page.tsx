"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface TestResult {
  status: string;
  message: string;
  details?: Record<string, unknown>;
}

interface TestResults {
  overall: string;
  timestamp: string;
  tests: Record<string, TestResult>;
}

export default function TestPage() {
  const [apiResults, setApiResults] = useState<TestResults | null>(null);
  const [clientTest, setClientTest] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function runTests() {
      // Test API route
      try {
        const response = await fetch("/api/test-connections");
        const data = await response.json();
        setApiResults(data);
      } catch (error) {
        setApiResults({
          overall: "error",
          timestamp: new Date().toISOString(),
          tests: {
            api: {
              status: "error",
              message: `API test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          },
        });
      }

      // Test client-side Supabase
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.getSession();

        setClientTest({
          status: error ? "error" : "success",
          message: error
            ? `Client Supabase error: ${error.message}`
            : "Client-side Supabase connection successful",
          details: {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          },
        });
      } catch (error) {
        setClientTest({
          status: "error",
          message: `Client test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }

      setLoading(false);
    }

    runTests();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-600 bg-green-100";
      case "warning":
        return "text-yellow-600 bg-yellow-100";
      case "error":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case "success":
        return "✅";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      default:
        return "⏳";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Running connection tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">
          🔧 Pauv Connection Tests
        </h1>

        {/* Overall Status */}
        <div
          className={`rounded-lg p-6 mb-8 ${getStatusColor(apiResults?.overall || "checking")}`}
        >
          <h2 className="text-xl font-semibold">
            {getStatusEmoji(apiResults?.overall || "checking")} Overall Status:{" "}
            {apiResults?.overall?.toUpperCase() || "CHECKING"}
          </h2>
          <p className="text-sm mt-2">
            Tested at: {apiResults?.timestamp || "N/A"}
          </p>
        </div>

        {/* Individual Tests */}
        <div className="space-y-4">
          {/* Server-side tests */}
          {apiResults?.tests &&
            Object.entries(apiResults.tests).map(([name, result]) => (
              <div key={name} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 capitalize">
                    {getStatusEmoji(result.status)} {name.replace(/([A-Z])/g, " $1").trim()}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(result.status)}`}
                  >
                    {result.status}
                  </span>
                </div>
                <p className="mt-2 text-gray-600">{result.message}</p>
                {result.details && (
                  <pre className="mt-3 bg-gray-100 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                )}
              </div>
            ))}

          {/* Client-side test */}
          {clientTest && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {getStatusEmoji(clientTest.status)} Client-Side Supabase
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(clientTest.status)}`}
                >
                  {clientTest.status}
                </span>
              </div>
              <p className="mt-2 text-gray-600">{clientTest.message}</p>
              {clientTest.details && (
                <pre className="mt-3 bg-gray-100 p-3 rounded text-sm overflow-auto">
                  {JSON.stringify(clientTest.details, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900">📋 What&apos;s Being Tested</h3>
          <ul className="mt-3 space-y-2 text-blue-800">
            <li>✓ Environment variables are properly set</li>
            <li>✓ Supabase server-side connection</li>
            <li>✓ Supabase client-side connection</li>
            <li>✓ AWS credentials format validation</li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            🔄 Run Tests Again
          </button>
        </div>
      </div>
    </div>
  );
}
