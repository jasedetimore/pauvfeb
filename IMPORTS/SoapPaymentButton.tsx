
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SoapPaymentButton() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handlePayment = async () => {
        setLoading(true);
        try {
            // In a real app, you might get these details from a form or auth context
            const response = await fetch("/api/payments/create-checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    amount: 50, // Example amount
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to initiate payment");
            }

            const data = await response.json();
            if (data.url) {
                // Redirect to Soap Checkout
                window.location.href = data.url;
            }
        } catch (error) {
            console.error("Payment error:", error);
            alert("Something went wrong initializing payment.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handlePayment}
            disabled={loading}
            className={`
        relative overflow-hidden rounded-lg bg-[var(--accent-red)] px-6 py-3 font-bold text-white transition-all
        hover:scale-105 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]
        active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
      `}
        >
            {loading ? (
                <span className="flex items-center gap-2">
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                    Processing...
                </span>
            ) : (
                "Pay with Soap"
            )}
        </button>
    );
}
