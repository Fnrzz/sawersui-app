'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getSuiClient } from "@/lib/sui-client";
import { CONFIG } from "@/lib/config";
import { SERVER_CONFIG } from "@/lib/server-config";
import { verifyPersonalMessageSignature } from '@mysten/sui/verify';
import { createHmac } from 'crypto';

// ============================================================
// WALLET LOGIN - Sign-In with Sui Wallet
// ============================================================

export async function verifyWalletLogin(
  address: string, 
  signature: string, 
  message: string // expecting "Login to SawerSui. Nonce: {timestamp}"
) {
  try {
    // 1. Verify Signature
    const messageBytes = new TextEncoder().encode(message);
    await verifyPersonalMessageSignature(messageBytes, signature);
    
    // 2. Generate Deterministic Credentials
    const secret = SERVER_CONFIG.SUPABASE.AUTH_SECRET; 
    
    // Use address directly (remove 0x, lowercase) for deterministic email
    const normalizedAddress = address.replace(/^0x/i, "").toLowerCase();
    const email = `${normalizedAddress}@sawersui.com`;
    
    const password = createHmac('sha256', secret).update(address).digest('hex');

    const supabase = await createClient();

    // 3. Attempt Login
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!signInError && signInData.session) {
      return { success: true, userId: signInData.user.id };
    }

    // 4. If Login Failed, Attempt Sign Up
    console.log("Login failed, attempting signup for:", email);
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: `Wallet User ${address.slice(0,4)}`,
          wallet_address: address,
        }
      }
    });

    if (signUpError) {
      throw new Error(`Signup failed: ${signUpError.message}`);
    }

    if (signUpData.session) {
       // 5. Create Profile Entry (email is in auth.users, not duplicated here)
       const { error: profileError } = await supabase.from('profiles').upsert({
         id: signUpData.user?.id,
         username: null, // Trigger onboarding
         display_name: null,
         wallet_address: address,
       }, { onConflict: 'id' });
       
       if (profileError) {
         console.error("Profile creation error:", profileError);
       }
       
       return { success: true, userId: signUpData.user?.id };
    }

    return { success: false, error: "Authentication failed" };

  } catch (err: unknown) {
    console.error("Verify Wallet Login Error:", err);
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
    return { success: false, error: errorMessage };
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
// PROFILE MANAGEMENT
// ============================================================

export async function updateProfile(username: string, displayName: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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

  revalidatePath('/dashboard');
  return { success: true };
}

export async function checkUserOnboarding() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { needsOnboarding: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .single();

  if (!profile) return { needsOnboarding: true };

  return {
    needsOnboarding: !profile.username || !profile.display_name,
    profile
  };
}
