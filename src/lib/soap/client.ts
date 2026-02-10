/**
 * Soap Pay API Client
 *
 * Handles communication with the Soap Pay API for payment processing.
 * Docs: https://docs.paywithsoap.com/api-reference
 * Uses sandbox URL by default — set SOAP_API_URL for production.
 */

const SOAP_API_URL =
  process.env.SOAP_API_URL || "https://api-sandbox.paywithsoap.com/api/v1";

function getApiKey(): string {
  const key = process.env.SOAP_API_KEY || process.env.SOAPBOX_API_KEY;
  if (!key) {
    throw new Error(
      "Missing Soap API key. Set SOAP_API_KEY or SOAPBOX_API_KEY in .env.local"
    );
  }
  return key;
}

interface CreateCustomerParams {
  email: string;
  first_name: string;
  last_name: string;
}

interface SoapCustomer {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface CreateCheckoutParams {
  customer_id: string;
  type: string;
  fixed_amount_cents: number;
  return_url?: string;
}

interface SoapCheckout {
  id: string;
  url: string;
  client_secret: string;
}

/**
 * Creates a customer in Soap Pay.
 *
 * If the email is already taken, automatically retries with an aliased
 * email (e.g., user+soap<timestamp>@domain.com) to avoid duplicates,
 * which is common in sandbox environments.
 */
export async function createSoapCustomer(
  params: CreateCustomerParams
): Promise<SoapCustomer> {
  const apiKey = getApiKey();

  const response = await fetch(`${SOAP_API_URL}/customers`, {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      first_name: params.first_name,
      last_name: params.last_name,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[Soap Client] Create customer error:", errorBody);

    // Handle duplicate email by aliasing
    if (errorBody.includes("Email has already been taken")) {
      console.log(
        "[Soap Client] Email taken, retrying with aliased email..."
      );
      const [localPart, domain] = params.email.split("@");
      const aliasedEmail = `${localPart}+soap${Date.now()}@${domain}`;

      const retryResponse = await fetch(`${SOAP_API_URL}/customers`, {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: aliasedEmail,
          first_name: params.first_name,
          last_name: params.last_name,
        }),
      });

      if (!retryResponse.ok) {
        const retryError = await retryResponse.text();
        throw new Error(
          `Failed to create Soap customer (retry): ${retryError}`
        );
      }

      return await retryResponse.json();
    }

    throw new Error(`Failed to create Soap customer: ${errorBody}`);
  }

  return await response.json();
}

/**
 * Creates a checkout in Soap Pay.
 *
 * POST /api/v1/checkouts with flat body { customer_id, type, return_url }.
 * Soap handles the deposit amount in their hosted checkout UI.
 */
export async function createSoapCheckout(
  params: CreateCheckoutParams
): Promise<SoapCheckout> {
  const apiKey = getApiKey();

  const body: Record<string, string | number> = {
    customer_id: params.customer_id,
    type: params.type,
    fixed_amount_cents: params.fixed_amount_cents,
  };
  if (params.return_url) {
    body.return_url = params.return_url;
  }

  const response = await fetch(`${SOAP_API_URL}/checkouts`, {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[Soap Client] Create checkout error:", errorBody);
    throw new Error(`Failed to create checkout: ${errorBody}`);
  }

  return await response.json();
}
