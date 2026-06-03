import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/" className="text-xl font-black text-primary">
            エンカイリスト
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-8">利用規約</h1>
        <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed text-muted">
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">第1条（適用）</h2>
            <p>
              本規約は、エンカイリスト（以下「本サービス」）の利用に関する条件を定めるものです。
              ユーザーは本規約に同意の上、本サービスを利用するものとします。
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">第2条（利用登録）</h2>
            <p>
              クイズ作成機能を利用するにはアカウント登録が必要です。
              クイズへの参加（プレイヤー）にはアカウント登録は不要です。
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">第3条（禁止事項）</h2>
            <p>以下の行為を禁止します。</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>法令に違反する行為</li>
              <li>公序良俗に反する内容のクイズ作成</li>
              <li>他者の権利を侵害する行為</li>
              <li>サービスの運営を妨害する行為</li>
              <li>不正アクセスやシステムへの攻撃</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">第4条（免責事項）</h2>
            <p>
              本サービスは現状有姿で提供されます。サービスの中断・停止・変更により生じた損害について、
              運営者は一切の責任を負いません。
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">第5条（規約の変更）</h2>
            <p>
              運営者は必要に応じて本規約を変更できるものとします。
              変更後の規約は本ページに掲載した時点で効力を生じます。
            </p>
          </section>
          <p className="pt-4 text-xs">最終更新日: 2026年6月1日</p>
        </div>
      </main>
    </div>
  );
}
