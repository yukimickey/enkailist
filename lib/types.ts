export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  host_id: string;
  title: string;
  description: string | null;
  room_code: string;
  status: "draft" | "lobby" | "active" | "finished";
  current_question_index: number;
  question_duration_sec: number;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  event_id: string;
  question_text: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  correct_choice: "a" | "b" | "c" | "d";
  order_index: number;
  time_limit_sec: number;
  created_at: string;
}

export interface Participant {
  id: string;
  event_id: string;
  nickname: string;
  session_token: string;
  total_score: number;
  is_active: boolean;
  created_at: string;
}

export interface Answer {
  id: string;
  participant_id: string;
  question_id: string;
  event_id: string;
  selected_choice: "a" | "b" | "c" | "d";
  is_correct: boolean;
  response_time_ms: number;
  score: number;
  created_at: string;
}

export interface AnswerCount {
  id: string;
  question_id: string;
  event_id: string;
  count_a: number;
  count_b: number;
  count_c: number;
  count_d: number;
  total_count: number;
  updated_at: string;
}

export type Choice = "a" | "b" | "c" | "d";

export interface QuestionWithoutAnswer
  extends Omit<Question, "correct_choice"> {}

export interface BroadcastPayload {
  type: "question" | "reveal" | "end" | "start" | "countdown";
  question?: QuestionWithoutAnswer;
  correct_choice?: Choice;
  question_index?: number;
  countdown?: number;
}
