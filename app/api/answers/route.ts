import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const { participant_id, question_id, event_id, selected_choice, session_token } = body;

  if (!participant_id || !question_id || !event_id || !selected_choice || !session_token) {
    return NextResponse.json({ error: "必須パラメータが不足しています" }, { status: 400 });
  }

  // Verify participant session
  const { data: participant } = await supabase
    .from("participants")
    .select("id, session_token")
    .eq("id", participant_id)
    .single();

  if (!participant || participant.session_token !== session_token) {
    return NextResponse.json({ error: "無効なセッションです" }, { status: 403 });
  }

  // Get the question to check answer (server-side only)
  const { data: question } = await supabase
    .from("questions")
    .select("correct_choice, time_limit_sec")
    .eq("id", question_id)
    .single();

  if (!question) {
    return NextResponse.json({ error: "問題が見つかりません" }, { status: 404 });
  }

  // Get event to calculate response time from when question was sent
  const { data: event } = await supabase
    .from("events")
    .select("updated_at")
    .eq("id", event_id)
    .single();

  if (!event) {
    return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
  }

  // Calculate response time
  const questionSentAt = new Date(event.updated_at).getTime();
  const now = Date.now();
  const response_time_ms = Math.max(0, now - questionSentAt);
  const timeLimitMs = (question.time_limit_sec || 15) * 1000;

  const is_correct = selected_choice === question.correct_choice;

  // Score calculation: correct + speed bonus (100-1000 points)
  let score = 0;
  if (is_correct) {
    const timeRatio = Math.max(0, 1 - response_time_ms / timeLimitMs);
    score = Math.round(100 + timeRatio * 900);
  }

  const { data: answer, error } = await supabase
    .from("answers")
    .insert({
      participant_id,
      question_id,
      event_id,
      selected_choice,
      is_correct,
      response_time_ms,
      score,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "この問題には既に回答済みです" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    answer_id: answer.id,
    is_correct,
    score,
    response_time_ms,
  });
}
