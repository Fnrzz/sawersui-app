"use client";

import { useTranslations } from "next-intl";

export default function DonationsPage() {
  const t = useTranslations("DonationGuidePage");

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
        {/* Overview Section */}
        <section className="space-y-6">
          <div className="bg-[#F7F7F7] border border-[#E5E7EB] p-6 rounded-xl">
            <h2 className="text-2xl font-extrabold text-[#1C1E21] mb-4 uppercase tracking-tight">
              {t("Overview.title")}
            </h2>
            <div className="prose prose-lg prose-gray max-w-none text-[#1C1E21]">
              <p>
                {t.rich("Overview.p1", {
                  bold: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
              <p className="mt-2">
                {t.rich("Overview.p2", {
                  bold: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
            </div>
          </div>
        </section>

        {/* Methods Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-extrabold text-[#1C1E21] uppercase tracking-tight flex items-center gap-3">
            <span>💳</span> {t("Methods.title")}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border-2 border-[#1C1E21] shadow-[4px_4px_0px_0px_#1C1E21] p-6 rounded-lg hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1C1E21] transition-all">
              <h3 className="text-xl font-black text-[#410891] mb-2">
                {t("Methods.Wallet.title")}
              </h3>
              <p className="text-[#606770] font-medium text-lg">
                {t.rich("Methods.Wallet.desc", {
                  bold: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
            </div>
            <div className="bg-white border-2 border-[#1C1E21] shadow-[4px_4px_0px_0px_#1C1E21] p-6 rounded-lg hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1C1E21] transition-all">
              <h3 className="text-xl font-black text-[#410891] mb-2">
                {t("Methods.Google.title")}
              </h3>
              <p className="text-[#606770] font-medium text-lg">
                {t.rich("Methods.Google.desc", {
                  bold: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
            </div>
          </div>
        </section>

        {/* Fees Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-extrabold text-[#1C1E21] uppercase tracking-tight flex items-center gap-3">
            <span>💰</span> {t("Fees.title")}
          </h2>

          <div className="grid gap-6">
            {/* Platform Fee */}
            <div className="bg-white border-2 border-[#1C1E21] shadow-[4px_4px_0px_0px_#1C1E21] p-6 rounded-lg hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1C1E21] transition-all flex flex-col md:flex-row gap-4 md:items-center">
              <div className="bg-red-100 text-red-800 font-black text-3xl px-6 py-4 rounded border-2 border-red-200 text-center min-w-[120px]">
                {t("Fees.Platform.val")}
              </div>
              <div>
                <h3 className="text-xl font-black text-[#1C1E21] mb-1">
                  {t("Fees.Platform.title")}
                </h3>
                <p className="text-[#606770] font-medium text-lg">
                  {t.rich("Fees.Platform.desc", {
                    bold: (chunks) => <strong>{chunks}</strong>,
                  })}
                </p>
              </div>
            </div>

            {/* Gas Fee */}
            <div className="bg-white border-2 border-[#1C1E21] shadow-[4px_4px_0px_0px_#1C1E21] p-6 rounded-lg hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1C1E21] transition-all flex flex-col md:flex-row gap-4 md:items-center">
              <div className="bg-green-100 text-green-800 font-black text-3xl px-6 py-4 rounded border-2 border-green-200 text-center min-w-[120px]">
                {t("Fees.Gas.val")}
              </div>
              <div>
                <h3 className="text-xl font-black text-[#1C1E21] mb-1">
                  {t("Fees.Gas.title")}
                </h3>
                <p className="text-[#606770] font-medium text-lg">
                  {t.rich("Fees.Gas.desc", {
                    bold: (chunks) => <strong>{chunks}</strong>,
                  })}
                </p>
              </div>
            </div>

            {/* Settlement */}
            <div className="bg-white border-2 border-[#1C1E21] shadow-[4px_4px_0px_0px_#1C1E21] p-6 rounded-lg hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1C1E21] transition-all flex flex-col md:flex-row gap-4 md:items-center">
              <div className="bg-blue-100 text-blue-800 font-black text-xl px-4 py-5 rounded border-2 border-blue-200 text-center min-w-[120px] flex items-center justify-center">
                {t("Fees.Settlement.val")}
              </div>
              <div>
                <h3 className="text-xl font-black text-[#1C1E21] mb-1">
                  {t("Fees.Settlement.title")}
                </h3>
                <p className="text-[#606770] font-medium text-lg">
                  {t.rich("Fees.Settlement.desc", {
                    bold: (chunks) => <strong>{chunks}</strong>,
                  })}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
