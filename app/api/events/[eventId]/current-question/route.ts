import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const supabase = await createClient();

  const { searchParams } = new URL(request.url);
  const participantId = searchParams.get("participant_id");

  // Get event
  const { data: event } = await supabase
    .from("events")
    .select("status, current_question_index")
    .eq("id", eventId)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (event.status === "finished") {
    return NextResponse.json({ phase: "finished" });
  }

  if (event.status !== "active" || event.current_question_index < 0) {
    return NextResponse.json({ phase: "waiting" });
  }

  // Get current question (without correct_choice)
  const { data: questions } = await supabase
    .from("questions")
    .select("id, event_id, question_text, choice_a, choice_b, choice_c, choice_d, order_index, time_limit_sec, created_at")
    .eq("event_id", eventId)
    .order("order_index", { ascending: true });

  if (!questions || !questions[event.current_question_index]) {
    return NextResponse.json({ phase: "waiting" });
  }

  const question = questions[event.current_question_index];

  // Check if participant already answered
  if (participantId) {
    const { data: existingAnswer } = await supabase
      .from("answers")
      .select("id, is_correct, score, selected_choice")
      .eq("participant_id", participantId)
      .eq("question_id", question.id)
      .single();

    if (existingAnswer) {
      return NextResponse.json({
        phase: "answered",
        question,
        question_index: event.current_question_index,
        answer: existingAnswer,
      });
    }
  }

  return NextResponse.json({
    phase: "question",
    question,
    question_index: event.current_question_index,
  });
}
