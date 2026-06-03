"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { QuestionWithoutAnswer, Choice, BroadcastPayload } from "@/lib/types";

interface PlayerSession {
  participant_id: string;
  session_token: string;
  event_id: string;
  nickname: string;
}

type GamePhase = "loading" | "waiting" | "question" | "answered" | "reveal" | "finished";

const choiceColors: Record<Choice, { bg: string; hover: string }> = {
  a: { bg: "bg-red-500", hover: "active:bg-red-600" },
  b: { bg: "bg-blue-500", hover: "active:bg-blue-600" },
  c: { bg: "bg-yellow-500", hover: "active:bg-yellow-600" },
  d: { bg: "bg-green-500", hover: "active:bg-green-600" },
};

const choiceKeys: Choice[] = ["a", "b", "c", "d"];

export default function GamePage({
  params,
}: {
  params: Promise<{ roomCode: string }>;
}) {
  const { roomCode } = use(params);
  const [session, setSession] = useState<PlayerSession | null>(null);
  const [phase, setPhase] = useState<GamePhase>("loading");
  const [currentQuestion, setCurrentQuestion] = useState<QuestionWithoutAnswer | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null);
  const [correctChoice, setCorrectChoice] = useState<Choice | null>(null);
  const [answerResult, setAnswerResult] = useState<{
    is_correct: boolean;
    score: number;
  } | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();
  const supabase = createClient();

  // Load session
  useEffect(() => {
    const stored = sessionStorage.getItem(`player_${roomCode}`);
    if (!stored) {
      router.push(`/play?code=${roomCode}`);
      return;
    }
    setSession(JSON.parse(stored));
  }, [roomCode, router]);

  // Fetch current question from API on page load
  useEffect(() => {
    if (!session) return;

    const fetchCurrentQuestion = async () => {
      try {
        const res = await fetch(
          `/api/events/${session.event_id}/current-question?participant_id=${session.participant_id}`
        );
        const data = await res.json();

        switch (data.phase) {
          case "question":
            setCurrentQuestion(data.question);
            setQuestionIndex(data.question_index);
            setCountdown(data.question.time_limit_sec || 15);
            setPhase("question");
            break;
          case "answered":
            setCurrentQuestion(data.question);
            setQuestionIndex(data.question_index);
            setSelectedChoice(data.answer.selected_choice);
            setAnswerResult({
              is_correct: data.answer.is_correct,
              score: data.answer.score,
            });
            setTotalScore((prev) => prev + data.answer.score);
            setPhase("answered");
            break;
          case "finished":
            setPhase("finished");
            break;
          default:
            setPhase("waiting");
        }
      } catch {
        setPhase("waiting");
      }
    };

    fetchCurrentQuestion();
  }, [session]);

  // Subscribe to game events via broadcast
  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel(`game:${session.event_id}`)
      .on("broadcast", { event: "game_signal" }, (payload) => {
        const data = payload.payload as BroadcastPayload;

        switch (data.type) {
          case "question":
            setCurrentQuestion(data.question || null);
            setQuestionIndex(data.question_index || 0);
            setPhase("question");
            setSelectedChoice(null);
            setCorrectChoice(null);
            setAnswerResult(null);
            setCountdown(data.question?.time_limit_sec || 15);
            break;
          case "reveal":
            setCorrectChoice(data.correct_choice || null);
            setPhase("reveal");
            break;
          case "end":
            setPhase("finished");
            break;
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, supabase]);

  // Countdown
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

  const handleAnswer = useCallback(
    async (choice: Choice) => {
      if (!session || !currentQuestion || phase !== "question") return;

      setSelectedChoice(choice);
      setPhase("answered");

      try {
        const res = await fetch("/api/answers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participant_id: session.participant_id,
            question_id: currentQuestion.id,
            event_id: session.event_id,
            selected_choice: choice,
            session_token: session.session_token,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          setAnswerResult({ is_correct: data.is_correct, score: data.score });
          setTotalScore((prev) => prev + data.score);
        }
      } catch {
        // Answer submission failed silently
      }
    },
    [session, currentQuestion, phase]
  );

  if (!session || phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const getChoiceValue = (q: QuestionWithoutAnswer, choice: Choice): string => {
    const map = { a: q.choice_a, b: q.choice_b, c: q.choice_c, d: q.choice_d };
    return map[choice];
  };

  const getCorrectAnswerText = (): string => {
    if (!correctChoice || !currentQuestion) return "";
    return `${correctChoice.toUpperCase()}. ${getChoiceValue(currentQuestion, correctChoice)}`;
  };

  const getSelectedAnswerText = (): string => {
    if (!selectedChoice || !currentQuestion) return "";
    return `${selectedChoice.toUpperCase()}. ${getChoiceValue(currentQuestion, selectedChoice)}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-gray-800">
        <span className="text-sm font-bold">{session.nickname}</span>
        <span className="text-sm text-primary font-bold">
          {totalScore.toLocaleString()}pt
        </span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {/* WAITING */}
        {phase === "waiting" && (
          <div className="text-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-xl text-gray-400">次の問題を待っています...</p>
          </div>
        )}

        {/* QUESTION - Answer Buttons */}
        {phase === "question" && currentQuestion && (
          <div className="w-full max-w-md space-y-4">
            <div className="text-center">
              <div
                className={`inline-flex items-center justify-center w-16 h-16 rounded-full text-3xl font-black ${
                  countdown <= 5 ? "bg-red-500 animate-pulse" : "bg-primary"
                }`}
              >
                {countdown}
              </div>
            </div>

            <p className="text-center text-sm text-gray-400">
              問題 {questionIndex + 1}
            </p>
            <h2 className="text-lg font-bold text-center leading-relaxed mb-4">
              {currentQuestion.question_text}
            </h2>

            <div className="grid grid-cols-1 gap-3">
              {choiceKeys.map((choice) => (
                <button
                  key={choice}
                  onClick={() => handleAnswer(choice)}
                  disabled={countdown === 0}
                  className={`${choiceColors[choice].bg} ${choiceColors[choice].hover}
                    w-full py-5 px-4 rounded-xl text-white font-bold text-lg
                    transition-transform active:scale-95 disabled:opacity-50
                    cursor-pointer disabled:cursor-not-allowed`}
                >
                  <span className="opacity-75 mr-2">{choice.toUpperCase()}</span>
                  {getChoiceValue(currentQuestion, choice)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ANSWERED */}
        {phase === "answered" && (
          <div className="text-center space-y-4 max-w-sm">
            {selectedChoice && currentQuestion && (
              <div
                className={`${choiceColors[selectedChoice].bg} rounded-2xl p-6 mx-auto`}
              >
                <p className="text-lg font-black">
                  {selectedChoice.toUpperCase()}. {getChoiceValue(currentQuestion, selectedChoice)}
                </p>
              </div>
            )}
            <p className="text-xl font-bold">回答済み！</p>
            <p className="text-gray-400">正解発表をお待ちください...</p>
            {answerResult && (
              <p className="text-sm text-gray-400">
                +{answerResult.score}pt
              </p>
            )}
          </div>
        )}

        {/* REVEAL */}
        {phase === "reveal" && (
          <div className="text-center space-y-6 max-w-sm w-full">
            {answerResult ? (
              answerResult.is_correct ? (
                <div className="space-y-3">
                  <div className="text-6xl">⭕</div>
                  <p className="text-3xl font-black text-green-400">正解！</p>
                  {selectedChoice && currentQuestion && (
                    <div className="bg-green-900/30 border border-green-500/50 rounded-xl p-4">
                      <p className="font-bold text-green-300">{getSelectedAnswerText()}</p>
                    </div>
                  )}
                  <p className="text-2xl font-bold text-primary">
                    +{answerResult.score}pt
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-6xl">❌</div>
                  <p className="text-3xl font-black text-red-400">不正解</p>
                  {selectedChoice && currentQuestion && (
                    <div className="bg-gray-800 rounded-xl p-4">
                      <p className="text-xs text-gray-400 mb-1">あなたの回答</p>
                      <p className="font-bold text-gray-300">{getSelectedAnswerText()}</p>
                    </div>
                  )}
                  {correctChoice && currentQuestion && (
                    <div className="bg-green-900/30 border border-green-500/50 rounded-xl p-4">
                      <p className="text-xs text-green-400 mb-1">正解</p>
                      <p className="font-bold text-green-300">{getCorrectAnswerText()}</p>
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="space-y-4">
                <div className="text-6xl">⏰</div>
                <p className="text-2xl font-bold text-gray-400">時間切れ</p>
                {correctChoice && currentQuestion && (
                  <div className="bg-green-900/30 border border-green-500/50 rounded-xl p-4">
                    <p className="text-xs text-green-400 mb-1">正解</p>
                    <p className="font-bold text-green-300">{getCorrectAnswerText()}</p>
                  </div>
                )}
              </div>
            )}
            <div className="pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400">現在のスコア</p>
              <p className="text-3xl font-black text-primary">
                {totalScore.toLocaleString()}pt
              </p>
            </div>
          </div>
        )}

        {/* FINISHED */}
        {phase === "finished" && (
          <div className="text-center space-y-6 max-w-sm">
            <div className="text-5xl">🎉</div>
            <h2 className="text-3xl font-black">クイズ終了！</h2>
            <div>
              <p className="text-sm text-gray-400">あなたの最終スコア</p>
              <p className="text-4xl font-black text-primary mt-2">
                {totalScore.toLocaleString()}pt
              </p>
            </div>
            <p className="text-gray-400 text-sm">
              ホストの画面で最終ランキングをご確認ください
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
