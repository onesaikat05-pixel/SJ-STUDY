import { useState, useEffect, useRef, useCallback } from "react";
import { supabase, CSS, Ic, Empty, todayStr, uid, fmtDate, fmtTimer, timeAgo, SYL, SUB_C, SUB_T, STATUS_L, STATUS_C, STATUS_N } from "./lib";
import { useAuth, useProfile, useLiveStatus, useTable, useSyllabus, useSquad } from "./hooks";

// ── Global Timer State (survives tab switches) ────────────────────
const TIMER_STATE = {
  running: false, elapsed: 0, mode: "pomo", phase: "work",
  cycle: 0, time: 25 * 60, wMin: 25, bMin: 5, lMin: 15,
  sub: "Biology", topic: "", startedAt: null,
};
let timerInterval = null;
const timerListeners = new Set();
const notifyTimer = () => timerListeners.forEach(fn => fn({ ...TIMER_STATE }));

function startGlobalTimer() {
  if (timerInterval) return;
  TIMER_STATE.startedAt = Date.now();
  timerInterval = setInterval(() => {
    if (!TIMER_STATE.running) return;
    if (TIMER_STATE.mode === "normal") {
      TIMER_STATE.elapsed++;
    } else {
      if (TIMER_STATE.time > 0) {
        TIMER_STATE.time--;
      } else {
        if (TIMER_STATE.phase === "work") {
          TIMER_STATE.elapsed += TIMER_STATE.wMin * 60;
          const nc = TIMER_STATE.cycle + 1;
          TIMER_STATE.cycle = nc;
          TIMER_STATE.phase = nc % 4 === 0 ? "long" : "break";
          TIMER_STATE.time = (TIMER_STATE.phase === "long" ? TIMER_STATE.lMin : TIMER_STATE.bMin) * 60;
        } else {
          TIMER_STATE.phase = "work";
          TIMER_STATE.time = TIMER_STATE.wMin * 60;
        }
      }
    }
    notifyTimer();
  }, 1000);
}

function stopGlobalTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function useGlobalTimer() {
  const [state, setState] = useState({ ...TIMER_STATE });
  useEffect(() => {
    timerListeners.add(setState);
    return () => timerListeners.delete(setState);
  }, []);
  return state;
}

export default function App() {
  const { user, signInGoogle, signOut } = useAuth();
  const profile = useProfile(user);
  const [tab, setTab] = useState("home");
  const timerState = useGlobalTimer();

  if (user === undefined) return <Splash />;
  if (!user) return <LoginScreen onLogin={signInGoogle} />;
  if (!profile) return <Splash />;

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: "var(--bg)", minHeight: "100vh", color: "var(--text)", display: "flex", flexDirection: "column", maxWidth: 600, margin: "0 auto" }}>
      <style>{CSS}</style>
      <Header profile={profile} onLogout={signOut} timerRunning={TIMER_STATE.running} timerElapsed={timerState.mode === "normal" ? timerState.elapsed : (timerState.wMin * 60 - timerState.time)} onTimerClick={() => setTab("timer")} />
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 88px" }}>
        <div className="fade-up" key={tab}>
          {tab === "home"   && <HomeTab user={user} profile={profile} />}
          {tab === "log"    && <LogTab user={user} />}
          {tab === "todo"   && <TodoTab user={user} />}
          {tab === "target" && <TargetTab user={user} />}
          {tab === "timer"  && <TimerTab user={user} />}
          {tab === "mock"   && <MockTab user={user} />}
          {tab === "syl"    && <SylTab user={user} />}
          {tab === "squad"  && <SquadTab user={user} profile={profile} />}
          {tab === "hist"   && <HistTab user={user} />}
        </div>
      </div>
      <BottomNav tab={tab} setTab={setTab} timerRunning={TIMER_STATE.running} />
    </div>
  );
}

function Splash() {
  return <div style={{ background: "#070711", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><style>{CSS}</style><div className="spinner" /></div>;
}

function LoginScreen({ onLogin }) {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, maxWidth: 600, margin: "0 auto" }}>
      <style>{CSS}</style>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ width: 76, height: 76, background: "linear-gradient(135deg,#b8900a,#e8c86a)", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, margin: "0 auto 16px", boxShadow: "0 12px 40px rgba(201,168,76,.3)" }}>🩺</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 34, fontWeight: 700, color: "var(--gold2)", letterSpacing: "-0.5px" }}>SJ STUDY</div>
        <div style={{ fontSize: 13, color: "var(--text3)", marginTop: 4, letterSpacing: "3px", textTransform: "uppercase" }}>NEET Study OS</div>
      </div>
      <div style={{ width: "100%", maxWidth: 340 }}>
        <button className="btn" onClick={onLogin} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "14px 24px", background: "#fff", color: "#1f1f1f", borderRadius: 12, width: "100%", fontWeight: 600, fontSize: 14 }}>
          <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H1.83v2.84C3.64 20.53 7.48 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H1.83A10.97 10.97 0 000 12c0 1.77.43 3.45 1.83 4.93l4.01-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.48 1 3.64 3.47 1.83 7.07l4.01 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>
        <div style={{ marginTop: 20, padding: 14, background: "var(--bg2)", borderRadius: 12, border: "1px solid var(--border)", fontSize: 11, color: "var(--text3)", lineHeight: 1.7 }}>
          🔒 Data permanently saved to your account — accessible from any device, 1 year from now.
        </div>
      </div>
    </div>
  );
}

