<div align="center">
  <br />
  <a href="https://sawersui.vercel.app">
    <img src="https://sawersui.vercel.app/logo2.webp" alt="SawerSui Logo" width="120" height="120">
  </a>

  <h1 align="center">SawerSui</h1>

  <p align="center">
    <strong>The First Web3 Donation Platform on Sui Network</strong>
  </p>
  
  <p align="center">
    Empowering creators with instant, low-fee, and gamified donations using the power of Sui Move.
  </p>

  <div align="center">
    <img src="https://img.shields.io/badge/Status-Beta-blue?style=for-the-badge" alt="Status">
    <img src="https://img.shields.io/badge/Network-Sui_Testnet-4DA2FF?style=for-the-badge&logo=sui" alt="Sui Network">
    <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
  </div>
</div>

<br />

## 📖 Introduction

**SawerSui** is a next-generation donation platform designed specifically for streamers and content creators. It bridges the gap between traditional content monetization and the decentralized web.

By leveraging the **Sui Network**, SawerSui solves the common pain points of traditional donation platforms—high fees, slow settlement times, and lack of transparency—while introducing Web3 native features like NFT rewards and decentralized milestones.

> _"Bridge interactions with your audience."_

---

## 💡 The Problem & Solution

| Traditional Platforms ❌                                   | The SawerSui Solution ✅                                                       |
| :--------------------------------------------------------- | :----------------------------------------------------------------------------- |
| **High Fees:** Up to 10-30% cuts from creator earnings.    | **Low Fees:** Minimal platform fee (5%) with gas-sponsored transactions.       |
| **Delayed Payouts:** Net-30 or monthly withdrawal limits.  | **Instant Settlement:** Funds go directly to the creator's wallet immediately. |
| **Friction:** Requires bank accounts and complex sign-ups. | **Seamless Onboarding:** Login with Google (zkLogin) or connect a Sui Wallet.  |
| **Static:** Just money transfer.                           | **Gamified:** NFT rewards for milestones.                                      |

---

## ✨ Key Features

### 🎥 For Streamers (Creators)

- **Real-time OBS Integration:** Connect seamlessly with OBS or Streamlabs. Alerts appear instantly on-screen when a donation is made.
- **Dynamic Leaderboards:** Display top supporters in real-time to encourage competition and engagement.
- **Milestone System:** Set funding goals (e.g., "New Camera Fund"). When reached, the system triggers celebrations.
- **Stable Income:** Accept **USDC** to avoid crypto volatility.
- **Dashboard Analytics:** Track donation history and active balances in a unified dashboard.
- **Text-to-Speech (TTS):** Engage your audience with AI-powered voice messages (Gemini TTS) that read donation messages aloud on stream.
  - **Multiple Voice Options:** Choose from voices like Kore, Charon, Puck, and Zephyr.
  - **Customizable Threshold:** Set a minimum donation amount for TTS to prevent spam.
  - **Live Previews:** Streamers can test voices directly in the dashboard.
- **Neo-Brutalist Design:** A bold, high-contrast interface that stands out.

### 👤 For Supporters (Donors)

- **Gas-Free Donations:** Utilizing Sui's Sponsored Transactions, donors pay **0 gas fees**. 100% of the intended amount (minus platform fee) goes to the creator.
- **Easy Login (zkLogin):** No need to manage private keys. Users can sign in using their existing Google accounts via **Enoki**.
- **NFT Rewards:** Participate in milestones and automatically receive unique NFTs as proof of support.
- **On-Chain Recognition:** Your support is immutably recorded on the blockchain.

---

## 🏗 Architecture & Tech Stack

SawerSui is built as a hybrid decentralized application (dApp) ensuring speed, security, and user experience.

### **The Stack**

- **Frontend Framework:** [Next.js 16 (App Router)](https://nextjs.org/) — For server-side rendering and high performance.
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) — Implements the **Neo-Brutalist** design system with high-contrast colors and bold typography.
- **Blockchain Interaction:**
  - **Sui Move:** Smart contracts for donation logic and NFT minting.
  - **@mysten/dapp-kit:** Wallet connection and transaction management.
  - **Enoki / zkLogin:** Social login provider for Web3 abstraction.
- **Backend & Data:**
  - **Supabase:** Handling off-chain user metadata, real-time websocket events for OBS, and historical indexing.
  - **Gemini AI:** Powering the Text-to-Speech (TTS) engine for natural-sounding voice alerts.
- **Media Storage:** Walrus & Supabase Storage.

### **Configuration**

To enable TTS, add your Google Gemini API key to `.env`:

```env
GEMINI_API_KEY=your_api_key_here
```

### **System Flow**

1.  **Auth:** User logs in via Google (zkLogin) or Sui Wallet.
2.  **Action:** User sends USDC to Creator.
3.  **Sponsor:** The platform sponsors the gas fee.
4.  **Chain:** Transaction is executed on Sui Network.
5.  **Event:** Supabase listens to the on-chain event.
6.  **Display:** The Overlay frontend receives a websocket signal and plays the alert on the Streamer's OBS.

## 🗺 Roadmap & Vision

- **Phase 1: Foundation (Current)**
  - Basic USDC & SUI Donation.
  - OBS Alert & Leaderboard Widgets.
  - Google Login Integration (zkLogin).
  - Milestone feature with automated NFT Minting.
- **Phase 2: Engagement**
  - "Mediashare" (Request video/music with donation).
- **Phase 3: Expansion**
  - Mobile PWA for easy donor access.
  - Multi-chain support (Bridge).
  - Creator-specific Token/DAO tools.

---

## 📄 License

Distributed under the MIT License.

<br />

<div align="center">
  <p>Built with ❤️ by the SawerSui Team</p>
</div>
