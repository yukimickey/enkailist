"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Badge, Input } from "@/components/ui";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";
import type { Event, Question, Choice } from "@/lib/types";

const statusMap = {
  draft: { label: "下書き", variant: "default" as const },
  lobby: { label: "ロビー", variant: "info" as const },
  active: { label: "進行中", variant: "success" as const },
  finished: { label: "終了", variant: "warning" as const },
};

interface QuestionForm {
  id?: string;
  question_text: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  correct_choice: Choice;
  time_limit_sec: number;
  order_index: number;
}

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const [event, setEvent] = useState<Event | null>(null);
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const router = useRouter();
  const supabase = createClient();

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

      const res = await fetch(`/api/events/${eventId}/questions`);
      const questionsData = await res.json();
      setQuestions(
        questionsData.map((q: Question, i: number) => ({
          ...q,
          order_index: q.order_index ?? i,
        }))
      );
      setLoading(false);
    };

    fetchData();
  }, [eventId, router, supabase]);

  const handleSaveQuestions = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}/questions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(questions),
      });
      if (!res.ok) throw new Error("保存に失敗しました");
      toast.success("問題を保存しました");
      setEditing(false);
    } catch {
      toast.error("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const openLobby = async () => {
    const { error } = await supabase
      .from("events")
      .update({ status: "lobby" })
      .eq("id", eventId);

    if (error) {
      toast.error("エラーが発生しました");
      return;
    }
    setEvent((prev) => (prev ? { ...prev, status: "lobby" } : null));
    toast.success("ロビーを開きました");
  };

  const deleteEvent = async () => {
    if (!confirm("このイベントを削除しますか？")) return;
    const { error } = await supabase.from("events").delete().eq("id", eventId);
    if (error) {
      toast.error("削除に失敗しました");
      return;
    }
    toast.success("イベントを削除しました");
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!event) return null;

  const playUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/play?code=${event.room_code}`
      : "";

  const choiceLabels = [
    { key: "choice_a" as const, label: "A", color: "border-l-red-500" },
    { key: "choice_b" as const, label: "B", color: "border-l-blue-500" },
    { key: "choice_c" as const, label: "C", color: "border-l-yellow-500" },
    { key: "choice_d" as const, label: "D", color: "border-l-green-500" },
  ];

  return (
    <div className="min-h-screen bg-muted-bg">
      <header className="bg-white border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-muted hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold flex-1">{event.title}</h1>
          <Badge variant={statusMap[event.status].variant}>
            {statusMap[event.status].label}
          </Badge>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* QR Code & Room Info */}
        <Card className="text-center">
          <h2 className="text-lg font-bold mb-4">参加用QRコード</h2>
          <div className="inline-block bg-white p-4 rounded-xl border border-border">
            {playUrl && <QRCodeSVG value={playUrl} size={200} />}
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted">ルームコード</p>
            <p className="text-4xl font-black tracking-widest text-primary mt-1">
              {event.room_code}
            </p>
          </div>
          <p className="text-xs text-muted mt-2 break-all">{playUrl}</p>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          {event.status === "draft" && (
            <Button onClick={openLobby}>ロビーを開く</Button>
          )}
          {(event.status === "lobby" || event.status === "active") && (
            <Link href={`/events/${eventId}/host`}>
              <Button>ホスト画面を開く</Button>
            </Link>
          )}
          {event.status === "finished" && (
            <Link href={`/events/${eventId}/results`}>
              <Button>結果を見る</Button>
            </Link>
          )}
          <Button variant="danger" onClick={deleteEvent}>
            削除
          </Button>
        </div>

        {/* Questions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">問題一覧 ({questions.length}問)</h2>
            {event.status === "draft" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(!editing)}
              >
                {editing ? "キャンセル" : "編集"}
              </Button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              {questions.map((q, index) => (
                <Card key={index}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold">問題 {index + 1}</span>
                    {questions.length > 1 && (
                      <button
                        onClick={() =>
                          setQuestions(questions.filter((_, i) => i !== index))
                        }
                        className="text-sm text-danger cursor-pointer"
                      >
                        削除
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <textarea
                      value={q.question_text}
                      onChange={(e) => {
                        const updated = [...questions];
                        updated[index] = {
                          ...updated[index],
                          question_text: e.target.value,
                        };
                        setQuestions(updated);
                      }}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-border text-sm"
                      placeholder="問題文"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      {choiceLabels.map(({ key, label, color }) => (
                        <div key={key} className={`border-l-4 ${color} pl-2`}>
                          <Input
                            label={label}
                            value={q[key]}
                            onChange={(e) => {
                              const updated = [...questions];
                              updated[index] = {
                                ...updated[index],
                                [key]: e.target.value,
                              };
                              setQuestions(updated);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <select
                      value={q.correct_choice}
                      onChange={(e) => {
                        const updated = [...questions];
                        updated[index] = {
                          ...updated[index],
                          correct_choice: e.target.value as Choice,
                        };
                        setQuestions(updated);
                      }}
                      className="px-3 py-2 rounded-lg border border-border text-sm"
                    >
                      <option value="a">正解: A</option>
                      <option value="b">正解: B</option>
                      <option value="c">正解: C</option>
                      <option value="d">正解: D</option>
                    </select>
                  </div>
                </Card>
              ))}
              <button
                onClick={() =>
                  setQuestions([
                    ...questions,
                    {
                      question_text: "",
                      choice_a: "",
                      choice_b: "",
                      choice_c: "",
                      choice_d: "",
                      correct_choice: "a",
                      time_limit_sec: 15,
                      order_index: questions.length,
                    },
                  ])
                }
                className="w-full py-3 border-2 border-dashed border-border rounded-xl text-muted hover:text-primary hover:border-primary transition-colors cursor-pointer"
              >
                + 問題を追加
              </button>
              <Button onClick={handleSaveQuestions} loading={saving} fullWidth>
                保存
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q, index) => (
                <Card key={index} padding="sm">
                  <p className="font-medium text-sm">
                    Q{index + 1}. {q.question_text}
                  </p>
                  <div className="grid grid-cols-2 gap-1 mt-2 text-xs text-muted">
                    <span className={q.correct_choice === "a" ? "text-accent font-bold" : ""}>
                      A: {q.choice_a}
                    </span>
                    <span className={q.correct_choice === "b" ? "text-accent font-bold" : ""}>
                      B: {q.choice_b}
                    </span>
                    <span className={q.correct_choice === "c" ? "text-accent font-bold" : ""}>
                      C: {q.choice_c}
                    </span>
                    <span className={q.correct_choice === "d" ? "text-accent font-bold" : ""}>
                      D: {q.choice_d}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
