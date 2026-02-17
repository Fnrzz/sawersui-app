"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { QRCodeCanvas } from "qrcode.react";
import { Copy, Download, ArrowLeft, Share2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { motion, Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

interface ShareLinkClientProps {
  username: string;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function ShareLinkClient({ username }: ShareLinkClientProps) {
  const t = useTranslations("ShareLink");
  const tAction = useTranslations("Action");
  const qrRef = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const donationUrl = origin ? `${origin}/${username}` : `/${username}`;
  const qrUrl = origin
    ? `https://slush.app/browser?url=${encodeURIComponent(`${origin}/${username}`)}`
    : `/${username}`;

  const handleCopy = useCallback(() => {
    navigator.clipboard
      .writeText(`${origin}/${username}`)
      .then(() => toast.success(t("copySuccess")))
      .catch(() => toast.error(t("copyError")));
  }, [username, t]);

  const handleDownloadQR = useCallback(() => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;

    const padding = 32;
    const borderWidth = 3;
    const shadowOffset = 4;
    const borderRadius = 12;
    const qrSize = canvas.width;
    const innerSize = qrSize + padding * 2;
    const totalSize = innerSize + borderWidth * 2 + shadowOffset;

    const outCanvas = document.createElement("canvas");
    outCanvas.width = totalSize + 16;
    outCanvas.height = totalSize + 16;
    const ctx = outCanvas.getContext("2d");
    if (!ctx) return;

    const offsetX = 8;
    const offsetY = 8;

    // Draw shadow
    ctx.fillStyle = "#000000";
    roundRect(
      ctx,
      offsetX + shadowOffset,
      offsetY + shadowOffset,
      innerSize + borderWidth * 2,
      innerSize + borderWidth * 2,
      borderRadius,
    );
    ctx.fill();

    // Draw border
    ctx.fillStyle = "#000000";
    roundRect(
      ctx,
      offsetX,
      offsetY,
      innerSize + borderWidth * 2,
      innerSize + borderWidth * 2,
      borderRadius,
    );
    ctx.fill();

    // Draw white inner area
    ctx.fillStyle = "#FFFFFF";
    roundRect(
      ctx,
      offsetX + borderWidth,
      offsetY + borderWidth,
      innerSize,
      innerSize,
      borderRadius - 2,
    );
    ctx.fill();

    // Draw QR code
    ctx.drawImage(
      canvas,
      offsetX + borderWidth + padding,
      offsetY + borderWidth + padding,
    );

    const link = document.createElement("a");
    link.download = `sawersui-${username}-qr.png`;
    link.href = outCanvas.toDataURL("image/png");
    link.click();

    toast.success(t("downloadSuccess"));
  }, [username, t]);

  return (
    <motion.div
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors w-fit border-b-2 border-transparent hover:border-black mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {tAction("backToDashboard")}
        </Link>
        <div className="flex items-center gap-3">
          <div className="bg-[#BFDBFE] p-3 rounded-lg border-[3px] border-black shadow-[3px_3px_0px_0px_#000]">
            <Share2 className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-black">
              {t("title")}
            </h1>
            <p className="text-black/60 font-medium">{t("subtitle")}</p>
          </div>
        </div>
      </motion.div>

      {/* Donation Link Card */}
      <motion.div
        variants={itemVariants}
        className="bg-[#BFDBFE] border-[3px] border-black rounded-xl p-6 shadow-[6px_6px_0px_0px_#000]"
      >
        <h2 className="font-black text-lg text-black mb-2">{t("linkTitle")}</h2>
        <p className="text-sm text-black/70 font-medium mb-4">
          {t("linkDesc")}
        </p>

        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white border-[3px] border-black rounded-lg px-4 py-3 font-mono text-sm md:text-base font-bold text-black truncate select-all">
            {donationUrl}
          </div>
          <button
            onClick={handleCopy}
            className="shrink-0 px-4 py-3 bg-black text-white font-bold text-sm rounded-lg border-[3px] border-black hover:bg-gray-800 active:translate-y-[2px] transition-all flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            <span className="hidden md:inline">{t("copyButton")}</span>
          </button>
        </div>
      </motion.div>

      {/* QR Code Card */}
      <motion.div
        variants={itemVariants}
        className="bg-[#E0E7FF] border-[3px] border-black rounded-xl p-6 shadow-[6px_6px_0px_0px_#000]"
      >
        <h2 className="font-black text-lg text-black mb-2">{t("qrTitle")}</h2>
        <p className="text-sm text-black/70 font-medium mb-6">{t("qrDesc")}</p>

        <div className="flex flex-col items-center gap-6">
          {/* QR Code */}
          <div
            ref={qrRef}
            className="bg-white border-[3px] border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_#000] inline-block"
          >
            <QRCodeCanvas
              value={qrUrl}
              size={200}
              level="H"
              marginSize={0}
              imageSettings={{
                src: "/logo2.webp",
                height: 40,
                width: 40,
                excavate: true,
              }}
            />
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownloadQR}
            className="px-6 py-3 bg-black text-white font-bold text-sm rounded-lg border-[3px] border-black hover:bg-gray-800 active:translate-y-[2px] transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t("downloadButton")}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
