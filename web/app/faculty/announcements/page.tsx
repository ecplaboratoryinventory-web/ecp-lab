"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, ChevronDown, ChevronUp, Megaphone } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string | null;
  author_id: string | null;
  target_role: string | null;
  priority: string | null;
  is_active: boolean;
  published_at: string | null;
  created_at: string | null;
}

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-[#eff6ff] text-[#1d4ed8]" },
  normal: { label: "Normal", className: "bg-[#ecfdf5] text-[#065f46]" },
  high: { label: "High", className: "bg-[#fff3cd] text-[#856404]" },
  urgent: { label: "Urgent", className: "bg-[#fef2f2] text-[#991b1b]" },
};

export default function FacultyAnnouncementsPage() {
  const supabase = createClient();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchAnnouncements = useCallback(async () => {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .eq("is_active", true)
      .or("target_role.eq.all,target_role.eq.faculty")
      .order("published_at", { ascending: false });

    setAnnouncements((data as Announcement[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void (async () => {
      await fetchAnnouncements();
    })();
  }, [fetchAnnouncements]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatDate = (date: string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getPriorityBadge = (priority: string | null) => {
    const p = (priority || "normal").toLowerCase();
    const config = PRIORITY_CONFIG[p] || PRIORITY_CONFIG.normal;
    return (
      <span
        className={`inline-block rounded-[10px] px-2.5 py-0.5 text-[0.68rem] font-bold ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="mb-6 rounded-xl border border-[#dde4ec] bg-gradient-to-r from-[#1b2b40] to-[#253348] p-6 shadow-sm">
          <div className="h-7 w-48 animate-pulse rounded bg-white/20" />
          <div className="mt-1 h-4 w-64 animate-pulse rounded bg-white/10" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[#dde4ec] bg-white p-5 shadow-sm">
              <div className="mb-3 h-5 w-3/4 animate-pulse rounded bg-[#e2e8f0]" />
              <div className="mb-2 h-3 w-full animate-pulse rounded bg-[#e2e8f0]" />
              <div className="mb-2 h-3 w-5/6 animate-pulse rounded bg-[#e2e8f0]" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-[#e2e8f0]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header Banner */}
      <div className="mb-6 rounded-xl border border-[#dde4ec] bg-gradient-to-r from-[#1b2b40] to-[#253348] p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-xl font-bold text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal/20 text-[#0ea5a0]">
            <Megaphone className="h-4 w-4" />
          </span>
          Announcements
        </h2>
        <p className="mt-1 text-sm text-white/70">
          Stay updated with the latest news and notices
        </p>
      </div>

      {announcements.length === 0 ? (
        <div className="rounded-xl border border-[#dde4ec] bg-white p-16 text-center shadow-sm">
          <Bell className="mx-auto mb-3 h-10 w-10 text-[#8fa1b3]/40" />
          <p className="text-sm font-medium text-[#8fa1b3]">No announcements yet</p>
          <p className="mt-1 text-xs text-[#8fa1b3]/60">
            Check back later for updates
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {announcements.map((a) => {
            const isExpanded = expanded.has(a.id);
            const priority = (a.priority || "normal").toLowerCase();
            const isHighUrgent = priority === "high" || priority === "urgent";

            return (
              <div
                key={a.id}
                className={`group relative overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:-translate-y-[2px] hover:shadow-md ${
                  isHighUrgent ? "border-l-[3px] border-l-[#f59e0b]" : "border-[#dde4ec]"
                }`}
              >
                {isHighUrgent && (
                  <div
                    className="absolute left-0 top-0 h-full w-[3px]"
                    style={{
                      background: priority === "urgent" ? "#ef4444" : "#f59e0b",
                    }}
                  />
                )}

                <div className="p-5">
                  <div className="mb-2.5 flex items-start justify-between gap-3">
                    <h3 className="text-[0.92rem] font-bold leading-tight text-[#1b2b40]">
                      {a.title}
                    </h3>
                    {getPriorityBadge(a.priority)}
                  </div>

                  <p className="mb-3 text-[0.8rem] leading-relaxed text-[#4a5e74]">
                    {isExpanded || !a.content
                      ? a.content || ""
                      : a.content.length > 150
                        ? a.content.slice(0, 150) + "..."
                        : a.content}
                  </p>

                  <div className="flex items-center justify-between border-t border-[#dde4ec] pt-3">
                    <span className="text-[0.7rem] text-[#8fa1b3]">
                      {formatDate(a.published_at || a.created_at)}
                    </span>

                    {a.content && a.content.length > 150 && (
                      <button
                        onClick={() => toggleExpand(a.id)}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-[0.72rem] font-semibold text-[#0ea5a0] transition-colors hover:bg-[#e0f7f6]"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-3.5 w-3.5" /> Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3.5 w-3.5" /> Read more
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
