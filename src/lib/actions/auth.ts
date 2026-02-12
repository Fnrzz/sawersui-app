"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getSuiClient } from "@/lib/sui-client";
import { CONFIG } from "@/lib/config";
import { SERVER_CONFIG } from "@/lib/server-config";
import { verifyPersonalMessageSignature } from "@mysten/sui/verify";
import { createHmac } from "crypto";

// ============================================================
// WALLET LOGIN - Sign-In with Sui Wallet
// ============================================================

export async function verifyWalletLogin(
  address: string,
  signature: string,
  message: string, // expecting "Login to SawerSui. Nonce: {timestamp}"
) {
  try {
    // 1. Verify Signature
    const messageBytes = new TextEncoder().encode(message);
    const client = getSuiClient();
    await verifyPersonalMessageSignature(messageBytes, signature, { client });

    // 2. Generate Deterministic Credentials
    const secret = SERVER_CONFIG.SUPABASE.AUTH_SECRET;

    // Use address directly (remove 0x, lowercase) for deterministic email
    const normalizedAddress = address.replace(/^0x/i, "").toLowerCase();
    const email = `${normalizedAddress}@sawersui.com`;

    const password = createHmac("sha256", secret).update(address).digest("hex");

    const supabase = await createClient();

    // 3. Attempt Login
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (!signInError && signInData.session) {
      return { success: true, userId: signInData.user.id };
    }

    // 4. If Login Failed, Attempt Sign Up
    console.log("Login failed, attempting signup for:", email);

    // For Wallet Login, we still allow auto-signup or we should align it?
    // The requirement specified "zkLogin... do NOT auto-register".
    // I will leave Wallet Login as is for now unless I see a reason to change it,
    // to minimize regression risk on pure wallet users.
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email,
        password,
        options: {
          data: {
            username: `Wallet User ${address.slice(0, 4)}`,
            wallet_address: address,
          },
        },
      },
    );

    if (signUpError) {
      throw new Error(`Signup failed: ${signUpError.message}`);
    }

    if (signUpData.session) {
      // 5. Create Profile Entry (email is in auth.users, not duplicated here)
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: signUpData.user?.id,
          username: null, // Trigger onboarding
          display_name: null,
          wallet_address: address,
        },
        { onConflict: "id" },
      );

      if (profileError) {
        console.error("Profile creation error:", profileError);
      }

      return { success: true, userId: signUpData.user?.id };
    }

    return { success: false, error: "Authentication failed" };
  } catch (err: unknown) {
    console.error("Verify Wallet Login Error:", err);
    const errorMessage =
      err instanceof Error ? err.message : "An unknown error occurred";
    return { success: false, error: errorMessage };
  }
}

// ============================================================
// PROFILE CHECK ACTIONS
// ============================================================

export async function checkProfileByAddress(address: string) {
  try {
    const supabase = await createClient(); // Determine if we need admin client?
    // Usually reading profiles matches RLS if public.

    // We try to find a profile with this wallet address
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, display_name")
      .eq("wallet_address", address)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows returned"
      console.error("Check Profile Error:", error);
    }

    if (data) {
      return { exists: true, profile: data };
    }

    return { exists: false };
  } catch (error) {
    console.error("checkProfileByAddress exception:", error);
    return { exists: false };
  }
}

// ============================================================
// WALLET BALANCE
// ============================================================

export async function getWalletBalance(address: string) {
  try {
    const client = getSuiClient();

    const coinType = CONFIG.SUI.ADDRESS.USDC_TYPE;
    if (!coinType) {
      console.warn("USDC Coin Address not configured");
      return "0.00";
    }

    const balance = await client.getBalance({
      owner: address,
      coinType: coinType,
    });

    const rawBalance = parseInt(balance.totalBalance);
    const formatted = (rawBalance / 1_000_000).toFixed(2);

    return formatted;
  } catch (error) {
    console.error("Failed to fetch balance:", error);
    return "0.00";
  }
}

// ============================================================
// ZKLOGIN - Sign-In with Google ID Token
// ============================================================

// ============================================================
// ZKLOGIN - Sign-In with Google ID Token
// ============================================================

// ZkLogin is now handled by @mysten/enoki client-side.
// Server-side ZkLogin verification functions see below.

export async function registerEnokiUser(
  address: string,
  username: string,
  displayName: string,
  email_optional?: string,
) {
  try {
    const secret = SERVER_CONFIG.SUPABASE.AUTH_SECRET;

    // Deterministic Credentials based on Address
    const normalizedAddress = address.replace(/^0x/i, "").toLowerCase();
    const email = `${normalizedAddress}@sawersui.com`;
    const password = createHmac("sha256", secret).update(address).digest("hex");

    const supabase = await createClient();

    // 1. Attempt Sign Up (or Sign In if exists)
    // We try to sign up. if user exists, we'll get an error or existing user user.
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email,
        password,
        options: {
          data: {
            username: username,
            wallet_address: address,
            google_email: email_optional,
          },
        },
      },
    );

    let userId = signUpData.user?.id;

    if (signUpError) {
      // If "User already registered", try to sign in to get the ID
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError || !signInData.user) {
        throw new Error(`Registration failed: ${signUpError.message}`);
      }
      userId = signInData.user.id;
    }

    if (userId) {
      // 2. Create/Update Profile Entry
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: userId,
          username: username,
          display_name: displayName,
          wallet_address: address,
        },
        { onConflict: "id" },
      );

      if (profileError) {
        console.error("Profile creation error:", profileError);
        return { success: false, error: "Failed to create profile" };
      } else {
        return { success: true, userId };
      }
    }

    return { success: false, error: "Registration failed" };
  } catch (err) {
    console.error("registerEnokiUser Error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ============================================================
// PROFILE MANAGEMENT
// ============================================================

export async function updateProfile(username: string, displayName: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  if (!username || username.length < 3) {
    throw new Error("Username must be at least 3 characters");
  }
  if (!displayName) {
    throw new Error("Display name is required");
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", user.id)
    .single();

  if (existing) {
    throw new Error("Username already taken");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      display_name: displayName,
    })
    .eq("id", user.id);

  if (error) throw error;

  revalidatePath("/dashboard");
  return { success: true };
}

export async function checkUserOnboarding() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { needsOnboarding: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .single();

  if (!profile) return { needsOnboarding: true };

  return {
    needsOnboarding: !profile.username || !profile.display_name,
    profile,
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  return { success: true };
}
