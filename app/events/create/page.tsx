"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Card } from "@/components/ui";
import toast from "react-hot-toast";
import type { Choice } from "@/lib/types";

interface QuestionForm {
  question_text: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  correct_choice: Choice;
  time_limit_sec: number;
}

const emptyQuestion: QuestionForm = {
  question_text: "",
  choice_a: "",
  choice_b: "",
  choice_c: "",
  choice_d: "",
  correct_choice: "a",
  time_limit_sec: 15,
};

export default function CreateEventPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questionDuration, setQuestionDuration] = useState(15);
  const [questions, setQuestions] = useState<QuestionForm[]>([
    { ...emptyQuestion },
  ]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const addQuestion = () => {
    setQuestions([...questions, { ...emptyQuestion }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (
    index: number,
    field: keyof QuestionForm,
    value: string | number
  ) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create event
      const eventRes = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          question_duration_sec: questionDuration,
        }),
      });

      if (!eventRes.ok) {
        const err = await eventRes.json();
        throw new Error(err.error);
      }

      const event = await eventRes.json();

      // Create questions
      const questionsToSave = questions.map((q, i) => ({
        ...q,
        order_index: i,
      }));

      const questionsRes = await fetch(
        `/api/events/${event.id}/questions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(questionsToSave),
        }
      );

      if (!questionsRes.ok) {
        const err = await questionsRes.json();
        throw new Error(err.error);
      }

      toast.success("イベントを作成しました！");
      router.push(`/events/${event.id}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "エラーが発生しました"
      );
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-xl font-bold">新規イベント作成</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event info */}
          <Card>
            <h2 className="text-lg font-bold mb-4">イベント情報</h2>
            <div className="space-y-4">
              <Input
                label="イベントタイトル"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: 忘年会クイズ大会 2026"
                required
              />
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  説明（任意）
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="イベントの説明を入力..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-muted"
                />
              </div>
              <Input
                label="回答制限時間（秒）"
                type="number"
                value={questionDuration}
                onChange={(e) =>
                  setQuestionDuration(parseInt(e.target.value) || 15)
                }
                min={5}
                max={60}
              />
            </div>
          </Card>

          {/* Questions */}
          {questions.map((q, index) => (
            <Card key={index}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">問題 {index + 1}</h2>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(index)}
                    className="text-danger hover:text-danger-hover text-sm cursor-pointer"
                  >
                    削除
                  </button>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    問題文
                  </label>
                  <textarea
                    value={q.question_text}
                    onChange={(e) =>
                      updateQuestion(index, "question_text", e.target.value)
                    }
                    placeholder="問題を入力してください..."
                    rows={2}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-muted"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {choiceLabels.map(({ key, label, color }) => (
                    <div
                      key={key}
                      className={`border-l-4 ${color} pl-3`}
                    >
                      <Input
                        label={`選択肢 ${label}`}
                        value={q[key]}
                        onChange={(e) =>
                          updateQuestion(index, key, e.target.value)
                        }
                        placeholder={`選択肢${label}を入力`}
                        required
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-foreground mb-1">
                      正解
                    </label>
                    <select
                      value={q.correct_choice}
                      onChange={(e) =>
                        updateQuestion(
                          index,
                          "correct_choice",
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-2 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="a">A</option>
                      <option value="b">B</option>
                      <option value="c">C</option>
                      <option value="d">D</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <Input
                      label="制限時間（秒）"
                      type="number"
                      value={q.time_limit_sec}
                      onChange={(e) =>
                        updateQuestion(
                          index,
                          "time_limit_sec",
                          parseInt(e.target.value) || 15
                        )
                      }
                      min={5}
                      max={60}
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}

          <button
            type="button"
            onClick={addQuestion}
            className="w-full py-3 border-2 border-dashed border-border rounded-xl text-muted hover:text-primary hover:border-primary transition-colors cursor-pointer"
          >
            + 問題を追加
          </button>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/dashboard")}
            >
              キャンセル
            </Button>
            <Button type="submit" loading={loading} fullWidth>
              イベントを作成
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
