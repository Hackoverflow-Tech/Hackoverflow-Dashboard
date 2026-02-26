"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { verifyDbPassword } from "@/actions/database";

interface HackathonData { [key: string]: unknown }
interface Meta { updatedAt: string | null; updatedBy: string | null; version: number }
interface HistoryEntry { version: number; savedAt: string; savedBy: string; [key: string]: unknown }

type LogType = "ai_mention" | "prefix_command" | "scheduled" | "error" | "all";

interface BotLog {
  _id: string;
  type:       LogType;
  event:      string;
  userId?:    string;
  username?:  string;
  channelId?: string;
  detail?:    string;
  success:    boolean;
  durationMs?: number;
  timestamp:  string;
}

interface LogSummary {
  ai_mention?:      { total: number; errors: number; avgMs: number };
  prefix_command?:  { total: number; errors: number; avgMs: number };
  scheduled?:       { total: number; errors: number; avgMs: number };
  error?:           { total: number; errors: number; avgMs: number };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  ai_mention:     { label: "AI",        color: "#a78bfa", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.25)" },
  prefix_command: { label: "CMD",       color: "#60a5fa", bg: "rgba(96,165,250,0.08)",  border: "rgba(96,165,250,0.25)"  },
  scheduled:      { label: "CRON",      color: "#f6ad55", bg: "rgba(246,173,85,0.08)",  border: "rgba(246,173,85,0.25)"  },
  error:          { label: "ERR",       color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.25)" },
};

function typeMeta(type: string, success: boolean) {
  if (!success) return TYPE_META.error;
  return TYPE_META[type] ?? TYPE_META.error;
}

function relTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 5)   return "just now";
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

// ─── Field Editor ─────────────────────────────────────────────────────────────

function FieldEditor({
  keyName, value, onChange, depth = 0,
}: {
  keyName: string; value: unknown; onChange: (v: unknown) => void; depth?: number;
}) {
  const [open, setOpen] = useState(depth < 2);

  if (typeof value === "object" && !Array.isArray(value) && value !== null) {
    const obj = value as Record<string, unknown>;
    return (
      <div style={{ marginBottom: "0.5rem" }}>
        <button onClick={() => setOpen(!open)} style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          background: "transparent", border: "none", color: "rgba(255,255,255,0.9)",
          fontFamily: "monospace", fontSize: "0.875rem", fontWeight: "bold",
          cursor: "pointer", padding: "0.25rem 0", letterSpacing: "0.05em",
        }}>
          <span style={{ opacity: 0.4, fontSize: "0.75rem" }}>{open ? "▼" : "▶"}</span>
          {keyName.toUpperCase()}
          <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: "normal", fontSize: "0.75rem" }}>
            {Object.keys(obj).length} fields
          </span>
        </button>
        {open && (
          <div style={{ paddingLeft: "1.25rem", borderLeft: "1px solid rgba(255,255,255,0.1)", marginLeft: "0.25rem", marginTop: "0.25rem" }}>
            {Object.entries(obj).map(([k, v]) => (
              <FieldEditor key={k} keyName={k} value={v} depth={depth + 1}
                onChange={(nv) => onChange({ ...obj, [k]: nv })} />
            ))}
          </div>
        )}
      </div>
    );
  }
  if (Array.isArray(value)) {
    return (
      <div style={{ marginBottom: "0.5rem" }}>
        <button onClick={() => setOpen(!open)} style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          background: "transparent", border: "none", color: "rgba(255,255,255,0.6)",
          fontFamily: "monospace", fontSize: "0.875rem", fontWeight: "bold",
          cursor: "pointer", padding: "0.25rem 0", letterSpacing: "0.05em",
        }}>
          <span style={{ opacity: 0.4, fontSize: "0.75rem" }}>{open ? "▼" : "▶"}</span>
          {keyName.toUpperCase()}
          <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: "normal", fontSize: "0.75rem" }}>
            [{value.length} items]
          </span>
        </button>
        {open && (
          <div style={{ paddingLeft: "1.25rem", borderLeft: "1px solid rgba(255,255,255,0.1)", marginLeft: "0.25rem", marginTop: "0.25rem" }}>
            {value.map((item, i) => (
              <FieldEditor key={i} keyName={`[${i}]`} value={item} depth={depth + 1}
                onChange={(nv) => { const arr = [...value]; arr[i] = nv; onChange(arr); }} />
            ))}
            <button onClick={() => onChange([...value, ""])} style={{
              background: "transparent", border: "1px dashed rgba(255,255,255,0.2)",
              color: "rgba(255,255,255,0.4)", fontFamily: "monospace", fontSize: "0.75rem",
              cursor: "pointer", padding: "0.25rem 0.75rem", marginTop: "0.5rem", letterSpacing: "0.05em",
            }}>+ ADD ITEM</button>
          </div>
        )}
      </div>
    );
  }
  if (typeof value === "boolean") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.4rem 0" }}>
        <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", minWidth: "180px", letterSpacing: "0.05em" }}>
          {keyName.toUpperCase()}
        </span>
        <button onClick={() => onChange(!value)} style={{
          padding: "0.25rem 0.75rem",
          border: `1px solid ${value ? "rgba(74,222,128,0.4)" : "rgba(248,113,113,0.4)"}`,
          backgroundColor: value ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
          color: value ? "#4ade80" : "#f87171",
          fontFamily: "monospace", fontSize: "0.75rem", cursor: "pointer", letterSpacing: "0.05em",
        }}>
          {value ? "TRUE" : "FALSE"}
        </button>
      </div>
    );
  }
  const long = typeof value === "string" && value.length > 80;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", padding: "0.4rem 0" }}>
      <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", minWidth: "180px", flexShrink: 0, paddingTop: "0.4rem", letterSpacing: "0.05em" }}>
        {keyName.toUpperCase()}
      </span>
      {long ? (
        <textarea value={String(value)} onChange={e => onChange(e.target.value)}
          style={{ flex: 1, backgroundColor: "transparent", border: "1px solid rgba(255,255,255,0.2)", padding: "0.4rem 0.5rem", color: "#fff", fontFamily: "monospace", fontSize: "0.875rem", resize: "vertical", minHeight: "72px" }}
          onFocus={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"}
          onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"} />
      ) : (
        <input type="text" value={String(value ?? "")}
          onChange={e => { const v = e.target.value; onChange(typeof value === "number" && !isNaN(Number(v)) ? Number(v) : v); }}
          style={{ flex: 1, backgroundColor: "transparent", border: "1px solid rgba(255,255,255,0.2)", padding: "0.4rem 0.5rem", color: "#fff", fontFamily: "monospace", fontSize: "0.875rem", boxSizing: "border-box" as const }}
          onFocus={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"}
          onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"} />
      )}
    </div>
  );
}

