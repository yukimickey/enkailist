import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui";
import { LogoutButton } from "./LogoutButton";
import type { Event } from "@/lib/types";

const statusLabels: Record<Event["status"], { label: string; variant: "default" | "info" | "success" | "warning" }> = {
  draft: { label: "下書き", variant: "default" },
  lobby: { label: "ロビー", variant: "info" },
  active: { label: "進行中", variant: "success" },
  finished: { label: "終了", variant: "warning" },
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("host_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-muted-bg">
      <header className="bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-black text-primary">
            エンカイリスト
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">イベント一覧</h1>
          <Link
            href="/events/create"
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-primary-hover transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規作成
          </Link>
        </div>

        {!events || events.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-muted text-lg mb-4">まだイベントがありません</p>
            <Link
              href="/events/create"
              className="text-primary hover:underline font-medium"
            >
              最初のクイズイベントを作成しましょう
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event: Event) => {
              const status = statusLabels[event.status];
              return (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <Card hoverable className="h-full">
                    <div className="flex items-start justify-between mb-2">
                      <h2 className="font-bold text-lg line-clamp-1">
                        {event.title}
                      </h2>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    {event.description && (
                      <p className="text-sm text-muted line-clamp-2 mb-3">
                        {event.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm text-muted">
                      <span>コード: {event.room_code}</span>
                      <span>
                        {new Date(event.created_at).toLocaleDateString("ja-JP")}
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
