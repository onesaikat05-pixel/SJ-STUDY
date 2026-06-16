import { useState, useEffect, useRef, useCallback } from "react";
import { supabase, CSS, Ic, Empty, todayStr, uid, fmtDate, fmtTimer, timeAgo, SYL, SUB_C, SUB_T, STATUS_L, STATUS_C, STATUS_N } from "./lib";
import { useAuth, useProfile, useLiveStatus, useTable, useSyllabus, useSquad } from "./hooks";

// ════════════════════════════════════════════════════════════════════
// ROOT APP
// ════════════════════════════════════════════════════════════════════
export default function App() {
  const { user, signInGoogle, signOut } = useAuth();
  const profile = useProfile(user);
  const [tab, setTab] = useState("home");

  if (user === undefined) return <SplashScreen />;
  if (!user) return <LoginScreen onLogin={signInGoogle} />;
  if (!profile) return <SplashScreen />;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "var(--bg)", minHeight: "100vh", color: "var(--text)", display: "flex", flexDirection: "column", maxWidth: 600, margin: "0 auto" }}>
      <style>{CSS}</style>
      <Header profile={profile} onLogout={signOut} />
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 88px" }}>
        <div className="fade-up" key={tab}>
          {tab === "home"   && <HomeTab user={user} profile={profile} />}
          {tab === "log"    && <LogTab user={user} />}
          {tab === "todo"   && <TodoTab user={user} />}
          {tab === "target" && <TargetTab user={user} />}
          {tab === "timer"  && <TimerTab user={user} />}
          {tab === "mock"   && <MockTab user={user} />}
          {tab === "syl"    && <SylTab user={user} />}
          {tab === "squad"  && <SquadTab user={user} />}
          {tab === "hist"   && <HistTab user={user} />}
        </div>
      </div>
      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}

// ── SPLASH ────────────────────────────────────────────────────────────
function SplashScreen() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{CSS}</style>
      <div className="spinner" />
    </div>
  );
}

// ── LOGIN ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, maxWidth: 600, margin: "0 auto" }}>
      <style>{CSS}</style>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ width: 76, height: 76, background: "linear-gradient(135deg, #b8900a, #e8c86a)", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, margin: "0 auto 16px", boxShadow: "0 12px 40px rgba(201,168,76,.3)" }}>🩺</div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, fontWeight: 700, color: "var(--gold2)", letterSpacing: "-0.5px" }}>SJ STUDY</div>
        <div style={{ fontSize: 13, color: "var(--text3)", marginTop: 4, letterSpacing: "3px", textTransform: "uppercase", fontWeight: 500 }}>NEET Study OS</div>
      </div>

      <div style={{ width: "100%", maxWidth: 340 }}>
        <div style={{ fontSize: 13, color: "var(--text2)", textAlign: "center", marginBottom: 24, lineHeight: 1.6 }}>
          Sign in to track your study, goals & connect with your squad.
        </div>

        <button className="btn" onClick={onLogin}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "14px 24px", background: "#fff", color: "#1f1f1f", borderRadius: 12, width: "100%", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H1.83v2.84C3.64 20.53 7.48 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H1.83A10.97 10.97 0 000 12c0 1.77.43 3.45 1.83 4.93l4.01-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.48 1 3.64 3.47 1.83 7.07l4.01 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ marginTop: 24, padding: 16, background: "var(--bg2)", borderRadius: 12, border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.7 }}>
            🔒 Your data is private and saved permanently to your account — accessible 1 year from now, from any device.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── HEADER ────────────────────────────────────────────────────────────
