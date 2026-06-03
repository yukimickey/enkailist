"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Input, Card } from "@/components/ui";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";

function PlayForm() {
  const searchParams = useSearchParams();
  const [roomCode, setRoomCode] = useState(searchParams.get("code") || "");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_code: roomCode.trim(),
          nickname: nickname.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      // Store session info in sessionStorage
      sessionStorage.setItem(
        `player_${roomCode}`,
        JSON.stringify({
          participant_id: data.participant_id,
          session_token: data.session_token,
          event_id: data.event_id,
          nickname: nickname.trim(),
        })
      );

      if (data.event_status === "active") {
        router.push(`/play/${roomCode}/game`);
      } else {
        router.push(`/play/${roomCode}`);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "参加に失敗しました"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <div className="text-center mb-6">
        <Link href="/" className="text-2xl font-black text-primary">
          エンカイリスト
        </Link>
        <p className="text-muted mt-2">クイズに参加する</p>
      </div>

      <form onSubmit={handleJoin} className="space-y-4">
        <Input
          label="ルームコード"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          placeholder="6桁のコードを入力"
          maxLength={6}
          pattern="[0-9]{6}"
          className="text-center text-2xl tracking-widest font-bold"
          required
        />
        <Input
          label="ニックネーム"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="あなたの名前"
          maxLength={20}
          required
        />
        <Button type="submit" fullWidth size="lg" loading={loading}>
          参加する
        </Button>
      </form>
    </Card>
  );
}

export default function PlayPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-purple-700 px-4">
      <Suspense fallback={<LoadingSpinner size="lg" />}>
        <PlayForm />
      </Suspense>
    </div>
  );
}
