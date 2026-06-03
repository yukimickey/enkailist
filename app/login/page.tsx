"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Card } from "@/components/ui";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error:", error.message, error.status, error);
      toast.error(`ログイン失敗: ${error.message}`);
      setLoading(false);
      return;
    }

    toast.success("ログインしました");
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted-bg px-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="text-2xl font-black text-primary">
            エンカイリスト
          </Link>
          <p className="text-muted mt-2">ログイン</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="メールアドレス"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <Input
            label="パスワード"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          <Button type="submit" fullWidth loading={loading}>
            ログイン
          </Button>
        </form>

        <p className="text-center text-sm text-muted mt-4">
          アカウントをお持ちでない方は{" "}
          <Link href="/signup" className="text-primary hover:underline font-medium">
            新規登録
          </Link>
        </p>
      </Card>
    </div>
  );
}