function Header({ profile, onLogout }) {
  const [showMenu, setShowMenu] = useState(false);
  return (
    <div style={{ background: "var(--bg2)", borderBottom: "1px solid var(--border)", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(12px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #b8900a, #e8c86a)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>🩺</div>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: "var(--gold2)", lineHeight: 1 }}>SJ STUDY</div>
          <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: "2px", textTransform: "uppercase", fontWeight: 600 }}>NEET 2026</div>
        </div>
      </div>
      <div style={{ position: "relative" }}>
        <button className="btn" onClick={() => setShowMenu(s => !s)}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 10px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10 }}>
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" style={{ width: 26, height: 26, borderRadius: 8, objectFit: "cover" }} />
          ) : (
            <div style={{ width: 26, height: 26, borderRadius: 8, background: `${profile.color}22`, border: `1.5px solid ${profile.color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: profile.color }}>{profile.initials}</div>
          )}
          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text2)", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.name}</span>
        </button>
        {showMenu && (
          <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: 10, padding: 8, minWidth: 150, zIndex: 200, boxShadow: "0 8px 32px rgba(0,0,0,.4)" }}>
            <button className="btn" onClick={() => { setShowMenu(false); onLogout(); }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "none", color: "var(--text2)", fontSize: 13, width: "100%", borderRadius: 7 }}>
              <Ic n="logout" s={14} /> Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── BOTTOM NAV ────────────────────────────────────────────────────────
function BottomNav({ tab, setTab }) {
  const tabs = [
    { id: "home",   icon: "home",    label: "Home" },
    { id: "log",    icon: "log",     label: "Log" },
    { id: "todo",   icon: "todo",    label: "Tasks" },
    { id: "target", icon: "target",  label: "Goals" },
    { id: "timer",  icon: "timer",   label: "Timer" },
    { id: "squad",  icon: "users",   label: "Squad" },
    { id: "mock",   icon: "mock",    label: "Mocks" },
    { id: "syl",    icon: "book",    label: "Syllabus" },
    { id: "hist",   icon: "history", label: "History" },
  ];
  return (
    <div style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)", display: "flex", position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, maxWidth: 600, margin: "0 auto", overflowX: "auto" }}>
      {tabs.map(t => (
        <button key={t.id} className={`nav-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
          <Ic n={t.icon} s={15} />
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// HOME TAB
// ════════════════════════════════════════════════════════════════════
function HomeTab({ user, profile }) {
  const { rows: logs }    = useTable("study_logs", user.id);
  const { rows: todos }   = useTable("todos", user.id);
  const { rows: mocks }   = useTable("mocks", user.id);
  const { progress: syl } = useSyllabus(user.id);

  const [nDate, setNDate] = useState(profile.neet_date || "2026-05-04");
  const saveDate = async (val) => {
    setNDate(val);
    await supabase.from("profiles").update({ neet_date: val }).eq("id", user.id);
  };

  const todayLogs  = logs.filter(l => l.date === todayStr());
  const totalMins  = todayLogs.reduce((a, l) => a + (l.duration || 0), 0);
  const todayTasks = todos.filter(t => t.date === todayStr());
  const doneTasks  = todayTasks.filter(t => t.done).length;

  const streak = (() => {
    const dates = [...new Set(logs.map(l => l.date))].sort().reverse();
    let s = 0, d = new Date();
    for (const dt of dates) {
      const diff = Math.floor((d - new Date(dt + "T12:00:00")) / 86400000);
      if (diff > 1) break;
      s++; d = new Date(dt + "T12:00:00");
    }
    return s;
  })();

  const daysLeft = Math.max(0, Math.ceil((new Date(nDate + "T00:00:00") - new Date()) / 86400000));
  const allTopics = Object.values(SYL).flat().length;
  const doneSyl   = Object.values(syl).filter(v => v >= 2).length;
  const subToday  = todayLogs.reduce((acc, l) => { acc[l.subject] = (acc[l.subject] || 0) + l.duration; return acc; }, {});
  const lastMock  = mocks[0];

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().slice(0, 10);
    const mins = logs.filter(l => l.date === ds).reduce((a, l) => a + l.duration, 0);
    return { day: d.toLocaleDateString("en-IN", { weekday: "short" }), mins };
  });
  const maxMins = Math.max(...last7.map(d => d.mins), 60);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ background: "linear-gradient(135deg, #0f0f20 0%, #0d0d18 100%)", border: "1px solid rgba(201,168,76,.2)", borderRadius: 16, padding: "22px 18px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -20, top: -20, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,.06) 0%, transparent 70%)" }} />
        <div style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "2px", fontWeight: 600, marginBottom: 6 }}>Time Remaining</div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 64, fontWeight: 700, color: "var(--gold2)", lineHeight: 1 }}>{daysLeft}</div>
        <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>days to NEET &nbsp;·&nbsp;
          <input type="date" value={nDate} onChange={e => saveDate(e.target.value)}
            style={{ background: "transparent", border: "none", color: "var(--text3)", fontSize: 11, width: "auto", padding: 0, outline: "none" }} />
        </div>
        {streak > 0 && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 10, background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.2)", borderRadius: 20, padding: "4px 10px" }}>
            <span style={{ fontSize: 14 }}>🔥</span>
            <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>{streak} day streak</span>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        <div className="stat-card">
          <div style={{ fontSize: 20, marginBottom: 4 }}>📚</div>
          <div className="stat-num">{Math.floor(totalMins / 60)}h {totalMins % 60}m</div>
          <div className="stat-lbl">Today</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: 20, marginBottom: 4 }}>✅</div>
          <div className="stat-num">{doneTasks}<span style={{ fontSize: 14, color: "var(--text3)" }}>/{todayTasks.length}</span></div>
          <div className="stat-lbl">Tasks</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: 20, marginBottom: 4 }}>📈</div>
          <div className="stat-num">{Math.round(doneSyl / allTopics * 100)}<span style={{ fontSize: 14, color: "var(--text3)" }}>%</span></div>
          <div className="stat-lbl">Syllabus</div>
        </div>
      </div>

      <div className="card">
        <div className="lbl" style={{ marginBottom: 12 }}>Weekly Study (Hours)</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60 }}>
          {last7.map((d, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: "100%", borderRadius: "4px 4px 0 0", background: d.mins > 0 ? `linear-gradient(180deg, var(--gold2), var(--gold))` : "var(--bg3)", height: `${Math.max(3, (d.mins / maxMins) * 52)}px`, transition: "height .4s ease", opacity: i === 6 ? 1 : 0.7 }} />
              <span style={{ fontSize: 9, color: "var(--text3)", fontWeight: 600, textTransform: "uppercase" }}>{d.day}</span>
            </div>
          ))}
        </div>
      </div>

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

      <div className="card">
        <div className="lbl" style={{ marginBottom: 12 }}>Syllabus Coverage</div>
        {Object.entries(SYL).map(([sub, topics]) => {
          const done = topics.filter(t => (syl[`${sub}__${t}`] || 0) >= 2).length;
          const pct = Math.round(done / topics.length * 100);
          return (
            <div key={sub} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: SUB_C[sub], fontWeight: 500 }}>{sub}</span>
                <span style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600 }}>{done}/{topics.length} &nbsp;{pct}%</span>
              </div>
              <div className="pbar"><div className="pfill" style={{ width: `${pct}%`, background: SUB_C[sub] }} /></div>
            </div>
          );
        })}
      </div>

      {lastMock && (
        <div className="card card-hi">
          <div className="lbl" style={{ marginBottom: 10 }}>Last Mock Test</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: "var(--gold2)" }}>
                {lastMock.score}<span style={{ fontSize: 14, color: "var(--text3)", fontFamily: "'DM Sans'" }}>/{lastMock.total}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{fmtDate(lastMock.date)} · {lastMock.name || "Mock Test"}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: lastMock.score / lastMock.total >= .6 ? "var(--green)" : "var(--red)", fontFamily: "'Playfair Display'" }}>
                {Math.round(lastMock.score / lastMock.total * 100)}%
              </div>
              <div style={{ fontSize: 10, color: "var(--text3)" }}>Accuracy</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// STUDY LOG TAB
