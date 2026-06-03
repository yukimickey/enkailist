import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-purple-600 to-pink-500 text-white">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-40 h-40 rounded-full bg-white" />
        <div className="absolute bottom-20 right-20 w-60 h-60 rounded-full bg-white" />
        <div className="absolute top-40 right-40 w-20 h-20 rounded-full bg-white" />
      </div>
      <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-36 text-center">
        <p className="text-lg md:text-xl font-bold opacity-90 mb-4">
          ビンゴはもう飽きた。
        </p>
        <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6">
          宴会を、もっと
          <br />
          盛り上げよう。
        </h1>
        <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto mb-10 leading-relaxed">
          オールスター感謝祭風の早押しクイズを
          <br className="hidden md:block" />
          スマホだけでかんたんに。企業パーティー・結婚式二次会に。
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="bg-white text-primary px-8 py-4 rounded-xl text-lg font-black hover:bg-gray-100 transition-colors shadow-lg"
          >
            無料でクイズを作る
          </Link>
          <Link
            href="/play"
            className="border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-white/10 transition-colors"
          >
            クイズに参加する
          </Link>
        </div>
      </div>
    </section>
  );
}
