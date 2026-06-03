import Link from "next/link";

export default function PrivacyPage() {
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
        <h1 className="text-2xl font-bold mb-8">プライバシーポリシー</h1>
        <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed text-muted">
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">1. 収集する情報</h2>
            <p>本サービスでは以下の情報を収集します。</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>アカウント登録時のメールアドレス</li>
              <li>クイズ参加時のニックネーム</li>
              <li>クイズの回答データ（選択肢、回答時間、スコア）</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">2. 情報の利用目的</h2>
            <p>収集した情報は以下の目的で利用します。</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>サービスの提供・運営</li>
              <li>クイズのリアルタイム集計・ランキング表示</li>
              <li>サービスの改善・開発</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">3. 第三者提供</h2>
            <p>
              法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">4. データの保管</h2>
            <p>
              クイズデータはイベント終了後も保存されますが、ユーザーはいつでもアカウントおよび
              関連データの削除を要求することができます。
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">5. お問い合わせ</h2>
            <p>
              プライバシーに関するお問い合わせは、サービス内のお問い合わせフォームよりご連絡ください。
            </p>
          </section>
          <p className="pt-4 text-xs">最終更新日: 2026年6月1日</p>
        </div>
      </main>
    </div>
  );
}
