"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { BroadcastPayload } from "@/lib/types";

interface PlayerSession {
  participant_id: string;
  session_token: string;
  event_id: string;
  nickname: string;
}

export default function LobbyPage({
  params,
}: {
  params: Promise<{ roomCode: string }>;
}) {
  const { roomCode } = use(params);
  const [participants, setParticipants] = useState<string[]>([]);
  const [session, setSession] = useState<PlayerSession | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const stored = sessionStorage.getItem(`player_${roomCode}`);
    if (!stored) {
      router.push(`/play?code=${roomCode}`);
      return;
    }
    setSession(JSON.parse(stored));
  }, [roomCode, router]);

  useEffect(() => {
    if (!session) return;

    // Fetch current participants
    const fetchParticipants = async () => {
      const { data } = await supabase
        .from("participants")
        .select("nickname")
        .eq("event_id", session.event_id)
        .eq("is_active", true);

      if (data) {
        setParticipants(data.map((p) => p.nickname));
      }
    };

    fetchParticipants();

    // Subscribe to new participants via Postgres Changes
    const channel = supabase
      .channel(`lobby:${session.event_id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "participants",
          filter: `event_id=eq.${session.event_id}`,
        },
        (payload) => {
          const newParticipant = payload.new as { nickname: string };
          setParticipants((prev) => [...prev, newParticipant.nickname]);
        }
      )
      .subscribe();

    // Listen for game start broadcast
    const gameChannel = supabase
      .channel(`game:${session.event_id}`)
      .on("broadcast", { event: "game_signal" }, (payload) => {
        const data = payload.payload as BroadcastPayload;
        if (data.type === "start" || data.type === "question") {
          // Save question data to sessionStorage so game page can load it immediately
          if (data.question) {
            sessionStorage.setItem(
              `game_question_${roomCode}`,
              JSON.stringify({
                question: data.question,
                question_index: data.question_index ?? 0,
              })
            );
          }
          router.push(`/play/${roomCode}/game`);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(gameChannel);
    };
  }, [session, supabase, roomCode, router]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-purple-700 flex flex-col items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <div className="mb-6">
          <p className="text-sm text-muted">ルームコード</p>
          <p className="text-3xl font-black tracking-widest text-primary">
            {roomCode}
          </p>
        </div>

        <div className="mb-6">
          <p className="text-lg font-bold mb-1">ようこそ、{session.nickname} さん！</p>
          <p className="text-muted text-sm">ホストがクイズを開始するまでお待ちください</p>
        </div>

        <div className="animate-pulse mb-6">
          <LoadingSpinner />
          <p className="text-sm text-muted mt-2">待機中...</p>
        </div>

        <div>
          <p className="text-sm font-medium text-muted mb-2">
            参加者 ({participants.length}人)
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {participants.map((name, i) => (
              <span
                key={i}
                className={`px-3 py-1 rounded-full text-sm ${
                  name === session.nickname
                    ? "bg-primary text-white font-bold"
                    : "bg-muted-bg text-foreground"
                }`}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
