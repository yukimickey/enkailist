import Link from "next/link";
import { HeroSection } from "@/components/lp/HeroSection";
import { FeaturesSection } from "@/components/lp/FeaturesSection";
import { HowToSection } from "@/components/lp/HowToSection";
import { ReviewsSection } from "@/components/lp/ReviewsSection";
import { FAQSection } from "@/components/lp/FAQSection";
import { CTASection } from "@/components/lp/CTASection";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-xl font-black text-primary">
            エンカイリスト
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/play"
              className="text-sm font-medium text-muted hover:text-foreground transition-colors"
            >
              参加する
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-muted hover:text-foreground transition-colors"
            >
              ログイン
            </Link>
            <Link
              href="/signup"
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-hover transition-colors"
            >
              無料で始める
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-14">
        <HeroSection />
        <FeaturesSection />
        <HowToSection />
        <ReviewsSection />
        <FAQSection />
        <CTASection />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xl font-black text-white">エンカイリスト</span>
              <p className="text-sm mt-1">宴会・二次会を盛り上げるクイズアプリ</p>
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/terms" className="hover:text-white transition-colors">
                利用規約
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                プライバシーポリシー
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-gray-800 text-center text-xs">
            &copy; 2026 エンカイリスト All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
