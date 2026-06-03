"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Card } from "@/components/ui";
import toast from "react-hot-toast";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("アカウントを作成しました。メールを確認してください。");
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted-bg px-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="text-2xl font-black text-primary">
            エンカイリスト
          </Link>
          <p className="text-muted mt-2">アカウント作成</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <Input
            label="表示名"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="田中太郎"
            required
          />
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
            placeholder="8文字以上"
            minLength={8}
            required
          />
          <Button type="submit" fullWidth loading={loading}>
            アカウントを作成
          </Button>
        </form>

        <p className="text-center text-sm text-muted mt-4">
          すでにアカウントをお持ちの方は{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            ログイン
          </Link>
        </p>
      </Card>
    </div>
  );
}
