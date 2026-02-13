"use client";

import { useTranslations } from "next-intl";

export default function GettingStartedPage() {
  const t = useTranslations("GettingStartedPage");

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
        {/* Streamers Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">🎥</span>
            <h2 className="text-3xl font-extrabold text-[#1C1E21] uppercase tracking-tight drop-shadow-[2px_2px_0px_rgba(245,158,11,0.5)]">
              {t("Streamers.title")}
            </h2>
          </div>

          <div className="grid gap-6">
            <div className="bg-white border-2 border-[#1C1E21] shadow-[4px_4px_0px_0px_#1C1E21] p-6 rounded-lg hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1C1E21] transition-all">
              <h3 className="text-xl font-black text-primary mb-2">
                {t("Streamers.Step1.title")}
              </h3>
              <p className="text-[#606770] font-medium text-lg">
                {t.rich("Streamers.Step1.desc", {
                  bold: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
            </div>

            <div className="bg-white border-2 border-[#1C1E21] shadow-[4px_4px_0px_0px_#1C1E21] p-6 rounded-lg hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1C1E21] transition-all">
              <h3 className="text-xl font-black text-primary mb-2">
                {t("Streamers.Step2.title")}
              </h3>
              <p className="text-[#606770] font-medium text-lg">
                {t.rich("Streamers.Step2.desc", {
                  bold: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
            </div>

            <div className="bg-white border-2 border-[#1C1E21] shadow-[4px_4px_0px_0px_#1C1E21] p-6 rounded-lg hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1C1E21] transition-all">
              <h3 className="text-xl font-black text-primary mb-2">
                {t("Streamers.Step3.title")}
              </h3>
              <p className="text-[#606770] font-medium text-lg">
                {t.rich("Streamers.Step3.desc", {
                  bold: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
            </div>
          </div>
        </section>

        {/* Supporters Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">🫶</span>
            <h2 className="text-3xl font-extrabold text-[#1C1E21] uppercase tracking-tight drop-shadow-[2px_2px_0px_rgba(245,158,11,0.5)]">
              {t("Supporters.title")}
            </h2>
          </div>

          <div className="grid gap-6">
            <div className="bg-white border-2 border-[#1C1E21] shadow-[4px_4px_0px_0px_#1C1E21] p-6 rounded-lg hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1C1E21] transition-all">
              <h3 className="text-xl font-black text-primary mb-2">
                {t("Supporters.Step1.title")}
              </h3>
              <p className="text-[#606770] font-medium text-lg">
                {t.rich("Supporters.Step1.desc", {
                  bold: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
            </div>
            <div className="bg-white border-2 border-[#1C1E21] shadow-[4px_4px_0px_0px_#1C1E21] p-6 rounded-lg hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1C1E21] transition-all">
              <h3 className="text-xl font-black text-primary mb-2">
                {t("Supporters.Step2.title")}
              </h3>
              <p className="text-[#606770] font-medium text-lg">
                {t.rich("Supporters.Step2.desc", {
                  bold: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
            </div>
            <div className="bg-white border-2 border-[#1C1E21] shadow-[4px_4px_0px_0px_#1C1E21] p-6 rounded-lg hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1C1E21] transition-all">
              <h3 className="text-xl font-black text-primary mb-2">
                {t("Supporters.Step3.title")}
              </h3>
              <p className="text-[#606770] font-medium text-lg">
                {t.rich("Supporters.Step3.desc", {
                  bold: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
