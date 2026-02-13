"use client";

import { useTranslations } from "next-intl";

export default function DocsPage() {
  const t = useTranslations("DocsPage");

  return (
    <div className="max-w-4xl mx-auto space-y-8 md:space-y-12">
      {/* Header Section */}
      <div className="space-y-4 border-b pb-8">
        <h1 className="text-3xl font-black text-[#410891] sm:text-4xl md:text-6xl tracking-tight break-words">
          {t("title")}
        </h1>
        <p className="text-xl sm:text-2xl font-bold text-[#1C1E21]/80 max-w-2xl">
          {t("subtitle")}
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <span className="bg-blue-100 text-blue-800 text-sm font-bold px-3 py-1 rounded-full border border-blue-200">
            {t("badges.beta")}
          </span>
          <span className="bg-[#4DA2FF]/10 text-[#4DA2FF] text-sm font-bold px-3 py-1 rounded-full border border-[#4DA2FF]/20">
            {t("badges.network")}
          </span>
        </div>
      </div>

      {/* Introduction */}
      <section className="space-y-4">
        <h2 className="text-3xl font-extrabold text-[#1C1E21] uppercase tracking-tight">
          {t("Introduction.title")}
        </h2>
        <div className="prose prose-lg prose-gray max-w-none text-[#1C1E21]">
          <p>
            {t.rich("Introduction.p1", {
              bold: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
          <p>
            {t.rich("Introduction.p2", {
              bold: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
          <blockquote className="border-l-4 border-[#410891] pl-4 italic text-xl font-medium text-[#410891]">
            &quot;{t("Introduction.quote")}&quot;
          </blockquote>
        </div>
      </section>

      {/* The Problem & Solution */}
      <section className="space-y-6">
        <h2 className="text-3xl font-extrabold text-[#1C1E21] uppercase tracking-tight">
          {t("Solution.title")}
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-red-200 bg-red-50 p-6 rounded-xl">
            <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center">
              ❌ {t("Solution.Traditional.title")}
            </h3>
            <ul className="space-y-3 text-red-900/80 font-medium">
              <li className="flex gap-2">
                <span>•</span>
                <span>
                  {t.rich("Solution.Traditional.li1", {
                    bold: (chunks) => <strong>{chunks}</strong>,
                  })}
                </span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>
                  {t.rich("Solution.Traditional.li2", {
                    bold: (chunks) => <strong>{chunks}</strong>,
                  })}
                </span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>
                  {t.rich("Solution.Traditional.li3", {
                    bold: (chunks) => <strong>{chunks}</strong>,
                  })}
                </span>
              </li>
            </ul>
          </div>
          <div className="border border-green-200 bg-green-50 p-6 rounded-xl">
            <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center">
              ✅ {t("Solution.SawerSui.title")}
            </h3>
            <ul className="space-y-3 text-green-900/80 font-medium">
              <li className="flex gap-2">
                <span>•</span>
                <span>
                  {t.rich("Solution.SawerSui.li1", {
                    bold: (chunks) => <strong>{chunks}</strong>,
                  })}
                </span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>
                  {t.rich("Solution.SawerSui.li2", {
                    bold: (chunks) => <strong>{chunks}</strong>,
                  })}
                </span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>
                  {t.rich("Solution.SawerSui.li3", {
                    bold: (chunks) => <strong>{chunks}</strong>,
                  })}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="space-y-6">
        <h2 className="text-3xl font-extrabold text-[#1C1E21] uppercase tracking-tight">
          {t("Features.title")}
        </h2>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-white border-2 border-[#1C1E21] shadow-[4px_4px_0px_0px_#1C1E21] p-6 rounded-lg hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1C1E21] transition-all">
            <h3 className="text-xl font-black text-[#410891] mb-2">
              {t("Features.Overlays.title")}
            </h3>
            <p className="text-[#606770] font-medium">
              {t.rich("Features.Overlays.desc", {
                bold: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>
          </div>

          <div className="bg-white border-2 border-[#1C1E21] shadow-[4px_4px_0px_0px_#1C1E21] p-6 rounded-lg hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1C1E21] transition-all">
            <h3 className="text-xl font-black text-[#410891] mb-2">
              {t("Features.GasFree.title")}
            </h3>
            <p className="text-[#606770] font-medium">
              {t.rich("Features.GasFree.desc", {
                bold: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>
          </div>

          <div className="bg-white border-2 border-[#1C1E21] shadow-[4px_4px_0px_0px_#1C1E21] p-6 rounded-lg hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1C1E21] transition-all">
            <h3 className="text-xl font-black text-[#410891] mb-2">
              {t("Features.zkLogin.title")}
            </h3>
            <p className="text-[#606770] font-medium">
              {t.rich("Features.zkLogin.desc", {
                bold: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>
          </div>

          <div className="bg-white border-2 border-[#1C1E21] shadow-[4px_4px_0px_0px_#1C1E21] p-6 rounded-lg hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1C1E21] transition-all">
            <h3 className="text-xl font-black text-[#410891] mb-2">
              {t("Features.Stablecoin.title")}
            </h3>
            <p className="text-[#606770] font-medium">
              {t.rich("Features.Stablecoin.desc", {
                bold: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="space-y-6">
        <h2 className="text-3xl font-extrabold text-[#1C1E21] uppercase tracking-tight">
          {t("Architecture.title")}
        </h2>
        <div className="bg-[#F7F7F7] p-8 rounded-xl border border-[#E5E7EB]">
          <ul className="space-y-4">
            <li className="flex flex-col sm:flex-row sm:items-baseline gap-2">
              <span className="font-black text-lg min-w-[150px]">
                {t("Architecture.Frontend.label")}
              </span>
              <span className="text-[#606770] font-medium">
                {t("Architecture.Frontend.val")}
              </span>
            </li>
            <li className="flex flex-col sm:flex-row sm:items-baseline gap-2">
              <span className="font-black text-lg min-w-[150px]">
                {t("Architecture.Blockchain.label")}
              </span>
              <span className="text-[#606770] font-medium">
                {t("Architecture.Blockchain.val")}
              </span>
            </li>
            <li className="flex flex-col sm:flex-row sm:items-baseline gap-2">
              <span className="font-black text-lg min-w-[150px]">
                {t("Architecture.Auth.label")}
              </span>
              <span className="text-[#606770] font-medium">
                {t("Architecture.Auth.val")}
              </span>
            </li>
            <li className="flex flex-col sm:flex-row sm:items-baseline gap-2">
              <span className="font-black text-lg min-w-[150px]">
                {t("Architecture.Backend.label")}
              </span>
              <span className="text-[#606770] font-medium">
                {t("Architecture.Backend.val")}
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Roadmap */}
      <section className="space-y-6 pb-12">
        <h2 className="text-3xl font-extrabold text-[#1C1E21] uppercase tracking-tight">
          {t("Roadmap.title")}
        </h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="bg-[#410891] text-white font-bold px-3 py-1 rounded text-sm mt-1">
              {t("Roadmap.Phase1.label")}
            </div>
            <div>
              <h3 className="font-bold text-lg">{t("Roadmap.Phase1.title")}</h3>
              <p className="text-[#606770]">{t("Roadmap.Phase1.desc")}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="bg-[#1C1E21]/10 text-[#1C1E21] font-bold px-3 py-1 rounded text-sm mt-1">
              {t("Roadmap.Phase2.label")}
            </div>
            <div>
              <h3 className="font-bold text-lg">{t("Roadmap.Phase2.title")}</h3>
              <p className="text-[#606770]">{t("Roadmap.Phase2.desc")}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="bg-[#1C1E21]/10 text-[#1C1E21] font-bold px-3 py-1 rounded text-sm mt-1">
              {t("Roadmap.Phase3.label")}
            </div>
            <div>
              <h3 className="font-bold text-lg">{t("Roadmap.Phase3.title")}</h3>
              <p className="text-[#606770]">{t("Roadmap.Phase3.desc")}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
