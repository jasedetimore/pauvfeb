# Soap Payments Implementation Guide

This document outlines how the Soap Pay integration is implemented in the codebase.

## Overview

The integration allows users to purchase credits (Deposits) using Soap Pay. The flow involves:
1.  Checking if the user already has a Soap Customer ID.
2.  Creating a Soap Customer if one doesn't exist (handling duplicate emails).
3.  Creating a Checkout Session for a `deposit` type transaction.
4.  Redirecting the user to the Soap Pay checkout URL.
5.  Updating the user's `soap_customer_id` metadata for future transactions.

## Key Components

### 1. Soap Client (`src/lib/soap/client.ts`)

This utility handles communication with the Soap Pay API.

-   **`createSoapCustomer(params)`**:
    -   Creates a customer in Soap Pay.
    -   **Duplicate Handling**: If the API returns "Email has already been taken", it automatically retries by appending a unique alias (e.g., `user+soap<timestamp>@domain.com`) to the email address. This ensures robustness, especially in sandbox environments where emails might be reused.
-   **`createSoapCheckoutSession(params)`**:
    -   Creates a session for the payment.
    -   **Payload**: For deposits, it uses `fixed_amount_cents` (integer) instead of `amount` (decimal).
    -   **Return URL**: Uses `return_url` (mapped from `successUrl` if provided) to redirect users after payment.

### 2. Checkout Route (`src/app/api/payments/create-checkout/route.ts`)

This API route manages the checkout initialization.

-   **Optimization**: First checks `user.user_metadata.soap_customer_id`. If present, it skips the customer creation call API to improve performance and avoid duplicate errors.
-   **New Customer Flow**: If no ID is found, it calls `createSoapCustomer`, gets the new ID, and updates the user's metadata in Supabase (`auth.users`) for persistence.
-   **Deposit Creation**:
    -   Creates a `deposit` record in the database with status `pending`.
    -   Initializes the Soap Checkout session with `type: "deposit"` and the amount in cents (`Math.round(amount * 100)`).
    -   Updates the deposit record with the `provider_id` (checkout session ID).
-   **Error Handling**: If session creation fails, the deposit status is updated to `failed`.

## Data Models

### User Metadata
Stored in Supabase Auth user metadata:
-   `soap_customer_id`: The ID returned by Soap Pay (e.g., `cus_...`).

### Deposit Record
Stored in `deposits` table:
-   `user_id`: Link to the user.
-   `amount_usdp`: Amount in USD.
-   `status`: `pending`, `completed`, or `failed`.
-   `provider_id`: The Soap Pay checkout session ID.

## Testing & Maintenance

-   **API Keys**: Ensure `SOAP_API_KEY` or `SOAPBOX_API_KEY` is set in `.env.local`.
-   **Sandbox URL**: The client is configured to use `https://api-sandbox.paywithsoap.com/api/v1`. Change `SOAP_API_URL` in `client.ts` for production.

## Troubleshooting

-   **"Email has already been taken"**: This is now handled automatically by aliasing. If you see this error in logs, it means the retry logic failed or the API behavior changed.
-   **"Unprocessable Entity" for Checkout**: Ensure `fixed_amount_cents` is an integer and `type` is set to `deposit`.
