"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";
import type { Event, QuestionWithoutAnswer, Choice, AnswerCount } from "@/lib/types";

interface LeaderboardEntry {
  id: string;
  nickname: string;
  total_score: number;
}

type Phase = "lobby" | "question" | "reveal" | "finished";

const choiceColors: Record<Choice, string> = {
  a: "bg-red-500",
  b: "bg-blue-500",
  c: "bg-yellow-500",
  d: "bg-green-500",
};

const choiceLabels: Choice[] = ["a", "b", "c", "d"];

export default function HostPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const [event, setEvent] = useState<Event | null>(null);
  const [phase, setPhase] = useState<Phase>("lobby");
  const [currentQuestion, setCurrentQuestion] = useState<QuestionWithoutAnswer | null>(null);
  const [questionIndex, setQuestionIndex] = useState(-1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [answerCounts, setAnswerCounts] = useState<AnswerCount | null>(null);
  const [correctChoice, setCorrectChoice] = useState<Choice | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      const { data: eventData } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (!eventData) {
        router.push("/dashboard");
        return;
      }

      setEvent(eventData);

      const { count } = await supabase
        .from("participants")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("is_active", true);

      setParticipantCount(count || 0);

      // Get total questions
      const { data: questions } = await supabase
        .from("questions")
        .select("id")
        .eq("event_id", eventId);

      setTotalQuestions(questions?.length || 0);

      if (eventData.status === "finished") {
        setPhase("finished");
        // Fetch final leaderboard
        const { data: lb } = await supabase
          .from("participants")
          .select("id, nickname, total_score")
          .eq("event_id", eventId)
          .order("total_score", { ascending: false })
          .limit(10);
        setLeaderboard(lb || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [eventId, router, supabase]);

  // Subscribe to participant count changes
  useEffect(() => {
    const channel = supabase
      .channel(`host_participants:${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "participants",
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          setParticipantCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, supabase]);

  // Subscribe to answer counts changes
  useEffect(() => {
    if (!currentQuestion) return;

    const channel = supabase
      .channel(`host_answers:${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "answer_counts",
          filter: `question_id=eq.${currentQuestion.id}`,
        },
        (payload) => {
          setAnswerCounts(payload.new as AnswerCount);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentQuestion, eventId, supabase]);

  // Countdown timer
  useEffect(() => {
    if (phase !== "question" || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, countdown]);

  const handleStart = useCallback(async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/start`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCurrentQuestion(data.question);
      setQuestionIndex(data.question_index);
      setTotalQuestions(data.total_questions);
      setPhase("question");
      setCountdown(data.question.time_limit_sec || 15);
      setAnswerCounts(null);
      setCorrectChoice(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "開始に失敗しました");
    } finally {
      setActionLoading(false);
    }
  }, [eventId]);

  const handleReveal = useCallback(async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/reveal`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCorrectChoice(data.correct_choice);
      setAnswerCounts(data.answer_counts);
      setLeaderboard(data.leaderboard);
      setPhase("reveal");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "エラー");
    } finally {
      setActionLoading(false);
    }
  }, [eventId]);

  const handleNextQuestion = useCallback(async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/next-question`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.finished) {
        setPhase("finished");
        confetti({
          particleCount: 200,
          spread: 70,
          origin: { y: 0.6 },
        });
        // Fetch final leaderboard
        const { data: lb } = await supabase
          .from("participants")
          .select("id, nickname, total_score")
          .eq("event_id", eventId)
          .order("total_score", { ascending: false })
          .limit(10);
        setLeaderboard(lb || []);
      } else {
        setCurrentQuestion(data.question);
        setQuestionIndex(data.question_index);
        setTotalQuestions(data.total_questions);
        setPhase("question");
        setCountdown(data.question.time_limit_sec || 15);
        setAnswerCounts(null);
        setCorrectChoice(null);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "エラー");
    } finally {
      setActionLoading(false);
    }
  }, [eventId, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const getChoiceValue = (q: QuestionWithoutAnswer, choice: Choice): string => {
    const map = { a: q.choice_a, b: q.choice_b, c: q.choice_c, d: q.choice_d };
    return map[choice];
  };

  const maxCount = answerCounts
    ? Math.max(answerCounts.count_a, answerCounts.count_b, answerCounts.count_c, answerCounts.count_d, 1)
    : 1;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-gray-800">
        <div className="flex items-center gap-4">
          <span className="text-xl font-black text-primary">エンカイリスト</span>
          <span className="text-sm text-gray-400">{event?.title}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            参加者: {participantCount}人
          </span>
          {phase !== "finished" && (
            <span className="text-sm text-gray-400">
              問題: {questionIndex + 1} / {totalQuestions}
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        {/* LOBBY */}
        {phase === "lobby" && (
          <div className="text-center space-y-8 max-w-xl">
            <div>
              <p className="text-sm text-gray-400 mb-2">ルームコード</p>
              <p className="text-7xl font-black tracking-[0.3em] text-primary">
                {event?.room_code}
              </p>
            </div>
            <p className="text-2xl text-gray-300">
              参加者: <span className="font-bold text-white">{participantCount}</span>人
            </p>
            <Button
              size="xl"
              onClick={handleStart}
              loading={actionLoading}
              disabled={participantCount === 0}
            >
              クイズを開始する
            </Button>
          </div>
        )}

        {/* QUESTION */}
        {phase === "question" && currentQuestion && (
          <div className="w-full max-w-4xl space-y-8">
            {/* Countdown */}
            <div className="text-center">
              <div
                className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-4xl font-black ${
                  countdown <= 5
                    ? "bg-red-500 animate-pulse"
                    : "bg-primary"
                }`}
              >
                {countdown}
              </div>
            </div>

            {/* Question */}
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-2">
                問題 {questionIndex + 1} / {totalQuestions}
              </p>
              <h2 className="text-3xl font-bold leading-relaxed">
                {currentQuestion.question_text}
              </h2>
            </div>

            {/* Choices */}
            <div className="grid grid-cols-2 gap-4">
              {choiceLabels.map((choice) => (
                <div
                  key={choice}
                  className={`${choiceColors[choice]} rounded-xl p-6 text-center`}
                >
                  <span className="text-sm font-bold opacity-75">
                    {choice.toUpperCase()}
                  </span>
                  <p className="text-xl font-bold mt-1">
                    {getChoiceValue(currentQuestion, choice)}
                  </p>
                </div>
              ))}
            </div>

            {/* Answer distribution bar */}
            {answerCounts && answerCounts.total_count > 0 && (
              <div className="text-center text-sm text-gray-400">
                回答数: {answerCounts.total_count}
              </div>
            )}

            <div className="text-center">
              <Button onClick={handleReveal} loading={actionLoading} size="lg">
                正解を発表
              </Button>
            </div>
          </div>
        )}

        {/* REVEAL */}
        {phase === "reveal" && currentQuestion && (
          <div className="w-full max-w-4xl space-y-8">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-2">
                問題 {questionIndex + 1} の正解
              </p>
              <h2 className="text-2xl font-bold mb-4">
                {currentQuestion.question_text}
              </h2>
            </div>

            {/* Answer Distribution */}
            <div className="space-y-3">
              {choiceLabels.map((choice) => {
                const count = answerCounts
                  ? answerCounts[`count_${choice}` as keyof AnswerCount] as number
                  : 0;
                const isCorrect = choice === correctChoice;
                const width = maxCount > 0 ? (count / maxCount) * 100 : 0;

                return (
                  <div key={choice} className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg ${
                        choiceColors[choice]
                      } ${isCorrect ? "ring-4 ring-white" : "opacity-60"}`}
                    >
                      {choice.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-sm ${
                            isCorrect ? "font-bold text-white" : "text-gray-400"
                          }`}
                        >
                          {getChoiceValue(currentQuestion, choice)}
                          {isCorrect && " ✓"}
                        </span>
                        <span className="text-sm text-gray-400">{count}人</span>
                      </div>
                      <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            isCorrect ? "bg-green-500" : "bg-gray-500"
                          }`}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4 text-center">ランキング</h3>
                <div className="space-y-2">
                  {leaderboard.slice(0, 5).map((entry, index) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 py-2"
                    >
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0
                            ? "bg-yellow-500"
                            : index === 1
                            ? "bg-gray-400"
                            : index === 2
                            ? "bg-orange-600"
                            : "bg-gray-700"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="flex-1 font-medium">{entry.nickname}</span>
                      <span className="font-bold text-primary">
                        {entry.total_score.toLocaleString()}pt
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center">
              <Button onClick={handleNextQuestion} loading={actionLoading} size="lg">
                {questionIndex + 1 >= totalQuestions ? "結果発表" : "次の問題へ"}
              </Button>
            </div>
          </div>
        )}

        {/* FINISHED */}
        {phase === "finished" && (
          <div className="w-full max-w-2xl space-y-8 text-center">
            <h2 className="text-4xl font-black">最終結果</h2>

            {leaderboard.length > 0 && (
              <div className="space-y-3">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-4 p-4 rounded-xl ${
                      index === 0
                        ? "bg-yellow-500/20 border-2 border-yellow-500 text-2xl"
                        : index === 1
                        ? "bg-gray-400/20 border border-gray-400 text-xl"
                        : index === 2
                        ? "bg-orange-600/20 border border-orange-600 text-lg"
                        : "bg-gray-800"
                    }`}
                  >
                    <span
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
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
                    <span className="flex-1 font-bold text-left">
                      {entry.nickname}
                    </span>
                    <span className="font-black text-primary">
                      {entry.total_score.toLocaleString()}pt
                    </span>
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => router.push(`/events/${eventId}`)}
            >
              イベントページへ戻る
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
