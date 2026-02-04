import { NextRequest, NextResponse } from "next/server";
import {
  createAdminClient,
  verifyAdminFromJWT,
  logAuditEntry,
  getClientIP,
  AdminOperationError,
} from "@/lib/supabase/admin";

/**
 * POST /api/admin/set-admin
 * Set admin claim for a user (super admin operation)
 * This should only be used during initial setup to make yourself admin
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    
    // For initial setup, we check if any admin exists
    // If no admin exists, allow the first user to become admin
    const adminClient = createAdminClient();
    
    const body = await request.json();
    const { user_id, email, make_admin = true } = body;

    if (!user_id && !email) {
      throw new AdminOperationError(
        "Either user_id or email is required",
        400,
        "VALIDATION_ERROR"
      );
    }

    // Find the user
    let targetUserId = user_id;
    
    if (email && !user_id) {
      const { data: users, error: userError } = await adminClient
        .from("auth.users")
        .select("id")
        .eq("email", email)
        .single();

      if (userError) {
        // Try using admin auth API
        const { data: { users: authUsers }, error: authError } = 
          await adminClient.auth.admin.listUsers();
        
        if (authError) {
          throw new AdminOperationError(
            "Failed to find user",
            500,
            "DB_ERROR"
          );
        }

        const foundUser = authUsers?.find((u) => u.email === email);
        if (!foundUser) {
          throw new AdminOperationError(
            `User with email ${email} not found`,
            404,
            "NOT_FOUND"
          );
        }
        targetUserId = foundUser.id;
      } else {
        targetUserId = users?.id;
      }
    }

    // Check if there are any existing admins
    const { data: { users: allUsers } } = await adminClient.auth.admin.listUsers();
    const existingAdmins = allUsers?.filter(
      (u) => u.app_metadata?.admin === true
    ) || [];

    // If admins exist, verify the requester is an admin
    if (existingAdmins.length > 0) {
      try {
        await verifyAdminFromJWT(authHeader);
      } catch {
        throw new AdminOperationError(
          "Only existing admins can modify admin status",
          403,
          "FORBIDDEN"
        );
      }
    }

    // Get the current user data
    const { data: { user: targetUser }, error: getUserError } = 
      await adminClient.auth.admin.getUserById(targetUserId);

    if (getUserError || !targetUser) {
      throw new AdminOperationError(
        "User not found",
        404,
        "NOT_FOUND"
      );
    }

    // Update the user's app_metadata
    const currentMetadata = targetUser.app_metadata || {};
    const updatedMetadata = { ...currentMetadata, admin: make_admin };

    const { data: updatedUser, error: updateError } = 
      await adminClient.auth.admin.updateUserById(targetUserId, {
        app_metadata: updatedMetadata,
      });

    if (updateError) {
      throw new AdminOperationError(
        updateError.message,
        500,
        "UPDATE_ERROR"
      );
    }

    // Log the action
    const requesterId = existingAdmins.length > 0 
      ? (await verifyAdminFromJWT(authHeader)).userId 
      : targetUserId;

    await logAuditEntry({
      adminId: requesterId,
      action: make_admin ? "GRANT_ADMIN" : "REVOKE_ADMIN",
      targetTable: "auth.users",
      targetId: targetUserId,
      oldValue: { admin: currentMetadata.admin || false },
      newValue: { admin: make_admin },
      metadata: { 
        targetEmail: targetUser.email,
        isInitialSetup: existingAdmins.length === 0,
      },
      ipAddress: getClientIP(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({
      success: true,
      message: make_admin 
        ? `Admin privileges granted to ${targetUser.email}`
        : `Admin privileges revoked from ${targetUser.email}`,
      user: {
        id: updatedUser.user?.id,
        email: updatedUser.user?.email,
        admin: updatedUser.user?.app_metadata?.admin,
      },
    });
  } catch (error) {
    if (error instanceof AdminOperationError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/set-admin
 * List all admin users
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    await verifyAdminFromJWT(authHeader);

    const adminClient = createAdminClient();

    const { data: { users }, error } = await adminClient.auth.admin.listUsers();

    if (error) {
      throw new AdminOperationError(error.message, 500, "DB_ERROR");
    }

    const admins = users
      ?.filter((u) => u.app_metadata?.admin === true)
      .map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
      })) || [];

    return NextResponse.json({
      success: true,
      admins,
      count: admins.length,
    });
  } catch (error) {
    if (error instanceof AdminOperationError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 401 }
    );
  }
}
