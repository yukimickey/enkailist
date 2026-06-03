"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface PlayerSession {
  participant_id: string;
  session_token: string;
  event_id: string;
  nickname: string;
}

interface RankingEntry {
  id: string;
  nickname: string;
  total_score: number;
}

export default function PlayerResultsPage({
  params,
}: {
  params: Promise<{ roomCode: string }>;
}) {
  const { roomCode } = use(params);
  const [session, setSession] = useState<PlayerSession | null>(null);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [myRank, setMyRank] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const stored = sessionStorage.getItem(`player_${roomCode}`);
    if (!stored) {
      router.push(`/play?code=${roomCode}`);
      return;
    }
    const s = JSON.parse(stored) as PlayerSession;
    setSession(s);

    const fetchResults = async () => {
      const { data } = await supabase
        .from("participants")
        .select("id, nickname, total_score")
        .eq("event_id", s.event_id)
        .order("total_score", { ascending: false });

      if (data) {
        setRanking(data);
        const rank = data.findIndex((p) => p.id === s.participant_id) + 1;
        setMyRank(rank);
      }
      setLoading(false);
    };

    fetchResults();
  }, [roomCode, router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-4">🏆</div>
          <h1 className="text-3xl font-black">最終結果</h1>
        </div>

        {session && myRank > 0 && (
          <Card className="!bg-gray-800 !border-primary text-center">
            <p className="text-sm text-gray-400">あなたの順位</p>
            <p className="text-5xl font-black text-primary mt-1">{myRank}位</p>
            <p className="text-lg font-bold mt-2">{session.nickname}</p>
            <p className="text-xl font-bold text-primary mt-1">
              {ranking
                .find((r) => r.id === session.participant_id)
                ?.total_score.toLocaleString() || 0}
              pt
            </p>
          </Card>
        )}

        <div className="space-y-2">
          {ranking.slice(0, 10).map((entry, index) => (
            <div
              key={entry.id}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                session && entry.id === session.participant_id
                  ? "bg-primary/20 border border-primary"
                  : "bg-gray-800"
              }`}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0
                    ? "bg-yellow-500 text-black"
                    : index === 1
                    ? "bg-gray-400 text-black"
                    : index === 2
                    ? "bg-orange-600"
                    : "bg-gray-700"
                }`}
              >
                {index + 1}
              </span>
              <span className="flex-1 font-medium text-sm">
                {entry.nickname}
              </span>
              <span className="font-bold text-primary text-sm">
                {entry.total_score.toLocaleString()}pt
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
