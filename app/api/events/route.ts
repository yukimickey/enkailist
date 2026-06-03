import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, question_duration_sec } = body;

  if (!title) {
    return NextResponse.json({ error: "タイトルは必須です" }, { status: 400 });
  }

  // Generate room code
  const { data: roomCode } = await supabase.rpc("generate_room_code");

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      host_id: user.id,
      title,
      description: description || null,
      room_code: roomCode,
      question_duration_sec: question_duration_sec || 15,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(event, { status: 201 });
}
