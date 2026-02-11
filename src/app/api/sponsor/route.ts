import { NextResponse } from "next/server";
import { Transaction } from "@mysten/sui/transactions";
import { getSuiClient } from "@/lib/sui-client";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromBase64 } from "@mysten/sui/utils";
import { CONFIG } from "@/lib/config";
import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";

const SPONSOR_SECRET_KEY = process.env.SPONSOR_SECRET_KEY || "";

// Dry-run transaction to estimate optimal gas budget
async function estimateGasBudget(
  tx: Transaction,
  client: SuiJsonRpcClient,
): Promise<number> {
  const TEMP_BUDGET = 100_000_000;
  const MIN_GAS_BUDGET = 2_000_000;
  const GAS_BUFFER = 1.2;

  tx.setGasBudget(TEMP_BUDGET);
  const tempBytes = await tx.build({ client });

  const dryRunResult = await client.dryRunTransactionBlock({
    transactionBlock: Buffer.from(tempBytes).toString("base64"),
  });

  if (dryRunResult.effects.status.status !== "success") {
    const errMsg =
      typeof dryRunResult.effects.status.error === "string"
        ? dryRunResult.effects.status.error
        : "Transaction simulation failed";
    throw new Error(`Dry-run failed: ${errMsg}`);
  }

  const { computationCost, storageCost, storageRebate } =
    dryRunResult.effects.gasUsed;

  const netGas =
    Number(computationCost) + Number(storageCost) - Number(storageRebate);

  const estimated = Math.ceil(Math.max(netGas, 0) * GAS_BUFFER);
  return Math.max(estimated, MIN_GAS_BUDGET);
}

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
      const { sender, recipientAddress, amountMist } = body;

      if (!sender || !recipientAddress || !amountMist) {
        return NextResponse.json(
          { error: "Missing required withdrawal fields" },
          { status: 400 },
        );
      }

      // Security Check: Value >= 0.5 USDC
      // 500,000 using BigInt constructor for compatibility
      const MIN_AMOUNT_MIST = BigInt("500000");
      if (BigInt(amountMist) < MIN_AMOUNT_MIST) {
        return NextResponse.json(
          { error: "Amount below minimum (0.50 USDC)" },
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
      // Explicitly set expiration to None
      tx.setExpiration({ None: true });

      const rgp = await client.getReferenceGasPrice();
      tx.setGasPrice(rgp);

      // 3. User Coin Logic (Fetch USDC)
      const { data: userCoins } = await client.getCoins({
        owner: sender,
        coinType: CONFIG.SUI.ADDRESS.USDC_TYPE,
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

      // 5. Estimate gas via dry-run, then build & sign
      const optimalGas = await estimateGasBudget(tx, client);
      tx.setGasBudget(optimalGas);
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

    // 6. Estimate gas via dry-run, then build
    const optimalGas = await estimateGasBudget(tx, client);
    tx.setGasBudget(optimalGas);
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
