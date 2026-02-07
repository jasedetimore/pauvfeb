
const SOAP_API_URL = "https://api-sandbox.paywithsoap.com/api/v1";
const API_KEY = (process.env.SOAP_API_KEY || process.env.SOAPBOX_API_KEY || "").trim();

type CreateCustomerParams = {
    first_name?: string;
    last_name?: string;
    email: string;
};

type SoapCustomer = {
    id: string;
    email: string;
};

type CreateCheckoutParams = {
    customer_id: string;
    amount?: number;
    fixed_amount_cents?: number;
    currency?: string;
    successUrl?: string; // Client side camelCase
    cancelUrl?: string; // Client side camelCase
    return_url?: string; // API param
    type?: "deposit" | "payment";
};

type SoapCheckoutSession = {
    id: string;
    url: string;
};

export async function createSoapCustomer(params: CreateCustomerParams): Promise<SoapCustomer> {
    if (!API_KEY) {
        throw new Error("Missing SOAP_API_KEY");
    }

    console.log(`[Soap Client] Creating customer for: ${params.email} using key: ${API_KEY.substring(0, 8)}...`);

    const create = async (p: CreateCustomerParams): Promise<
        | { ok: true; data: SoapCustomer }
        | { ok: false; status: number; statusText: string; errorText: string }
    > => {
        const response = await fetch(`${SOAP_API_URL}/customers`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(p),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return { ok: false, status: response.status, statusText: response.statusText, errorText };
        }
        return { ok: true, data: await response.json() };
    };

    let result = await create(params);

    // If email is taken, try to create an alias
    if (!result.ok && result.errorText.includes("Email has already been taken")) {
        console.warn("[Soap Client] Email taken, retrying with alias...");
        const aliasEmail = params.email.replace("@", `+soap${Date.now()}@`);
        result = await create({ ...params, email: aliasEmail });
    }

    if (!result.ok) {
        throw new Error(`Soap Pay API error (createCustomer): ${result.statusText} - ${result.errorText}`);
    }

    return result.data;
}

export async function createSoapCheckoutSession(params: CreateCheckoutParams): Promise<SoapCheckoutSession> {
    if (!API_KEY) {
        throw new Error("Missing SOAP_API_KEY");
    }

    // Ensure type is set, default to 'deposit' if not provided as per docs example
    const payload = {
        customer_id: params.customer_id,
        type: params.type || 'deposit',
        // Use fixed_amount_cents if provided, otherwise check if amount is provided and convert?
        // But better to let caller handle conversion for now.
        fixed_amount_cents: params.fixed_amount_cents,
        return_url: params.return_url || params.successUrl, // Map successUrl to return_url if return_url is missing
    };

    console.log(`[Soap Client] Creating checkout session for customer: ${params.customer_id}`);

    const response = await fetch(`${SOAP_API_URL}/checkouts`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Soap Pay API error (createCheckout): ${response.statusText} - ${errorText}`);
    }

    return response.json();
}

export async function verifyWebhookSignature(payload: string, signature: string): Promise<boolean> {
    // Implement signature verification logic here based on Soap Pay docs
    // For now, return true
    return true;
}
