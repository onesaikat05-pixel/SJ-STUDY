import { useState, useEffect, useRef, useReducer, useCallback } from "react";

// ════════════════════════════════════════════════════════════════════
// SUPABASE CONFIG — Replace these with your actual Supabase credentials
// Get them from: https://supabase.com → Your Project → Settings → API
// ════════════════════════════════════════════════════════════════════
const SUPABASE_URL = "YOUR_SUPABASE_URL";       // e.g. https://xyzabc.supabase.co
const SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY";  // your anon/public key

// ── Simple Supabase client (no npm needed) ──────────────────────────
const sb = {
  headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  async query(table, method = "GET", body = null, filter = "") {
    const url = `${SUPABASE_URL}/rest/v1/${table}${filter}`;
    const res = await fetch(url, { method, headers: { ...this.headers, Prefer: method === "POST" ? "return=representation" : "" }, body: body ? JSON.stringify(body) : null });
    if (!res.ok) throw new Error(await res.text());
    return method === "DELETE" ? null : res.json();
  },
  async insert(table, data) { return this.query(table, "POST", data); },
  async select(table, filter = "") { return this.query(table, "GET", null, `?${filter}&order=created_at.desc`); },
  async delete(table, id) { return this.query(table, "DELETE", null, `?id=eq.${id}`); },
  async update(table, id, data) { return this.query(table, "PATCH", data, `?id=eq.${id}`); },
  // Auth
  async signInGoogle() {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${window.location.origin}`, { headers: this.headers });
    window.location.href = res.url || `${SUPABASE_URL}/auth/v1/authorize?provider=google`;
  },
  async getUser() {
    try {
      const token = localStorage.getItem("sb_token");
      if (!token) return null;
      const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { ...this.headers, Authorization: `Bearer ${token}` } });
      if (!res.ok) return null;
      return res.json();
    } catch { return null; }
  },
};

// ── In-memory store (works without Supabase too — demo mode) ─────────
const MEM = { study_logs: [], todos: [], targets: [], mocks: [], syllabus_progress: {}, timer_sessions: [], neet_date: "2026-05-04" };
const _listeners = new Set();
const getM = (k) => MEM[k];
const setM = (k, v) => { MEM[k] = v; _listeners.forEach(f => f()); };
function useStore(key) {
  const [, r] = useReducer(x => x + 1, 0);
  useEffect(() => { _listeners.add(r); return () => _listeners.delete(r); }, []);
  return [getM(key), (v) => setM(key, v)];
}

// ── Utils ─────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().slice(0, 10);
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const fmtDate = (d) => { try { return new Date(d + "T12:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return d || ""; } };
const fmtTimer = (s) => `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

// ── NEET Syllabus ─────────────────────────────────────────────────────
const SYL = {
  Biology:   ["Cell: The Unit of Life", "Biomolecules", "Cell Cycle & Division", "Genetics & Inheritance", "Molecular Basis of Inheritance", "Evolution", "Human Physiology I", "Human Physiology II", "Plant Physiology", "Reproduction in Organisms", "Sexual Reproduction in Plants", "Human Reproduction", "Reproductive Health", "Principles of Inheritance", "Microbes in Human Welfare", "Biotechnology: Principles", "Biotechnology & Applications", "Organisms & Populations", "Ecosystem", "Biodiversity", "Environmental Issues"],
  Physics:   ["Physical World & Units", "Kinematics", "Laws of Motion", "Work Energy Power", "Rotational Motion", "Gravitation", "Properties of Matter", "Thermodynamics", "Kinetic Theory", "Oscillations", "Waves", "Electrostatics", "Current Electricity", "Magnetic Effects", "Magnetism", "EMI & AC", "EM Waves", "Ray Optics", "Wave Optics", "Dual Nature", "Atoms", "Nuclei", "Semiconductors"],
  Chemistry: ["Basic Concepts", "Atomic Structure", "Chemical Bonding", "States of Matter", "Thermodynamics", "Equilibrium", "Redox Reactions", "Hydrogen", "s-Block Elements", "p-Block I", "p-Block II", "d & f Block", "Coordination Compounds", "Organic Chemistry Basics", "Hydrocarbons", "Haloalkanes", "Alcohols & Ethers", "Aldehydes & Ketones", "Carboxylic Acids", "Amines", "Biomolecules", "Polymers", "Chemistry in Everyday Life", "Electrochemistry", "Chemical Kinetics", "Solutions", "Surface Chemistry"],
};
const SUB_C = { Biology: "#10b981", Physics: "#6366f1", Chemistry: "#f59e0b" };
const SUB_T = { Biology: "bio", Physics: "phy", Chemistry: "che" };
const STATUS_L = ["—", "~", "✓", "R"];
const STATUS_C = ["#2d2d3d", "#f59e0b", "#10b981", "#6366f1"];
const STATUS_N = ["Not Started", "In Progress", "Done", "Revised"];

// ════════════════════════════════════════════════════════════════════
// GLOBAL CSS
// ════════════════════════════════════════════════════════════════════
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  
  :root {
    --bg:      #070711;
    --bg2:     #0c0c1a;
    --bg3:     #111124;
    --border:  #1c1c30;
    --border2: #252538;
    --text:    #e8e4f0;
    --text2:   #9994aa;
    --text3:   #55506a;
    --gold:    #c9a84c;
    --gold2:   #e8c86a;
    --green:   #10b981;
    --blue:    #6366f1;
    --orange:  #f59e0b;
    --red:     #ef4444;
    --radius:  12px;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 99px; }

  body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; }

  input, textarea, select {
    font-family: 'DM Sans', sans-serif;
    background: var(--bg2);
    border: 1px solid var(--border);
    color: var(--text);
    border-radius: 10px;
    padding: 9px 13px;
    width: 100%;
    outline: none;
    font-size: 13px;
    transition: border-color .15s, box-shadow .15s;
  }
  input:focus, textarea:focus, select:focus {
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgba(201,168,76,.08);
  }
  select option { background: var(--bg3); }

  .card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px;
  }
  .card-hi { border-color: var(--border2); }

  .lbl {
    font-size: 10px;
    color: var(--text3);
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    margin-bottom: 5px;
  }

  .btn { cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all .15s; border: none; }

  .btn-primary {
    background: linear-gradient(135deg, #b8900a, var(--gold), var(--gold2));
    color: #07070e;
    padding: 10px 22px;
    border-radius: 10px;
    font-weight: 600;
    font-size: 13px;
    letter-spacing: 0.3px;
  }
  .btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 6px 24px rgba(201,168,76,.25); }
  .btn-primary:active { transform: translateY(0); }

  .btn-ghost {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text2);
    padding: 8px 14px;
    border-radius: 10px;
    font-size: 13px;
  }
  .btn-ghost:hover { border-color: var(--gold); color: var(--gold); }

  .btn-icon {
    background: none;
    border: none;
    color: var(--text3);
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
  }
  .btn-icon:hover { color: var(--red); background: rgba(239,68,68,.1); }

  .tag {
    display: inline-flex;
    align-items: center;
    padding: 1px 8px;
    border-radius: 20px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.3px;
    white-space: nowrap;
  }
  .bio { background: rgba(16,185,129,.12); color: #10b981; }
  .phy { background: rgba(99,102,241,.12); color: #6366f1; }
  .che { background: rgba(245,158,11,.12); color: #f59e0b; }
  .gen { background: rgba(148,163,184,.1); color: #94a3b8; }

  .pbar { background: var(--bg3); border-radius: 99px; height: 4px; overflow: hidden; }
  .pfill { height: 100%; border-radius: 99px; transition: width .5s ease; }

  .section-title {
    font-family: 'Playfair Display', serif;
    font-size: 22px;
    font-weight: 700;
    color: var(--gold2);
    letter-spacing: -0.3px;
    margin-bottom: 2px;
  }
  .section-sub { font-size: 12px; color: var(--text3); margin-bottom: 14px; }

  .filter-btn {
    padding: 6px 14px;
    border-radius: 20px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text3);
    font-size: 12px;
    cursor: pointer;
    transition: all .15s;
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
  }
  .filter-btn.active {
    border-color: var(--gold);
    background: rgba(201,168,76,.1);
    color: var(--gold);
  }

  .stat-card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 14px 12px;
    text-align: center;
  }
  .stat-num {
    font-family: 'Playfair Display', serif;
    font-size: 26px;
    font-weight: 700;
    color: var(--gold2);
    line-height: 1.1;
  }
  .stat-lbl {
    font-size: 9px;
    color: var(--text3);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 600;
    margin-top: 3px;
  }

  .nav-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 6px 6px 4px;
    background: none;
    border: none;
    color: var(--text3);
    font-size: 9px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    cursor: pointer;
    transition: color .15s;
    border-top: 2px solid transparent;
    flex: 1;
    min-width: 0;
  }
  .nav-btn.active { color: var(--gold); border-top-color: var(--gold); }
  .nav-btn:hover:not(.active) { color: var(--text2); }

  .divider { border: none; border-top: 1px solid var(--border); margin: 10px 0; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-up { animation: fadeUp .25s ease forwards; }

  @keyframes pulse-ring {
    0%   { box-shadow: 0 0 0 0 rgba(201,168,76,.35); }
    70%  { box-shadow: 0 0 0 10px rgba(201,168,76,0); }
    100% { box-shadow: 0 0 0 0 rgba(201,168,76,0); }
  }
  .pulse { animation: pulse-ring 2s infinite; }

  .check-btn {
    width: 22px; height: 22px;
    border-radius: 7px;
    border: 2px solid var(--border2);
    background: transparent;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    cursor: pointer;
    transition: all .15s;
  }
  .check-btn.done { border-color: var(--green); background: rgba(16,185,129,.15); }
  .check-btn:hover:not(.done) { border-color: var(--gold); }
`;

// ════════════════════════════════════════════════════════════════════
// ICON COMPONENT
// ════════════════════════════════════════════════════════════════════
const P = {
  home:    "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z|M9 22V12h6v10",
  log:     "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z|M14 2v6h6|M16 13H8|M16 17H8",
  target:  "M12 2a10 10 0 100 20A10 10 0 0012 2z|M12 6a6 6 0 100 12A6 6 0 0012 6z|M12 10a2 2 0 100 4 2 2 0 000-4z",
  timer:   "M12 2a10 10 0 100 20A10 10 0 0012 2z|M12 6v6l4 2",
  mock:    "M9 11l3 3L22 4|M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
  book:    "M4 19.5A2.5 2.5 0 016.5 17H20|M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z",
  history: "M12 8v4l3 3|M12 2a10 10 0 100 20A10 10 0 0012 2z",
  todo:    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2|M9 5a2 2 0 002 2h2a2 2 0 002-2|M9 12l2 2 4-4",
  trash:   "M3 6h18|M8 6V4h8v2|M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6",
  check:   "M20 6L9 17l-5-5",
  reset:   "M1 4v6h6|M23 20v-6h-6|M20.49 9A9 9 0 005.64 5.64L1 10|M23 14l-4.64 4.36A9 9 0 013.51 15",
  user:    "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2|M12 3a4 4 0 100 8 4 4 0 000-8z",
  logout:  "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4|M16 17l5-5-5-5|M21 12H9",
  stethoscope: "M4.8 2.3A.3.3 0 105 2H4a2 2 0 00-2 2v5a6 6 0 006 6v0a6 6 0 006-6V4a2 2 0 00-2-2h-1a.2.2 0 100 .3|M8 15v1a6 6 0 006 6v0a6 6 0 006-6v-4",
  plus:    "M12 5v14|M5 12h14",
  flame:   "M12 2c0 0-5.5 3.5-5.5 8.5 0 3.5 2.3 6.3 5.5 7a7 7 0 005.5-7C17.5 5.5 12 2 12 2z",
};
const Ic = ({ n, s = 16 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {(P[n] || "").split("|").map((d, i) => <path key={i} d={d} />)}
  </svg>
);

// ════════════════════════════════════════════════════════════════════
// USER CONTEXT (simple demo — no real auth in artifact)
// ════════════════════════════════════════════════════════════════════
const DEMO_USERS = [
  { id: "user1", name: "Shaurya", avatar: "SJ", color: "#c9a84c" },
  { id: "user2", name: "Priya",   avatar: "PR", color: "#10b981" },
  { id: "user3", name: "Rahul",   avatar: "RK", color: "#6366f1" },
  { id: "user4", name: "Ananya",  avatar: "AN", color: "#f59e0b" },
];

// ════════════════════════════════════════════════════════════════════
// ROOT APP
// ════════════════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab]   = useState("home");
  const [user, setUser] = useState(null); // null = login screen

  if (!user) return <LoginScreen onLogin={setUser} />;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "var(--bg)", minHeight: "100vh", color: "var(--text)", display: "flex", flexDirection: "column", maxWidth: 600, margin: "0 auto" }}>
      <style>{CSS}</style>
      <Header user={user} onLogout={() => setUser(null)} />
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 88px" }}>
        <div className="fade-up">
          {tab === "home"   && <HomeTab user={user} />}
          {tab === "log"    && <LogTab user={user} />}
          {tab === "todo"   && <TodoTab user={user} />}
          {tab === "target" && <TargetTab user={user} />}
          {tab === "timer"  && <TimerTab user={user} />}
          {tab === "mock"   && <MockTab user={user} />}
          {tab === "syl"    && <SylTab user={user} />}
          {tab === "hist"   && <HistTab user={user} />}
        </div>
      </div>
      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}

// ── LOGIN ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, maxWidth: 600, margin: "0 auto" }}>
      <style>{CSS}</style>
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ width: 72, height: 72, background: "linear-gradient(135deg, #b8900a, #e8c86a)", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 16px", boxShadow: "0 12px 40px rgba(201,168,76,.3)" }}>🩺</div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: "var(--gold2)", letterSpacing: "-0.5px" }}>SJ STUDY</div>
        <div style={{ fontSize: 13, color: "var(--text3)", marginTop: 4, letterSpacing: "3px", textTransform: "uppercase", fontWeight: 500 }}>NEET Study OS</div>
      </div>

      <div style={{ width: "100%", maxWidth: 340 }}>
        <div style={{ fontSize: 13, color: "var(--text3)", textAlign: "center", marginBottom: 20 }}>Select your profile to continue</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {DEMO_USERS.map(u => (
            <button key={u.id} onClick={() => onLogin(u)} className="btn"
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, width: "100%", textAlign: "left", cursor: "pointer", transition: "all .15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = u.color; e.currentTarget.style.background = "var(--bg3)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg2)"; }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: `${u.color}22`, border: `2px solid ${u.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: u.color, flexShrink: 0 }}>{u.avatar}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: "var(--text)" }}>{u.name}</div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>NEET 2026 Aspirant</div>
              </div>
              <div style={{ marginLeft: "auto", color: u.color, opacity: 0.6 }}>→</div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 28, padding: 16, background: "var(--bg2)", borderRadius: 12, border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.7 }}>
            <strong style={{ color: "var(--gold)", fontSize: 12 }}>🔒 Real website pe:</strong><br />
            Yahan Google Login hoga. Har user ka data alag-alag cloud mein save rahega permanently. Supabase setup guide neeche dekho.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── HEADER ────────────────────────────────────────────────────────────
