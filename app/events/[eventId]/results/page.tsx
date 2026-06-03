import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .eq("host_id", user.id)
    .single();

  if (!event) redirect("/dashboard");

  // Get participants ranked by score
  const { data: participants } = await supabase
    .from("participants")
    .select("*")
    .eq("event_id", eventId)
    .order("total_score", { ascending: false });

  // Get questions
  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("event_id", eventId)
    .order("order_index", { ascending: true });

  // Get answer counts for each question
  const { data: answerCounts } = await supabase
    .from("answer_counts")
    .select("*")
    .eq("event_id", eventId);

  const countsMap = new Map(
    (answerCounts || []).map((ac) => [ac.question_id, ac])
  );

  return (
    <div className="min-h-screen bg-muted-bg">
      <header className="bg-white border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href={`/events/${eventId}`}
            className="text-muted hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold">結果: {event.title}</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Final Ranking */}
        <section>
          <h2 className="text-lg font-bold mb-4">最終ランキング</h2>
          <div className="space-y-2">
            {(participants || []).map((p, index) => (
              <Card key={p.id} padding="sm">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                      index === 0
                        ? "bg-yellow-500"
                        : index === 1
                        ? "bg-gray-400"
                        : index === 2
                        ? "bg-orange-600"
                        : "bg-gray-300"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="flex-1 font-medium">{p.nickname}</span>
                  <span className="font-bold text-primary">
                    {p.total_score.toLocaleString()}pt
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Question-by-question results */}
        <section>
          <h2 className="text-lg font-bold mb-4">問題別結果</h2>
          <div className="space-y-4">
            {(questions || []).map((q, index) => {
              const counts = countsMap.get(q.id);
              const total = counts?.total_count || 0;
              const correctCount = counts
                ? (counts[`count_${q.correct_choice}` as keyof typeof counts] as number)
                : 0;
              const correctRate =
                total > 0 ? Math.round((correctCount / total) * 100) : 0;

              return (
                <Card key={q.id}>
                  <p className="text-sm text-muted mb-1">
                    Q{index + 1} (正答率: {correctRate}%)
                  </p>
                  <p className="font-medium mb-2">{q.question_text}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {(["a", "b", "c", "d"] as const).map((choice) => {
                      const count = counts
                        ? (counts[`count_${choice}` as keyof typeof counts] as number)
                        : 0;
                      return (
                        <div
                          key={choice}
                          className={`px-3 py-2 rounded-lg ${
                            choice === q.correct_choice
                              ? "bg-green-100 text-green-800 font-bold"
                              : "bg-muted-bg text-muted"
                          }`}
                        >
                          {choice.toUpperCase()}:{" "}
                          {q[`choice_${choice}` as keyof typeof q]} ({count}人)
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
