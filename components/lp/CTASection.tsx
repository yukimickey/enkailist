import Link from "next/link";

export function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-primary via-purple-600 to-pink-500 text-white text-center">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-black mb-4">
          次の宴会を、最高の思い出に。
        </h2>
        <p className="text-lg opacity-90 mb-8 leading-relaxed">
          無料でアカウント作成、すぐにクイズを作成できます。
          <br />
          ビンゴの代わりに、盛り上がるクイズ大会を開催しましょう。
        </p>
        <Link
          href="/signup"
          className="inline-block bg-white text-primary px-8 py-4 rounded-xl text-lg font-black hover:bg-gray-100 transition-colors shadow-lg"
        >
          無料でクイズを作る
        </Link>
      </div>
    </section>
  );
}