// ════════════════════════════════════════════════════════════════════
function LogTab({ user }) {
  const { rows: logs, insert, remove, loading } = useTable("study_logs", user.id);
  const [sub,   setSub]   = useState("Biology");
  const [topic, setTopic] = useState("");
  const [hrs,   setHrs]   = useState("");
  const [mins,  setMins]  = useState("");
  const [notes, setNotes] = useState("");
  const [date,  setDate]  = useState(todayStr());

  const add = async () => {
    if (!topic.trim()) return;
    const dur = parseInt(hrs || 0) * 60 + parseInt(mins || 0);
    await insert({ subject: sub, topic: topic.trim(), duration: dur, notes, date });
    setTopic(""); setHrs(""); setMins(""); setNotes("");
  };

  const grouped = logs.reduce((acc, l) => { (acc[l.date] = acc[l.date] || []).push(l); return acc; }, {});
  const dates   = Object.keys(grouped).sort().reverse();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div><div className="section-title">Study Log</div><div className="section-sub">Track every session — permanently saved</div></div>

      <div className="card">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div><div className="lbl">Date</div><input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
          <div><div className="lbl">Subject</div>
            <select value={sub} onChange={e => setSub(e.target.value)}>
              {Object.keys(SYL).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 10 }}><div className="lbl">Topic / Chapter</div><input placeholder="e.g. Cell Division, Ray Optics, Equilibrium..." value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div><div className="lbl">Hours</div><input type="number" min="0" max="24" placeholder="0" value={hrs} onChange={e => setHrs(e.target.value)} /></div>
          <div><div className="lbl">Minutes</div><input type="number" min="0" max="59" placeholder="0" value={mins} onChange={e => setMins(e.target.value)} /></div>
        </div>
        <div style={{ marginBottom: 12 }}><div className="lbl">Notes (optional)</div><textarea rows={2} placeholder="What did you cover? Any doubts?" value={notes} onChange={e => setNotes(e.target.value)} style={{ resize: "none" }} /></div>
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
              <span style={{ fontSize: 12, color: "var(--text3)", fontWeight: 600 }}>{Math.floor(tot / 60)}h {tot % 60}m total</span>
            </div>
            {dl.map((l, i) => (
              <div key={l.id} style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none", paddingTop: i > 0 ? 10 : 0, marginTop: i > 0 ? 10 : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 3 }}>
                      <span className={`tag ${SUB_T[l.subject] || "gen"}`}>{l.subject}</span>
                      <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{l.topic}</span>
                    </div>
                    {l.notes && <div style={{ fontSize: 11, color: "var(--text3)", marginLeft: 1, lineHeight: 1.5 }}>{l.notes}</div>}
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

// ════════════════════════════════════════════════════════════════════
// TODO TAB
// ════════════════════════════════════════════════════════════════════
function TodoTab({ user }) {
  const { rows: todos, insert, update, remove, loading } = useTable("todos", user.id);
  const [text,  setText]  = useState("");
  const [sub,   setSub]   = useState("Biology");
  const [date,  setDate]  = useState(todayStr());
  const [prio,  setPrio]  = useState("medium");
  const [filt,  setFilt]  = useState("today");

  const add = async () => {
    if (!text.trim()) return;
    await insert({ text: text.trim(), subject: sub, date, priority: prio, done: false });
    setText("");
  };

  const filtered = todos.filter(t =>
    filt === "today"   ? t.date === todayStr() :
    filt === "pending" ? !t.done && t.date <= todayStr() : true
  );
  const prioC = { high: "var(--red)", medium: "var(--orange)", low: "var(--green)" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div><div className="section-title">To-Do</div><div className="section-sub">Daily tasks & chapter targets</div></div>

      <div className="card">
        <div style={{ marginBottom: 10 }}><div className="lbl">Task</div><input placeholder="What needs to be done?" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          <div><div className="lbl">Subject</div>
            <select value={sub} onChange={e => setSub(e.target.value)}>
              {Object.keys(SYL).map(s => <option key={s}>{s}</option>)}
              <option>General</option>
            </select>
          </div>
          <div><div className="lbl">Priority</div>
            <select value={prio} onChange={e => setPrio(e.target.value)}>
              <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
            </select>
          </div>
          <div><div className="lbl">For Date</div><input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
        </div>
        <button className="btn btn-primary" onClick={add} style={{ width: "100%" }}>+ Add Task</button>
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        {[["today", "Today"], ["pending", "Pending"], ["all", "All"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilt(v)} className={`filter-btn ${filt === v ? "active" : ""}`}>{l}</button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text3)", alignSelf: "center" }}>
          {filtered.filter(t => t.done).length}/{filtered.length} done
        </span>
      </div>

      {loading && <div style={{ display: "flex", justifyContent: "center", padding: 20 }}><div className="spinner" /></div>}
      {!loading && filtered.length === 0 && <Empty text="No tasks here." emoji="✅" />}

      {filtered.map(t => (
        <div key={t.id} className="card" style={{ opacity: t.done ? 0.5 : 1, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className={`check-btn btn ${t.done ? "done" : ""}`} onClick={() => update(t.id, { done: !t.done })} style={{ padding: 0 }}>
              {t.done && <Ic n="check" s={11} />}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: t.done ? "var(--text3)" : "var(--text)", textDecoration: t.done ? "line-through" : "none", fontWeight: 500 }}>{t.text}</div>
              <div style={{ display: "flex", gap: 5, marginTop: 4, alignItems: "center", flexWrap: "wrap" }}>
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

// ════════════════════════════════════════════════════════════════════
// TARGETS TAB
// ════════════════════════════════════════════════════════════════════
function TargetTab({ user }) {
  const { rows: targets, insert, update, remove, loading } = useTable("targets", user.id);
  const [text, setText]   = useState("");
  const [type, setType]   = useState("daily");
  const [prio, setPrio]   = useState("medium");
  const [dl,   setDl]     = useState("");
  const [view, setView]   = useState("active");

  const add = async () => {
    if (!text.trim()) return;
    await insert({ text: text.trim(), type, priority: prio, deadline: dl || null, status: "active", date: todayStr() });
    setText(""); setDl("");
  };

  const shown = targets.filter(t => view === "active" ? t.status !== "done" : t.status === "done");
  const prioC = { high: "var(--red)", medium: "var(--orange)", low: "var(--green)" };
  const typeC = { daily: "#6366f1", weekly: "#10b981", monthly: "#f59e0b", longterm: "#c9a84c" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div><div className="section-title">Goals & Targets</div><div className="section-sub">Set clear, dated goals — track progress over time</div></div>

      <div className="card">
        <div style={{ marginBottom: 10 }}><div className="lbl">Goal</div><input placeholder="What do you want to achieve?" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          <div><div className="lbl">Type</div>
            <select value={type} onChange={e => setType(e.target.value)}>
              {["daily", "weekly", "monthly", "longterm"].map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div><div className="lbl">Priority</div>
            <select value={prio} onChange={e => setPrio(e.target.value)}>
              {["high", "medium", "low"].map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div><div className="lbl">Deadline</div><input type="date" value={dl} onChange={e => setDl(e.target.value)} /></div>
        </div>
        <button className="btn btn-primary" onClick={add} style={{ width: "100%" }}>+ Add Goal</button>
      </div>

      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {[["active", "Active"], ["done", "Completed"]].map(([v, l]) => (
          <button key={v} onClick={() => setView(v)} className={`filter-btn ${view === v ? "active" : ""}`}>{l} ({targets.filter(t => v === "active" ? t.status !== "done" : t.status === "done").length})</button>
        ))}
      </div>

      {loading && <div style={{ display: "flex", justifyContent: "center", padding: 20 }}><div className="spinner" /></div>}
      {!loading && shown.length === 0 && <Empty text={`No ${view} goals.`} emoji="🎯" />}

      {shown.map(t => (
        <div key={t.id} className="card" style={{ opacity: t.status === "done" ? 0.5 : 1, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <button className={`check-btn btn ${t.status === "done" ? "done" : ""}`} onClick={() => update(t.id, { status: t.status === "done" ? "active" : "done" })} style={{ marginTop: 2, padding: 0 }}>
              {t.status === "done" && <Ic n="check" s={11} />}
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: t.status === "done" ? "var(--text3)" : "var(--text)", textDecoration: t.status === "done" ? "line-through" : "none", fontWeight: 500, marginBottom: 6 }}>{t.text}</div>
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

// ════════════════════════════════════════════════════════════════════
// TIMER TAB — FIXED to properly save sessions
// ════════════════════════════════════════════════════════════════════
function TimerTab({ user }) {
  const { rows: sessions, insert: insertSession } = useTable("timer_sessions", user.id);
  const { insert: insertLog } = useTable("study_logs", user.id);
  const [mode,    setMode]    = useState("pomo");
  const [running, setRunning] = useState(false);
  const [time,    setTime]    = useState(25 * 60);
  const [elapsed, setElapsed] = useState(0);
  const [phase,   setPhase]   = useState("work");
  const [cycle,   setCycle]   = useState(0);
  const [wMin,    setWMin]    = useState(25);
  const [bMin,    setBMin]    = useState(5);
  const [lMin,    setLMin]    = useState(15);
  const [sub,     setSub]     = useState("Biology");
  const [topic,   setTopic]   = useState("");
  const [saved, setSaved] = useState(false);
  const ref = useRef(null);
  const elapsedRef = useRef(0); // ref to avoid stale closures
  const sessionLoggedRef = useRef(false);

  // Track live status for squad
  useLiveStatus(user, running, sub, topic);

  useEffect(() => { elapsedRef.current = elapsed; }, [elapsed]);

  useEffect(() => {
    if (!running) { clearInterval(ref.current); return; }
    ref.current = setInterval(() => {
      if (mode === "pomo") {
        setTime(t => {
          if (t <= 1) {
            if (phase === "work") {
              // Work phase completed — save this work session
              saveSession(wMin, true);
              const nc = cycle + 1; setCycle(nc);
              const np = nc % 4 === 0 ? "long" : "break";
              setPhase(np);
              return (np === "long" ? lMin : bMin) * 60;
            } else {
              setPhase("work");
              return wMin * 60;
            }
          }
          return t - 1;
        });
      } else {
        setElapsed(e => e + 1);
      }
    }, 1000);
    return () => clearInterval(ref.current);
  }, [running, mode, phase, cycle, wMin, bMin, lMin]);

  const saveSession = useCallback(async (durationMin, isPomo) => {
    if (durationMin < 1) return;
    const s = { subject: sub, topic, duration: durationMin, date: todayStr(), type: isPomo ? "pomo" : "normal" };
    await insertSession(s);
    await insertLog({ ...s, notes: `⏱ Timer session (${isPomo ? "Pomodoro" : "Normal"})` });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [sub, topic, insertSession, insertLog]);

  const reset = () => { setRunning(false); setElapsed(0); setTime(mode === "pomo" ? wMin * 60 : 0); setPhase("work"); setCycle(0); };

  const handleNormalSave = async () => {
    const mins = Math.floor(elapsedRef.current / 60);
    await saveSession(mins, false);
    reset();
  };

  const phaseC = { work: "var(--gold)", break: "var(--green)", long: "var(--blue)" };
  const R = 70, C = 2 * Math.PI * R;
  const total = (phase === "work" ? wMin : phase === "break" ? bMin : lMin) * 60;
  const pct = mode === "pomo" ? (total - time) / total : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div><div className="section-title">Focus Timer</div><div className="section-sub">Pomodoro & deep work sessions — auto-saved to your log</div></div>

      {saved && (
        <div style={{ background: "rgba(16,185,129,.1)", border: "1px solid rgba(16,185,129,.3)", borderRadius: 10, padding: "8px 14px", fontSize: 12, color: "var(--green)", display: "flex", alignItems: "center", gap: 8 }}>
          <Ic n="check" s={14} /> Session saved to your Study Log!
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        {[["pomo", "🍅 Pomodoro"], ["normal", "⏱ Normal"]].map(([v, l]) => (
          <button key={v} onClick={() => { setMode(v); reset(); setTime(v === "pomo" ? wMin * 60 : 0); }} className={`filter-btn ${mode === v ? "active" : ""}`} style={{ flex: 1, padding: "9px 0" }}>{l}</button>
        ))}
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "24px 16px" }}>
        {mode === "pomo" && (
          <div style={{ display: "flex", gap: 8 }}>
            {[["work", "Focus"], ["break", "Break"], ["long", "Long Rest"]].map(([p, l]) => (
              <span key={p} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: phase === p ? `${phaseC[p]}18` : "var(--bg3)", color: phase === p ? phaseC[p] : "var(--text3)", fontWeight: 600 }}>{l}</span>
            ))}
          </div>
        )}

        <div style={{ position: "relative", width: 168, height: 168 }}>
          <svg width={168} height={168} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={84} cy={84} r={R} fill="none" stroke="var(--bg3)" strokeWidth={8} />
            {mode === "pomo" && (
              <circle cx={84} cy={84} r={R} fill="none" stroke={phaseC[phase]} strokeWidth={8}
                strokeDasharray={C} strokeDashoffset={C * (1 - pct)} strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s linear" }} />
            )}
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: "'Playfair Display'", fontSize: 36, fontWeight: 700, color: mode === "pomo" ? phaseC[phase] : "var(--gold2)", letterSpacing: "-1px" }}>
              {mode === "normal" ? fmtTimer(elapsed) : fmtTimer(time)}
            </div>
            {mode === "pomo" && <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>Cycle {cycle + 1}</div>}
            {running && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                <div className="live-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} />
                <span style={{ fontSize: 9, color: "var(--green)", fontWeight: 600 }}>LIVE</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" onClick={reset} style={{ padding: "10px 14px" }}><Ic n="reset" s={15} /></button>
          <button className={`btn btn-primary ${running ? "pulse" : ""}`} onClick={() => setRunning(r => !r)} style={{ padding: "10px 32px", fontSize: 15 }}>
            {running ? "⏸ Pause" : "▶ Start"}
          </button>
          {mode === "normal" && elapsed > 0 && (
            <button className="btn btn-ghost" onClick={handleNormalSave}>Save</button>
          )}
        </div>
      </div>

      {mode === "pomo" && (
        <div className="card">
          <div className="lbl" style={{ marginBottom: 10 }}>Timer Settings</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[["Focus (min)", wMin, setWMin, "work"], ["Break (min)", bMin, setBMin, "break"], ["Long (min)", lMin, setLMin, "long"]].map(([l, v, s, p]) => (
              <div key={l}><div className="lbl">{l}</div>
                <input type="number" min="1" max="120" value={v} onChange={e => { s(+e.target.value); if (!running && phase === p) setTime(+e.target.value * 60); }} disabled={running} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="lbl" style={{ marginBottom: 10 }}>Session Info</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><div className="lbl">Subject</div>
            <select value={sub} onChange={e => setSub(e.target.value)} disabled={running}>
              {Object.keys(SYL).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div><div className="lbl">Topic</div><input placeholder="What are you studying?" value={topic} onChange={e => setTopic(e.target.value)} disabled={running} /></div>
        </div>
        {running && <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 8 }}>🟢 Your squad can see you're studying this right now</div>}
      </div>

      {sessions.length > 0 && (
        <div className="card">
          <div className="lbl" style={{ marginBottom: 10 }}>Recent Sessions</div>
          {sessions.slice(0, 5).map(s => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: "1px solid var(--border)" }}>
              <div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span className={`tag ${SUB_T[s.subject] || "gen"}`}>{s.subject}</span>
                  <span style={{ fontSize: 12, color: "var(--text2)" }}>{s.topic || "—"}</span>
                </div>
                <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>{fmtDate(s.date)}</div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--gold)" }}>{s.duration}m</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// MOCK TESTS TAB
// ════════════════════════════════════════════════════════════════════
function MockTab({ user }) {
  const { rows: mocks, insert, remove, loading } = useTable("mocks", user.id);
  const [name,  setName]  = useState("");
  const [date,  setDate]  = useState(todayStr());
  const [score, setScore] = useState("");
  const [total, setTotal] = useState("720");
  const [bio,   setBio]   = useState("");
  const [phy,   setPhy]   = useState("");
  const [che,   setChe]   = useState("");
  const [notes, setNotes] = useState("");

  const save = async () => {
    if (!score) return;
    await insert({ name, date, score: +score, total: +total, bio: +bio || 0, phy: +phy || 0, che: +che || 0, notes });
    setName(""); setScore(""); setBio(""); setPhy(""); setChe(""); setNotes("");
  };

  const sorted = [...mocks].sort((a, b) => new Date(b.date) - new Date(a.date));
  const avg    = mocks.length ? Math.round(mocks.reduce((a, m) => a + m.score, 0) / mocks.length) : 0;
  const best   = mocks.length ? Math.max(...mocks.map(m => m.score)) : 0;
  const last5  = [...mocks].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div><div className="section-title">Mock Tests</div><div className="section-sub">Track every test — watch the curve rise</div></div>

      {mocks.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {[["📝", mocks.length, "Tests"], ["📈", avg, "Avg Score"], ["🏆", best, "Best"]].map(([e, v, l]) => (
              <div key={l} className="stat-card">
                <div style={{ fontSize: 18, marginBottom: 3 }}>{e}</div>
                <div className="stat-num">{v}</div>
                <div className="stat-lbl">{l}</div>
              </div>
            ))}
          </div>

          {last5.length > 1 && (
            <div className="card">
              <div className="lbl" style={{ marginBottom: 10 }}>Score Trend</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 50 }}>
                {last5.map((m, i) => {
                  const h = Math.max(4, (m.score / m.total) * 46);
                  const c = m.score / m.total >= .6 ? "var(--green)" : m.score / m.total >= .4 ? "var(--orange)" : "var(--red)";
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                      <span style={{ fontSize: 9, color: "var(--text3)" }}>{m.score}</span>
                      <div style={{ width: "100%", background: c, borderRadius: "3px 3px 0 0", height: h, opacity: 0.8 }} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <div className="card">
        <div className="lbl" style={{ marginBottom: 10 }}>Add Result</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div><div className="lbl">Test Name</div><input placeholder="NEET Mock #1" value={name} onChange={e => setName(e.target.value)} /></div>
          <div><div className="lbl">Date</div><input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div><div className="lbl">Your Score</div><input type="number" placeholder="450" value={score} onChange={e => setScore(e.target.value)} /></div>
          <div><div className="lbl">Out of</div><input type="number" placeholder="720" value={total} onChange={e => setTotal(e.target.value)} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
          <div><div className="lbl">Biology</div><input type="number" placeholder="0" value={bio} onChange={e => setBio(e.target.value)} /></div>
          <div><div className="lbl">Physics</div><input type="number" placeholder="0" value={phy} onChange={e => setPhy(e.target.value)} /></div>
          <div><div className="lbl">Chemistry</div><input type="number" placeholder="0" value={che} onChange={e => setChe(e.target.value)} /></div>
        </div>
        <div style={{ marginBottom: 12 }}><div className="lbl">Notes / Analysis</div><textarea rows={2} placeholder="Mistakes, weak areas, what to revise..." value={notes} onChange={e => setNotes(e.target.value)} style={{ resize: "none" }} /></div>
        <button className="btn btn-primary" onClick={save} style={{ width: "100%" }}>+ Save Result</button>
      </div>

      {loading && <div style={{ display: "flex", justifyContent: "center", padding: 20 }}><div className="spinner" /></div>}
      {!loading && sorted.length === 0 && <Empty text="No mock tests yet. Add your first result!" emoji="📊" />}

      {sorted.map(m => {
        const pct = Math.round(m.score / m.total * 100);
        const c = pct >= 70 ? "var(--green)" : pct >= 50 ? "var(--orange)" : "var(--red)";
        return (
          <div key={m.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>{m.name || "Mock Test"}</div>
                <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>{fmtDate(m.date)}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'Playfair Display'", fontSize: 24, fontWeight: 700, color: "var(--gold2)" }}>{m.score}<span style={{ fontSize: 12, color: "var(--text3)", fontFamily: "'DM Sans'" }}>/{m.total}</span></div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: c }}>{pct}%</div>
                </div>
                <button className="btn btn-icon" onClick={() => remove(m.id)}><Ic n="trash" s={13} /></button>
              </div>
            </div>
            {(m.bio + m.phy + m.che) > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[["Bio", m.bio, "var(--green)"], ["Phy", m.phy, "var(--blue)"], ["Che", m.che, "var(--orange)"]].map(([l, v, c]) => (
                  <div key={l} style={{ background: "var(--bg3)", borderRadius: 8, padding: 8, textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: c, fontFamily: "'Playfair Display'" }}>{v}</div>
                    <div style={{ fontSize: 9, color: "var(--text3)", fontWeight: 600, textTransform: "uppercase" }}>{l}</div>
                  </div>
                ))}
              </div>
            )}
            {m.notes && <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 10, borderTop: "1px solid var(--border)", paddingTop: 8, lineHeight: 1.5 }}>{m.notes}</div>}
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// SYLLABUS TAB
// ════════════════════════════════════════════════════════════════════
function SylTab({ user }) {
  const { progress: prog, setTopicStatus, loading } = useSyllabus(user.id);
  const [active, setActive] = useState("Biology");
  const [search, setSearch] = useState("");

  const topics = SYL[active].filter(t => t.toLowerCase().includes(search.toLowerCase()));
  const done   = SYL[active].filter(t => (prog[`${active}__${t}`] || 0) >= 2).length;
  const pct    = Math.round(done / SYL[active].length * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div><div className="section-title">Syllabus Tracker</div><div className="section-sub">Mark every chapter — Biology, Physics, Chemistry</div></div>

      <div style={{ display: "flex", gap: 8 }}>
        {Object.keys(SYL).map(s => (
          <button key={s} onClick={() => { setActive(s); setSearch(""); }} className={`filter-btn ${active === s ? "active" : ""}`} style={{ flex: 1, borderColor: active === s ? SUB_C[s] : undefined, color: active === s ? SUB_C[s] : undefined }}>
            {s}
          </button>
        ))}
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontWeight: 600, color: SUB_C[active], fontSize: 14 }}>{active}</span>
          <span style={{ fontSize: 12, color: "var(--text3)", fontWeight: 600 }}>{done}/{SYL[active].length} done · {pct}%</span>
        </div>
        <div className="pbar" style={{ height: 6 }}><div className="pfill" style={{ width: `${pct}%`, background: SUB_C[active] }} /></div>
      </div>

      <input placeholder="🔍 Search topics..." value={search} onChange={e => setSearch(e.target.value)} />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {STATUS_N.map((l, i) => (
          <span key={l} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--text3)" }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: STATUS_C[i], display: "inline-block" }} />{l}
          </span>
        ))}
      </div>

      {loading && <div style={{ display: "flex", justifyContent: "center", padding: 20 }}><div className="spinner" /></div>}

      {!loading && topics.map(topic => {
        const k  = `${active}__${topic}`;
        const st = prog[k] || 0;
        return (
          <div key={topic} className="card" style={{ padding: "10px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: st >= 2 ? "var(--text3)" : "var(--text)", fontWeight: 500, flex: 1, paddingRight: 10 }}>{topic}</span>
              <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                {STATUS_L.map((l, i) => (
                  <button key={i} onClick={() => setTopicStatus(k, i)} className="btn"
                    style={{ width: 28, height: 28, borderRadius: 7, border: `1.5px solid ${st === i ? STATUS_C[i] : "var(--border2)"}`, background: st === i ? `${STATUS_C[i]}18` : "transparent", color: st === i ? STATUS_C[i] : "var(--text3)", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// SQUAD TAB — YPT-style group view
// ════════════════════════════════════════════════════════════════════
function SquadTab({ user }) {
  const { members, loading, refetch } = useSquad(user.id);

  const fmtH = (mins) => `${Math.floor(mins / 60)}h ${mins % 60}m`;
  const maxToday = Math.max(...members.map(m => m.todayMins), 60);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div className="section-title">Squad</div>
        <div className="section-sub">Live status & leaderboard — accountability, weaponized</div>
      </div>

      {loading && <div style={{ display: "flex", justifyContent: "center", padding: 30 }}><div className="spinner" /></div>}

      {!loading && members.length === 0 && <Empty text="No squad members yet." emoji="👥" />}

      {!loading && members.map((m, i) => (
        <div key={m.id} className="card" style={{ borderColor: m.id === user.id ? "rgba(201,168,76,.3)" : "var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Rank */}
            <div style={{ width: 24, textAlign: "center", flexShrink: 0 }}>
              {i === 0 && m.todayMins > 0 ? <span style={{ fontSize: 18 }}>🥇</span> :
               i === 1 && m.todayMins > 0 ? <span style={{ fontSize: 18 }}>🥈</span> :
               i === 2 && m.todayMins > 0 ? <span style={{ fontSize: 18 }}>🥉</span> :
               <span style={{ fontSize: 12, color: "var(--text3)", fontWeight: 700 }}>#{i+1}</span>}
            </div>

            {/* Avatar */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              {m.avatar_url ? (
                <img src={m.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover" }} />
              ) : (
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${m.color}22`, border: `2px solid ${m.color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: m.color }}>{m.initials}</div>
              )}
              {m.isLive && (
                <div className="live-dot" style={{ position: "absolute", bottom: -2, right: -2, width: 12, height: 12, borderRadius: "50%", background: "var(--green)", border: "2px solid var(--bg2)" }} />
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{m.name}{m.id === user.id ? " (You)" : ""}</span>
                {m.streak > 0 && (
                  <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 11, color: "#f59e0b" }}>🔥{m.streak}</span>
                )}
              </div>
              {m.isLive ? (
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                  <span className={`tag ${SUB_T[m.current_subject] || "gen"}`}>{m.current_subject || "Studying"}</span>
                  {m.current_topic && <span style={{ fontSize: 11, color: "var(--text2)" }}>{m.current_topic}</span>}
                </div>
              ) : (
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                  {m.last_active ? `Last active ${timeAgo(m.last_active)}` : "No activity yet"}
                </div>
              )}
            </div>

            {/* Today's time */}
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontFamily: "'Playfair Display'", fontSize: 18, fontWeight: 700, color: m.todayMins > 0 ? "var(--gold2)" : "var(--text3)" }}>{fmtH(m.todayMins)}</div>
              <div style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase", fontWeight: 600 }}>Today</div>
            </div>
          </div>

          {/* Progress bar relative to top performer */}
          {m.todayMins > 0 && (
            <div className="pbar" style={{ marginTop: 10, height: 4 }}>
              <div className="pfill" style={{ width: `${Math.min(100, (m.todayMins / maxToday) * 100)}%`, background: m.isLive ? "var(--green)" : "var(--gold)" }} />
            </div>
          )}
        </div>
      ))}

      {!loading && members.length > 0 && (
        <div className="card" style={{ background: "linear-gradient(135deg, var(--bg2), var(--bg3))" }}>
          <div className="lbl" style={{ marginBottom: 10 }}>This Week</div>
          {members.sort((a,b) => b.weekMins - a.weekMins).map(m => (
            <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
              <span style={{ fontSize: 12, color: "var(--text2)" }}>{m.name}{m.id === user.id ? " (You)" : ""}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gold)" }}>{fmtH(m.weekMins)}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: "center", fontSize: 11, color: "var(--text3)", marginTop: 4 }}>
        🔄 Auto-refreshes every 15 seconds
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// HISTORY TAB
// ════════════════════════════════════════════════════════════════════
function HistTab({ user }) {
  const { rows: logs }    = useTable("study_logs", user.id);
  const { rows: targets } = useTable("targets", user.id);
  const { rows: mocks }   = useTable("mocks", user.id);
  const { rows: todos }   = useTable("todos", user.id);
  const [filt,   setFilt]   = useState("all");
  const [search, setSearch] = useState("");

  const all = [
    ...logs.map(l => ({ ...l, _t: "log",    _d: l.date })),
    ...targets.map(t => ({ ...t, _t: "target", _d: t.date })),
    ...mocks.map(m => ({ ...m, _t: "mock",   _d: m.date })),
    ...todos.map(t => ({ ...t, _t: "todo",   _d: t.date })),
  ].filter(e => {
    if (filt !== "all" && e._t !== filt) return false;
    if (search && !JSON.stringify(e).toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => new Date(b._d) - new Date(a._d));

  const grouped = all.reduce((acc, e) => { (acc[e._d] = acc[e._d] || []).push(e); return acc; }, {});
  const dates   = Object.keys(grouped).sort().reverse();

  const tC = { log: "var(--gold)", target: "var(--blue)", mock: "var(--green)", todo: "var(--text3)" };
  const tE = { log: "📖", target: "🎯", mock: "📊", todo: "✅" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div><div className="section-title">Full History</div><div className="section-sub">Every log, goal, test — permanently saved</div></div>

      <div style={{ background: "linear-gradient(135deg, var(--bg2), var(--bg3))", border: "1px solid rgba(201,168,76,.15)", borderRadius: 12, padding: "12px 14px" }}>
        <div style={{ fontSize: 12, color: "var(--text3)", lineHeight: 1.6 }}>
          ✨ <strong style={{ color: "var(--gold)" }}>Permanent Record</strong> — Aaj ka study log, 1 saal baad bhi yahan milega. Cloud mein safe hai.
        </div>
      </div>

      <input placeholder="🔍 Search in history..." value={search} onChange={e => setSearch(e.target.value)} />

      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {[["all", "All"], ["log", "📖 Study"], ["target", "🎯 Goals"], ["mock", "📊 Mocks"], ["todo", "✅ Tasks"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilt(v)} className={`filter-btn ${filt === v ? "active" : ""}`}>{l}</button>
        ))}
      </div>

      {dates.length === 0 && <Empty text="Start your journey — everything shows up here!" emoji="🗓" />}

      {dates.map(d => (
        <div key={d}>
          <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", padding: "6px 2px 6px", borderBottom: "1px solid var(--border)", marginBottom: 8 }}>{fmtDate(d)}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {grouped[d].map((e, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", background: "var(--bg2)", borderRadius: 10, borderLeft: `3px solid ${tC[e._t]}` }}>
                <span style={{ fontSize: 15, marginTop: 1 }}>{tE[e._t]}</span>
                <div style={{ flex: 1, minWidth: 0, fontSize: 12 }}>
                  {e._t === "log" && <>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3 }}>
                      <span className={`tag ${SUB_T[e.subject] || "gen"}`}>{e.subject}</span>
                      <span style={{ color: "var(--text)", fontWeight: 500 }}>{e.topic}</span>
                    </div>
                    {e.notes && <div style={{ color: "var(--text3)", marginBottom: 3, lineHeight: 1.4 }}>{e.notes}</div>}
                    <span style={{ color: "var(--gold)", fontWeight: 600 }}>{Math.floor(e.duration / 60)}h {e.duration % 60}m</span>
                  </>}
                  {e._t === "target" && <>
                    <div style={{ color: "var(--text)", fontWeight: 500, marginBottom: 3 }}>{e.text}</div>
                    <span style={{ color: e.status === "done" ? "var(--green)" : "var(--text3)" }}>{e.status === "done" ? "✓ Completed" : "Active"} · {e.type}</span>
                  </>}
                  {e._t === "mock" && <>
                    <div style={{ color: "var(--text)", fontWeight: 500, marginBottom: 3 }}>{e.name || "Mock Test"}</div>
                    <span style={{ color: "var(--gold)", fontWeight: 600 }}>{e.score}/{e.total} ({Math.round(e.score / e.total * 100)}%)</span>
                  </>}
                  {e._t === "todo" && <>
                    <div style={{ color: e.done ? "var(--text3)" : "var(--text)", textDecoration: e.done ? "line-through" : "none", fontWeight: 500 }}>{e.text}</div>
                    <span style={{ color: e.done ? "var(--green)" : "var(--text3)", marginTop: 2, display: "block" }}>{e.done ? "✓ Done" : "Pending"}</span>
                  </>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