function Header({ user, onLogout }) {
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
          <div style={{ width: 26, height: 26, borderRadius: 8, background: `${user.color}22`, border: `1.5px solid ${user.color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: user.color }}>{user.avatar}</div>
          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text2)" }}>{user.name}</span>
        </button>
        {showMenu && (
          <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: 10, padding: 8, minWidth: 150, zIndex: 200, boxShadow: "0 8px 32px rgba(0,0,0,.4)" }}>
            <button className="btn" onClick={() => { setShowMenu(false); onLogout(); }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "none", color: "var(--text2)", fontSize: 13, width: "100%", borderRadius: 7 }}>
              <Ic n="logout" s={14} /> Switch User
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
    { id: "mock",   icon: "mock",    label: "Mocks" },
    { id: "syl",    icon: "book",    label: "Syllabus" },
    { id: "hist",   icon: "history", label: "History" },
  ];
  return (
    <div style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)", display: "flex", position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, maxWidth: 600, margin: "0 auto" }}>
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
function HomeTab({ user }) {
  const [logs]    = useStore("study_logs");
  const [todos]   = useStore("todos");
  const [mocks]   = useStore("mocks");
  const [syl]     = useStore("syllabus_progress");
  const [nDate, setNDate] = useStore("neet_date");

  const myLogs  = logs.filter(l => l.userId === user.id);
  const myTodos = todos.filter(t => t.userId === user.id);
  const myMocks = mocks.filter(m => m.userId === user.id);
  const mySyl   = Object.fromEntries(Object.entries(syl).filter(([k]) => k.startsWith(user.id + "__")));

  const todayLogs = myLogs.filter(l => l.date === todayStr());
  const totalMins = todayLogs.reduce((a, l) => a + (l.duration || 0), 0);
  const todayTasks = myTodos.filter(t => t.date === todayStr());
  const doneTasks  = todayTasks.filter(t => t.done).length;

  // Streak
  const streak = (() => {
    const dates = [...new Set(myLogs.map(l => l.date))].sort().reverse();
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
  const doneSyl   = Object.values(mySyl).filter(v => v >= 2).length;
  const subToday  = todayLogs.reduce((acc, l) => { acc[l.subject] = (acc[l.subject] || 0) + l.duration; return acc; }, {});
  const lastMock  = myMocks[myMocks.length - 1];

  // Weekly study (last 7 days)
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().slice(0, 10);
    const mins = myLogs.filter(l => l.date === ds).reduce((a, l) => a + l.duration, 0);
    return { day: d.toLocaleDateString("en-IN", { weekday: "short" }), mins };
  });
  const maxMins = Math.max(...last7.map(d => d.mins), 60);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Countdown hero */}
      <div style={{ background: "linear-gradient(135deg, #0f0f20 0%, #0d0d18 100%)", border: "1px solid rgba(201,168,76,.2)", borderRadius: 16, padding: "22px 18px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -20, top: -20, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,.06) 0%, transparent 70%)" }} />
        <div style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "2px", fontWeight: 600, marginBottom: 6 }}>Time Remaining</div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 64, fontWeight: 700, color: "var(--gold2)", lineHeight: 1 }}>{daysLeft}</div>
        <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>days to NEET &nbsp;·&nbsp;
          <input type="date" value={nDate} onChange={e => setNDate(e.target.value)}
            style={{ background: "transparent", border: "none", color: "var(--text3)", fontSize: 11, width: "auto", padding: 0, outline: "none" }} />
        </div>
        {streak > 0 && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 10, background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.2)", borderRadius: 20, padding: "4px 10px" }}>
            <span style={{ fontSize: 14 }}>🔥</span>
            <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>{streak} day streak</span>
          </div>
        )}
      </div>

      {/* Stats row */}
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

      {/* Weekly chart */}
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

      {/* Today subjects */}
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

      {/* Syllabus overview */}
      <div className="card">
        <div className="lbl" style={{ marginBottom: 12 }}>Syllabus Coverage</div>
        {Object.entries(SYL).map(([sub, topics]) => {
          const done = topics.filter(t => (mySyl[`${user.id}__${sub}__${t}`] || 0) >= 2).length;
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

      {/* Last mock */}
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
  const [logs, setLogs] = useStore("study_logs");
  const [sub,   setSub]   = useState("Biology");
  const [topic, setTopic] = useState("");
  const [hrs,   setHrs]   = useState("");
  const [mins,  setMins]  = useState("");
  const [notes, setNotes] = useState("");
  const [date,  setDate]  = useState(todayStr());

  const add = () => {
    if (!topic.trim()) return;
    const dur = parseInt(hrs || 0) * 60 + parseInt(mins || 0);
    const entry = { id: uid(), userId: user.id, userName: user.name, subject: sub, topic: topic.trim(), duration: dur, notes, date, createdAt: new Date().toISOString() };
    setLogs([entry, ...logs]);
    setTopic(""); setHrs(""); setMins(""); setNotes("");
  };
  const del = id => setLogs(logs.filter(l => l.id !== id));

  const myLogs  = logs.filter(l => l.userId === user.id);
  const grouped = myLogs.reduce((acc, l) => { (acc[l.date] = acc[l.date] || []).push(l); return acc; }, {});
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

      {dates.length === 0 && <Empty text="No sessions yet. Start logging!" emoji="📖" />}

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
                    <button className="btn btn-icon" onClick={() => del(l.id)}><Ic n="trash" s={13} /></button>
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
  const [todos, setTodos] = useStore("todos");
  const [text,  setText]  = useState("");
  const [sub,   setSub]   = useState("Biology");
  const [date,  setDate]  = useState(todayStr());
  const [prio,  setPrio]  = useState("medium");
  const [filt,  setFilt]  = useState("today");

  const myTodos = todos.filter(t => t.userId === user.id);
  const add = () => {
    if (!text.trim()) return;
    setTodos([{ id: uid(), userId: user.id, text: text.trim(), subject: sub, date, priority: prio, done: false, createdAt: new Date().toISOString() }, ...todos]);
    setText("");
  };
  const toggle = id => setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const del    = id => setTodos(todos.filter(t => t.id !== id));

  const filtered = myTodos.filter(t =>
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

      {filtered.length === 0 && <Empty text="No tasks here." emoji="✅" />}

      {filtered.map(t => (
        <div key={t.id} className="card" style={{ opacity: t.done ? 0.5 : 1, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className={`check-btn btn ${t.done ? "done" : ""}`} onClick={() => toggle(t.id)} style={{ padding: 0 }}>
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
            <button className="btn btn-icon" onClick={() => del(t.id)}><Ic n="trash" s={13} /></button>
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
  const [targets, setTargets] = useStore("targets");
  const [text, setText]   = useState("");
  const [type, setType]   = useState("daily");
  const [prio, setPrio]   = useState("medium");
  const [dl,   setDl]     = useState("");
  const [view, setView]   = useState("active");

  const myTargets = targets.filter(t => t.userId === user.id);
  const add = () => {
    if (!text.trim()) return;
    setTargets([{ id: uid(), userId: user.id, text: text.trim(), type, priority: prio, deadline: dl, status: "active", date: todayStr(), createdAt: new Date().toISOString() }, ...targets]);
    setText(""); setDl("");
  };
  const toggle = id => setTargets(targets.map(t => t.id === id ? { ...t, status: t.status === "done" ? "active" : "done" } : t));
  const del    = id => setTargets(targets.filter(t => t.id !== id));

  const shown = myTargets.filter(t => view === "active" ? t.status !== "done" : t.status === "done");
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
          <button key={v} onClick={() => setView(v)} className={`filter-btn ${view === v ? "active" : ""}`}>{l} ({myTargets.filter(t => v === "active" ? t.status !== "done" : t.status === "done").length})</button>
        ))}
      </div>

      {shown.length === 0 && <Empty text={`No ${view} goals.`} emoji="🎯" />}

      {shown.map(t => (
        <div key={t.id} className="card" style={{ opacity: t.status === "done" ? 0.5 : 1, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <button className={`check-btn btn ${t.status === "done" ? "done" : ""}`} onClick={() => toggle(t.id)} style={{ marginTop: 2, padding: 0 }}>
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
            <button className="btn btn-icon" onClick={() => del(t.id)}><Ic n="trash" s={13} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// TIMER TAB
// ════════════════════════════════════════════════════════════════════
function TimerTab({ user }) {
  const [sessions, setSessions] = useStore("timer_sessions");
  const [logs, setLogs]         = useStore("study_logs");
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
  const ref = useRef(null);

  useEffect(() => {
    if (!running) { clearInterval(ref.current); return; }
    ref.current = setInterval(() => {
      if (mode === "pomo") {
        setTime(t => {
          if (t <= 1) {
            if (phase === "work") {
              const nc = cycle + 1; setCycle(nc);
              const np = nc % 4 === 0 ? "long" : "break";
              setPhase(np);
              return (np === "long" ? lMin : bMin) * 60;
            } else { setPhase("work"); return wMin * 60; }
          }
          return t - 1;
        });
      } else {
        setElapsed(e => e + 1);
      }
    }, 1000);
    return () => clearInterval(ref.current);
  }, [running, mode, phase, cycle, wMin, bMin, lMin]);

  const saveSession = useCallback(() => {
    const dur = mode === "pomo" ? wMin : Math.floor(elapsed / 60);
    if (dur < 1) return;
    const s = { id: uid(), userId: user.id, subject: sub, topic, duration: dur, date: todayStr(), type: mode };
    setSessions(prev => [s, ...prev]);
    setLogs(prev => [{ ...s, notes: `Timer session (${mode === "pomo" ? "Pomodoro" : "Normal"})`, createdAt: new Date().toISOString() }, ...prev]);
    setElapsed(0);
  }, [mode, wMin, elapsed, sub, topic, user.id]);

  const reset = () => { setRunning(false); setElapsed(0); setTime(mode === "pomo" ? wMin * 60 : 0); setPhase("work"); setCycle(0); };

  const phaseC = { work: "var(--gold)", break: "var(--green)", long: "var(--blue)" };
  const R = 70, C = 2 * Math.PI * R;
  const total = (phase === "work" ? wMin : phase === "break" ? bMin : lMin) * 60;
  const pct = mode === "pomo" ? (total - time) / total : 0;

  const mySessions = sessions.filter(s => s.userId === user.id);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div><div className="section-title">Focus Timer</div><div className="section-sub">Pomodoro & deep work sessions</div></div>

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
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" onClick={reset} style={{ padding: "10px 14px" }}><Ic n="reset" s={15} /></button>
          <button className={`btn btn-primary ${running ? "pulse" : ""}`} onClick={() => setRunning(r => !r)} style={{ padding: "10px 32px", fontSize: 15 }}>
            {running ? "⏸ Pause" : "▶ Start"}
          </button>
          {mode === "normal" && elapsed > 60 && (
            <button className="btn btn-ghost" onClick={() => { saveSession(); reset(); }}>Save</button>
          )}
        </div>
      </div>

      {mode === "pomo" && (
        <div className="card">
          <div className="lbl" style={{ marginBottom: 10 }}>Timer Settings</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[["Focus (min)", wMin, setWMin, "work"], ["Break (min)", bMin, setBMin, "break"], ["Long (min)", lMin, setLMin, "long"]].map(([l, v, s, p]) => (
              <div key={l}><div className="lbl">{l}</div>
                <input type="number" min="1" max="120" value={v} onChange={e => { s(+e.target.value); if (!running && phase === p) setTime(+e.target.value * 60); }} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="lbl" style={{ marginBottom: 10 }}>Session Info</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><div className="lbl">Subject</div>
            <select value={sub} onChange={e => setSub(e.target.value)}>
              {Object.keys(SYL).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div><div className="lbl">Topic</div><input placeholder="What are you studying?" value={topic} onChange={e => setTopic(e.target.value)} /></div>
        </div>
      </div>

      {mySessions.length > 0 && (
        <div className="card">
          <div className="lbl" style={{ marginBottom: 10 }}>Recent Sessions</div>
          {mySessions.slice(0, 5).map(s => (
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
  const [mocks, setMocks] = useStore("mocks");
  const [name,  setName]  = useState("");
  const [date,  setDate]  = useState(todayStr());
  const [score, setScore] = useState("");
  const [total, setTotal] = useState("720");
  const [bio,   setBio]   = useState("");
  const [phy,   setPhy]   = useState("");
  const [che,   setChe]   = useState("");
  const [notes, setNotes] = useState("");

  const myMocks  = mocks.filter(m => m.userId === user.id);
  const save = () => {
    if (!score) return;
    setMocks([...mocks, { id: uid(), userId: user.id, name, date, score: +score, total: +total, bio: +bio || 0, phy: +phy || 0, che: +che || 0, notes }]);
    setName(""); setScore(""); setBio(""); setPhy(""); setChe(""); setNotes("");
  };
  const del = id => setMocks(mocks.filter(m => m.id !== id));

  const sorted = [...myMocks].sort((a, b) => new Date(b.date) - new Date(a.date));
  const avg    = myMocks.length ? Math.round(myMocks.reduce((a, m) => a + m.score, 0) / myMocks.length) : 0;
  const best   = myMocks.length ? Math.max(...myMocks.map(m => m.score)) : 0;
  const last5  = [...myMocks].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div><div className="section-title">Mock Tests</div><div className="section-sub">Track every test — watch the curve rise</div></div>

      {myMocks.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {[["📝", myMocks.length, "Tests"], ["📈", avg, "Avg Score"], ["🏆", best, "Best"]].map(([e, v, l]) => (
              <div key={l} className="stat-card">
                <div style={{ fontSize: 18, marginBottom: 3 }}>{e}</div>
                <div className="stat-num">{v}</div>
                <div className="stat-lbl">{l}</div>
              </div>
            ))}
          </div>

          {/* Mini score chart */}
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

      {sorted.length === 0 && <Empty text="No mock tests yet. Add your first result!" emoji="📊" />}

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
                <button className="btn btn-icon" onClick={() => del(m.id)}><Ic n="trash" s={13} /></button>
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
  const [prog, setProg] = useStore("syllabus_progress");
  const [active, setActive] = useState("Biology");
  const [search, setSearch] = useState("");

  const key = (sub, topic) => `${user.id}__${sub}__${topic}`;
  const upd  = (k, v) => setProg({ ...prog, [k]: v });

  const topics = SYL[active].filter(t => t.toLowerCase().includes(search.toLowerCase()));
  const done   = SYL[active].filter(t => (prog[key(active, t)] || 0) >= 2).length;
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

      {topics.map(topic => {
        const k  = key(active, topic);
        const st = prog[k] || 0;
        return (
          <div key={topic} className="card" style={{ padding: "10px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: st >= 2 ? "var(--text3)" : "var(--text)", fontWeight: 500, flex: 1, paddingRight: 10 }}>{topic}</span>
              <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                {STATUS_L.map((l, i) => (
                  <button key={i} onClick={() => upd(k, i)} className="btn"
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
// HISTORY TAB
// ════════════════════════════════════════════════════════════════════
function HistTab({ user }) {
  const [logs]    = useStore("study_logs");
  const [targets] = useStore("targets");
  const [mocks]   = useStore("mocks");
  const [todos]   = useStore("todos");
  const [filt,   setFilt]   = useState("all");
  const [search, setSearch] = useState("");

  const all = [
    ...logs.filter(l => l.userId === user.id).map(l => ({ ...l, _t: "log",    _d: l.date })),
    ...targets.filter(t => t.userId === user.id).map(t => ({ ...t, _t: "target", _d: t.date })),
    ...mocks.filter(m => m.userId === user.id).map(m => ({ ...m, _t: "mock",   _d: m.date })),
    ...todos.filter(t => t.userId === user.id).map(t => ({ ...t, _t: "todo",   _d: t.date })),
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
          ✨ <strong style={{ color: "var(--gold)" }}>Permanent Record</strong> — Aaj ka study log, 1 saal baad bhi yahan milega. Har cheez date-wise saved hai.
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

// ── Empty state ───────────────────────────────────────────────────────
function Empty({ text, emoji }) {
  return (
    <div style={{ textAlign: "center", color: "var(--text3)", marginTop: 32, fontSize: 13, lineHeight: 2 }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{emoji}</div>
      {text}
    </div>
  );
}
