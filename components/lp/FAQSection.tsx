"use client";

import { useState } from "react";

const faqs = [
  {
    q: "無料で使えますか？",
    a: "はい、基本機能は全て無料でお使いいただけます。アカウント登録だけですぐにクイズを作成できます。",
  },
  {
    q: "参加者はアカウント登録が必要ですか？",
    a: "いいえ、参加者はアカウント登録不要です。QRコードを読み取り、ニックネームを入力するだけで参加できます。",
  },
  {
    q: "何人まで同時に参加できますか？",
    a: "技術的な上限は特にありませんが、快適にお使いいただける目安として100人程度を推奨しています。",
  },
  {
    q: "スマホ以外でも参加できますか？",
    a: "はい、PC・タブレットなどのブラウザからも参加可能です。ただし、ホスト画面はPC・プロジェクターでの表示を推奨しています。",
  },
  {
    q: "問題は何問まで作れますか？",
    a: "問題数に制限はありません。イベントの長さに合わせて自由に設定してください。",
  },
  {
    q: "インターネット環境は必要ですか？",
    a: "はい、ホスト・参加者ともにインターネット接続が必要です。会場のWi-Fi環境をご確認ください。",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 bg-muted-bg">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black mb-4">よくある質問</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-border overflow-hidden"
            >
              <button
                onClick={() =>
                  setOpenIndex(openIndex === index ? null : index)
                }
                className="w-full flex items-center justify-between px-6 py-4 text-left font-medium hover:bg-muted-bg/50 transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                <svg
                  className={`w-5 h-5 text-muted transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4 text-muted leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
