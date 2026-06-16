import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ════════════════════════════════════════════════════════════════════
// SUPABASE CONFIG — Apna URL aur Key yahan daalo
// Supabase Dashboard → Settings → API se milega
// ════════════════════════════════════════════════════════════════════
const SUPABASE_URL = "https://couhjsdofjhjyyaeobsp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_wxfdpH8obgAXeuYuGdP_XA_s0HFqObU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Utils ─────────────────────────────────────────────────────────────
export const todayStr = () => new Date().toISOString().slice(0, 10);
export const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
export const fmtDate = (d) => { try { return new Date(d + "T12:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return d || ""; } };
export const fmtTimer = (s) => `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
export const timeAgo = (ts) => {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// ── NEET Syllabus ─────────────────────────────────────────────────────
export const SYL = {
  Biology:   ["Cell: The Unit of Life", "Biomolecules", "Cell Cycle & Division", "Genetics & Inheritance", "Molecular Basis of Inheritance", "Evolution", "Human Physiology I", "Human Physiology II", "Plant Physiology", "Reproduction in Organisms", "Sexual Reproduction in Plants", "Human Reproduction", "Reproductive Health", "Principles of Inheritance", "Microbes in Human Welfare", "Biotechnology: Principles", "Biotechnology & Applications", "Organisms & Populations", "Ecosystem", "Biodiversity", "Environmental Issues"],
  Physics:   ["Physical World & Units", "Kinematics", "Laws of Motion", "Work Energy Power", "Rotational Motion", "Gravitation", "Properties of Matter", "Thermodynamics", "Kinetic Theory", "Oscillations", "Waves", "Electrostatics", "Current Electricity", "Magnetic Effects", "Magnetism", "EMI & AC", "EM Waves", "Ray Optics", "Wave Optics", "Dual Nature", "Atoms", "Nuclei", "Semiconductors"],
  Chemistry: ["Basic Concepts", "Atomic Structure", "Chemical Bonding", "States of Matter", "Thermodynamics", "Equilibrium", "Redox Reactions", "Hydrogen", "s-Block Elements", "p-Block I", "p-Block II", "d & f Block", "Coordination Compounds", "Organic Chemistry Basics", "Hydrocarbons", "Haloalkanes", "Alcohols & Ethers", "Aldehydes & Ketones", "Carboxylic Acids", "Amines", "Biomolecules", "Polymers", "Chemistry in Everyday Life", "Electrochemistry", "Chemical Kinetics", "Solutions", "Surface Chemistry"],
};
export const SUB_C = { Biology: "#10b981", Physics: "#6366f1", Chemistry: "#f59e0b" };
export const SUB_T = { Biology: "bio", Physics: "phy", Chemistry: "che" };
export const STATUS_L = ["—", "~", "✓", "R"];
export const STATUS_C = ["#2d2d3d", "#f59e0b", "#10b981", "#6366f1"];
export const STATUS_N = ["Not Started", "In Progress", "Done", "Revised"];

// ════════════════════════════════════════════════════════════════════
// GLOBAL CSS
// ════════════════════════════════════════════════════════════════════
export const CSS = `
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
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

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
    padding: 6px 4px 4px;
    background: none;
    border: none;
    color: var(--text3);
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
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

  @keyframes live-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  .live-dot { animation: live-dot 1.5s infinite; }

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

  .spinner {
    width: 28px; height: 28px;
    border: 3px solid var(--border);
    border-top-color: var(--gold);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

// ════════════════════════════════════════════════════════════════════
// ICONS
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
  logout:  "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4|M16 17l5-5-5-5|M21 12H9",
  users:   "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2|M9 11a4 4 0 100-8 4 4 0 000 8z|M23 21v-2a4 4 0 00-3-3.87|M16 3.13a4 4 0 010 7.75",
  flame:   "M12 2c0 0-5.5 3.5-5.5 8.5 0 3.5 2.3 6.3 5.5 7a7 7 0 005.5-7C17.5 5.5 12 2 12 2z",
  trophy:  "M6 9H4.5a2.5 2.5 0 010-5H6|M18 9h1.5a2.5 2.5 0 000-5H18|M4 22h16|M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22|M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22|M18 2H6v7a6 6 0 0012 0V2z",
};
export const Ic = ({ n, s = 16 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {(P[n] || "").split("|").map((d, i) => <path key={i} d={d} />)}
  </svg>
);

export function Empty({ text, emoji }) {
  return (
    <div style={{ textAlign: "center", color: "var(--text3)", marginTop: 32, fontSize: 13, lineHeight: 2 }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{emoji}</div>
      {text}
</div>
  );
}
