import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const results: Record<string, { status: string; message: string; details?: unknown }> = {};

  // Test 1: Environment Variables
  results.envVars = {
    status: "checking",
    message: "",
  };

  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "AWS_REGION",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
  ];

  const missingVars = requiredEnvVars.filter((v) => !process.env[v]);

  if (missingVars.length > 0) {
    results.envVars = {
      status: "error",
      message: `Missing environment variables: ${missingVars.join(", ")}`,
    };
  } else {
    results.envVars = {
      status: "success",
      message: "All required environment variables are set",
      details: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        awsRegion: process.env.AWS_REGION,
      },
    };
  }

  // Test 2: Supabase Connection
  try {
    const supabase = await createClient();
    
    // Try to query the database (even if no tables exist, connection will work)
    const { error } = await supabase.from("_test_connection").select("*").limit(1);
    
    // If we get a "relation does not exist" error, that's fine - it means we connected
    if (error && !error.message.includes("does not exist") && !error.message.includes("permission denied")) {
      results.supabase = {
        status: "error",
        message: `Supabase connection failed: ${error.message}`,
      };
    } else {
      // Also test auth
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      results.supabase = {
        status: "success",
        message: "Supabase connection successful",
        details: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          authWorking: !authError,
          sessionExists: !!authData?.session,
        },
      };
    }
  } catch (error) {
    results.supabase = {
      status: "error",
      message: `Supabase error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }

  // Test 3: AWS Credentials Validation (basic check)
  try {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION;

    if (accessKeyId && secretAccessKey && region) {
      // Basic format validation
      const isValidAccessKey = /^AKIA[A-Z0-9]{16}$/.test(accessKeyId);
      
      results.aws = {
        status: isValidAccessKey ? "success" : "warning",
        message: isValidAccessKey 
          ? "AWS credentials format is valid" 
          : "AWS Access Key ID format may be incorrect",
        details: {
          region,
          accessKeyPrefix: accessKeyId.substring(0, 8) + "...",
          keyLength: accessKeyId.length,
        },
      };
    } else {
      results.aws = {
        status: "error",
        message: "AWS credentials not configured",
      };
    }
  } catch (error) {
    results.aws = {
      status: "error",
      message: `AWS check error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }

  // Overall status
  const allSuccess = Object.values(results).every((r) => r.status === "success");
  const hasErrors = Object.values(results).some((r) => r.status === "error");

  return NextResponse.json({
    overall: allSuccess ? "success" : hasErrors ? "error" : "warning",
    timestamp: new Date().toISOString(),
    tests: results,
  }, {
    status: 200,
  });
}
