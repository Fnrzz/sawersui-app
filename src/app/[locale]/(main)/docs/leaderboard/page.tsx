"use client";

import { useTranslations } from "next-intl";

export default function LeaderboardPage() {
  const t = useTranslations("LeaderboardGuidePage");

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="border-b pb-8">
        <h1 className="text-3xl font-black text-primary sm:text-5xl mb-4 tracking-tight uppercase drop-shadow-[4px_4px_0px_#1C1E21]">
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
            <h2 className="text-2xl font-extrabold text-[#1C1E21] mb-4 uppercase tracking-tight drop-shadow-[2px_2px_0px_rgba(245,158,11,0.5)]">
              {t("Overview.title")}
            </h2>
            <div className="prose prose-lg prose-gray max-w-none text-[#1C1E21]">
              <p>{t("Overview.p1")}</p>
              <p className="mt-2">{t("Overview.p2")}</p>
            </div>
          </div>
        </section>

        {/* Setup Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-extrabold text-[#1C1E21] uppercase tracking-tight flex items-center gap-3 drop-shadow-[2px_2px_0px_rgba(245,158,11,0.5)]">
            <span>🛠️</span> {t("Setup.title")}
          </h2>
          <div className="grid gap-6">
            {/* Step 1 */}
            <div className="bg-white border-2 border-[#1C1E21] shadow-[4px_4px_0px_0px_#1C1E21] p-6 rounded-lg hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1C1E21] transition-all">
              <h3 className="text-xl font-black text-primary mb-2">
                {t("Setup.Step1.title")}
              </h3>
              <p className="text-[#606770] font-medium text-lg">
                {t.rich("Setup.Step1.desc", {
                  bold: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
            </div>
            {/* Step 2 */}
            <div className="bg-white border-2 border-[#1C1E21] shadow-[4px_4px_0px_0px_#1C1E21] p-6 rounded-lg hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1C1E21] transition-all">
              <h3 className="text-xl font-black text-primary mb-2">
                {t("Setup.Step2.title")}
              </h3>
              <p className="text-[#606770] font-medium text-lg">
                {t.rich("Setup.Step2.desc", {
                  bold: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
            </div>
            {/* Step 3 */}
            <div className="bg-white border-2 border-[#1C1E21] shadow-[4px_4px_0px_0px_#1C1E21] p-6 rounded-lg hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1C1E21] transition-all">
              <h3 className="text-xl font-black text-primary mb-2">
                {t("Setup.Step3.title")}
              </h3>
              <p className="text-[#606770] font-medium text-lg">
                {t("Setup.Step3.desc")}
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-extrabold text-[#1C1E21] uppercase tracking-tight flex items-center gap-3 drop-shadow-[2px_2px_0px_rgba(245,158,11,0.5)]">
            <span>✨</span> {t("Features.title")}
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Realtime */}
            <div className="bg-white border-2 border-[#1C1E21] shadow-[4px_4px_0px_0px_#1C1E21] p-6 rounded-lg hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1C1E21] transition-all">
              <h3 className="text-xl font-black text-primary mb-2 flex items-center gap-2">
                <span>⚡</span> {t("Features.Realtime.title")}
              </h3>
              <p className="text-[#606770] font-medium text-lg">
                {t("Features.Realtime.desc")}
              </p>
            </div>

            {/* Customizable */}
            <div className="bg-white border-2 border-[#1C1E21] shadow-[4px_4px_0px_0px_#1C1E21] p-6 rounded-lg hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1C1E21] transition-all">
              <h3 className="text-xl font-black text-primary mb-2 flex items-center gap-2">
                <span>🎨</span> {t("Features.Customizable.title")}
              </h3>
              <p className="text-[#606770] font-medium text-lg">
                {t("Features.Customizable.desc")}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
