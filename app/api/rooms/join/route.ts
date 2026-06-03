import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const { room_code, nickname } = body;

  if (!room_code || !nickname) {
    return NextResponse.json(
      { error: "ルームコードとニックネームは必須です" },
      { status: 400 }
    );
  }

  // Find event by room code
  const { data: event } = await supabase
    .from("events")
    .select("id, status")
    .eq("room_code", room_code)
    .single();

  if (!event) {
    return NextResponse.json(
      { error: "ルームが見つかりません" },
      { status: 404 }
    );
  }

  if (event.status !== "lobby" && event.status !== "active") {
    return NextResponse.json(
      { error: "このルームは現在参加できません" },
      { status: 400 }
    );
  }

  // Generate session token
  const session_token = crypto.randomUUID();

  // Create participant
  const { data: participant, error } = await supabase
    .from("participants")
    .insert({
      event_id: event.id,
      nickname,
      session_token,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "そのニックネームは既に使われています" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      participant_id: participant.id,
      session_token: participant.session_token,
      event_id: event.id,
      event_status: event.status,
    },
    { status: 201 }
  );
}
