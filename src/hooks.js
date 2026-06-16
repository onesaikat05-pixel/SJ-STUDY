import { useState, useEffect, useCallback } from "react";
import { supabase, todayStr, uid } from "./lib";

// ════════════════════════════════════════════════════════════════════
// AUTH HOOK — Google Login via Supabase
// ════════════════════════════════════════════════════════════════════
export function useAuth() {
  const [user, setUser] = useState(undefined); // undefined = loading, null = logged out

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const signInGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { user, signInGoogle, signOut };
}

// ════════════════════════════════════════════════════════════════════
// PROFILE — ensures a row in profiles table exists, tracks live status
// ════════════════════════════════════════════════════════════════════
export function useProfile(user) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!user) { setProfile(null); return; }
    (async () => {
      // Try to fetch existing profile
      let { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (!data) {
        // Create new profile
        const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Aspirant";
        const avatar = user.user_metadata?.avatar_url || "";
        const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
        const { data: created } = await supabase.from("profiles").insert({
          id: user.id, name, avatar_url: avatar, initials,
          color: ["#c9a84c","#10b981","#6366f1","#f59e0b","#ef4444","#06b6d4"][Math.floor(Math.random()*6)],
        }).select().single();
        data = created;
      }
      setProfile(data);
    })();
  }, [user]);

  return profile;
}

// ════════════════════════════════════════════════════════════════════
// LIVE STATUS — Update "studying now" status, with heartbeat
// ════════════════════════════════════════════════════════════════════
export function useLiveStatus(user, isStudying, subject, topic) {
  useEffect(() => {
    if (!user) return;
    const update = async () => {
      await supabase.from("profiles").update({
        is_studying: isStudying,
        current_subject: isStudying ? subject : null,
        current_topic: isStudying ? topic : null,
        last_active: new Date().toISOString(),
      }).eq("id", user.id);
    };
    update();
    // Heartbeat every 30s while studying
    if (isStudying) {
      const interval = setInterval(update, 30000);
      return () => clearInterval(interval);
    }
  }, [user, isStudying, subject, topic]);

  // Clear status on unmount/close
  useEffect(() => {
    if (!user) return;
    const clear = () => {
      supabase.from("profiles").update({ is_studying: false, last_active: new Date().toISOString() }).eq("id", user.id);
    };
    window.addEventListener("beforeunload", clear);
    return () => window.removeEventListener("beforeunload", clear);
  }, [user]);
}

// ════════════════════════════════════════════════════════════════════
// GENERIC DATA HOOK — fetch + realtime subscribe for a table
// ════════════════════════════════════════════════════════════════════
export function useTable(table, userId, extraFilter = null) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) return;
    let query = supabase.from(table).select("*").eq("user_id", userId).order("created_at", { ascending: false });
    const { data, error } = await query;
    if (!error) setRows(data || []);
    setLoading(false);
  }, [table, userId]);

  useEffect(() => { refetch(); }, [refetch]);

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`${table}_${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table, filter: `user_id=eq.${userId}` }, () => refetch())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [table, userId, refetch]);

  const insert = useCallback(async (row) => {
    const fullRow = { id: uid(), user_id: userId, ...row, created_at: new Date().toISOString() };
    setRows(prev => [fullRow, ...prev]); // optimistic
    const { error } = await supabase.from(table).insert(fullRow);
    if (error) { console.error(error); refetch(); }
  }, [table, userId, refetch]);

  const update = useCallback(async (id, patch) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r)); // optimistic
    const { error } = await supabase.from(table).update(patch).eq("id", id);
    if (error) { console.error(error); refetch(); }
  }, [table, refetch]);

  const remove = useCallback(async (id) => {
    setRows(prev => prev.filter(r => r.id !== id)); // optimistic
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) { console.error(error); refetch(); }
  }, [table, refetch]);

  return { rows, loading, insert, update, remove, refetch };
}

// ════════════════════════════════════════════════════════════════════
// SYLLABUS PROGRESS — special table with composite key (user_id + topic_key)
// ════════════════════════════════════════════════════════════════════
export function useSyllabus(userId) {
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from("syllabus_progress").select("*").eq("user_id", userId);
    const map = {};
    (data || []).forEach(r => { map[r.topic_key] = r.status; });
    setProgress(map);
    setLoading(false);
  }, [userId]);

  useEffect(() => { refetch(); }, [refetch]);

  const setTopicStatus = useCallback(async (topicKey, status) => {
    setProgress(prev => ({ ...prev, [topicKey]: status })); // optimistic
    const { error } = await supabase.from("syllabus_progress").upsert({
      id: `${userId}__${topicKey}`, user_id: userId, topic_key: topicKey, status, updated_at: new Date().toISOString(),
    });
    if (error) { console.error(error); refetch(); }
  }, [userId, refetch]);

  return { progress, loading, setTopicStatus };
}

// ════════════════════════════════════════════════════════════════════
// SQUAD — fetch all profiles + their today's stats for the group view
// ════════════════════════════════════════════════════════════════════
export function useSquad(userId) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const { data: profiles } = await supabase.from("profiles").select("*").order("name");
    if (!profiles) { setLoading(false); return; }

    const today = todayStr();
    const enriched = await Promise.all(profiles.map(async (p) => {
      const { data: logs } = await supabase.from("study_logs").select("duration, date, subject").eq("user_id", p.id).gte("date", new Date(Date.now() - 7*86400000).toISOString().slice(0,10));
      const todayLogs = (logs || []).filter(l => l.date === today);
      const todayMins = todayLogs.reduce((a, l) => a + (l.duration || 0), 0);
      const weekMins  = (logs || []).reduce((a, l) => a + (l.duration || 0), 0);

      // Streak
      const dates = [...new Set((logs || []).map(l => l.date))].sort().reverse();
      let streak = 0, d = new Date();
      for (const dt of dates) {
        const diff = Math.floor((d - new Date(dt + "T12:00:00")) / 86400000);
        if (diff > 1) break;
        streak++; d = new Date(dt + "T12:00:00");
      }

      // Is studying now? (active within last 2 min)
      const activeRecently = p.last_active && (Date.now() - new Date(p.last_active).getTime()) < 120000;

      return { ...p, todayMins, weekMins, streak, isLive: p.is_studying && activeRecently };
    }));

    enriched.sort((a, b) => b.todayMins - a.todayMins);
    setMembers(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
    const interval = setInterval(refetch, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [refetch]);

  // Realtime: refetch on any profile or log change
  useEffect(() => {
    const channel = supabase
      .channel("squad_updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "study_logs" }, () => refetch())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [refetch]);

  return { members, loading, refetch };
}