function Header({ profile, onLogout, timerRunning, timerElapsed, onTimerClick }) {
  const [showMenu, setShowMenu] = useState(false);
  return (
    <div style={{ background: "var(--bg2)", borderBottom: "1px solid var(--border)", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#b8900a,#e8c86a)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>🩺</div>
        <div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 16, color: "var(--gold2)", lineHeight: 1 }}>SJ STUDY</div>
          <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: "2px", textTransform: "uppercase", fontWeight: 600 }}>NEET 2026</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {timerRunning && (
          <button onClick={onTimerClick} className="btn" style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "rgba(16,185,129,.1)", border: "1px solid rgba(16,185,129,.3)", borderRadius: 20 }}>
            <div className="live-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} />
            <span style={{ fontSize: 12, color: "var(--green)", fontFamily: "monospace", fontWeight: 700 }}>{fmtTimer(timerElapsed)}</span>
          </button>
        )}
        <div style={{ position: "relative" }}>
          <button className="btn" onClick={() => setShowMenu(s => !s)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 10px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10 }}>
            {profile.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: 26, height: 26, borderRadius: 8, objectFit: "cover" }} /> : <div style={{ width: 26, height: 26, borderRadius: 8, background: `${profile.color}22`, border: `1.5px solid ${profile.color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: profile.color }}>{profile.initials}</div>}
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text2)", maxWidth: 70, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.name}</span>
          </button>
          {showMenu && (
            <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: 10, padding: 8, minWidth: 140, zIndex: 200, boxShadow: "0 8px 32px rgba(0,0,0,.4)" }}>
              <button className="btn" onClick={() => { setShowMenu(false); onLogout(); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "none", color: "var(--text2)", fontSize: 13, width: "100%", borderRadius: 7 }}>
                <Ic n="logout" s={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BottomNav({ tab, setTab, timerRunning }) {
  const tabs = [
    { id: "home", icon: "home", label: "Home" },
    { id: "log", icon: "log", label: "Log" },
    { id: "todo", icon: "todo", label: "Tasks" },
    { id: "target", icon: "target", label: "Goals" },
    { id: "timer", icon: "timer", label: "Timer" },
    { id: "squad", icon: "users", label: "Squad" },
    { id: "mock", icon: "mock", label: "Mocks" },
    { id: "syl", icon: "book", label: "Syllabus" },
    { id: "hist", icon: "history", label: "History" },
  ];
  return (
    <div style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)", display: "flex", position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, maxWidth: 600, margin: "0 auto", overflowX: "auto" }}>
      {tabs.map(t => (
        <button key={t.id} className={`nav-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)} style={{ position: "relative" }}>
          <Ic n={t.icon} s={15} />
          {t.id === "timer" && timerRunning && <div style={{ position: "absolute", top: 4, right: 8, width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} className="live-dot" />}
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// HOME TAB — with proper total hours display
// ════════════════════════════════════════════════════════════════════
function HomeTab({ user, profile }) {
  const { rows: logs } = useTable("study_logs", user.id);
  const { rows: todos } = useTable("todos", user.id);
  const { rows: mocks } = useTable("mocks", user.id);
  const { progress: syl } = useSyllabus(user.id);
  const [nDate, setNDate] = useState(profile.neet_date || "2026-05-04");
  const timerState = useGlobalTimer();

  const saveDate = async (val) => { setNDate(val); await supabase.from("profiles").update({ neet_date: val }).eq("id", user.id); };

  const todayLogs = logs.filter(l => l.date === todayStr());
  const totalMins = todayLogs.reduce((a, l) => a + (l.duration || 0), 0);
  // Add live timer to today's total
  const liveAddedMins = TIMER_STATE.running && TIMER_STATE.mode === "normal" ? Math.floor(TIMER_STATE.elapsed / 60) : TIMER_STATE.running && TIMER_STATE.mode === "pomo" && TIMER_STATE.phase === "work" ? Math.floor((TIMER_STATE.wMin * 60 - TIMER_STATE.time) / 60) : 0;
  const displayMins = totalMins + liveAddedMins;

  const todayTasks = todos.filter(t => t.date === todayStr());
  const doneTasks = todayTasks.filter(t => t.done).length;

  const streak = (() => {
    const dates = [...new Set(logs.map(l => l.date))].sort().reverse();
    let s = 0, d = new Date();
    for (const dt of dates) { const diff = Math.floor((d - new Date(dt + "T12:00:00")) / 86400000); if (diff > 1) break; s++; d = new Date(dt + "T12:00:00"); }
    return s;
  })();

  const daysLeft = Math.max(0, Math.ceil((new Date(nDate + "T00:00:00") - new Date()) / 86400000));
  const allTopics = Object.values(SYL).flat().length;
  const doneSyl = Object.values(syl).filter(v => v >= 2).length;
  const subToday = todayLogs.reduce((acc, l) => { acc[l.subject] = (acc[l.subject] || 0) + l.duration; return acc; }, {});
  const lastMock = mocks[0];

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().slice(0, 10);
    const mins = logs.filter(l => l.date === ds).reduce((a, l) => a + l.duration, 0);
    return { day: d.toLocaleDateString("en-IN", { weekday: "short" }), mins };
  });
  const maxMins = Math.max(...last7.map(d => d.mins), 60);

  // Weekly total
  const weekTotal = last7.reduce((a, d) => a + d.mins, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Countdown */}
      <div style={{ background: "linear-gradient(135deg,#0f0f20,#0d0d18)", border: "1px solid rgba(201,168,76,.2)", borderRadius: 16, padding: "22px 18px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -20, top: -20, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle,rgba(201,168,76,.06) 0%,transparent 70%)" }} />
        <div style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "2px", fontWeight: 600, marginBottom: 6 }}>Time Remaining</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 64, fontWeight: 700, color: "var(--gold2)", lineHeight: 1 }}>{daysLeft}</div>
        <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>days to NEET &nbsp;·&nbsp;
          <input type="date" value={nDate} onChange={e => saveDate(e.target.value)} style={{ background: "transparent", border: "none", color: "var(--text3)", fontSize: 11, width: "auto", padding: 0, outline: "none" }} />
        </div>
        {streak > 0 && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 10, background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.2)", borderRadius: 20, padding: "4px 10px" }}>
            <span style={{ fontSize: 14 }}>🔥</span>
            <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>{streak} day streak</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        <div className="stat-card">
          <div style={{ fontSize: 20, marginBottom: 4 }}>📚</div>
          <div className="stat-num">{Math.floor(displayMins / 60)}<span style={{ fontSize: 16 }}>h</span> {displayMins % 60}<span style={{ fontSize: 16 }}>m</span></div>
          <div className="stat-lbl">Today{TIMER_STATE.running ? " 🟢" : ""}</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: 20, marginBottom: 4 }}>📅</div>
          <div className="stat-num">{Math.floor(weekTotal / 60)}<span style={{ fontSize: 16 }}>h</span></div>
          <div className="stat-lbl">This Week</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: 20, marginBottom: 4 }}>✅</div>
          <div className="stat-num">{doneTasks}<span style={{ fontSize: 14, color: "var(--text3)" }}>/{todayTasks.length}</span></div>
          <div className="stat-lbl">Tasks</div>
        </div>
      </div>

      {/* Weekly bar chart */}
      <div className="card">
        <div className="lbl" style={{ marginBottom: 12 }}>Weekly Study</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60 }}>
          {last7.map((d, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 8, color: "var(--text3)" }}>{d.mins > 0 ? `${Math.floor(d.mins / 60)}h` : ""}</span>
              <div style={{ width: "100%", borderRadius: "4px 4px 0 0", background: d.mins > 0 ? "linear-gradient(180deg,var(--gold2),var(--gold))" : "var(--bg3)", height: `${Math.max(3, (d.mins / maxMins) * 48)}px`, opacity: i === 6 ? 1 : 0.7 }} />
              <span style={{ fontSize: 9, color: "var(--text3)", fontWeight: 600, textTransform: "uppercase" }}>{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Today's subjects */}
      {Object.keys(subToday).length > 0 && (
        <div className="card">
          <div className="lbl" style={{ marginBottom: 10 }}>Today's Study</div>
          {Object.entries(subToday).map(([sub, mins]) => (
            <div key={sub} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: SUB_C[sub] }} />
                <span style={{ fontSize: 13, color: "var(--text2)" }}>{sub}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--gold)" }}>{Math.floor(mins / 60)}h {mins % 60}m</span>
            </div>
          ))}
        </div>
      )}

      {/* Syllabus */}
      <div className="card">
        <div className="lbl" style={{ marginBottom: 12 }}>Syllabus Coverage</div>
        {Object.entries(SYL).map(([sub, topics]) => {
          const done = topics.filter(t => (syl[`${sub}__${t}`] || 0) >= 2).length;
          const pct = Math.round(done / topics.length * 100);
          return (
            <div key={sub} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: SUB_C[sub], fontWeight: 500 }}>{sub}</span>
                <span style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600 }}>{done}/{topics.length} · {pct}%</span>
              </div>
              <div className="pbar"><div className="pfill" style={{ width: `${pct}%`, background: SUB_C[sub] }} /></div>
            </div>
          );
        })}
        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>{doneSyl}/{allTopics} topics completed overall</div>
      </div>

      {lastMock && (
        <div className="card card-hi">
          <div className="lbl" style={{ marginBottom: 10 }}>Last Mock Test</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 700, color: "var(--gold2)" }}>{lastMock.score}<span style={{ fontSize: 14, color: "var(--text3)", fontFamily: "'DM Sans'" }}>/{lastMock.total}</span></div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{fmtDate(lastMock.date)} · {lastMock.name || "Mock Test"}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: lastMock.score / lastMock.total >= .6 ? "var(--green)" : "var(--red)", fontFamily: "'Playfair Display'" }}>{Math.round(lastMock.score / lastMock.total * 100)}%</div>
              <div style={{ fontSize: 10, color: "var(--text3)" }}>Accuracy</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// TIMER TAB — Global persistent timer
