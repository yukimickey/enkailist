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

  const nextIndex = event.current_question_index + 1;

  // Get all questions
  const { data: questions } = await supabase
    .from("questions")
    .select("id, question_text, choice_a, choice_b, choice_c, choice_d, order_index, time_limit_sec")
    .eq("event_id", eventId)
    .order("order_index", { ascending: true });

  if (!questions || nextIndex >= questions.length) {
    // No more questions - end game
    await supabase
      .from("events")
      .update({ status: "finished", updated_at: new Date().toISOString() })
      .eq("id", eventId);

    const channel = supabase.channel(`game:${eventId}`);
    await channel.send({
      type: "broadcast",
      event: "game_signal",
      payload: { type: "end" },
    });

    return NextResponse.json({ finished: true });
  }

  // Update event
  await supabase
    .from("events")
    .update({
      current_question_index: nextIndex,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId);

  // Broadcast next question
  const channel = supabase.channel(`game:${eventId}`);
  await channel.send({
    type: "broadcast",
    event: "game_signal",
    payload: {
      type: "question",
      question: questions[nextIndex],
      question_index: nextIndex,
    },
  });

  return NextResponse.json({
    question: questions[nextIndex],
    question_index: nextIndex,
    total_questions: questions.length,
  });
}