// ─── History Modal ────────────────────────────────────────────────────────────

function HistoryModal({ onClose }: { onClose: () => void }) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/bot-config/history").then(r => r.json())
      .then(j => { setHistory(j.history ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.7)" }}>
      <div style={{ backgroundColor: "#000", border: "1px solid rgba(255,255,255,0.2)", width: "100%", maxWidth: "480px", margin: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <span style={{ fontFamily: "monospace", fontSize: "0.875rem", letterSpacing: "0.05em" }}>VERSION HISTORY</span>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontFamily: "monospace", fontSize: "1rem" }}>✕</button>
        </div>
        <div style={{ padding: "1rem", maxHeight: "400px", overflowY: "auto" }}>
          {loading && <div style={{ fontFamily: "monospace", fontSize: "0.875rem", color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "2rem 0" }}>Loading...</div>}
          {!loading && history.length === 0 && <div style={{ fontFamily: "monospace", fontSize: "0.875rem", color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "2rem 0" }}>No history yet.</div>}
          {history.map((h, i) => (
            <div key={i} style={{ border: "1px solid rgba(255,255,255,0.1)", padding: "0.75rem 1rem", marginBottom: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "monospace", fontSize: "0.875rem", fontWeight: "bold" }}>v{h.version}</span>
                <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>{new Date(h.savedAt).toLocaleString()}</span>
              </div>
              {h.savedBy && h.savedBy !== "unknown" && (
                <div style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: "0.25rem" }}>by {h.savedBy}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Seed Modal ───────────────────────────────────────────────────────────────

function SeedModal({ onClose, onSeeded }: { onClose: () => void; onSeeded: () => void }) {
  const [raw, setRaw]       = useState('{\n  \n}');
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);
  const handleSeed = async () => {
    try {
      const parsed = JSON.parse(raw);
      setSaving(true);
      const res = await fetch("/api/bot-config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      onSeeded();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid JSON");
      setSaving(false);
    }
  };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.7)" }}>
      <div style={{ backgroundColor: "#000", border: "1px solid rgba(255,255,255,0.2)", width: "100%", maxWidth: "640px", margin: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <span style={{ fontFamily: "monospace", fontSize: "0.875rem", letterSpacing: "0.05em" }}>SEED INITIAL CONFIG</span>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontFamily: "monospace", fontSize: "1rem" }}>✕</button>
        </div>
        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {error && <div style={{ border: "1px solid rgba(248,113,113,0.4)", backgroundColor: "rgba(248,113,113,0.1)", padding: "0.75rem 1rem", fontFamily: "monospace", fontSize: "0.875rem", color: "#f87171" }}>{error}</div>}
          <textarea value={raw} onChange={e => setRaw(e.target.value)} spellCheck={false}
            style={{ width: "100%", height: "256px", boxSizing: "border-box", backgroundColor: "transparent", border: "1px solid rgba(255,255,255,0.2)", padding: "1rem", color: "#fff", fontFamily: "monospace", fontSize: "0.875rem", resize: "none" }} />
          <button onClick={handleSeed} disabled={saving}
            style={{ width: "100%", padding: "0.875rem", backgroundColor: saving ? "rgba(255,255,255,0.1)" : "#fff", border: "none", color: saving ? "rgba(255,255,255,0.4)" : "#000", fontFamily: "monospace", fontSize: "0.875rem", fontWeight: "bold", cursor: saving ? "not-allowed" : "pointer", letterSpacing: "0.05em" }}>
            {saving ? "SEEDING..." : "SEED DATABASE"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Bot Status ────────────────────────────────────────────────────────────────

interface BotStatus {
  online:     boolean;
  lastSeen:   string | null;
  tag:        string | null;
  ping:       number | null;
  guildCount: number | null;
  startedAt:  string | null;
  staleMs?:   number;
}

// ─── Live Log Feed ─────────────────────────────────────────────────────────────

function LiveLogFeed() {
  const [logs, setLogs]           = useState<BotLog[]>([]);
  const [summary, setSummary]     = useState<LogSummary>({});
  const [filter, setFilter]       = useState<LogType | "all">("all");
  const [paused, setPaused]       = useState(false);
  const [loading, setLoading]     = useState(true);
  const [newCount, setNewCount]   = useState(0);
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const latestRef                 = useRef<string | null>(null);
  const intervalRef               = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusRef                 = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedRef                   = useRef<HTMLDivElement>(null);
  const [tick, setTick]           = useState(0);

  const fetchStatus = useCallback(async () => {
    try {
      const res  = await fetch("/api/bot-config/status");
      const json = await res.json();
      if (res.ok) setBotStatus(json);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchStatus();
    statusRef.current = setInterval(fetchStatus, 15_000);
    return () => { if (statusRef.current) clearInterval(statusRef.current); };
  }, [fetchStatus]);

  const fetchLogs = useCallback(async (isPolling = false) => {
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (filter !== "all") params.set("type", filter);
      if (isPolling && latestRef.current) params.set("since", latestRef.current);

      const res  = await fetch(`/api/bot-config/logs?${params}`);
      const json = await res.json();
      if (!res.ok) return;

      const incoming: BotLog[] = json.logs ?? [];
      setSummary(json.summary ?? {});

      if (isPolling && latestRef.current) {
        if (incoming.length > 0) {
          setNewCount(c => c + incoming.length);
          setLogs(prev => [...incoming, ...prev].slice(0, 200));
          latestRef.current = incoming[0].timestamp;
        }
      } else {
        setLogs(incoming);
        latestRef.current = incoming[0]?.timestamp ?? null;
        setLoading(false);
      }
    } catch { /* silent */ }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    setNewCount(0);
    fetchLogs(false);
  }, [fetchLogs]);

  useEffect(() => {
    if (paused) { if (intervalRef.current) clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => fetchLogs(true), 8000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [paused, fetchLogs]);

  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);
  void tick;

  const totalErrors = Object.values(summary).reduce((a, v) => a + (v?.errors ?? 0), 0);
  const totalEvents = Object.values(summary).reduce((a, v) => a + (v?.total  ?? 0), 0);

  const isOnline   = botStatus?.online ?? false;
  const statusUnknown = botStatus === null;
  const dotColor   = statusUnknown ? "rgba(255,255,255,0.2)" : isOnline ? "#4ade80" : "#f87171";
  const dotShadow  = isOnline ? "0 0 0 2px rgba(74,222,128,0.25)" : "none";
  const statusText = statusUnknown ? "CHECKING..." : isOnline ? "ONLINE" : "OFFLINE";
  const statusTextColor = statusUnknown ? "rgba(255,255,255,0.3)" : isOnline ? "#4ade80" : "#f87171";

  const pillBtn = (label: string, val: LogType | "all", color: string) => (
    <button
      key={val}
      onClick={() => setFilter(val)}
      style={{
        fontFamily: "monospace", fontSize: "0.68rem", padding: "0.3rem 0.7rem",
        cursor: "pointer", letterSpacing: "0.07em", border: "1px solid",
        borderColor: filter === val ? color : "rgba(255,255,255,0.12)",
        backgroundColor: filter === val ? `${color}18` : "transparent",
        color: filter === val ? color : "rgba(255,255,255,0.35)",
        transition: "all 0.15s",
      }}
    >{label}</button>
  );

  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column" }}>

      {/* ── Bot status strip ── */}
      <div style={{
        padding: "0.75rem 1.25rem",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: "0.75rem",
        backgroundColor: isOnline ? "rgba(74,222,128,0.04)" : statusUnknown ? "transparent" : "rgba(248,113,113,0.04)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
            <span style={{
              display: "inline-block", width: 8, height: 8, borderRadius: "50%",
              backgroundColor: dotColor,
              boxShadow: dotShadow,
              animation: isOnline ? "bc-pulse 2s ease-in-out infinite" : "none",
              flexShrink: 0,
            }} />
            <span style={{ fontFamily: "monospace", fontSize: "0.72rem", fontWeight: 700, color: statusTextColor, letterSpacing: "0.08em" }}>
              {statusText}
            </span>
          </span>

          {botStatus?.tag && (
            <span style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>
              {botStatus.tag}
            </span>
          )}

          {botStatus?.ping != null && isOnline && (
            <span style={{ fontFamily: "monospace", fontSize: "0.68rem", color: "rgba(255,255,255,0.3)" }}>
              <span style={{ color: "rgba(255,255,255,0.18)" }}>ping</span>{" "}
              <span style={{ color: botStatus.ping < 100 ? "#4ade80" : botStatus.ping < 300 ? "#f6ad55" : "#f87171" }}>
                {botStatus.ping}ms
              </span>
            </span>
          )}

          {botStatus?.guildCount != null && isOnline && (
            <span style={{ fontFamily: "monospace", fontSize: "0.68rem", color: "rgba(255,255,255,0.3)" }}>
              <span style={{ color: "rgba(255,255,255,0.18)" }}>servers</span> {botStatus.guildCount}
            </span>
          )}

          {botStatus?.startedAt && isOnline && (
            <span style={{ fontFamily: "monospace", fontSize: "0.68rem", color: "rgba(255,255,255,0.3)" }}>
              <span style={{ color: "rgba(255,255,255,0.18)" }}>up since</span>{" "}
              {new Date(botStatus.startedAt).toLocaleString()}
            </span>
          )}

          {botStatus?.lastSeen && !isOnline && (
            <span style={{ fontFamily: "monospace", fontSize: "0.68rem", color: "#f87171", opacity: 0.7 }}>
              last seen {relTime(botStatus.lastSeen)}
            </span>
          )}
        </div>

        <span style={{ fontFamily: "monospace", fontSize: "0.62rem", color: "rgba(255,255,255,0.18)" }}>
          checked every 15s
        </span>
      </div>

      {/* ── Header bar ── */}
      <div style={{
        padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontFamily: "monospace", fontSize: "0.7rem", color: paused ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.5)" }}>
            <span style={{
              display: "inline-block", width: 6, height: 6, borderRadius: "50%",
              backgroundColor: paused ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.4)",
            }} />
            {paused ? "PAUSED" : "POLLING"}
          </span>
          <span style={{ fontFamily: "monospace", fontSize: "0.75rem", letterSpacing: "0.1em", color: "rgba(255,255,255,0.55)" }}>
            BOT LOGS
          </span>
          {newCount > 0 && (
            <span style={{
              fontFamily: "monospace", fontSize: "0.62rem", padding: "0.15rem 0.5rem",
              backgroundColor: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)",
              color: "#4ade80", cursor: "pointer",
            }} onClick={() => { setNewCount(0); feedRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }}>
              +{newCount} new ↑
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "monospace", fontSize: "0.68rem", color: "rgba(255,255,255,0.25)", marginRight: "0.25rem" }}>
            {totalEvents} total · {totalErrors > 0 ? <span style={{ color: "#f87171" }}>{totalErrors} errors</span> : "0 errors"}
          </span>

          {pillBtn("ALL",  "all",            "#fff"    )}
          {pillBtn("AI",   "ai_mention",     "#a78bfa" )}
          {pillBtn("CMD",  "prefix_command", "#60a5fa" )}
          {pillBtn("CRON", "scheduled",      "#f6ad55" )}
          {pillBtn("ERR",  "error",          "#f87171" )}

          <button
            onClick={() => setPaused(p => !p)}
            style={{
              fontFamily: "monospace", fontSize: "0.68rem", padding: "0.3rem 0.7rem",
              cursor: "pointer", letterSpacing: "0.07em",
              border: "1px solid rgba(255,255,255,0.15)",
              backgroundColor: paused ? "rgba(255,255,255,0.08)" : "transparent",
              color: "rgba(255,255,255,0.45)",
            }}
          >{paused ? "▶ RESUME" : "⏸ PAUSE"}</button>

          <button
            onClick={() => { setLoading(true); setNewCount(0); fetchLogs(false); fetchStatus(); }}
            style={{
              fontFamily: "monospace", fontSize: "0.68rem", padding: "0.3rem 0.7rem",
              cursor: "pointer", letterSpacing: "0.07em",
              border: "1px solid rgba(255,255,255,0.12)",
              backgroundColor: "transparent", color: "rgba(255,255,255,0.35)",
            }}
          >↻ REFRESH</button>
        </div>
      </div>

      {/* ── Summary strip ── */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        {(["ai_mention", "prefix_command", "scheduled", "error"] as const).map((t, i) => {
          const m   = TYPE_META[t];
          const s   = summary[t];
          return (
            <div key={t} style={{
              padding: "0.6rem 1rem",
              borderRight: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none",
              cursor: "pointer",
              backgroundColor: filter === t ? `${m.color}08` : "transparent",
            }} onClick={() => setFilter(filter === t ? "all" : t)}>
              <div style={{ fontFamily: "monospace", fontSize: "0.6rem", color: m.color, letterSpacing: "0.1em", marginBottom: "0.2rem" }}>{m.label}</div>
              <div style={{ fontFamily: "monospace", fontSize: "1rem", fontWeight: 900, color: "#fff" }}>{s?.total ?? 0}</div>
              {s && s.errors > 0 && (
                <div style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "#f87171", marginTop: "0.1rem" }}>{s.errors} failed</div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Log entries ── */}
      <div
        ref={feedRef}
        style={{ maxHeight: "520px", overflowY: "auto", fontFamily: "monospace", fontSize: "0.78rem" }}
      >
        {loading && (
          <div style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
            Loading logs…
          </div>
        )}
        {!loading && logs.length === 0 && (
          <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.25)" }}>
            No logs yet. Once the bot starts handling commands, events will appear here.
          </div>
        )}
        {logs.map((log) => {
          const m    = typeMeta(log.type, log.success);
          const isEx = expanded === log._id;
          return (
            <div
              key={log._id}
              onClick={() => setExpanded(isEx ? null : log._id)}
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                padding: "0.6rem 1.25rem",
                cursor: "pointer",
                backgroundColor: isEx ? "rgba(255,255,255,0.03)" : "transparent",
                transition: "background 0.1s",
              }}
              onMouseEnter={e => { if (!isEx) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.02)"; }}
              onMouseLeave={e => { if (!isEx) e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <span style={{
                  fontSize: "0.6rem", padding: "0.15rem 0.45rem", letterSpacing: "0.09em", fontWeight: 700,
                  color: m.color, backgroundColor: m.bg, border: `1px solid ${m.border}`,
                  flexShrink: 0,
                }}>
                  {m.label}
                </span>

                <span style={{ color: log.success ? "#4ade80" : "#f87171", flexShrink: 0, fontSize: "0.7rem" }}>
                  {log.success ? "●" : "✗"}
                </span>

                <span style={{ color: "#fff", fontWeight: 600, flexShrink: 0 }}>
                  {log.event}
                </span>

                {log.username && (
                  <span style={{ color: "rgba(255,255,255,0.35)", flexShrink: 0 }}>
                    @{log.username}
                  </span>
                )}

                {log.detail && !isEx && (
                  <span style={{ color: "rgba(255,255,255,0.28)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "280px" }}>
                    {log.detail}
                  </span>
                )}

                <span style={{ marginLeft: "auto", display: "flex", gap: "0.75rem", alignItems: "center", flexShrink: 0 }}>
                  {log.durationMs != null && (
                    <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.65rem" }}>
                      {log.durationMs}ms
                    </span>
                  )}
                  <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.65rem", minWidth: "58px", textAlign: "right" }}>
                    {relTime(log.timestamp)}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.6rem" }}>
                    {isEx ? "▲" : "▼"}
                  </span>
                </span>
              </div>

              {isEx && (
                <div style={{
                  marginTop: "0.6rem", padding: "0.75rem",
                  backgroundColor: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.07)",
                  display: "flex", flexDirection: "column", gap: "0.35rem",
                }}>
                  {log.detail && (
                    <div>
                      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.65rem", marginRight: "0.5rem" }}>
                        {log.success ? "DETAIL" : "ERROR"}
                      </span>
                      <span style={{ color: log.success ? "rgba(255,255,255,0.75)" : "#f87171" }}>
                        {log.detail}
                      </span>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
                    {log.channelId && (
                      <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.65rem" }}>
                        <span style={{ color: "rgba(255,255,255,0.15)" }}>channel</span> #{log.channelId}
                      </span>
                    )}
                    {log.userId && (
                      <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.65rem" }}>
                        <span style={{ color: "rgba(255,255,255,0.15)" }}>uid</span> {log.userId}
                      </span>
                    )}
                    <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.65rem" }}>
                      <span style={{ color: "rgba(255,255,255,0.15)" }}>time</span>{" "}
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                    {log.durationMs != null && (
                      <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.65rem" }}>
                        <span style={{ color: "rgba(255,255,255,0.15)" }}>took</span> {log.durationMs}ms
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Footer ── */}
      <div style={{
        padding: "0.6rem 1.25rem",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        fontFamily: "monospace", fontSize: "0.65rem", color: "rgba(255,255,255,0.2)",
        display: "flex", justifyContent: "space-between",
      }}>
        <span>Showing {logs.length} entries · auto-refreshes every 8s</span>
        <span>Click any row to expand</span>
      </div>
    </div>
  );
}

// ─── Lock Screen ──────────────────────────────────────────────────────────────

function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [pw, setPw]             = useState("");
  const [loading, setLoading]   = useState(false);
  const [shake, setShake]       = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (!pw.trim() || loading) return;
    setLoading(true);
    const ok = await verifyDbPassword(pw);
    setLoading(false);
    if (ok) {
      onUnlock();
    } else {
      setAttempts(a => a + 1);
      setShake(true);
      setTimeout(() => setShake(false), 450);
      setPw("");
      setErrorMsg("Incorrect password");
      inputRef.current?.focus();
    }
  };

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" style={{ display: "block", margin: "0 auto 1rem" }}>
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.04em", marginBottom: "0.35rem" }}>BOT CONFIG</h1>
          <p style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "rgba(255,255,255,0.32)" }}>This area is restricted. Enter the password to continue.</p>
        </div>
        <div className={shake ? "bc-shake" : ""} style={{ border: "1px solid rgba(255,255,255,0.09)", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <div style={{ fontFamily: "monospace", fontSize: "0.63rem", letterSpacing: "0.14em", color: "rgba(255,255,255,0.3)", marginBottom: "0.6rem" }}>PASSWORD</div>
            <input ref={inputRef} type="password" placeholder="Enter password" value={pw}
              onChange={e => { setPw(e.target.value); setErrorMsg(""); }}
              onKeyDown={e => e.key === "Enter" && submit()}
              autoFocus
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.14)", color: "#fff", fontFamily: "monospace", fontSize: "0.875rem", padding: "0.7rem 1rem", width: "100%", outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.38)"}
              onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"} />
          </div>
          {errorMsg && <div style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#f87171" }}>✗ {errorMsg}{attempts > 1 ? ` (${attempts} attempts)` : ""}</div>}
          <button onClick={submit} disabled={!pw.trim() || loading}
            style={{ padding: "0.875rem", backgroundColor: !pw.trim() || loading ? "rgba(255,255,255,0.1)" : "#fff", border: "none", color: !pw.trim() || loading ? "rgba(255,255,255,0.4)" : "#000", fontFamily: "monospace", fontSize: "0.875rem", fontWeight: "bold", cursor: !pw.trim() || loading ? "not-allowed" : "pointer", letterSpacing: "0.05em", width: "100%" }}>
            {loading ? "VERIFYING…" : "→ UNLOCK"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function BotConfigPage() {
  const [unlocked, setUnlocked] = useState(false);
  return (
    <>
      <style>{`
        .bc-page { padding: 3rem; }
        @media (max-width: 640px) { .bc-page { padding: 1.25rem; padding-top: calc(60px + 1.25rem); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bc-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 60%{transform:translateX(8px)} 80%{transform:translateX(-4px)} }
        .bc-shake { animation: bc-shake .4s ease; }
        @keyframes bc-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
      <div className="bc-page">
        {unlocked
          ? <BotConfigEditor onLock={() => setUnlocked(false)} />
          : <LockScreen onUnlock={() => setUnlocked(true)} />}
      </div>
    </>
  );
}

// ─── Config Editor + Log Feed ─────────────────────────────────────────────────

function BotConfigEditor({ onLock }: { onLock: () => void }) {
  const [data, setData]             = useState<HackathonData | null>(null);
  const [meta, setMeta]             = useState<Meta | null>(null);
  const [rawJson, setRawJson]       = useState("");
  const [mode, setMode]             = useState<"visual" | "raw">("visual");
  const [pageStatus, setPageStatus] = useState<"loading" | "idle" | "saving" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg]     = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [jsonError, setJsonError]   = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [showSeed, setShowSeed]     = useState(false);
  const [notFound, setNotFound]     = useState(false);

  const fetchData = useCallback(async () => {
    setPageStatus("loading");
    setErrorMsg("");
    setNotFound(false);
    try {
      const res  = await fetch("/api/bot-config");
      const json = await res.json();
      if (res.status === 404) { setNotFound(true); setPageStatus("idle"); return; }
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setData(json.data);
      setRawJson(JSON.stringify(json.data, null, 2));
      setMeta(json.meta);
      setPageStatus("idle");
      setHasChanges(false);
    } catch (err: unknown) {
      setPageStatus("error");
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleVisualChange = (newData: HackathonData) => {
    setData(newData); setRawJson(JSON.stringify(newData, null, 2));
    setHasChanges(true); setJsonError("");
  };
  const handleRawChange = (val: string) => {
    setRawJson(val); setHasChanges(true);
    try { setData(JSON.parse(val)); setJsonError(""); } catch { setJsonError("Invalid JSON"); }
  };
  const handleSave = async () => {
    if (!data || jsonError) return;
    setPageStatus("saving");
    try {
      const res  = await fetch("/api/bot-config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setPageStatus("success");
      setHasChanges(false);
      if (json.version && meta) setMeta({ ...meta, version: json.version, updatedAt: new Date().toISOString() });
      setTimeout(() => setPageStatus("idle"), 2500);
    } catch (err: unknown) {
      setPageStatus("error");
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const btnBase: React.CSSProperties = {
    padding: "0.5rem 1rem", backgroundColor: "transparent",
    border: "1px solid rgba(255,255,255,0.2)", color: "#fff",
    fontFamily: "monospace", fontSize: "0.75rem", cursor: "pointer",
    transition: "all 0.3s", letterSpacing: "0.05em",
    display: "flex", alignItems: "center", gap: "0.5rem",
  };

  return (
    <>
      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} />}
      {showSeed    && <SeedModal onClose={() => setShowSeed(false)} onSeeded={() => { setShowSeed(false); fetchData(); }} />}

      {/* ── Header ── */}
      <div style={{ marginBottom: "3rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 900, letterSpacing: "-0.05em", marginBottom: "0.5rem" }}>BOT CONFIG</h1>
          <p style={{ fontFamily: "monospace", color: "rgba(255,255,255,0.6)", fontSize: "1rem" }}>Manage Kernel Discord bot data</p>
        </div>
        <button onClick={onLock} style={{ ...btnBase, marginTop: "0.5rem" }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          LOCK
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

        {/* ── Status + controls ── */}
        <div style={{ border: "1px solid rgba(255,255,255,0.1)", padding: "1.25rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ fontFamily: "monospace", fontSize: "0.875rem", display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
            {pageStatus === "loading" && <span style={{ color: "rgba(255,255,255,0.4)" }}>Loading...</span>}
            {meta && (
              <>
                <span style={{ color: "rgba(255,255,255,0.6)" }}><span style={{ color: "rgba(255,255,255,0.4)" }}>Version:</span> v{meta.version}</span>
                {meta.updatedAt && <span style={{ color: "rgba(255,255,255,0.6)" }}><span style={{ color: "rgba(255,255,255,0.4)" }}>Updated:</span> {new Date(meta.updatedAt).toLocaleString()}</span>}
                {meta.updatedBy && meta.updatedBy !== "unknown" && <span style={{ color: "rgba(255,255,255,0.6)" }}><span style={{ color: "rgba(255,255,255,0.4)" }}>By:</span> {meta.updatedBy}</span>}
                {hasChanges && <span style={{ color: "#f6ad55" }}>● Unsaved changes</span>}
              </>
            )}
            {notFound && <span style={{ color: "rgba(255,255,255,0.4)" }}>No config in database</span>}
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", border: "1px solid rgba(255,255,255,0.2)" }}>
              {(["visual", "raw"] as const).map(m => (
                <button key={m} onClick={() => setMode(m)} style={{ ...btnBase, border: "none", backgroundColor: mode === m ? "#fff" : "transparent", color: mode === m ? "#000" : "rgba(255,255,255,0.6)", fontWeight: mode === m ? "bold" : "normal" }}>
                  {m === "visual" ? "VISUAL" : "JSON"}
                </button>
              ))}
            </div>
            <button onClick={() => setShowHistory(true)} style={btnBase}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.88"/></svg>
              HISTORY
            </button>
            <button onClick={fetchData} disabled={pageStatus === "loading" || pageStatus === "saving"}
              style={{ ...btnBase, opacity: (pageStatus === "loading" || pageStatus === "saving") ? 0.4 : 1 }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: pageStatus === "loading" ? "spin 1s linear infinite" : "none" }}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.49-3.88"/></svg>
              REFRESH
            </button>
            <button onClick={handleSave} disabled={!hasChanges || pageStatus === "saving" || pageStatus === "loading" || !!jsonError}
              style={{ ...btnBase, backgroundColor: pageStatus === "success" ? "rgba(74,222,128,0.2)" : hasChanges && !jsonError ? "#fff" : "transparent", color: pageStatus === "success" ? "#4ade80" : hasChanges && !jsonError ? "#000" : "rgba(255,255,255,0.4)", border: pageStatus === "success" ? "1px solid rgba(74,222,128,0.4)" : hasChanges && !jsonError ? "1px solid #fff" : "1px solid rgba(255,255,255,0.2)", fontWeight: "bold", opacity: (!hasChanges || !!jsonError) && pageStatus !== "success" ? 0.5 : 1, cursor: (!hasChanges || !!jsonError) ? "not-allowed" : "pointer" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {pageStatus === "success" ? <polyline points="20 6 9 17 4 12"/> : <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>}
              </svg>
              {pageStatus === "saving" ? "SAVING..." : pageStatus === "success" ? "SAVED" : "SAVE CHANGES"}
            </button>
          </div>
        </div>

        {/* ── Message Scheduler (moved to top) ── */}
        <ScheduledMessagePanel />

        {/* ── Live Log Feed ── */}
        <LiveLogFeed />

        {/* ── Error banners ── */}
        {pageStatus === "error" && (
          <div style={{ border: "1px solid rgba(248,113,113,0.4)", backgroundColor: "rgba(248,113,113,0.1)", padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
            <span style={{ fontFamily: "monospace", fontSize: "0.875rem", color: "#f87171" }}>{errorMsg}</span>
            <button onClick={() => setPageStatus("idle")} style={{ background: "transparent", border: "none", color: "#f87171", cursor: "pointer", fontFamily: "monospace" }}>✕</button>
          </div>
        )}
        {jsonError && (
          <div style={{ border: "1px solid rgba(248,113,113,0.4)", backgroundColor: "rgba(248,113,113,0.1)", padding: "0.75rem 1.5rem" }}>
            <span style={{ fontFamily: "monospace", fontSize: "0.875rem", color: "#f87171" }}>Invalid JSON — fix before saving</span>
          </div>
        )}

        {/* ── Not found ── */}
        {notFound && (
          <div style={{ border: "1px solid rgba(255,255,255,0.1)", padding: "2rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1.5rem" }}>
            <div>
              <div style={{ fontFamily: "monospace", fontSize: "1rem", fontWeight: "bold", marginBottom: "0.5rem" }}>NO CONFIG IN DATABASE</div>
              <div style={{ fontFamily: "monospace", fontSize: "0.875rem", color: "rgba(255,255,255,0.6)" }}>Seed once from your existing <code style={{ color: "#fff" }}>hackathon-data.json</code></div>
            </div>
            <button onClick={() => setShowSeed(true)} style={{ padding: "0.75rem 1.5rem", backgroundColor: "#fff", border: "none", color: "#000", fontFamily: "monospace", fontSize: "0.875rem", fontWeight: "bold", cursor: "pointer", letterSpacing: "0.05em" }}>SEED DATABASE</button>
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {pageStatus === "loading" && (
          <div style={{ border: "1px solid rgba(255,255,255,0.1)", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[...Array(8)].map((_, i) => <div key={i} style={{ height: "36px", backgroundColor: "rgba(255,255,255,0.05)", opacity: 1 - i * 0.1 }} />)}
          </div>
        )}

        {/* ── Config editor ── */}
        {data && pageStatus !== "loading" && (
          mode === "visual" ? (
            <div style={{ border: "1px solid rgba(255,255,255,0.1)", padding: "1.5rem" }}>
              <div style={{ fontSize: "0.875rem", fontFamily: "monospace", color: "rgba(255,255,255,0.6)", marginBottom: "1.5rem", letterSpacing: "0.05em" }}>EDIT FIELDS</div>
              {Object.entries(data).map(([k, v]) => (
                <FieldEditor key={k} keyName={k} value={v} depth={0} onChange={(nv) => handleVisualChange({ ...data, [k]: nv })} />
              ))}
            </div>
          ) : (
            <div style={{ border: "1px solid rgba(255,255,255,0.1)", padding: "1.5rem" }}>
              <div style={{ fontSize: "0.875rem", fontFamily: "monospace", color: "rgba(255,255,255,0.6)", marginBottom: "1rem", letterSpacing: "0.05em" }}>RAW JSON</div>
              <textarea value={rawJson} onChange={e => handleRawChange(e.target.value)} spellCheck={false}
                style={{ width: "100%", minHeight: "60vh", boxSizing: "border-box", backgroundColor: "transparent", border: `1px solid ${jsonError ? "rgba(248,113,113,0.4)" : "rgba(255,255,255,0.2)"}`, padding: "1rem", color: "#fff", fontFamily: "monospace", fontSize: "0.875rem", lineHeight: 1.6, resize: "vertical" }}
                onFocus={e => e.currentTarget.style.borderColor = jsonError ? "rgba(248,113,113,0.6)" : "rgba(255,255,255,0.4)"}
                onBlur={e => e.currentTarget.style.borderColor = jsonError ? "rgba(248,113,113,0.4)" : "rgba(255,255,255,0.2)"} />
            </div>
          )
        )}

      </div>
    </>
  );
}

// ─── Scheduled Message Panel ──────────────────────────────────────────────────

interface ScheduledMsg {
  _id:            string;
  name:           string;
  channelId:      string;
  messageFormat:  "plain" | "embed";
  content:        string;
  embedTitle?:    string;
  embedColor?:    string;
  scheduleType:   "once" | "recurring";
  cronExpression?: string;
  sendAt?:        string;
  active:         boolean;
  sent:           boolean;
  sentCount:      number;
  lastSentAt?:    string;
  createdAt:      string;
}

const CRON_PRESETS = [
  { label: "Daily 9 AM",         value: "0 9 * * *"   },
  { label: "Daily 6 PM",         value: "0 18 * * *"  },
  { label: "Weekly Mon 10 AM",   value: "0 10 * * 1"  },
  { label: "Every hour",         value: "0 * * * *"   },
  { label: "Every 30 min",       value: "*/30 * * * *" },
  { label: "Custom…",            value: "custom"       },
];

const EMBED_COLORS = ["#FF6B35","#4ECDC4","#4ade80","#60a5fa","#a78bfa","#f6ad55","#f87171","#FFD700","#FF0000"];

function ScheduledMessagePanel() {
  const [messages, setMessages]     = useState<ScheduledMsg[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState("");
  const [toast, setToast]           = useState("");

  const [name, setName]                     = useState("");
  const [channelId, setChannelId]           = useState("");
  const [messageFormat, setMessageFormat]   = useState<"plain"|"embed">("plain");
  const [content, setContent]               = useState("");
  const [embedTitle, setEmbedTitle]         = useState("");
  const [embedColor, setEmbedColor]         = useState("#FF6B35");
  const [scheduleType, setScheduleType]     = useState<"once"|"recurring">("once");
  const [cronPreset, setCronPreset]         = useState("0 9 * * *");
  const [cronCustom, setCronCustom]         = useState("");
  const [sendAt, setSendAt]                 = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fetchMessages = useCallback(async () => {
    try {
      const res  = await fetch("/api/bot-config/messages");
      const json = await res.json();
      if (res.ok) setMessages(json.messages ?? []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const resetForm = () => {
    setName(""); setChannelId(""); setMessageFormat("plain"); setContent("");
    setEmbedTitle(""); setEmbedColor("#FF6B35"); setScheduleType("once");
    setCronPreset("0 9 * * *"); setCronCustom(""); setSendAt(""); setFormError("");
  };

  const handleCreate = async () => {
    setFormError("");
    const cronExpression = cronPreset === "custom" ? cronCustom : cronPreset;
    const payload = {
      name, channelId, messageFormat, content, embedTitle, embedColor,
      scheduleType,
      cronExpression: scheduleType === "recurring" ? cronExpression : undefined,
      sendAt:         scheduleType === "once" ? sendAt : undefined,
    };
    setSaving(true);
    try {
      const res  = await fetch("/api/bot-config/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) { setFormError(json.error ?? "Failed to create"); return; }
      showToast("Message scheduled");
      resetForm();
      setShowForm(false);
      fetchMessages();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Error");
    } finally { setSaving(false); }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await fetch(`/api/bot-config/messages/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !current }) });
    setMessages(prev => prev.map(m => m._id === id ? { ...m, active: !current } : m));
  };

  const deleteMsg = async (id: string) => {
    if (!confirm("Delete this scheduled message?")) return;
    await fetch(`/api/bot-config/messages/${id}`, { method: "DELETE" });
    setMessages(prev => prev.filter(m => m._id !== id));
    showToast("Message deleted");
  };

  const inp: React.CSSProperties = {
    background: "transparent", border: "1px solid rgba(255,255,255,0.15)",
    color: "#fff", fontFamily: "monospace", fontSize: "0.8rem",
    padding: "0.6rem 0.75rem", width: "100%", outline: "none", boxSizing: "border-box",
  };
  const lbl: React.CSSProperties = {
    fontFamily: "monospace", fontSize: "0.62rem", letterSpacing: "0.12em",
    color: "rgba(255,255,255,0.3)", marginBottom: "0.4rem", display: "block",
  };
  const segBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem",
    cursor: "pointer", border: "none", letterSpacing: "0.06em",
    backgroundColor: active ? "#fff" : "transparent",
    color: active ? "#000" : "rgba(255,255,255,0.4)",
    fontWeight: active ? "bold" : "normal",
  });

  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.1)" }}>

      {toast && (
        <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 999, fontFamily: "monospace", fontSize: "0.8rem", padding: "0.7rem 1.1rem", border: "1px solid rgba(74,222,128,0.4)", backgroundColor: "rgba(74,222,128,0.1)", color: "#4ade80" }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <span style={{ fontFamily: "monospace", fontSize: "0.75rem", letterSpacing: "0.1em", color: "rgba(255,255,255,0.55)" }}>
            MESSAGE SCHEDULER
          </span>
          <span style={{ fontFamily: "monospace", fontSize: "0.65rem", color: "rgba(255,255,255,0.25)" }}>
            {messages.length} message{messages.length !== 1 ? "s" : ""}
          </span>
        </div>
        <button
          onClick={() => { setShowForm(f => !f); if (showForm) resetForm(); }}
          style={{ fontFamily: "monospace", fontSize: "0.72rem", padding: "0.4rem 0.9rem", cursor: "pointer", letterSpacing: "0.07em", border: "1px solid rgba(255,255,255,0.2)", backgroundColor: showForm ? "rgba(255,255,255,0.08)" : "transparent", color: showForm ? "rgba(255,255,255,0.6)" : "#fff" }}
        >
          {showForm ? "✕ CANCEL" : "+ NEW MESSAGE"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div style={{ padding: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: "1.25rem", backgroundColor: "rgba(255,255,255,0.02)" }}>
          <div style={{ fontFamily: "monospace", fontSize: "0.7rem", letterSpacing: "0.12em", color: "rgba(255,255,255,0.4)" }}>NEW SCHEDULED MESSAGE</div>

          {formError && (
            <div style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#f87171", border: "1px solid rgba(248,113,113,0.3)", padding: "0.6rem 0.9rem", backgroundColor: "rgba(248,113,113,0.07)" }}>
              {formError}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <span style={lbl}>MESSAGE NAME</span>
              <input style={inp} placeholder="e.g. Lunch Break Reminder" value={name} onChange={e => setName(e.target.value)}
                onFocus={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"}
                onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"} />
            </div>
            <div>
              <span style={lbl}>DISCORD CHANNEL ID</span>
              <input style={inp} placeholder="e.g. 1234567890123456789" value={channelId} onChange={e => setChannelId(e.target.value)}
                onFocus={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"}
                onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"} />
            </div>
          </div>

          <div>
            <span style={lbl}>MESSAGE FORMAT</span>
            <div style={{ display: "flex", border: "1px solid rgba(255,255,255,0.15)" }}>
              <button style={segBtn(messageFormat === "plain")} onClick={() => setMessageFormat("plain")}>PLAIN TEXT</button>
              <button style={segBtn(messageFormat === "embed")} onClick={() => setMessageFormat("embed")}>EMBED</button>
            </div>
          </div>

          {messageFormat === "embed" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", alignItems: "end" }}>
              <div>
                <span style={lbl}>EMBED TITLE</span>
                <input style={inp} placeholder="Title shown in the embed header" value={embedTitle} onChange={e => setEmbedTitle(e.target.value)}
                  onFocus={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"} />
              </div>
              <div>
                <span style={lbl}>COLOR</span>
                <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                  {EMBED_COLORS.map(c => (
                    <button key={c} onClick={() => setEmbedColor(c)} style={{ width: 22, height: 22, backgroundColor: c, border: embedColor === c ? "2px solid #fff" : "2px solid transparent", cursor: "pointer", flexShrink: 0 }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div>
            <span style={lbl}>{messageFormat === "embed" ? "EMBED DESCRIPTION" : "MESSAGE CONTENT"}</span>
            <textarea
              style={{ ...inp, minHeight: "80px", resize: "vertical" }}
              placeholder={messageFormat === "embed" ? "Body text of the embed…" : "Your message text…"}
              value={content}
              onChange={e => setContent(e.target.value)}
              onFocus={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"}
              onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"}
            />
          </div>

          <div>
            <span style={lbl}>SCHEDULE TYPE</span>
            <div style={{ display: "flex", border: "1px solid rgba(255,255,255,0.15)" }}>
              <button style={segBtn(scheduleType === "once")}      onClick={() => setScheduleType("once")}>ONE-TIME</button>
              <button style={segBtn(scheduleType === "recurring")} onClick={() => setScheduleType("recurring")}>RECURRING</button>
            </div>
          </div>

          {scheduleType === "once" && (
            <div>
              <span style={lbl}>SEND AT (your local time)</span>
              <input type="datetime-local" style={inp} value={sendAt} onChange={e => setSendAt(e.target.value)}
                onFocus={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"}
                onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"} />
            </div>
          )}

          {scheduleType === "recurring" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div>
                <span style={lbl}>CRON PRESET</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {CRON_PRESETS.map(p => (
                    <button key={p.value} onClick={() => setCronPreset(p.value)} style={{ fontFamily: "monospace", fontSize: "0.68rem", padding: "0.3rem 0.7rem", cursor: "pointer", letterSpacing: "0.06em", border: "1px solid", borderColor: cronPreset === p.value ? "#fff" : "rgba(255,255,255,0.15)", backgroundColor: cronPreset === p.value ? "rgba(255,255,255,0.1)" : "transparent", color: cronPreset === p.value ? "#fff" : "rgba(255,255,255,0.4)" }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              {cronPreset === "custom" && (
                <div>
                  <span style={lbl}>CUSTOM CRON EXPRESSION</span>
                  <input style={inp} placeholder="e.g. 0 12 * * 5  (Fridays at noon)" value={cronCustom} onChange={e => setCronCustom(e.target.value)}
                    onFocus={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"}
                    onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"} />
                </div>
              )}
              {cronPreset !== "custom" && (
                <div style={{ fontFamily: "monospace", fontSize: "0.65rem", color: "rgba(255,255,255,0.2)" }}>
                  Expression: <span style={{ color: "rgba(255,255,255,0.45)" }}>{cronPreset}</span>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={saving}
            style={{ padding: "0.8rem", backgroundColor: saving ? "rgba(255,255,255,0.1)" : "#fff", border: "none", color: saving ? "rgba(255,255,255,0.4)" : "#000", fontFamily: "monospace", fontSize: "0.8rem", fontWeight: "bold", cursor: saving ? "not-allowed" : "pointer", letterSpacing: "0.07em" }}
          >
            {saving ? "SCHEDULING…" : "→ SCHEDULE MESSAGE"}
          </button>
        </div>
      )}

      {/* Message list */}
      <div>
        {loading && (
          <div style={{ padding: "2rem", textAlign: "center", fontFamily: "monospace", fontSize: "0.8rem", color: "rgba(255,255,255,0.3)" }}>Loading…</div>
        )}
        {!loading && messages.length === 0 && (
          <div style={{ padding: "2.5rem", textAlign: "center", fontFamily: "monospace", fontSize: "0.8rem", color: "rgba(255,255,255,0.25)" }}>
            No scheduled messages yet. Click + NEW MESSAGE to create one.
          </div>
        )}
        {messages.map((msg, i) => {
          const isRecurring = msg.scheduleType === "recurring";
          const isSent      = msg.scheduleType === "once" && msg.sent;
          const statusColor = isSent ? "#4ade80" : msg.active ? "#f6ad55" : "rgba(255,255,255,0.2)";
          const statusLabel = isSent ? "SENT" : msg.active ? "ACTIVE" : "PAUSED";
          return (
            <div key={msg._id} style={{ padding: "0.9rem 1.25rem", borderBottom: i < messages.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>

              <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: statusColor, flexShrink: 0, display: "inline-block", boxShadow: msg.active && !isSent ? `0 0 0 2px ${statusColor}33` : "none" }} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.2rem" }}>
                  <span style={{ fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 600, color: "#fff" }}>{msg.name}</span>
                  <span style={{ fontFamily: "monospace", fontSize: "0.6rem", padding: "0.1rem 0.45rem", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.35)" }}>
                    {isRecurring ? "RECURRING" : "ONE-TIME"}
                  </span>
                  <span style={{ fontFamily: "monospace", fontSize: "0.6rem", padding: "0.1rem 0.45rem", border: `1px solid ${statusColor}44`, color: statusColor }}>
                    {statusLabel}
                  </span>
                  {msg.messageFormat === "embed" && (
                    <span style={{ fontFamily: "monospace", fontSize: "0.6rem", padding: "0.1rem 0.45rem", border: "1px solid rgba(167,139,250,0.3)", color: "#a78bfa" }}>EMBED</span>
                  )}
                </div>
                <div style={{ fontFamily: "monospace", fontSize: "0.68rem", color: "rgba(255,255,255,0.28)", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <span>ch: {msg.channelId}</span>
                  {isRecurring && <span>cron: <span style={{ color: "rgba(255,255,255,0.45)" }}>{msg.cronExpression}</span></span>}
                  {!isRecurring && msg.sendAt && <span>at: <span style={{ color: "rgba(255,255,255,0.45)" }}>{new Date(msg.sendAt).toLocaleString()}</span></span>}
                  {msg.sentCount > 0 && <span style={{ color: "#4ade80" }}>sent {msg.sentCount}×</span>}
                  {msg.lastSentAt && <span>last: {new Date(msg.lastSentAt).toLocaleString()}</span>}
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                {!isSent && (
                  <button
                    onClick={() => toggleActive(msg._id, msg.active)}
                    style={{ fontFamily: "monospace", fontSize: "0.65rem", padding: "0.3rem 0.6rem", cursor: "pointer", letterSpacing: "0.06em", border: "1px solid rgba(255,255,255,0.15)", backgroundColor: "transparent", color: msg.active ? "#f6ad55" : "rgba(255,255,255,0.4)" }}
                  >
                    {msg.active ? "⏸ PAUSE" : "▶ RESUME"}
                  </button>
                )}
                <button
                  onClick={() => deleteMsg(msg._id)}
                  style={{ fontFamily: "monospace", fontSize: "0.65rem", padding: "0.3rem 0.6rem", cursor: "pointer", letterSpacing: "0.06em", border: "1px solid rgba(248,113,113,0.25)", backgroundColor: "transparent", color: "#f87171" }}
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {messages.length > 0 && (
        <div style={{ padding: "0.6rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.05)", fontFamily: "monospace", fontSize: "0.62rem", color: "rgba(255,255,255,0.18)" }}>
          Bot syncs new messages every 60s · one-time messages fire within 1 minute of their scheduled time
        </div>
      )}
    </div>
  );
}