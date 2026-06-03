import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .eq("host_id", user.id)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Get current question with correct answer
  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("event_id", eventId)
    .order("order_index", { ascending: true });

  if (!questions || event.current_question_index >= questions.length) {
    return NextResponse.json({ error: "No current question" }, { status: 400 });
  }

  const currentQuestion = questions[event.current_question_index];

  // Get answer counts
  const { data: answerCounts } = await supabase
    .from("answer_counts")
    .select("*")
    .eq("question_id", currentQuestion.id)
    .single();

  // Get leaderboard
  const { data: leaderboard } = await supabase
    .from("participants")
    .select("id, nickname, total_score")
    .eq("event_id", eventId)
    .eq("is_active", true)
    .order("total_score", { ascending: false })
    .limit(10);

  // Broadcast correct answer
  const channel = supabase.channel(`game:${eventId}`);
  await channel.send({
    type: "broadcast",
    event: "game_signal",
    payload: {
      type: "reveal",
      correct_choice: currentQuestion.correct_choice,
      question_index: event.current_question_index,
    },
  });

  return NextResponse.json({
    correct_choice: currentQuestion.correct_choice,
    answer_counts: answerCounts || {
      count_a: 0,
      count_b: 0,
      count_c: 0,
      count_d: 0,
      total_count: 0,
    },
    leaderboard: leaderboard || [],
  });
}
