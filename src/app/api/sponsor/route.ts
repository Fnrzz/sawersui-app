import { NextResponse } from "next/server";
import { Transaction } from "@mysten/sui/transactions";
import { getSuiClient } from "@/lib/sui-client";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromBase64 } from "@mysten/sui/utils";
import { CONFIG } from "@/lib/config";

const SPONSOR_SECRET_KEY = process.env.SPONSOR_SECRET_KEY || "";

function getSponsorKeypair(): Ed25519Keypair {
  if (!SPONSOR_SECRET_KEY) {
    throw new Error("SPONSOR_SECRET_KEY is not set in environment variables");
  }

  if (SPONSOR_SECRET_KEY.startsWith("suiprivkey")) {
    const { secretKey } = decodeSuiPrivateKey(SPONSOR_SECRET_KEY);
    return Ed25519Keypair.fromSecretKey(secretKey);
  }

  const rawBytes = fromBase64(SPONSOR_SECRET_KEY);
  if (rawBytes.length === 32) {
    return Ed25519Keypair.fromSecretKey(rawBytes);
  }

  throw new Error("Invalid key length. Expected 32 bytes.");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // =================================================================
    // NEW FLOW: Server-Side Sponsored Withdrawal
    // =================================================================
    if (body.isWithdrawal) {
      const { sender, recipientAddress, amountMist, coinType } = body;

      if (!sender || !recipientAddress || !amountMist) {
        return NextResponse.json(
          { error: "Missing required withdrawal fields" },
          { status: 400 },
        );
      }

      const targetCoinType = coinType || CONFIG.SUI.ADDRESS.USDC_TYPE;
      const isSui = targetCoinType === "0x2::sui::SUI";

      // Security Check: Value >= 0.5 USDC / 0.1 SUI (approx)
      let minAmountMist = BigInt("500000"); // 0.5 USDC
      if (isSui) {
        minAmountMist = BigInt("100000000"); // 0.1 SUI (just a sane default for gas/dust)
      }

      if (BigInt(amountMist) < minAmountMist) {
        return NextResponse.json(
          { error: "Amount below minimum limit" },
          { status: 400 },
        );
      }

      const client = getSuiClient();
      const sponsor = getSponsorKeypair();
      const sponsorAddress = sponsor.toSuiAddress();

      // 1. Fetch Sponsor's Gas Coins
      const { data: gasCoins } = await client.getCoins({
        owner: sponsorAddress,
        coinType: "0x2::sui::SUI",
      });

      if (gasCoins.length === 0) {
        throw new Error("Sponsor has no SUI for gas");
      }
      const gasCoin = gasCoins[0];

      // 2. Build Transaction
      const tx = new Transaction();
      tx.setSender(sender);
      tx.setGasOwner(sponsorAddress);
      tx.setGasPayment([
        {
          objectId: gasCoin.coinObjectId,
          version: gasCoin.version,
          digest: gasCoin.digest,
        },
      ]);
      tx.setGasBudget(50_000_000);
      // Explicitly set expiration to None
      tx.setExpiration({ None: true });

      const rgp = await client.getReferenceGasPrice();
      tx.setGasPrice(rgp);

      // 3. User Coin Logic (Fetch USDC or SUI)
      // CRITICAL: Even for SUI, we fetch user's coin objects. We do NOT use tx.gas.
      const { data: userCoins } = await client.getCoins({
        owner: sender,
        coinType: targetCoinType,
      });

      if (!userCoins || userCoins.length === 0) {
        return NextResponse.json(
          { error: "Insufficient balance or no valid coins found" },
          { status: 400 },
        );
      }

      const coinIds = userCoins.map((c) => c.coinObjectId);
      const primaryCoin = coinIds[0];

      if (coinIds.length > 1) {
        tx.mergeCoins(
          tx.object(primaryCoin),
          coinIds.slice(1).map((id) => tx.object(id)),
        );
      }

      // 4. Split and Transfer
      const [coinToTransfer] = tx.splitCoins(tx.object(primaryCoin), [
        tx.pure.u64(amountMist),
      ]);

      tx.transferObjects([coinToTransfer], tx.pure.address(recipientAddress));

      // 5. Build & Sign
      const txBytes = await tx.build({ client });
      const txBytesBase64 = Buffer.from(txBytes).toString("base64");
      const { signature: sponsorSignature } =
        await sponsor.signTransaction(txBytes);

      return NextResponse.json({
        sponsoredTransactionBytes: txBytesBase64,
        sponsorSignature,
      });
    }

    // =================================================================
    // EXISTING FLOW: Sponsored Donation (Server builds transaction)
    // =================================================================
    // Only check for `txBytes` if it's NOT a withdrawal request,
    // but the original code had `if (body.txBytes)` as the differentiator.
    // The previous flow in this file was:
    // 1. Withdrawal (Client-side) -> body.txBytes
    // 2. Donation -> body.sender + others
    // We are REPLACING Flow 1 with the "isWithdrawal" check above.

    // So we just fall through to existing donation logic if 'isWithdrawal' is not true.

    const { sender, streamerAddress, amountMist } = body;

    if (!sender || !streamerAddress || !amountMist) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Minimum donation amount protection (0.50 USDC = 500,000 MIST)
    const MIN_AMOUNT_MIST = 500_000;
    if (Number(amountMist) < MIN_AMOUNT_MIST) {
      return NextResponse.json(
        { error: "Amount below minimum (0.50 USDC)" },
        { status: 400 },
      );
    }

    const client = getSuiClient();
    const sponsor = getSponsorKeypair();
    const sponsorAddress = sponsor.toSuiAddress();

    // 1. Fetch Sponsor's Gas Coins
    const { data: coins } = await client.getCoins({
      owner: sponsorAddress,
      coinType: "0x2::sui::SUI",
    });

    if (coins.length === 0) {
      throw new Error("Sponsor has no SUI for gas");
    }

    // 2. Lock a specific Gas Coin (Prevent double-spend/locking issues)
    const gasCoin = coins[0];

    // 3. Build Transaction
    const tx = new Transaction();
    tx.setSender(sender);
    tx.setGasOwner(sponsorAddress);
    tx.setGasPayment([
      {
        objectId: gasCoin.coinObjectId,
        version: gasCoin.version,
        digest: gasCoin.digest,
      },
    ]);
    tx.setGasBudget(50_000_000);
    // Explicitly set expiration to None to prevent "Unknown value 2 for enum TransactionExpiration" error
    tx.setExpiration({ None: true });

    // 4. Reference Gas Price (Safety)
    const rgp = await client.getReferenceGasPrice();
    tx.setGasPrice(rgp);

    // 5. Donation Logic (Split & Transfer)
    const { data: userCoins } = await client.getCoins({
      owner: sender,
      coinType: body.coinType || CONFIG.SUI.ADDRESS.USDC_TYPE,
    });

    if (!userCoins || userCoins.length === 0) {
      return NextResponse.json(
        { error: "Insufficient balance or no valid coins found" },
        { status: 400 },
      );
    }

    const coinIds = userCoins.map((c) => c.coinObjectId);
    const primaryCoin = coinIds[0];

    if (coinIds.length > 1) {
      tx.mergeCoins(
        tx.object(primaryCoin),
        coinIds.slice(1).map((id) => tx.object(id)),
      );
    }

    const [donationCoin] = tx.splitCoins(tx.object(primaryCoin), [
      tx.pure.u64(amountMist),
    ]);

    const refId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    tx.moveCall({
      target: `${CONFIG.SUI.ADDRESS.PACKAGE_ID}::donation_module::donate`,
      typeArguments: [body.coinType || CONFIG.SUI.ADDRESS.USDC_TYPE],
      arguments: [
        tx.object(CONFIG.SUI.ADDRESS.CONFIG_ID),
        donationCoin,
        tx.pure.u64(amountMist),
        tx.pure.address(streamerAddress),
        tx.pure.string(refId),
      ],
    });

    // 6. Build Bytes
    const txBytes = await tx.build({ client });
    const txBytesBase64 = Buffer.from(txBytes).toString("base64");

    // 7. Sponsor Signs
    const { signature: sponsorSignature } =
      await sponsor.signTransaction(txBytes);

    return NextResponse.json({
      sponsoredTransactionBytes: txBytesBase64,
      sponsorSignature,
    });
  } catch (error: unknown) {
    console.error("[API/Sponsor] Error:", error);
    const message = error instanceof Error ? error.message : "Known error";
    return NextResponse.json(
      {
        error: message || "Failed to create sponsored transaction",
      },
      { status: 500 },
    );
  }
}