// ════════════════════════════════════════════════════════════════════
function TimerTab({ user }) {
  const { insert: insertSession } = useTable("timer_sessions", user.id);
  const { insert: insertLog } = useTable("study_logs", user.id);
  const ts = useGlobalTimer();
  const [saved, setSaved] = useState(false);

  // Update live status in Supabase
  useLiveStatus(user, ts.running, ts.sub, ts.topic);

  const toggle = () => {
    TIMER_STATE.running = !TIMER_STATE.running;
    if (TIMER_STATE.running) startGlobalTimer();
    notifyTimer();
  };

  const reset = () => {
    TIMER_STATE.running = false;
    TIMER_STATE.elapsed = 0;
    TIMER_STATE.time = TIMER_STATE.wMin * 60;
    TIMER_STATE.phase = "work";
    TIMER_STATE.cycle = 0;
    stopGlobalTimer();
    notifyTimer();
  };

  const save = async () => {
    const dur = ts.mode === "normal" ? Math.floor(ts.elapsed / 60) : Math.floor(ts.elapsed / 60);
    if (dur < 1) { alert("Minimum 1 minute ka session hona chahiye!"); return; }
    const s = { subject: ts.sub, topic: ts.topic, duration: dur, date: todayStr(), type: ts.mode };
    await insertSession(s);
    await insertLog({ ...s, notes: `⏱ Timer session (${ts.mode === "pomo" ? "Pomodoro" : "Normal"})` });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    reset();
  };

  const phaseC = { work: "var(--gold)", break: "var(--green)", long: "var(--blue)" };
  const R = 70, C = 2 * Math.PI * R;
  const totalSecs = (ts.phase === "work" ? ts.wMin : ts.phase === "break" ? ts.bMin : ts.lMin) * 60;
  const pct = ts.mode === "pomo" ? (totalSecs - ts.time) / totalSecs : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div><div className="section-title">Focus Timer</div><div className="section-sub">Timer tab switch karne pe bhi chalta rahega ✅</div></div>

      {saved && <div style={{ background: "rgba(16,185,129,.1)", border: "1px solid rgba(16,185,129,.3)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--green)" }}>✅ Session saved to Study Log!</div>}

      <div style={{ display: "flex", gap: 8 }}>
        {[["pomo", "🍅 Pomodoro"], ["normal", "⏱ Normal"]].map(([v, l]) => (
          <button key={v} onClick={() => { if (!ts.running) { TIMER_STATE.mode = v; TIMER_STATE.elapsed = 0; TIMER_STATE.time = TIMER_STATE.wMin * 60; TIMER_STATE.phase = "work"; TIMER_STATE.cycle = 0; notifyTimer(); } }} className={`filter-btn ${ts.mode === v ? "active" : ""}`} style={{ flex: 1, padding: "9px 0" }}>{l}</button>
        ))}
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "24px 16px" }}>
        {ts.mode === "pomo" && (
          <div style={{ display: "flex", gap: 8 }}>
            {[["work", "Focus"], ["break", "Break"], ["long", "Long Rest"]].map(([p, l]) => (
              <span key={p} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: ts.phase === p ? `${phaseC[p]}18` : "var(--bg3)", color: ts.phase === p ? phaseC[p] : "var(--text3)", fontWeight: 600 }}>{l}</span>
            ))}
          </div>
        )}

        <div style={{ position: "relative", width: 168, height: 168 }}>
          <svg width={168} height={168} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={84} cy={84} r={R} fill="none" stroke="var(--bg3)" strokeWidth={8} />
            {ts.mode === "pomo" && <circle cx={84} cy={84} r={R} fill="none" stroke={phaseC[ts.phase]} strokeWidth={8} strokeDasharray={C} strokeDashoffset={C * (1 - pct)} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s linear" }} />}
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: "'Playfair Display'", fontSize: 34, fontWeight: 700, color: ts.mode === "pomo" ? phaseC[ts.phase] : "var(--gold2)", letterSpacing: "-1px" }}>
              {ts.mode === "normal" ? fmtTimer(ts.elapsed) : fmtTimer(ts.time)}
            </div>
            {ts.mode === "pomo" && <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>Cycle {ts.cycle + 1}</div>}
            {ts.running && <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}><div className="live-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} /><span style={{ fontSize: 9, color: "var(--green)", fontWeight: 600 }}>LIVE — Squad dekh sakta hai</span></div>}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" onClick={reset} style={{ padding: "10px 14px" }}><Ic n="reset" s={15} /></button>
          <button className={`btn btn-primary ${ts.running ? "pulse" : ""}`} onClick={toggle} style={{ padding: "10px 32px", fontSize: 15 }}>
            {ts.running ? "⏸ Pause" : "▶ Start"}
          </button>
          {(ts.elapsed > 0 || (ts.mode === "pomo" && ts.cycle > 0)) && !ts.running && (
            <button className="btn btn-ghost" onClick={save}>💾 Save</button>
          )}
        </div>
      </div>

      {ts.mode === "pomo" && (
        <div className="card">
          <div className="lbl" style={{ marginBottom: 10 }}>Timer Settings</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[["Focus (min)", "wMin", ts.wMin], ["Break (min)", "bMin", ts.bMin], ["Long (min)", "lMin", ts.lMin]].map(([l, k, v]) => (
              <div key={k}><div className="lbl">{l}</div>
                <input type="number" min="1" max="120" value={v} disabled={ts.running} onChange={e => { TIMER_STATE[k] = +e.target.value; if (!ts.running && ts.phase === "work" && k === "wMin") TIMER_STATE.time = +e.target.value * 60; notifyTimer(); }} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="lbl" style={{ marginBottom: 10 }}>Session Info</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><div className="lbl">Subject</div>
            <select value={ts.sub} disabled={ts.running} onChange={e => { TIMER_STATE.sub = e.target.value; notifyTimer(); }}>
              {Object.keys(SYL).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div><div className="lbl">Topic</div>
            <input placeholder="Kya padh rahe ho?" value={ts.topic} disabled={ts.running} onChange={e => { TIMER_STATE.topic = e.target.value; notifyTimer(); }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// SQUAD TAB — YPT style with chat
// ════════════════════════════════════════════════════════════════════
function SquadTab({ user, profile }) {
  const { members, loading } = useSquad(user.id);
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const [view, setView] = useState("live"); // live | chat | week
  const chatEndRef = useRef(null);

  // Load + subscribe to messages
  useEffect(() => {
    supabase.from("squad_messages").select("*, profiles(name,avatar_url,initials,color)").order("created_at", { ascending: true }).limit(50)
      .then(({ data }) => { if (data) setMessages(data); });
    const channel = supabase.channel("squad_chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "squad_messages" }, payload => {
        supabase.from("squad_messages").select("*, profiles(name,avatar_url,initials,color)").eq("id", payload.new.id).single()
          .then(({ data }) => { if (data) setMessages(prev => [...prev, data]); });
      }).subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMsg = async () => {
    if (!msg.trim()) return;
    await supabase.from("squad_messages").insert({ id: uid(), user_id: user.id, message: msg.trim(), created_at: new Date().toISOString() });
    setMsg("");
  };

  const fmtH = (mins) => `${Math.floor(mins / 60)}h ${mins % 60}m`;
  const maxToday = Math.max(...members.map(m => m.todayMins), 60);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div><div className="section-title">Squad</div><div className="section-sub">Live status · Leaderboard · Chat</div></div>

      <div style={{ display: "flex", gap: 6 }}>
        {[["live", "🟢 Live"], ["week", "📊 Week"], ["chat", "💬 Chat"]].map(([v, l]) => (
          <button key={v} onClick={() => setView(v)} className={`filter-btn ${view === v ? "active" : ""}`} style={{ flex: 1 }}>{l}</button>
        ))}
      </div>

      {/* LIVE VIEW */}
      {view === "live" && (
        <>
          {loading && <div style={{ display: "flex", justifyContent: "center", padding: 30 }}><div className="spinner" /></div>}
          {!loading && members.map((m, i) => (
            <div key={m.id} className="card" style={{ borderColor: m.id === user.id ? "rgba(201,168,76,.3)" : "var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 24, textAlign: "center", flexShrink: 0 }}>
                  {i === 0 && m.todayMins > 0 ? "🥇" : i === 1 && m.todayMins > 0 ? "🥈" : i === 2 && m.todayMins > 0 ? "🥉" : <span style={{ fontSize: 11, color: "var(--text3)", fontWeight: 700 }}>#{i + 1}</span>}
                </div>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  {m.avatar_url ? <img src={m.avatar_url} alt="" style={{ width: 42, height: 42, borderRadius: 10, objectFit: "cover" }} /> : <div style={{ width: 42, height: 42, borderRadius: 10, background: `${m.color}22`, border: `2px solid ${m.color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: m.color }}>{m.initials}</div>}
                  {m.isLive && <div className="live-dot" style={{ position: "absolute", bottom: -2, right: -2, width: 12, height: 12, borderRadius: "50%", background: "var(--green)", border: "2px solid var(--bg2)" }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{m.name}{m.id === user.id ? " (You)" : ""}</span>
                    {m.streak > 0 && <span style={{ fontSize: 11, color: "#f59e0b" }}>🔥{m.streak}</span>}
                  </div>
                  {m.isLive ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                      <span style={{ fontSize: 10, color: "var(--green)", fontWeight: 600 }}>● STUDYING</span>
                      {m.current_subject && <span className={`tag ${SUB_T[m.current_subject] || "gen"}`}>{m.current_subject}</span>}
                      {m.current_topic && <span style={{ fontSize: 11, color: "var(--text2)" }}>{m.current_topic}</span>}
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{m.last_active ? `Last active ${timeAgo(m.last_active)}` : "No activity yet"}</div>
                  )}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: "'Playfair Display'", fontSize: 18, fontWeight: 700, color: m.todayMins > 0 ? "var(--gold2)" : "var(--text3)" }}>{fmtH(m.todayMins)}</div>
                  <div style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase", fontWeight: 600 }}>Today</div>
                </div>
              </div>
              {m.todayMins > 0 && <div className="pbar" style={{ marginTop: 10 }}><div className="pfill" style={{ width: `${Math.min(100, (m.todayMins / maxToday) * 100)}%`, background: m.isLive ? "var(--green)" : "var(--gold)" }} /></div>}
            </div>
          ))}
          <div style={{ textAlign: "center", fontSize: 11, color: "var(--text3)" }}>🔄 Auto-refreshes every 15 seconds</div>
        </>
      )}

      {/* WEEK VIEW */}
      {view === "week" && (
        <div className="card">
          <div className="lbl" style={{ marginBottom: 12 }}>This Week — Leaderboard</div>
          {[...members].sort((a, b) => b.weekMins - a.weekMins).map((m, i) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
              <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span>
              {m.avatar_url ? <img src={m.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" }} /> : <div style={{ width: 32, height: 32, borderRadius: 8, background: `${m.color}22`, border: `1.5px solid ${m.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: m.color }}>{m.initials}</div>}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}{m.id === user.id ? " (You)" : ""}</div>
                <div className="pbar" style={{ marginTop: 4, height: 4 }}><div className="pfill" style={{ width: `${Math.min(100, (m.weekMins / Math.max(...members.map(x => x.weekMins), 60)) * 100)}%`, background: m.color }} /></div>
              </div>
              <span style={{ fontFamily: "'Playfair Display'", fontSize: 15, fontWeight: 700, color: "var(--gold)" }}>{fmtH(m.weekMins)}</span>
            </div>
          ))}
        </div>
      )}

      {/* CHAT VIEW */}
      {view === "chat" && (
        <>
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, padding: 12, maxHeight: 400, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
            {messages.length === 0 && <div style={{ textAlign: "center", color: "var(--text3)", fontSize: 13, padding: 20 }}>Abhi koi message nahi. Pehla message bhejo! 👋</div>}
            {messages.map(m => {
              const isMe = m.user_id === user.id;
              const p = m.profiles;
              return (
                <div key={m.id} style={{ display: "flex", gap: 8, alignItems: "flex-end", flexDirection: isMe ? "row-reverse" : "row" }}>
                  {!isMe && (p?.avatar_url ? <img src={p.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: 7, objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 28, height: 28, borderRadius: 7, background: `${p?.color || "#666"}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: p?.color || "#666", flexShrink: 0 }}>{p?.initials || "?"}</div>)}
                  <div style={{ maxWidth: "70%" }}>
                    {!isMe && <div style={{ fontSize: 9, color: "var(--text3)", marginBottom: 2, fontWeight: 600 }}>{p?.name}</div>}
                    <div style={{ background: isMe ? "rgba(201,168,76,.2)" : "var(--bg3)", border: `1px solid ${isMe ? "rgba(201,168,76,.3)" : "var(--border)"}`, borderRadius: isMe ? "12px 12px 2px 12px" : "12px 12px 12px 2px", padding: "8px 12px", fontSize: 13, color: "var(--text)", lineHeight: 1.5 }}>{m.message}</div>
                    <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 2, textAlign: isMe ? "right" : "left" }}>{timeAgo(m.created_at)}</div>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="Message likho..." value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMsg()} style={{ flex: 1 }} />
            <button className="btn btn-primary" onClick={sendMsg} style={{ padding: "0 20px", flexShrink: 0 }}>Send</button>
          </div>
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// REST OF TABS (Log, Todo, Target, Mock, Syl, Hist) — same as before
// ════════════════════════════════════════════════════════════════════
function LogTab({ user }) {
  const { rows: logs, insert, remove, loading } = useTable("study_logs", user.id);
  const [sub, setSub] = useState("Biology");
  const [topic, setTopic] = useState("");
  const [hrs, setHrs] = useState("");
  const [mins, setMins] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(todayStr());

  const add = async () => {
    if (!topic.trim()) return;
    const dur = parseInt(hrs || 0) * 60 + parseInt(mins || 0);
    await insert({ subject: sub, topic: topic.trim(), duration: dur, notes, date });
    setTopic(""); setHrs(""); setMins(""); setNotes("");
  };

  const grouped = logs.reduce((acc, l) => { (acc[l.date] = acc[l.date] || []).push(l); return acc; }, {});
  const dates = Object.keys(grouped).sort().reverse();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div><div className="section-title">Study Log</div><div className="section-sub">Permanently saved — 1 saal baad bhi milega</div></div>
      <div className="card">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div><div className="lbl">Date</div><input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
          <div><div className="lbl">Subject</div><select value={sub} onChange={e => setSub(e.target.value)}>{Object.keys(SYL).map(s => <option key={s}>{s}</option>)}</select></div>
        </div>
        <div style={{ marginBottom: 10 }}><div className="lbl">Topic</div><input placeholder="e.g. Cell Division, Ray Optics..." value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div><div className="lbl">Hours</div><input type="number" min="0" max="24" placeholder="0" value={hrs} onChange={e => setHrs(e.target.value)} /></div>
          <div><div className="lbl">Minutes</div><input type="number" min="0" max="59" placeholder="0" value={mins} onChange={e => setMins(e.target.value)} /></div>
        </div>
        <div style={{ marginBottom: 12 }}><div className="lbl">Notes</div><textarea rows={2} placeholder="Kya cover kiya?" value={notes} onChange={e => setNotes(e.target.value)} style={{ resize: "none" }} /></div>
        <button className="btn btn-primary" onClick={add} style={{ width: "100%" }}>+ Add Session</button>
      </div>
      {loading && <div style={{ display: "flex", justifyContent: "center", padding: 20 }}><div className="spinner" /></div>}
      {!loading && dates.length === 0 && <Empty text="No sessions yet. Start logging!" emoji="📖" />}
      {dates.map(d => {
        const dl = grouped[d], tot = dl.reduce((a, l) => a + l.duration, 0);
        return (
          <div key={d} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontFamily: "'Playfair Display'", fontSize: 15, fontWeight: 600, color: "var(--gold)" }}>{fmtDate(d)}</span>
              <span style={{ fontSize: 12, color: "var(--text3)", fontWeight: 600 }}>{Math.floor(tot / 60)}h {tot % 60}m</span>
            </div>
            {dl.map((l, i) => (
              <div key={l.id} style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none", paddingTop: i > 0 ? 10 : 0, marginTop: i > 0 ? 10 : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 3 }}>
                      <span className={`tag ${SUB_T[l.subject] || "gen"}`}>{l.subject}</span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{l.topic}</span>
                    </div>
                    {l.notes && <div style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.5 }}>{l.notes}</div>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gold)", whiteSpace: "nowrap" }}>{Math.floor(l.duration / 60)}h {l.duration % 60}m</span>
                    <button className="btn btn-icon" onClick={() => remove(l.id)}><Ic n="trash" s={13} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function TodoTab({ user }) {
  const { rows: todos, insert, update, remove, loading } = useTable("todos", user.id);
  const [text, setText] = useState(""); const [sub, setSub] = useState("Biology"); const [date, setDate] = useState(todayStr()); const [prio, setPrio] = useState("medium"); const [filt, setFilt] = useState("today");
  const add = async () => { if (!text.trim()) return; await insert({ text: text.trim(), subject: sub, date, priority: prio, done: false }); setText(""); };
  const filtered = todos.filter(t => filt === "today" ? t.date === todayStr() : filt === "pending" ? !t.done && t.date <= todayStr() : true);
  const prioC = { high: "var(--red)", medium: "var(--orange)", low: "var(--green)" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div><div className="section-title">To-Do</div><div className="section-sub">Daily tasks & chapter targets</div></div>
      <div className="card">
        <div style={{ marginBottom: 10 }}><div className="lbl">Task</div><input placeholder="What needs to be done?" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          <div><div className="lbl">Subject</div><select value={sub} onChange={e => setSub(e.target.value)}>{Object.keys(SYL).map(s => <option key={s}>{s}</option>)}<option>General</option></select></div>
          <div><div className="lbl">Priority</div><select value={prio} onChange={e => setPrio(e.target.value)}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
          <div><div className="lbl">Date</div><input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
        </div>
        <button className="btn btn-primary" onClick={add} style={{ width: "100%" }}>+ Add Task</button>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {[["today", "Today"], ["pending", "Pending"], ["all", "All"]].map(([v, l]) => <button key={v} onClick={() => setFilt(v)} className={`filter-btn ${filt === v ? "active" : ""}`}>{l}</button>)}
        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text3)" }}>{filtered.filter(t => t.done).length}/{filtered.length} done</span>
      </div>
      {loading && <div style={{ display: "flex", justifyContent: "center", padding: 20 }}><div className="spinner" /></div>}
      {!loading && filtered.length === 0 && <Empty text="No tasks here." emoji="✅" />}
      {filtered.map(t => (
        <div key={t.id} className="card" style={{ opacity: t.done ? 0.5 : 1, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className={`check-btn btn ${t.done ? "done" : ""}`} onClick={() => update(t.id, { done: !t.done })} style={{ padding: 0 }}>{t.done && <Ic n="check" s={11} />}</button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: t.done ? "var(--text3)" : "var(--text)", textDecoration: t.done ? "line-through" : "none", fontWeight: 500 }}>{t.text}</div>
              <div style={{ display: "flex", gap: 5, marginTop: 4, flexWrap: "wrap" }}>
                {t.subject !== "General" && <span className={`tag ${SUB_T[t.subject] || "gen"}`}>{t.subject}</span>}
                <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 20, background: `${prioC[t.priority]}15`, color: prioC[t.priority], fontWeight: 600 }}>{t.priority}</span>
                <span style={{ fontSize: 10, color: "var(--text3)" }}>{fmtDate(t.date)}</span>
              </div>
            </div>
            <button className="btn btn-icon" onClick={() => remove(t.id)}><Ic n="trash" s={13} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

function TargetTab({ user }) {
  const { rows: targets, insert, update, remove, loading } = useTable("targets", user.id);
  const [text, setText] = useState(""); const [type, setType] = useState("daily"); const [prio, setPrio] = useState("medium"); const [dl, setDl] = useState(""); const [view, setView] = useState("active");
  const add = async () => { if (!text.trim()) return; await insert({ text: text.trim(), type, priority: prio, deadline: dl || null, status: "active", date: todayStr() }); setText(""); setDl(""); };
  const shown = targets.filter(t => view === "active" ? t.status !== "done" : t.status === "done");
  const prioC = { high: "var(--red)", medium: "var(--orange)", low: "var(--green)" };
  const typeC = { daily: "#6366f1", weekly: "#10b981", monthly: "#f59e0b", longterm: "#c9a84c" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div><div className="section-title">Goals & Targets</div><div className="section-sub">Set clear goals — track over time</div></div>
      <div className="card">
        <div style={{ marginBottom: 10 }}><div className="lbl">Goal</div><input placeholder="What do you want to achieve?" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          <div><div className="lbl">Type</div><select value={type} onChange={e => setType(e.target.value)}>{["daily", "weekly", "monthly", "longterm"].map(v => <option key={v}>{v}</option>)}</select></div>
          <div><div className="lbl">Priority</div><select value={prio} onChange={e => setPrio(e.target.value)}>{["high", "medium", "low"].map(v => <option key={v}>{v}</option>)}</select></div>
          <div><div className="lbl">Deadline</div><input type="date" value={dl} onChange={e => setDl(e.target.value)} /></div>
        </div>
        <button className="btn btn-primary" onClick={add} style={{ width: "100%" }}>+ Add Goal</button>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {[["active", "Active"], ["done", "Done"]].map(([v, l]) => <button key={v} onClick={() => setView(v)} className={`filter-btn ${view === v ? "active" : ""}`}>{l} ({targets.filter(t => v === "active" ? t.status !== "done" : t.status === "done").length})</button>)}
      </div>
      {loading && <div style={{ display: "flex", justifyContent: "center", padding: 20 }}><div className="spinner" /></div>}
      {!loading && shown.length === 0 && <Empty text={`No ${view} goals.`} emoji="🎯" />}
      {shown.map(t => (
        <div key={t.id} className="card" style={{ opacity: t.status === "done" ? 0.5 : 1, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <button className={`check-btn btn ${t.status === "done" ? "done" : ""}`} onClick={() => update(t.id, { status: t.status === "done" ? "active" : "done" })} style={{ marginTop: 2, padding: 0 }}>{t.status === "done" && <Ic n="check" s={11} />}</button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: t.status === "done" ? "var(--text3)" : "var(--text)", textDecoration: t.status === "done" ? "line-through" : "none", marginBottom: 6 }}>{t.text}</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                <span style={{ fontSize: 9, padding: "1px 7px", borderRadius: 20, background: `${typeC[t.type]}15`, color: typeC[t.type], fontWeight: 600 }}>{t.type}</span>
                <span style={{ fontSize: 9, padding: "1px 7px", borderRadius: 20, background: `${prioC[t.priority]}15`, color: prioC[t.priority], fontWeight: 600 }}>{t.priority}</span>
                {t.deadline && <span style={{ fontSize: 10, color: "var(--text3)" }}>📅 {fmtDate(t.deadline)}</span>}
                <span style={{ fontSize: 10, color: "var(--text3)" }}>Set {fmtDate(t.date)}</span>
              </div>
            </div>
            <button className="btn btn-icon" onClick={() => remove(t.id)}><Ic n="trash" s={13} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

function MockTab({ user }) {
  const { rows: mocks, insert, remove, loading } = useTable("mocks", user.id);
  const [name, setName] = useState(""); const [date, setDate] = useState(todayStr()); const [score, setScore] = useState(""); const [total, setTotal] = useState("720"); const [bio, setBio] = useState(""); const [phy, setPhy] = useState(""); const [che, setChe] = useState(""); const [notes, setNotes] = useState("");
  const save = async () => { if (!score) return; await insert({ name, date, score: +score, total: +total, bio: +bio || 0, phy: +phy || 0, che: +che || 0, notes }); setName(""); setScore(""); setBio(""); setPhy(""); setChe(""); setNotes(""); };
  const sorted = [...mocks].sort((a, b) => new Date(b.date) - new Date(a.date));
  const avg = mocks.length ? Math.round(mocks.reduce((a, m) => a + m.score, 0) / mocks.length) : 0;
  const best = mocks.length ? Math.max(...mocks.map(m => m.score)) : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div><div className="section-title">Mock Tests</div><div className="section-sub">Track every test — watch the curve rise</div></div>
      {mocks.length > 0 && <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>{[["📝", mocks.length, "Tests"], ["📈", avg, "Avg"], ["🏆", best, "Best"]].map(([e, v, l]) => <div key={l} className="stat-card"><div style={{ fontSize: 18, marginBottom: 3 }}>{e}</div><div className="stat-num">{v}</div><div className="stat-lbl">{l}</div></div>)}</div>}
      <div className="card">
        <div className="lbl" style={{ marginBottom: 10 }}>Add Result</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}><div><div className="lbl">Test Name</div><input placeholder="Mock #1" value={name} onChange={e => setName(e.target.value)} /></div><div><div className="lbl">Date</div><input type="date" value={date} onChange={e => setDate(e.target.value)} /></div></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}><div><div className="lbl">Score</div><input type="number" placeholder="450" value={score} onChange={e => setScore(e.target.value)} /></div><div><div className="lbl">Out of</div><input type="number" placeholder="720" value={total} onChange={e => setTotal(e.target.value)} /></div></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}><div><div className="lbl">Biology</div><input type="number" placeholder="0" value={bio} onChange={e => setBio(e.target.value)} /></div><div><div className="lbl">Physics</div><input type="number" placeholder="0" value={phy} onChange={e => setPhy(e.target.value)} /></div><div><div className="lbl">Chemistry</div><input type="number" placeholder="0" value={che} onChange={e => setChe(e.target.value)} /></div></div>
        <div style={{ marginBottom: 12 }}><div className="lbl">Notes</div><textarea rows={2} placeholder="Mistakes, weak areas..." value={notes} onChange={e => setNotes(e.target.value)} style={{ resize: "none" }} /></div>
        <button className="btn btn-primary" onClick={save} style={{ width: "100%" }}>+ Save Result</button>
      </div>
      {loading && <div style={{ display: "flex", justifyContent: "center", padding: 20 }}><div className="spinner" /></div>}
      {!loading && sorted.length === 0 && <Empty text="No mock tests yet!" emoji="📊" />}
      {sorted.map(m => { const pct = Math.round(m.score / m.total * 100); const c = pct >= 70 ? "var(--green)" : pct >= 50 ? "var(--orange)" : "var(--red)"; return (
        <div key={m.id} className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div><div style={{ fontWeight: 600, fontSize: 14 }}>{m.name || "Mock Test"}</div><div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>{fmtDate(m.date)}</div></div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ textAlign: "right" }}><div style={{ fontFamily: "'Playfair Display'", fontSize: 22, fontWeight: 700, color: "var(--gold2)" }}>{m.score}<span style={{ fontSize: 11, color: "var(--text3)", fontFamily: "'DM Sans'" }}>/{m.total}</span></div><div style={{ fontSize: 14, fontWeight: 700, color: c }}>{pct}%</div></div>
              <button className="btn btn-icon" onClick={() => remove(m.id)}><Ic n="trash" s={13} /></button>
            </div>
          </div>
          {(m.bio + m.phy + m.che) > 0 && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>{[["Bio", m.bio, "var(--green)"], ["Phy", m.phy, "var(--blue)"], ["Che", m.che, "var(--orange)"]].map(([l, v, c]) => <div key={l} style={{ background: "var(--bg3)", borderRadius: 8, padding: 8, textAlign: "center" }}><div style={{ fontSize: 15, fontWeight: 700, color: c, fontFamily: "'Playfair Display'" }}>{v}</div><div style={{ fontSize: 9, color: "var(--text3)", fontWeight: 600, textTransform: "uppercase" }}>{l}</div></div>)}</div>}
          {m.notes && <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 8, borderTop: "1px solid var(--border)", paddingTop: 7, lineHeight: 1.5 }}>{m.notes}</div>}
        </div>
      ); })}
    </div>
  );
}

function SylTab({ user }) {
  const { progress: prog, setTopicStatus, loading } = useSyllabus(user.id);
  const [active, setActive] = useState("Biology");
  const [search, setSearch] = useState("");
  const topics = SYL[active].filter(t => t.toLowerCase().includes(search.toLowerCase()));
  const done = SYL[active].filter(t => (prog[`${active}__${t}`] || 0) >= 2).length;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div><div className="section-title">Syllabus</div><div className="section-sub">Mark every chapter — Bio, Phy, Chem</div></div>
      <div style={{ display: "flex", gap: 8 }}>{Object.keys(SYL).map(s => <button key={s} onClick={() => { setActive(s); setSearch(""); }} className={`filter-btn ${active === s ? "active" : ""}`} style={{ flex: 1, borderColor: active === s ? SUB_C[s] : undefined, color: active === s ? SUB_C[s] : undefined }}>{s}</button>)}</div>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontWeight: 600, color: SUB_C[active], fontSize: 14 }}>{active}</span><span style={{ fontSize: 12, color: "var(--text3)", fontWeight: 600 }}>{done}/{SYL[active].length} done · {Math.round(done / SYL[active].length * 100)}%</span></div>
        <div className="pbar" style={{ height: 6 }}><div className="pfill" style={{ width: `${Math.round(done / SYL[active].length * 100)}%`, background: SUB_C[active] }} /></div>
      </div>
      <input placeholder="🔍 Search topics..." value={search} onChange={e => setSearch(e.target.value)} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{STATUS_N.map((l, i) => <span key={l} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--text3)" }}><span style={{ width: 8, height: 8, borderRadius: 2, background: STATUS_C[i], display: "inline-block" }} />{l}</span>)}</div>
      {loading && <div style={{ display: "flex", justifyContent: "center", padding: 20 }}><div className="spinner" /></div>}
      {!loading && topics.map(topic => { const k = `${active}__${topic}`; const st = prog[k] || 0; return (
        <div key={topic} className="card" style={{ padding: "10px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: st >= 2 ? "var(--text3)" : "var(--text)", fontWeight: 500, flex: 1, paddingRight: 10 }}>{topic}</span>
            <div style={{ display: "flex", gap: 5 }}>{STATUS_L.map((l, i) => <button key={i} onClick={() => setTopicStatus(k, i)} className="btn" style={{ width: 28, height: 28, borderRadius: 7, border: `1.5px solid ${st === i ? STATUS_C[i] : "var(--border2)"}`, background: st === i ? `${STATUS_C[i]}18` : "transparent", color: st === i ? STATUS_C[i] : "var(--text3)", fontSize: 10, fontWeight: 700 }}>{l}</button>)}</div>
          </div>
        </div>
      ); })}
    </div>
  );
}

function HistTab({ user }) {
  const { rows: logs } = useTable("study_logs", user.id);
  const { rows: targets } = useTable("targets", user.id);
  const { rows: mocks } = useTable("mocks", user.id);
  const { rows: todos } = useTable("todos", user.id);
  const [filt, setFilt] = useState("all"); const [search, setSearch] = useState("");
  const all = [...logs.map(l => ({ ...l, _t: "log", _d: l.date })), ...targets.map(t => ({ ...t, _t: "target", _d: t.date })), ...mocks.map(m => ({ ...m, _t: "mock", _d: m.date })), ...todos.map(t => ({ ...t, _t: "todo", _d: t.date }))].filter(e => { if (filt !== "all" && e._t !== filt) return false; if (search && !JSON.stringify(e).toLowerCase().includes(search.toLowerCase())) return false; return true; }).sort((a, b) => new Date(b._d) - new Date(a._d));
  const grouped = all.reduce((acc, e) => { (acc[e._d] = acc[e._d] || []).push(e); return acc; }, {});
  const dates = Object.keys(grouped).sort().reverse();
  const tC = { log: "var(--gold)", target: "var(--blue)", mock: "var(--green)", todo: "var(--text3)" };
  const tE = { log: "📖", target: "🎯", mock: "📊", todo: "✅" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div><div className="section-title">Full History</div><div className="section-sub">✨ 1 saal baad bhi yahan milega — cloud mein safe</div></div>
      <input placeholder="🔍 Search..." value={search} onChange={e => setSearch(e.target.value)} />
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{[["all", "All"], ["log", "📖 Study"], ["target", "🎯 Goals"], ["mock", "📊 Mocks"], ["todo", "✅ Tasks"]].map(([v, l]) => <button key={v} onClick={() => setFilt(v)} className={`filter-btn ${filt === v ? "active" : ""}`}>{l}</button>)}</div>
      {dates.length === 0 && <Empty text="Start your journey — sab yahan dikhega!" emoji="🗓" />}
      {dates.map(d => (
        <div key={d}>
          <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", padding: "6px 2px", borderBottom: "1px solid var(--border)", marginBottom: 8 }}>{fmtDate(d)}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {grouped[d].map((e, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", background: "var(--bg2)", borderRadius: 10, borderLeft: `3px solid ${tC[e._t]}` }}>
                <span style={{ fontSize: 15, marginTop: 1 }}>{tE[e._t]}</span>
                <div style={{ flex: 1, minWidth: 0, fontSize: 12 }}>
                  {e._t === "log" && <><div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3 }}><span className={`tag ${SUB_T[e.subject] || "gen"}`}>{e.subject}</span><span style={{ color: "var(--text)", fontWeight: 500 }}>{e.topic}</span></div>{e.notes && <div style={{ color: "var(--text3)", marginBottom: 3 }}>{e.notes}</div>}<span style={{ color: "var(--gold)", fontWeight: 600 }}>{Math.floor(e.duration / 60)}h {e.duration % 60}m</span></>}
                  {e._t === "target" && <><div style={{ color: "var(--text)", fontWeight: 500, marginBottom: 3 }}>{e.text}</div><span style={{ color: e.status === "done" ? "var(--green)" : "var(--text3)" }}>{e.status === "done" ? "✓ Completed" : "Active"} · {e.type}</span></>}
                  {e._t === "mock" && <><div style={{ color: "var(--text)", fontWeight: 500, marginBottom: 3 }}>{e.name || "Mock Test"}</div><span style={{ color: "var(--gold)", fontWeight: 600 }}>{e.score}/{e.total} ({Math.round(e.score / e.total * 100)}%)</span></>}
                  {e._t === "todo" && <><div style={{ color: e.done ? "var(--text3)" : "var(--text)", textDecoration: e.done ? "line-through" : "none", fontWeight: 500 }}>{e.text}</div><span style={{ color: e.done ? "var(--green)" : "var(--text3)", display: "block", marginTop: 2 }}>{e.done ? "✓ Done" : "Pending"}</span></>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
