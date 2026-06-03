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

  // Get first question
  const { data: questions } = await supabase
    .from("questions")
    .select("id, question_text, choice_a, choice_b, choice_c, choice_d, order_index, time_limit_sec")
    .eq("event_id", eventId)
    .order("order_index", { ascending: true });

  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: "問題がありません" }, { status: 400 });
  }

  // Update event status
  await supabase
    .from("events")
    .update({
      status: "active",
      current_question_index: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId);

  // Broadcast first question to all players
  const channel = supabase.channel(`game:${eventId}`);
  await channel.send({
    type: "broadcast",
    event: "game_signal",
    payload: {
      type: "question",
      question: questions[0],
      question_index: 0,
    },
  });

  return NextResponse.json({
    question: questions[0],
    question_index: 0,
    total_questions: questions.length,
  });
}
