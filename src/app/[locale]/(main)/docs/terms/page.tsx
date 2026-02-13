"use client";

import { useTranslations } from "next-intl";

export default function TermsPage() {
  const t = useTranslations("TermsPage");

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="border-b pb-8">
        <h1 className="text-3xl font-black text-[#410891] sm:text-5xl mb-4 tracking-tight">
          {t("title")}
        </h1>
        <p className="text-xl sm:text-2xl text-[#1C1E21]/80 font-bold max-w-2xl">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid gap-12">
        {/* Agreement Section */}
        <section className="space-y-6">
          <div className="bg-[#F7F7F7] border border-[#E5E7EB] p-6 rounded-xl">
            <h2 className="text-2xl font-extrabold text-[#1C1E21] mb-4 uppercase tracking-tight">
              {t("Agreement.title")}
            </h2>
            <p className="prose prose-lg prose-gray max-w-none text-[#1C1E21]">
              {t("Agreement.p")}
            </p>
          </div>
        </section>

        {/* User Obligations Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-extrabold text-[#1C1E21] uppercase tracking-tight flex items-center gap-3">
            <span>🛡️</span> {t("UserObligations.title")}
          </h2>
          <div className="bg-white border-2 border-[#1C1E21] shadow-[4px_4px_0px_0px_#1C1E21] p-6 rounded-lg">
            <p className="text-[#606770] font-medium text-lg">
              {t("UserObligations.p")}
            </p>
          </div>
        </section>

        {/* Payments Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-extrabold text-[#1C1E21] uppercase tracking-tight flex items-center gap-3">
            <span>💰</span> {t("Payments.title")}
          </h2>
          <div className="grid gap-6">
            <div className="bg-white border-2 border-[#1C1E21] shadow-[4px_4px_0px_0px_#1C1E21] p-6 rounded-lg hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1C1E21] transition-all">
              <p className="text-[#606770] font-medium text-lg">
                {t.rich("Payments.p1", {
                  bold: (chunks) => (
                    <strong className="text-[#410891]">{chunks}</strong>
                  ),
                })}
              </p>
            </div>
            <div className="bg-white border-2 border-[#1C1E21] shadow-[4px_4px_0px_0px_#1C1E21] p-6 rounded-lg hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1C1E21] transition-all">
              <p className="text-[#606770] font-medium text-lg">
                {t.rich("Payments.p2", {
                  bold: (chunks) => (
                    <strong className="text-[#410891]">{chunks}</strong>
                  ),
                })}
              </p>
            </div>
            <div className="bg-white border-2 border-[#1C1E21] shadow-[4px_4px_0px_0px_#1C1E21] p-6 rounded-lg hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1C1E21] transition-all">
              <p className="text-[#606770] font-medium text-lg">
                {t.rich("Payments.p3", {
                  bold: (chunks) => (
                    <strong className="text-[#410891]">{chunks}</strong>
                  ),
                })}
              </p>
            </div>
          </div>
        </section>

        {/* Disclaimer Section */}
        <section className="space-y-6">
          <div className="bg-[#FFEBEE] border-2 border-[#D32F2F] p-6 rounded-lg">
            <h2 className="text-2xl font-extrabold text-[#D32F2F] mb-4 uppercase tracking-tight">
              ⚠️ {t("Disclaimer.title")}
            </h2>
            <p className="text-[#D32F2F] font-medium text-lg">
              {t("Disclaimer.p")}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
