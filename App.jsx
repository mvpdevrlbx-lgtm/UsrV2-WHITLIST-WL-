import React, { useState, useEffect, useRef, useCallback } from "react";
import { storage } from "./storage";
import {
  MessageCircle,
  Newspaper,
  Clapperboard,
  ShieldCheck,
  Send,
  Trash2,
  Plus,
  Lock,
  LogOut,
  Heart,
  Upload,
  X,
  CheckCircle2,
  Radio,
  Hash,
  Repeat2,
  Tv,
  User,
  Pencil,
  Ban,
  Search,
  ShoppingBag,
  Skull,
  KeyRound,
  CreditCard,
  ArrowRightLeft,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Design tokens                                                      */
/* ------------------------------------------------------------------ */
const COLORS = {
  bg: "#0B0E14",
  surface: "#141920",
  surfaceRaised: "#1C222B",
  line: "#2A313C",
  text: "#ECEFF3",
  textMuted: "#8993A1",
  gold: "#E8B23D",
  red: "#E4483D",
  blue: "#3DA9E8",
  green: "#3DDC97",
};

const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap";

const ADMIN_PASSWORD = "salon2026";
const JOURNALIST_PASSWORD = "redaction2026";
const DARKCHAT_CODE = "nocturne2026";
const STARTING_BALANCE = 1000;

const STORE_KEY = "app-data-v3";
const emptyData = {
  chatMessages: [],
  newsPosts: [],
  jtEditions: [],
  feedPosts: [],
  videos: [],
  characters: [],
  licenses: [],
  marketListings: [],
  blackListings: [],
  wallets: {},
  transactions: [],
};

const LICENSE_TYPES = [
  "Permis de conduire",
  "Port d'arme",
  "Permis de chasse",
  "Permis de pêche",
  "Licence radio",
];

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
function shortCode(len = 6) {
  return Math.random().toString(36).slice(2, 2 + len).toUpperCase();
}
function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "à l'instant";
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)} h`;
  return `${Math.floor(s / 86400)} j`;
}
function getBalance(data, pseudo) {
  const v = data.wallets ? data.wallets[pseudo] : undefined;
  return typeof v === "number" ? v : STARTING_BALANCE;
}
function cardNumberFor(pseudo) {
  let h = 0;
  for (let i = 0; i < pseudo.length; i++) h = (Math.imul(h, 31) + pseudo.charCodeAt(i)) >>> 0;
  const s = (h.toString() + "0000000000000000").slice(0, 16);
  return s.match(/.{1,4}/g).join(" ");
}
function formatMoney(n) {
  return `${n.toLocaleString("fr-FR")}$`;
}
function parsePrice(price) {
  const n = parseFloat(String(price).replace(/[^0-9.,]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/* ------------------------------------------------------------------ */
/*  Global styles                                                      */
/* ------------------------------------------------------------------ */
function GlobalStyle() {
  return (
    <style>{`
      @import url('${FONT_URL}');
      .salon-root * { box-sizing: border-box; }
      .salon-root {
        font-family: 'Inter', sans-serif;
        color: ${COLORS.text};
        background: ${COLORS.bg};
        min-height: 100%;
        background-image:
          radial-gradient(ellipse at top left, rgba(232,178,61,0.06), transparent 55%),
          radial-gradient(ellipse at bottom right, rgba(61,169,232,0.07), transparent 55%);
      }
      .salon-serif { font-family: 'Fraunces', serif; }
      .salon-mono { font-family: 'JetBrains Mono', monospace; }
      .salon-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
      .salon-scroll::-webkit-scrollbar-thumb { background: ${COLORS.line}; border-radius: 4px; }
      .salon-btn { cursor: pointer; border: none; font-family: 'Inter', sans-serif; font-weight: 600; transition: transform .12s ease, filter .12s ease; }
      .salon-btn:active { transform: scale(0.97); }
      .salon-btn:hover { filter: brightness(1.08); }
      .salon-btn:disabled { cursor: default; }
      .salon-input { background: ${COLORS.surfaceRaised}; border: 1px solid ${COLORS.line}; color: ${COLORS.text}; font-family: 'Inter', sans-serif; outline: none; border-radius: 10px; }
      .salon-input:focus { border-color: ${COLORS.blue}; }
      .salon-input::placeholder { color: ${COLORS.textMuted}; }
      @keyframes salonFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      .salon-fade { animation: salonFadeUp .35s ease both; }
      @keyframes salonPulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
      .salon-live-dot { animation: salonPulse 1.4s ease-in-out infinite; }

      @keyframes salonBgDrift {
        0% { background-position: 0% 0%, 100% 100%; }
        50% { background-position: 8% 6%, 92% 94%; }
        100% { background-position: 0% 0%, 100% 100%; }
      }
      .salon-root { background-size: 160% 160%, 160% 160%; animation: salonBgDrift 22s ease-in-out infinite; }

      .salon-hover-lift { transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease; }
      .salon-hover-lift:hover { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(0,0,0,0.32); border-color: ${COLORS.gold}; }

      @keyframes salonCardShine {
        0% { transform: translateX(-120%) rotate(8deg); }
        100% { transform: translateX(220%) rotate(8deg); }
      }
      .salon-card-shine::before {
        content: ""; position: absolute; top: -40%; left: 0; width: 30%; height: 180%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
        animation: salonCardShine 5s ease-in-out infinite; pointer-events: none;
      }

      @keyframes salonPop {
        0% { transform: scale(0.9); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }
      .salon-pop { animation: salonPop .22s ease both; }

      @keyframes salonSpin { to { transform: rotate(360deg); } }
      .salon-spin { animation: salonSpin 1s linear infinite; }

      .salon-navbtn { transition: background .15s ease, border-color .15s ease, color .15s ease; }

      .salon-shell { display: flex; min-height: 100vh; }
      .salon-sidebar {
        width: 226px; flex-shrink: 0; border-right: 1px solid ${COLORS.line};
        padding: 24px 14px; position: sticky; top: 0; height: 100vh; overflow-y: auto;
        display: flex; flex-direction: column;
      }
      .salon-navbtn {
        display: flex; align-items: center; gap: 10px; width: 100%; text-align: left;
        background: transparent; color: ${COLORS.textMuted}; padding: 10px 12px; border-radius: 9px;
        font-size: 13.5px; border-left: 3px solid transparent;
      }
      .salon-navbtn.active { color: ${COLORS.text}; background: ${COLORS.surface}; border-left: 3px solid ${COLORS.gold}; }
      .salon-main-col { flex: 1; min-width: 0; }
      @media (max-width: 780px) {
        .salon-shell { flex-direction: column; }
        .salon-sidebar { width: 100%; height: auto; position: relative; border-right: none; border-bottom: 1px solid ${COLORS.line}; padding: 14px; }
        .salon-navlist { flex-direction: row !important; overflow-x: auto; gap: 4px !important; }
        .salon-navbtn { border-left: none !important; border-bottom: 2px solid transparent; white-space: nowrap; flex-shrink: 0; }
        .salon-navbtn.active { border-left: none !important; border-bottom: 2px solid ${COLORS.gold}; }
      }

      .id-card {
        position: relative; overflow: hidden; max-width: 360px; border-radius: 16px;
        border: 1px solid ${COLORS.gold}; background: linear-gradient(160deg, ${COLORS.surfaceRaised}, ${COLORS.surface});
        padding: 20px;
      }
      .id-card::after {
        content: "RP"; position: absolute; right: -10px; bottom: -30px; font-size: 100px; font-weight: 700;
        font-family: 'Fraunces', serif; color: rgba(232,178,61,0.05); pointer-events: none; line-height: 1;
      }
    `}</style>
  );
}

/* ------------------------------------------------------------------ */
/*  Storage helpers                                                    */
/* ------------------------------------------------------------------ */
async function loadData() {
  try {
    const res = await storage.get(STORE_KEY, true);
    if (!res) return { ...emptyData };
    return { ...emptyData, ...JSON.parse(res.value) };
  } catch (e) {
    return { ...emptyData };
  }
}
async function saveData(data) {
  try {
    await storage.set(STORE_KEY, JSON.stringify(data), true);
  } catch (e) {
    console.error("Erreur de sauvegarde", e);
  }
}

async function transferMoney(from, to, amount, note) {
  if (!from || !to || from === to || !(amount > 0)) return { ok: false, error: "Virement invalide." };
  const fresh = await loadData();
  const fromBal = getBalance(fresh, from);
  if (fromBal < amount) return { ok: false, error: "Solde insuffisant." };
  fresh.wallets = { ...fresh.wallets, [from]: fromBal - amount, [to]: getBalance(fresh, to) + amount };
  fresh.transactions = [...(fresh.transactions || []), { id: uid(), from, to, amount, note: note || "", ts: Date.now() }].slice(-300);
  await saveData(fresh);
  return { ok: true, data: fresh };
}

/* ------------------------------------------------------------------ */
/*  Age gate                                                            */
/* ------------------------------------------------------------------ */
function AgeGate({ onVerified }) {
  const [birth, setBirth] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const submit = async () => {
    if (!birth) return setError("Indique ta date de naissance.");
    const b = new Date(birth);
    const now = new Date();
    let age = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
    if (age < 18) return setError("L'accès est réservé aux personnes majeures.");
    setChecking(true);
    try {
      await storage.set("age-verified", "1", false);
    } catch (e) {}
    setTimeout(() => {
      setChecking(false);
      onVerified();
    }, 500);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="salon-fade" style={{ maxWidth: 380, width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 18, padding: "36px 30px" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.red})`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <ShieldCheck size={24} color="#0B0E14" strokeWidth={2.4} />
        </div>
        <h1 className="salon-serif" style={{ fontSize: 26, margin: "0 0 8px", lineHeight: 1.15 }}>Vérification d'âge</h1>
        <p style={{ color: COLORS.textMuted, fontSize: 14, lineHeight: 1.6, margin: "0 0 22px" }}>
          La centrale et ses salons contiennent des échanges libres entre adultes. Indique ta date de naissance pour continuer.
        </p>
        <label style={{ fontSize: 12, color: COLORS.textMuted, display: "block", marginBottom: 6 }}>Date de naissance</label>
        <input type="date" value={birth} onChange={(e) => setBirth(e.target.value)} className="salon-input" style={{ width: "100%", padding: "12px 14px", fontSize: 15, marginBottom: 14 }} />
        {error && <p style={{ color: COLORS.red, fontSize: 13, margin: "0 0 14px" }}>{error}</p>}
        <button onClick={submit} disabled={checking} className="salon-btn" style={{ width: "100%", padding: "13px 0", borderRadius: 10, background: COLORS.gold, color: "#0B0E14", fontSize: 15, opacity: checking ? 0.7 : 1 }}>
          {checking ? "Vérification…" : "Entrer"}
        </button>
        <p style={{ color: COLORS.textMuted, fontSize: 11, marginTop: 16, lineHeight: 1.5 }}>
          Cette vérification repose sur une déclaration sur l'honneur et n'a pas de valeur d'identification légale.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Access gate (dark chat verification)                               */
/* ------------------------------------------------------------------ */
function useGateVerified(storageKey) {
  const [verified, setVerified] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get(storageKey, false);
        setVerified(!!(res && res.value === "1"));
      } catch (e) {
        setVerified(false);
      }
    })();
  }, [storageKey]);
  const markVerified = async () => {
    setVerified(true);
    try {
      await storage.set(storageKey, "1", false);
    } catch (e) {}
  };
  return [verified, markVerified];
}

function AccessGate({ storageKey, code, title, desc, accent = COLORS.red, children }) {
  const [verified, markVerified] = useGateVerified(storageKey);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (input.trim().toLowerCase() === code.toLowerCase()) {
      setError("");
      markVerified();
    } else {
      setError("Code d'accès incorrect.");
    }
  };

  if (verified === null) return null;

  if (!verified) {
    return (
      <div className="salon-fade" style={{ maxWidth: 380, margin: "30px auto" }}>
        <div style={{ background: COLORS.surface, border: `1px solid ${accent}`, borderRadius: 16, padding: 28, textAlign: "center" }}>
          <KeyRound size={22} color={accent} style={{ marginBottom: 12 }} />
          <h3 className="salon-serif" style={{ fontSize: 20, margin: "0 0 6px" }}>{title}</h3>
          <p style={{ fontSize: 12.5, color: COLORS.textMuted, marginBottom: 16, lineHeight: 1.5 }}>{desc}</p>
          <input
            className="salon-input"
            type="password"
            placeholder="Code d'accès"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            style={{ width: "100%", padding: "10px 12px", fontSize: 14, marginBottom: 10 }}
          />
          {error && <p style={{ color: COLORS.red, fontSize: 12.5, marginBottom: 10 }}>{error}</p>}
          <button className="salon-btn" onClick={submit} style={{ width: "100%", padding: "11px 0", borderRadius: 9, background: accent, color: "#0B0E14", fontSize: 14 }}>
            Débloquer l'accès
          </button>
          <p style={{ color: COLORS.textMuted, fontSize: 11, marginTop: 14, lineHeight: 1.5 }}>
            Ce code est distribué en RP par les personnages déjà présents dans le salon. Demande-le en jeu.
          </p>
        </div>
      </div>
    );
  }

  return children;
}

/* ------------------------------------------------------------------ */
/*  Pseudo                                                              */
/* ------------------------------------------------------------------ */
function usePseudo() {
  const [pseudo, setPseudo] = useState("");
  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get("pseudo", false);
        if (res && res.value) setPseudo(res.value);
      } catch (e) {}
    })();
  }, []);
  const save = async (p) => {
    setPseudo(p);
    try {
      await storage.set("pseudo", p, false);
    } catch (e) {}
  };
  return [pseudo, save];
}

function PseudoBar({ onSave }) {
  const [val, setVal] = useState("");
  return (
    <div style={{ display: "flex", gap: 8, padding: 14, background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, marginBottom: 16 }}>
      <input className="salon-input" placeholder="Choisis un pseudo pour participer" value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && val.trim() && onSave(val.trim())} style={{ flex: 1, padding: "9px 12px", fontSize: 14 }} />
      <button className="salon-btn" onClick={() => val.trim() && onSave(val.trim())} style={{ padding: "9px 16px", borderRadius: 8, background: COLORS.blue, color: "#0B0E14", fontSize: 13 }}>Valider</button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chat tab                                                            */
/* ------------------------------------------------------------------ */
function ChatTab({ data, refresh, pseudo, setPseudo }) {
  const [text, setText] = useState("");
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [data.chatMessages.length]);

  const send = async () => {
    if (!text.trim() || !pseudo) return;
    const fresh = await loadData();
    fresh.chatMessages = [...fresh.chatMessages, { id: uid(), pseudo, text: text.trim(), ts: Date.now() }].slice(-200);
    await saveData(fresh);
    setText("");
    refresh(fresh);
  };

  return (
    <div className="salon-fade">
      {!pseudo && <PseudoBar onSave={setPseudo} />}
      <div ref={scrollRef} className="salon-scroll" style={{ height: 420, overflowY: "auto", background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {data.chatMessages.length === 0 && <p style={{ color: COLORS.textMuted, fontSize: 14, margin: "auto" }}>Aucun message pour l'instant. Lance la conversation.</p>}
        {data.chatMessages.map((m) => (
          <div key={m.id} style={{ maxWidth: "80%" }}>
            <div style={{ fontSize: 12, color: COLORS.blue, fontWeight: 600, marginBottom: 2 }}>
              {m.pseudo} <span style={{ color: COLORS.textMuted, fontWeight: 400 }}>· {timeAgo(m.ts)}</span>
            </div>
            <div style={{ background: COLORS.surfaceRaised, borderRadius: "4px 12px 12px 12px", padding: "8px 12px", fontSize: 14, lineHeight: 1.5 }}>{m.text}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input className="salon-input" placeholder={pseudo ? "Écris un message…" : "Choisis un pseudo d'abord"} disabled={!pseudo} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} style={{ flex: 1, padding: "12px 14px", fontSize: 14 }} />
        <button className="salon-btn" onClick={send} disabled={!pseudo} style={{ width: 46, borderRadius: 10, background: COLORS.gold, color: "#0B0E14", display: "flex", alignItems: "center", justifyContent: "center", opacity: pseudo ? 1 : 0.5 }}>
          <Send size={17} />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  News tab                                                            */
/* ------------------------------------------------------------------ */
function NewsTab({ data, refresh, pseudo, setPseudo }) {
  const [openId, setOpenId] = useState(null);
  const [comment, setComment] = useState("");
  const posts = [...data.newsPosts].sort((a, b) => b.ts - a.ts);

  const addComment = async (postId) => {
    if (!comment.trim() || !pseudo) return;
    const fresh = await loadData();
    fresh.newsPosts = fresh.newsPosts.map((p) => (p.id === postId ? { ...p, comments: [...(p.comments || []), { id: uid(), pseudo, text: comment.trim(), ts: Date.now() }] } : p));
    await saveData(fresh);
    setComment("");
    refresh(fresh);
  };

  return (
    <div className="salon-fade">
      {!pseudo && <PseudoBar onSave={setPseudo} />}
      {posts.length === 0 && <div style={{ padding: 40, textAlign: "center", color: COLORS.textMuted, border: `1px dashed ${COLORS.line}`, borderRadius: 14 }}>Aucune actu publiée. L'admin peut en ajouter depuis l'onglet Admin.</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {posts.map((p) => (
          <article key={p.id} className="salon-hover-lift" style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 11, color: COLORS.gold, marginBottom: 6, fontWeight: 600 }}>{timeAgo(p.ts)}</div>
            <h3 className="salon-serif" style={{ fontSize: 20, margin: "0 0 8px", lineHeight: 1.25 }}>{p.title}</h3>
            <p style={{ fontSize: 14, lineHeight: 1.6, margin: "0 0 12px" }}>{p.body}</p>
            <button className="salon-btn" onClick={() => setOpenId(openId === p.id ? null : p.id)} style={{ background: "transparent", color: COLORS.blue, fontSize: 13, padding: "4px 0" }}>
              {(p.comments || []).length} commentaire{(p.comments || []).length !== 1 ? "s" : ""} {openId === p.id ? "▲" : "▼"}
            </button>
            {openId === p.id && (
              <div style={{ marginTop: 12, borderTop: `1px solid ${COLORS.line}`, paddingTop: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                  {(p.comments || []).map((c) => (
                    <div key={c.id} style={{ fontSize: 13, lineHeight: 1.5 }}>
                      <span style={{ color: COLORS.gold, fontWeight: 600 }}>{c.pseudo}</span> <span style={{ color: COLORS.textMuted, fontSize: 11 }}>· {timeAgo(c.ts)}</span>
                      <div>{c.text}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="salon-input" placeholder={pseudo ? "Ajouter un commentaire…" : "Choisis un pseudo d'abord"} disabled={!pseudo} value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addComment(p.id)} style={{ flex: 1, padding: "9px 12px", fontSize: 13 }} />
                  <button className="salon-btn" disabled={!pseudo} onClick={() => addComment(p.id)} style={{ padding: "9px 14px", borderRadius: 8, background: COLORS.gold, color: "#0B0E14", fontSize: 13 }}>Envoyer</button>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  JT tab                                                              */
/* ------------------------------------------------------------------ */
function JtTab({ data, refresh, pseudo, setPseudo }) {
  const [journalistAuthed, setJournalistAuthed] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [live, setLive] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [comment, setComment] = useState("");
  const editions = [...data.jtEditions].sort((a, b) => b.ts - a.ts);

  const login = () => {
    if (pwd === JOURNALIST_PASSWORD) {
      setJournalistAuthed(true);
      setShowLogin(false);
      setPwdError("");
    } else setPwdError("Mot de passe incorrect.");
  };

  const publish = async () => {
    if (!title.trim() || !body.trim() || !pseudo) return;
    const fresh = await loadData();
    fresh.jtEditions = [...fresh.jtEditions, { id: uid(), title: title.trim(), body: body.trim(), live, author: pseudo, ts: Date.now(), reactions: { like: [], wow: [] }, comments: [] }];
    await saveData(fresh);
    setTitle("");
    setBody("");
    setLive(false);
    refresh(fresh);
  };

  const react = async (editionId, type) => {
    if (!pseudo) return;
    const fresh = await loadData();
    fresh.jtEditions = fresh.jtEditions.map((e) => {
      if (e.id !== editionId) return e;
      const list = e.reactions?.[type] || [];
      const already = list.includes(pseudo);
      return { ...e, reactions: { ...e.reactions, [type]: already ? list.filter((p) => p !== pseudo) : [...list, pseudo] } };
    });
    await saveData(fresh);
    refresh(fresh);
  };

  const addComment = async (editionId) => {
    if (!comment.trim() || !pseudo) return;
    const fresh = await loadData();
    fresh.jtEditions = fresh.jtEditions.map((e) => (e.id === editionId ? { ...e, comments: [...(e.comments || []), { id: uid(), pseudo, text: comment.trim(), ts: Date.now() }] } : e));
    await saveData(fresh);
    setComment("");
    refresh(fresh);
  };

  return (
    <div className="salon-fade">
      {!pseudo && <PseudoBar onSave={setPseudo} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, padding: "12px 16px", background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: COLORS.textMuted }}>
          <Tv size={16} color={COLORS.red} /> Éditions publiées par la rédaction — tout le monde peut réagir et commenter.
        </div>
        {!journalistAuthed && <button className="salon-btn" onClick={() => setShowLogin(true)} style={{ background: "transparent", color: COLORS.blue, fontSize: 12.5, whiteSpace: "nowrap" }}>Espace rédaction</button>}
        {journalistAuthed && <button className="salon-btn" onClick={() => setJournalistAuthed(false)} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", color: COLORS.gold, fontSize: 12.5 }}><LogOut size={13} /> Quitter la rédaction</button>}
      </div>

      {showLogin && !journalistAuthed && (
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <input className="salon-input" type="password" placeholder="Mot de passe rédaction" value={pwd} onChange={(e) => setPwd(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()} style={{ width: "100%", padding: "10px 12px", fontSize: 14, marginBottom: 8 }} />
          {pwdError && <p style={{ color: COLORS.red, fontSize: 12.5, marginBottom: 8 }}>{pwdError}</p>}
          <button className="salon-btn" onClick={login} style={{ padding: "9px 16px", borderRadius: 8, background: COLORS.blue, color: "#0B0E14", fontSize: 13 }}>Entrer</button>
        </div>
      )}

      {journalistAuthed && (
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 18, marginBottom: 20 }}>
          <h4 className="salon-serif" style={{ fontSize: 17, margin: "0 0 10px" }}>Nouvelle édition</h4>
          <input className="salon-input" placeholder="Titre de l'édition" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", padding: "10px 12px", fontSize: 14, marginBottom: 8 }} />
          <textarea className="salon-input" placeholder="Contenu du JT" value={body} onChange={(e) => setBody(e.target.value)} rows={3} style={{ width: "100%", padding: "10px 12px", fontSize: 14, marginBottom: 10, resize: "vertical" }} />
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: COLORS.textMuted, marginBottom: 12, cursor: "pointer" }}>
            <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} /> Marquer comme édition en direct
          </label>
          <button className="salon-btn" onClick={publish} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, background: COLORS.red, color: "#fff", fontSize: 13 }}><Plus size={15} /> Diffuser</button>
        </div>
      )}

      {editions.length === 0 && <div style={{ padding: 40, textAlign: "center", color: COLORS.textMuted, border: `1px dashed ${COLORS.line}`, borderRadius: 14 }}>Aucune édition diffusée pour l'instant.</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {editions.map((e) => (
          <article key={e.id} className="salon-hover-lift" style={{ background: COLORS.surface, border: `1px solid ${e.live ? COLORS.red : COLORS.line}`, borderRadius: 14, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
              {e.live && <span style={{ display: "flex", alignItems: "center", gap: 5, color: COLORS.red, fontSize: 11, fontWeight: 700 }}><span className="salon-live-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.red, display: "inline-block" }} />EN DIRECT</span>}
              <span style={{ fontSize: 11, color: COLORS.textMuted }}>{e.author} · {timeAgo(e.ts)}</span>
            </div>
            <h3 className="salon-serif" style={{ fontSize: 20, margin: "0 0 8px", lineHeight: 1.25 }}>{e.title}</h3>
            <p style={{ fontSize: 14, lineHeight: 1.6, margin: "0 0 12px" }}>{e.body}</p>
            <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              <button className="salon-btn" onClick={() => react(e.id, "like")} style={{ background: "transparent", color: (e.reactions?.like || []).includes(pseudo) ? COLORS.gold : COLORS.textMuted, fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}>👍 {(e.reactions?.like || []).length}</button>
              <button className="salon-btn" onClick={() => react(e.id, "wow")} style={{ background: "transparent", color: (e.reactions?.wow || []).includes(pseudo) ? COLORS.blue : COLORS.textMuted, fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}>😮 {(e.reactions?.wow || []).length}</button>
              <button className="salon-btn" onClick={() => setOpenId(openId === e.id ? null : e.id)} style={{ background: "transparent", color: COLORS.textMuted, fontSize: 13 }}>{(e.comments || []).length} commentaire{(e.comments || []).length !== 1 ? "s" : ""}</button>
            </div>
            {openId === e.id && (
              <div style={{ marginTop: 12, borderTop: `1px solid ${COLORS.line}`, paddingTop: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                  {(e.comments || []).map((c) => (
                    <div key={c.id} style={{ fontSize: 13, lineHeight: 1.5 }}>
                      <span style={{ color: COLORS.gold, fontWeight: 600 }}>{c.pseudo}</span> <span style={{ color: COLORS.textMuted, fontSize: 11 }}>· {timeAgo(c.ts)}</span>
                      <div>{c.text}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="salon-input" placeholder={pseudo ? "Réagir à l'édition…" : "Choisis un pseudo d'abord"} disabled={!pseudo} value={comment} onChange={(ev) => setComment(ev.target.value)} onKeyDown={(ev) => ev.key === "Enter" && addComment(e.id)} style={{ flex: 1, padding: "9px 12px", fontSize: 13 }} />
                  <button className="salon-btn" disabled={!pseudo} onClick={() => addComment(e.id)} style={{ padding: "9px 14px", borderRadius: 8, background: COLORS.gold, color: "#0B0E14", fontSize: 13 }}>Envoyer</button>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Feed tab                                                            */
/* ------------------------------------------------------------------ */
const FEED_MAX = 280;

function FeedTab({ data, refresh, pseudo, setPseudo }) {
  const [text, setText] = useState("");
  const [replyOpen, setReplyOpen] = useState(null);
  const [replyText, setReplyText] = useState("");
  const posts = [...data.feedPosts].sort((a, b) => b.ts - a.ts);

  const post = async () => {
    if (!text.trim() || !pseudo) return;
    const fresh = await loadData();
    fresh.feedPosts = [{ id: uid(), pseudo, text: text.trim().slice(0, FEED_MAX), ts: Date.now(), likes: [], reposts: [], replies: [] }, ...fresh.feedPosts];
    await saveData(fresh);
    setText("");
    refresh(fresh);
  };

  const toggleLike = async (id) => {
    if (!pseudo) return;
    const fresh = await loadData();
    fresh.feedPosts = fresh.feedPosts.map((p) => (p.id !== id ? p : { ...p, likes: (p.likes || []).includes(pseudo) ? p.likes.filter((x) => x !== pseudo) : [...(p.likes || []), pseudo] }));
    await saveData(fresh);
    refresh(fresh);
  };

  const toggleRepost = async (id) => {
    if (!pseudo) return;
    const fresh = await loadData();
    fresh.feedPosts = fresh.feedPosts.map((p) => (p.id !== id ? p : { ...p, reposts: (p.reposts || []).includes(pseudo) ? p.reposts.filter((x) => x !== pseudo) : [...(p.reposts || []), pseudo] }));
    await saveData(fresh);
    refresh(fresh);
  };

  const addReply = async (id) => {
    if (!replyText.trim() || !pseudo) return;
    const fresh = await loadData();
    fresh.feedPosts = fresh.feedPosts.map((p) => (p.id === id ? { ...p, replies: [...(p.replies || []), { id: uid(), pseudo, text: replyText.trim(), ts: Date.now() }] } : p));
    await saveData(fresh);
    setReplyText("");
    refresh(fresh);
  };

  return (
    <div className="salon-fade">
      {!pseudo && <PseudoBar onSave={setPseudo} />}
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 16, marginBottom: 18 }}>
        <textarea className="salon-input" placeholder={pseudo ? "Quoi de neuf en ville ?" : "Choisis un pseudo pour poster"} disabled={!pseudo} value={text} onChange={(e) => setText(e.target.value.slice(0, FEED_MAX))} rows={2} style={{ width: "100%", padding: "10px 12px", fontSize: 14, marginBottom: 8, resize: "none" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="salon-mono" style={{ fontSize: 11, color: COLORS.textMuted }}>{text.length}/{FEED_MAX}</span>
          <button className="salon-btn" onClick={post} disabled={!pseudo || !text.trim()} style={{ padding: "8px 18px", borderRadius: 20, background: COLORS.blue, color: "#0B0E14", fontSize: 13, opacity: !pseudo || !text.trim() ? 0.5 : 1 }}>Poster</button>
        </div>
      </div>

      {posts.length === 0 && <div style={{ padding: 40, textAlign: "center", color: COLORS.textMuted, border: `1px dashed ${COLORS.line}`, borderRadius: 14 }}>Le fil est vide. Sois le·la premier·ère à poster.</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {posts.map((p) => (
          <div key={p.id} className="salon-hover-lift" style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.blue})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#0B0E14" }}>{p.pseudo.slice(0, 2).toUpperCase()}</div>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{p.pseudo}</span>
              <span style={{ fontSize: 11, color: COLORS.textMuted }}>· {timeAgo(p.ts)}</span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.5, margin: "0 0 10px", whiteSpace: "pre-wrap" }}>{p.text}</p>
            <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
              <button className="salon-btn" onClick={() => toggleLike(p.id)} style={{ background: "transparent", display: "flex", alignItems: "center", gap: 5, color: (p.likes || []).includes(pseudo) ? COLORS.red : COLORS.textMuted, fontSize: 12.5 }}><Heart size={14} fill={(p.likes || []).includes(pseudo) ? COLORS.red : "none"} /> {(p.likes || []).length}</button>
              <button className="salon-btn" onClick={() => toggleRepost(p.id)} style={{ background: "transparent", display: "flex", alignItems: "center", gap: 5, color: (p.reposts || []).includes(pseudo) ? COLORS.blue : COLORS.textMuted, fontSize: 12.5 }}><Repeat2 size={14} /> {(p.reposts || []).length}</button>
              <button className="salon-btn" onClick={() => setReplyOpen(replyOpen === p.id ? null : p.id)} style={{ background: "transparent", color: COLORS.textMuted, fontSize: 12.5 }}>{(p.replies || []).length} réponse{(p.replies || []).length !== 1 ? "s" : ""}</button>
            </div>
            {replyOpen === p.id && (
              <div style={{ marginTop: 10, borderTop: `1px solid ${COLORS.line}`, paddingTop: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
                  {(p.replies || []).map((r) => (<div key={r.id} style={{ fontSize: 12.5 }}><span style={{ color: COLORS.blue, fontWeight: 600 }}>{r.pseudo}</span> {r.text}</div>))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="salon-input" placeholder="Répondre…" disabled={!pseudo} value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addReply(p.id)} style={{ flex: 1, padding: "8px 10px", fontSize: 12.5 }} />
                  <button className="salon-btn" disabled={!pseudo} onClick={() => addReply(p.id)} style={{ padding: "8px 12px", borderRadius: 8, background: COLORS.blue, color: "#0B0E14", fontSize: 12 }}>Envoyer</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Video tab                                                           */
/* ------------------------------------------------------------------ */
const MAX_VIDEO_BYTES = 3.2 * 1024 * 1024;

function VideoTab({ data, refresh, pseudo, setPseudo }) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const videos = [...data.videos].sort((a, b) => b.ts - a.ts);

  const pickFile = (f) => {
    setError("");
    if (!f) return;
    if (!f.type.startsWith("video/")) return setError("Choisis un fichier vidéo.");
    if (f.size > MAX_VIDEO_BYTES) return setError(`Vidéo trop lourde (${(f.size / 1024 / 1024).toFixed(1)} Mo). Limite : ${(MAX_VIDEO_BYTES / 1024 / 1024).toFixed(1)} Mo.`);
    setFile(f);
  };

  const upload = async () => {
    if (!file || !pseudo) return;
    setUploading(true);
    setError("");
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = () => reject(new Error("Lecture impossible"));
        r.readAsDataURL(file);
      });
      const id = uid();
      const setRes = await storage.set(`video:${id}`, dataUrl, true);
      if (!setRes) throw new Error("Échec de l'enregistrement");
      const fresh = await loadData();
      fresh.videos = [...fresh.videos, { id, author: pseudo, caption: caption.trim(), ts: Date.now(), likes: 0, likedBy: [] }];
      await saveData(fresh);
      refresh(fresh);
      setUploadOpen(false);
      setFile(null);
      setCaption("");
    } catch (e) {
      setError("Une erreur est survenue pendant l'envoi. Réessaie.");
    } finally {
      setUploading(false);
    }
  };

  const toggleLike = async (video) => {
    if (!pseudo) return;
    const fresh = await loadData();
    fresh.videos = fresh.videos.map((v) => {
      if (v.id !== video.id) return v;
      const likedBy = v.likedBy || [];
      const already = likedBy.includes(pseudo);
      return { ...v, likedBy: already ? likedBy.filter((p) => p !== pseudo) : [...likedBy, pseudo], likes: already ? Math.max(0, v.likes - 1) : v.likes + 1 };
    });
    await saveData(fresh);
    refresh(fresh);
  };

  return (
    <div className="salon-fade">
      {!pseudo && <PseudoBar onSave={setPseudo} />}
      <button className="salon-btn" onClick={() => setUploadOpen(true)} disabled={!pseudo} style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 18px", borderRadius: 10, background: `linear-gradient(90deg, ${COLORS.red}, ${COLORS.gold})`, color: "#0B0E14", fontSize: 14, marginBottom: 16, opacity: pseudo ? 1 : 0.5 }}><Upload size={16} /> Publier une vidéo</button>

      {videos.length === 0 && <div style={{ padding: 40, textAlign: "center", color: COLORS.textMuted, border: `1px dashed ${COLORS.line}`, borderRadius: 14 }}>Aucune vidéo pour l'instant. Sois le·la premier·ère à publier.</div>}

      <div className="salon-scroll" style={{ display: "flex", flexDirection: "column", gap: 20, maxHeight: 640, overflowY: "auto", paddingRight: 4 }}>
        {videos.map((v) => (
          <div key={v.id} style={{ background: "#000", border: `1px solid ${COLORS.line}`, borderRadius: 16, overflow: "hidden", maxWidth: 340, margin: "0 auto", width: "100%" }}>
            <div style={{ position: "relative", background: "#000" }}>
              <VideoPlayer id={v.id} />
              <div style={{ position: "absolute", right: 10, bottom: 66, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <button className="salon-btn" onClick={() => toggleLike(v)} style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}><Heart size={20} color={(v.likedBy || []).includes(pseudo) ? COLORS.red : "#fff"} fill={(v.likedBy || []).includes(pseudo) ? COLORS.red : "none"} /></button>
                <span style={{ fontSize: 11, color: "#fff" }}>{v.likes}</span>
              </div>
              <div style={{ position: "absolute", left: 12, bottom: 12, right: 60, color: "#fff" }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>@{v.author}</div>
                {v.caption && <div style={{ fontSize: 12.5, marginTop: 2 }}>{v.caption}</div>}
                <div style={{ fontSize: 10.5, color: "#ccc", marginTop: 2 }}>{timeAgo(v.ts)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {uploadOpen && (
        <div onClick={() => !uploading && setUploadOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 16, padding: 24, maxWidth: 380, width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 className="salon-serif" style={{ fontSize: 19, margin: 0 }}>Nouvelle vidéo</h3>
              <button className="salon-btn" onClick={() => setUploadOpen(false)} style={{ background: "transparent", color: COLORS.textMuted }}><X size={18} /></button>
            </div>
            <div onClick={() => fileRef.current && fileRef.current.click()} style={{ border: `1.5px dashed ${COLORS.line}`, borderRadius: 12, padding: 24, textAlign: "center", cursor: "pointer", marginBottom: 14, color: file ? COLORS.gold : COLORS.textMuted, fontSize: 13 }}>
              {file ? file.name : "Clique pour choisir un fichier vidéo (max 3 Mo)"}
              <input ref={fileRef} type="file" accept="video/*" onChange={(e) => pickFile(e.target.files && e.target.files[0])} style={{ display: "none" }} />
            </div>
            <input className="salon-input" placeholder="Légende (optionnel)" value={caption} onChange={(e) => setCaption(e.target.value)} style={{ width: "100%", padding: "10px 12px", fontSize: 13, marginBottom: 12 }} />
            {error && <p style={{ color: COLORS.red, fontSize: 12.5, marginBottom: 12 }}>{error}</p>}
            <button className="salon-btn" onClick={upload} disabled={!file || uploading} style={{ width: "100%", padding: "12px 0", borderRadius: 10, background: COLORS.gold, color: "#0B0E14", fontSize: 14, opacity: !file || uploading ? 0.6 : 1 }}>{uploading ? "Envoi…" : "Publier"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function VideoPlayer({ id }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await storage.get(`video:${id}`, true);
        if (!cancelled && res) setSrc(res.value);
      } catch (e) {}
    })();
    return () => { cancelled = true; };
  }, [id]);
  if (!src) return <div style={{ height: 420, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textMuted, fontSize: 12 }}>Chargement de la vidéo…</div>;
  return <video src={src} controls playsInline style={{ width: "100%", maxHeight: 480, display: "block", background: "#000" }} />;
}

/* ------------------------------------------------------------------ */
/*  Character / ID card tab                                            */
/* ------------------------------------------------------------------ */
function CharacterTab({ data, refresh, pseudo, setPseudo }) {
  const own = data.characters.find((c) => c.pseudo === pseudo);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", dob: "", gender: "Non précisé", job: "", bio: "" });

  useEffect(() => {
    if (own) setForm({ firstName: own.firstName, lastName: own.lastName, dob: own.dob, gender: own.gender, job: own.job, bio: own.bio });
  }, [own?.id]);

  const myLicenses = data.licenses.filter((l) => l.characterPseudo === pseudo);

  const submit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.dob || !pseudo) return;
    const fresh = await loadData();
    const existing = fresh.characters.find((c) => c.pseudo === pseudo);
    if (existing) {
      fresh.characters = fresh.characters.map((c) => (c.pseudo === pseudo ? { ...c, ...form, ts: c.ts } : c));
    } else {
      fresh.characters = [...fresh.characters, { id: uid(), pseudo, ...form, idNumber: `RP-${shortCode(6)}`, ts: Date.now() }];
    }
    await saveData(fresh);
    setEditing(false);
    refresh(fresh);
  };

  if (!pseudo) {
    return (
      <div className="salon-fade">
        <PseudoBar onSave={setPseudo} />
        <p style={{ color: COLORS.textMuted, fontSize: 13 }}>Choisis un pseudo pour créer ton personnage.</p>
      </div>
    );
  }

  if (!own || editing) {
    return (
      <div className="salon-fade" style={{ maxWidth: 420 }}>
        <h3 className="salon-serif" style={{ fontSize: 20, margin: "0 0 4px" }}>{own ? "Modifier mon personnage" : "Créer mon personnage"}</h3>
        <p style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 16 }}>Ces informations serviront à générer ta carte d'identité RP.</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input className="salon-input" placeholder="Prénom" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} style={{ flex: 1, padding: "10px 12px", fontSize: 14 }} />
          <input className="salon-input" placeholder="Nom" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} style={{ flex: 1, padding: "10px 12px", fontSize: 14 }} />
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: COLORS.textMuted, display: "block", marginBottom: 4 }}>Date de naissance (personnage)</label>
            <input type="date" className="salon-input" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} style={{ width: "100%", padding: "10px 12px", fontSize: 14 }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: COLORS.textMuted, display: "block", marginBottom: 4 }}>Genre</label>
            <select className="salon-input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} style={{ width: "100%", padding: "10px 12px", fontSize: 14 }}>
              <option>Non précisé</option>
              <option>Homme</option>
              <option>Femme</option>
            </select>
          </div>
        </div>
        <input className="salon-input" placeholder="Métier / occupation" value={form.job} onChange={(e) => setForm({ ...form, job: e.target.value })} style={{ width: "100%", padding: "10px 12px", fontSize: 14, marginBottom: 8 }} />
        <textarea className="salon-input" placeholder="Description / historique du personnage" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} style={{ width: "100%", padding: "10px 12px", fontSize: 14, marginBottom: 14, resize: "vertical" }} />
        <div style={{ display: "flex", gap: 8 }}>
          <button className="salon-btn" onClick={submit} style={{ padding: "10px 18px", borderRadius: 9, background: COLORS.gold, color: "#0B0E14", fontSize: 14 }}>{own ? "Enregistrer" : "Créer le personnage"}</button>
          {own && <button className="salon-btn" onClick={() => setEditing(false)} style={{ padding: "10px 18px", borderRadius: 9, background: "transparent", color: COLORS.textMuted, fontSize: 14 }}>Annuler</button>}
        </div>
      </div>
    );
  }

  const age = (() => {
    const b = new Date(own.dob);
    const now = new Date();
    let a = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--;
    return a;
  })();

  return (
    <div className="salon-fade">
      <div className="id-card salon-card-shine salon-pop" style={{ marginBottom: 20 }}>
        <div className="salon-mono" style={{ fontSize: 10, letterSpacing: 1, color: COLORS.gold, marginBottom: 14 }}>LA CENTRALE · CARTE D'IDENTITÉ</div>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.blue})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#0B0E14", flexShrink: 0 }}>
            {own.firstName[0]}{own.lastName[0]}
          </div>
          <div>
            <div className="salon-serif" style={{ fontSize: 19, marginBottom: 2 }}>{own.firstName} {own.lastName}</div>
            <div style={{ fontSize: 12.5, color: COLORS.textMuted, marginBottom: 2 }}>{own.job || "Occupation non renseignée"}</div>
            <div style={{ fontSize: 12.5, color: COLORS.textMuted }}>{age} ans · {own.gender}</div>
          </div>
        </div>
        {own.bio && <p style={{ fontSize: 12.5, lineHeight: 1.5, color: COLORS.text, marginTop: 14 }}>{own.bio}</p>}
        <div className="salon-mono" style={{ marginTop: 16, fontSize: 13, letterSpacing: 2, color: COLORS.gold }}>{own.idNumber}</div>
      </div>

      <button className="salon-btn" onClick={() => setEditing(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: COLORS.surface, border: `1px solid ${COLORS.line}`, color: COLORS.text, fontSize: 12.5, marginBottom: 24 }}>
        <Pencil size={13} /> Modifier mon personnage
      </button>

      <h4 className="salon-serif" style={{ fontSize: 17, margin: "0 0 10px" }}>Permis & licences</h4>
      {myLicenses.length === 0 && <p style={{ color: COLORS.textMuted, fontSize: 13 }}>Aucun permis délivré pour l'instant. Un admin peut t'en attribuer un.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {myLicenses.map((l) => (
          <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: "10px 14px" }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{l.type}</div>
              <div className="salon-mono" style={{ fontSize: 11, color: COLORS.textMuted }}>{l.number}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 9px", borderRadius: 20, background: l.status === "valide" ? "rgba(61,220,151,0.15)" : "rgba(228,72,61,0.15)", color: l.status === "valide" ? COLORS.green : COLORS.red }}>
              {l.status === "valide" ? "Valide" : "Révoqué"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Fake search engine ("Noggle")                                      */
/* ------------------------------------------------------------------ */
function buildSearchIndex(data) {
  const idx = [];
  data.newsPosts.forEach((p) => idx.push({ kind: "Actu", title: p.title, snippet: p.body, url: `centrale-actu.rp/${p.id}` }));
  data.jtEditions.forEach((e) => idx.push({ kind: "JT", title: e.title, snippet: e.body, url: `centrale-jt.rp/${e.id}` }));
  data.feedPosts.forEach((p) => idx.push({ kind: "Fil", title: `@${p.pseudo}`, snippet: p.text, url: `centrale-fil.rp/${p.pseudo}/${p.id}` }));
  data.characters.forEach((c) => idx.push({ kind: "Profil", title: `${c.firstName} ${c.lastName}`, snippet: c.bio || c.job || "Fiche personnage RP.", url: `centrale-id.rp/${c.pseudo}` }));
  data.marketListings.forEach((m) => idx.push({ kind: "Marché", title: m.title, snippet: `${m.desc || ""} — ${m.price}`, url: `centrale-marche.rp/${m.id}` }));
  return idx;
}

function SearchTab({ data }) {
  const [query, setQuery] = useState("");
  const [ran, setRan] = useState(false);
  const index = buildSearchIndex(data);
  const results = ran
    ? index.filter((r) => (r.title + " " + r.snippet).toLowerCase().includes(query.trim().toLowerCase()))
    : [];

  const run = () => setRan(true);

  return (
    <div className="salon-fade" style={{ maxWidth: 560 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: ran ? 0 : 60, marginBottom: 22, transition: "margin .2s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.gold})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Search size={18} color="#0B0E14" />
          </div>
          <span className="salon-serif" style={{ fontSize: 26 }}>Noggle</span>
        </div>
        <div style={{ display: "flex", gap: 8, width: "100%" }}>
          <input
            className="salon-input"
            placeholder="Rechercher dans le réseau…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            style={{ flex: 1, padding: "12px 16px", fontSize: 14, borderRadius: 30 }}
          />
          <button className="salon-btn" onClick={run} style={{ width: 46, borderRadius: "50%", background: COLORS.blue, color: "#0B0E14", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Search size={17} />
          </button>
        </div>
        <p style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 10 }}>Moteur de recherche fictif — indexe uniquement le contenu publié dans l'app.</p>
      </div>

      {ran && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {results.length === 0 && <p style={{ color: COLORS.textMuted, fontSize: 13.5 }}>Aucun résultat pour « {query} ».</p>}
          {results.map((r, i) => (
            <div key={i}>
              <div className="salon-mono" style={{ fontSize: 11.5, color: COLORS.green }}>{r.url}</div>
              <div style={{ fontSize: 16, color: COLORS.blue, margin: "2px 0 3px", fontWeight: 600 }}>{r.title} <span style={{ fontSize: 10.5, color: COLORS.textMuted, fontWeight: 400 }}>· {r.kind}</span></div>
              <div style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.5 }}>{(r.snippet || "").slice(0, 140)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Bank tab (virtual RP currency, not a real payment system)          */
/* ------------------------------------------------------------------ */
function BankTab({ data, refresh, pseudo, setPseudo }) {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");

  const balance = pseudo ? getBalance(data, pseudo) : 0;
  const others = data.characters.filter((c) => c.pseudo !== pseudo);
  const myTx = (data.transactions || []).filter((t) => t.from === pseudo || t.to === pseudo).sort((a, b) => b.ts - a.ts).slice(0, 20);

  const send = async () => {
    setError(""); setSuccess("");
    const amt = parseFloat(amount);
    if (!pseudo) return;
    if (!to) return setError("Choisis un destinataire.");
    if (!(amt > 0)) return setError("Montant invalide.");
    setSending(true);
    const res = await transferMoney(pseudo, to, amt, note.trim());
    setSending(false);
    if (!res.ok) return setError(res.error);
    setSuccess(`${formatMoney(amt)} envoyés à ${to}.`);
    setAmount(""); setNote("");
    refresh(res.data);
  };

  if (!pseudo) {
    return (
      <div className="salon-fade">
        <PseudoBar onSave={setPseudo} />
        <p style={{ color: COLORS.textMuted, fontSize: 13 }}>Choisis un pseudo pour accéder à ta carte.</p>
      </div>
    );
  }

  return (
    <div className="salon-fade" style={{ maxWidth: 420 }}>
      <div
        className="id-card salon-card-shine salon-pop"
        style={{ marginBottom: 22, background: `linear-gradient(150deg, #16324A, #0B0E14 70%)`, border: `1px solid ${COLORS.blue}` }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div className="salon-mono" style={{ fontSize: 10, letterSpacing: 1, color: COLORS.blue }}>LA CENTRALE · CARTE BANCAIRE RP</div>
          <CreditCard size={22} color={COLORS.blue} />
        </div>
        <div className="salon-mono" style={{ fontSize: 17, letterSpacing: 2, margin: "26px 0 18px" }}>{cardNumberFor(pseudo)}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 10.5, color: COLORS.textMuted, marginBottom: 3 }}>TITULAIRE</div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{pseudo.toUpperCase()}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10.5, color: COLORS.textMuted, marginBottom: 3 }}>SOLDE</div>
            <div className="salon-serif" style={{ fontSize: 22, color: COLORS.green }}>{formatMoney(balance)}</div>
          </div>
        </div>
      </div>

      <h4 className="salon-serif" style={{ fontSize: 17, margin: "0 0 10px", display: "flex", alignItems: "center", gap: 8 }}>
        <ArrowRightLeft size={16} color={COLORS.blue} /> Envoyer de l'argent
      </h4>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16, marginBottom: 22 }}>
        <select className="salon-input" value={to} onChange={(e) => setTo(e.target.value)} style={{ width: "100%", padding: "9px 12px", fontSize: 13.5, marginBottom: 8 }}>
          <option value="">Choisir un destinataire</option>
          {others.map((c) => <option key={c.id} value={c.pseudo}>{c.firstName} {c.lastName} (@{c.pseudo})</option>)}
        </select>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input className="salon-input" placeholder="Montant" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ flex: 1, padding: "9px 12px", fontSize: 13.5 }} />
          <input className="salon-input" placeholder="Motif (optionnel)" value={note} onChange={(e) => setNote(e.target.value)} style={{ flex: 1.4, padding: "9px 12px", fontSize: 13.5 }} />
        </div>
        {error && <p style={{ color: COLORS.red, fontSize: 12.5, marginBottom: 8 }}>{error}</p>}
        {success && <p style={{ color: COLORS.green, fontSize: 12.5, marginBottom: 8 }}>{success}</p>}
        <button className="salon-btn" onClick={send} disabled={sending} style={{ padding: "9px 18px", borderRadius: 8, background: COLORS.blue, color: "#0B0E14", fontSize: 13, opacity: sending ? 0.6 : 1 }}>
          {sending ? "Envoi…" : "Envoyer"}
        </button>
      </div>

      <h4 className="salon-serif" style={{ fontSize: 17, margin: "0 0 10px" }}>Historique</h4>
      {myTx.length === 0 && <p style={{ color: COLORS.textMuted, fontSize: 13 }}>Aucune transaction pour l'instant.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {myTx.map((t) => (
          <div key={t.id} className="salon-hover-lift" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: "8px 12px", fontSize: 12.5 }}>
            <span>
              {t.from === pseudo ? <>Envoyé à <b style={{ color: COLORS.blue }}>{t.to}</b></> : <>Reçu de <b style={{ color: COLORS.green }}>{t.from}</b></>}
              {t.note && <span style={{ color: COLORS.textMuted }}> · {t.note}</span>}
            </span>
            <span className="salon-mono" style={{ color: t.from === pseudo ? COLORS.red : COLORS.green, fontWeight: 700 }}>{t.from === pseudo ? "-" : "+"}{formatMoney(t.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Marketplace (generic, reused for the licit and black markets)      */
/* ------------------------------------------------------------------ */
function MarketTab({ data, refresh, pseudo, setPseudo, listKey, title, desc, accent, icon: Icon }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", price: "", desc: "" });
  const [buyingId, setBuyingId] = useState(null);
  const [buyError, setBuyError] = useState("");
  const listings = [...(data[listKey] || [])].sort((a, b) => b.ts - a.ts);

  const post = async () => {
    if (!form.title.trim() || !form.price.trim() || !pseudo) return;
    const fresh = await loadData();
    fresh[listKey] = [
      ...(fresh[listKey] || []),
      { id: uid(), seller: pseudo, title: form.title.trim(), price: form.price.trim(), desc: form.desc.trim(), ts: Date.now() },
    ];
    await saveData(fresh);
    setForm({ title: "", price: "", desc: "" });
    setOpen(false);
    refresh(fresh);
  };

  const remove = async (id) => {
    const fresh = await loadData();
    fresh[listKey] = (fresh[listKey] || []).filter((l) => l.id !== id);
    await saveData(fresh);
    refresh(fresh);
  };

  const buy = async (listing) => {
    if (!pseudo) return;
    const amt = parsePrice(listing.price);
    if (!amt) return;
    setBuyError("");
    setBuyingId(listing.id);
    const res = await transferMoney(pseudo, listing.seller, amt, `Achat : ${listing.title}`);
    if (!res.ok) {
      setBuyError(res.error);
      setBuyingId(null);
      return;
    }
    const fresh = res.data;
    fresh[listKey] = (fresh[listKey] || []).filter((l) => l.id !== listing.id);
    await saveData(fresh);
    setBuyingId(null);
    refresh(fresh);
  };

  return (
    <div className="salon-fade">
      {!pseudo && <PseudoBar onSave={setPseudo} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: COLORS.textMuted }}>
          <Icon size={16} color={accent} /> {desc}
        </div>
        <button className="salon-btn" onClick={() => setOpen(!open)} disabled={!pseudo} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: accent, color: "#0B0E14", fontSize: 12.5, opacity: pseudo ? 1 : 0.5 }}>
          <Plus size={14} /> Publier une annonce
        </button>
      </div>

      {open && (
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16, marginBottom: 18 }}>
          <input className="salon-input" placeholder="Nom de l'objet / service" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ width: "100%", padding: "9px 12px", fontSize: 13.5, marginBottom: 8 }} />
          <input className="salon-input" placeholder="Prix (ex: 250$)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} style={{ width: "100%", padding: "9px 12px", fontSize: 13.5, marginBottom: 8 }} />
          <textarea className="salon-input" placeholder="Description (optionnel)" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} rows={2} style={{ width: "100%", padding: "9px 12px", fontSize: 13.5, marginBottom: 10, resize: "vertical" }} />
          <button className="salon-btn" onClick={post} style={{ padding: "8px 16px", borderRadius: 8, background: accent, color: "#0B0E14", fontSize: 13 }}>Publier</button>
        </div>
      )}

      {listings.length === 0 && <div style={{ padding: 40, textAlign: "center", color: COLORS.textMuted, border: `1px dashed ${COLORS.line}`, borderRadius: 14 }}>Aucune annonce pour l'instant.</div>}
      {buyError && <p style={{ color: COLORS.red, fontSize: 12.5, marginBottom: 10 }}>{buyError}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {listings.map((l) => {
          const price = parsePrice(l.price);
          const canBuy = pseudo && l.seller !== pseudo && price;
          return (
            <div key={l.id} className="salon-hover-lift" style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 700 }}>{l.title}</div>
                  {l.desc && <div style={{ fontSize: 12.5, color: COLORS.textMuted, marginTop: 3, lineHeight: 1.5 }}>{l.desc}</div>}
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 6 }}>Vendeur : <b style={{ color: COLORS.blue }}>{l.seller}</b> · {timeAgo(l.ts)}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                  <span className="salon-mono" style={{ fontSize: 13.5, color: accent, fontWeight: 700 }}>{l.price}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    {canBuy && (
                      <button className="salon-btn" onClick={() => buy(l)} disabled={buyingId === l.id} style={{ padding: "5px 10px", borderRadius: 7, background: accent, color: "#0B0E14", fontSize: 11.5, opacity: buyingId === l.id ? 0.6 : 1 }}>
                        {buyingId === l.id ? "…" : "Acheter"}
                      </button>
                    )}
                    {l.seller === pseudo && (
                      <button className="salon-btn" onClick={() => remove(l.id)} style={{ background: "transparent", color: COLORS.textMuted }}><Trash2 size={14} /></button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Admin tab                                                            */
/* ------------------------------------------------------------------ */
function AdminTab({ data, refresh }) {
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [licenseChar, setLicenseChar] = useState("");
  const [licenseType, setLicenseType] = useState(LICENSE_TYPES[0]);

  const login = () => {
    if (pwd === ADMIN_PASSWORD) { setAuthed(true); setPwdError(""); } else setPwdError("Mot de passe incorrect.");
  };

  const addPost = async () => {
    if (!newTitle.trim() || !newBody.trim()) return;
    const fresh = await loadData();
    fresh.newsPosts = [...fresh.newsPosts, { id: uid(), title: newTitle.trim(), body: newBody.trim(), ts: Date.now(), comments: [] }];
    await saveData(fresh);
    setNewTitle(""); setNewBody("");
    refresh(fresh);
  };
  const deletePost = async (id) => { const fresh = await loadData(); fresh.newsPosts = fresh.newsPosts.filter((p) => p.id !== id); await saveData(fresh); refresh(fresh); };
  const deleteMessage = async (id) => { const fresh = await loadData(); fresh.chatMessages = fresh.chatMessages.filter((m) => m.id !== id); await saveData(fresh); refresh(fresh); };
  const deleteVideo = async (id) => { const fresh = await loadData(); fresh.videos = fresh.videos.filter((v) => v.id !== id); await saveData(fresh); try { await storage.delete(`video:${id}`, true); } catch (e) {} refresh(fresh); };
  const deleteJt = async (id) => { const fresh = await loadData(); fresh.jtEditions = fresh.jtEditions.filter((e) => e.id !== id); await saveData(fresh); refresh(fresh); };
  const deleteFeedPost = async (id) => { const fresh = await loadData(); fresh.feedPosts = fresh.feedPosts.filter((p) => p.id !== id); await saveData(fresh); refresh(fresh); };
  const deleteMarketListing = async (id) => { const fresh = await loadData(); fresh.marketListings = (fresh.marketListings || []).filter((l) => l.id !== id); await saveData(fresh); refresh(fresh); };
  const deleteBlackListing = async (id) => { const fresh = await loadData(); fresh.blackListings = (fresh.blackListings || []).filter((l) => l.id !== id); await saveData(fresh); refresh(fresh); };
  const [walletChar, setWalletChar] = useState("");
  const [walletAmount, setWalletAmount] = useState("");
  const creditWallet = async () => {
    const amt = parseFloat(walletAmount);
    if (!walletChar || !Number.isFinite(amt) || amt === 0) return;
    const fresh = await loadData();
    fresh.wallets = { ...fresh.wallets, [walletChar]: getBalance(fresh, walletChar) + amt };
    fresh.transactions = [...(fresh.transactions || []), { id: uid(), from: "banque-centrale", to: walletChar, amount: amt, note: "Ajustement admin", ts: Date.now() }].slice(-300);
    await saveData(fresh);
    setWalletAmount("");
    refresh(fresh);
  };
  const deleteCharacter = async (pseudoToDelete) => { const fresh = await loadData(); fresh.characters = fresh.characters.filter((c) => c.pseudo !== pseudoToDelete); fresh.licenses = fresh.licenses.filter((l) => l.characterPseudo !== pseudoToDelete); await saveData(fresh); refresh(fresh); };

  const issueLicense = async () => {
    if (!licenseChar) return;
    const fresh = await loadData();
    fresh.licenses = [...fresh.licenses, { id: uid(), characterPseudo: licenseChar, type: licenseType, number: `${licenseType.slice(0, 3).toUpperCase()}-${shortCode(5)}`, status: "valide", ts: Date.now() }];
    await saveData(fresh);
    refresh(fresh);
  };
  const toggleLicenseStatus = async (id) => {
    const fresh = await loadData();
    fresh.licenses = fresh.licenses.map((l) => (l.id === id ? { ...l, status: l.status === "valide" ? "revoque" : "valide" } : l));
    await saveData(fresh);
    refresh(fresh);
  };
  const deleteLicense = async (id) => { const fresh = await loadData(); fresh.licenses = fresh.licenses.filter((l) => l.id !== id); await saveData(fresh); refresh(fresh); };

  if (!authed) {
    return (
      <div className="salon-fade" style={{ maxWidth: 340, margin: "40px auto" }}>
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 16, padding: 28, textAlign: "center" }}>
          <Lock size={22} color={COLORS.gold} style={{ marginBottom: 12 }} />
          <h3 className="salon-serif" style={{ fontSize: 20, margin: "0 0 6px" }}>Espace admin</h3>
          <p style={{ fontSize: 12.5, color: COLORS.textMuted, marginBottom: 16 }}>Accès réservé. Entre le mot de passe administrateur.</p>
          <input className="salon-input" type="password" placeholder="Mot de passe" value={pwd} onChange={(e) => setPwd(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()} style={{ width: "100%", padding: "10px 12px", fontSize: 14, marginBottom: 10 }} />
          {pwdError && <p style={{ color: COLORS.red, fontSize: 12.5, marginBottom: 10 }}>{pwdError}</p>}
          <button className="salon-btn" onClick={login} style={{ width: "100%", padding: "11px 0", borderRadius: 9, background: COLORS.gold, color: "#0B0E14", fontSize: 14 }}>Se connecter</button>
        </div>
      </div>
    );
  }

  return (
    <div className="salon-fade">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.gold, fontSize: 13, fontWeight: 600 }}><CheckCircle2 size={16} /> Connecté en tant qu'admin</div>
        <button className="salon-btn" onClick={() => setAuthed(false)} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", color: COLORS.textMuted, fontSize: 13 }}><LogOut size={14} /> Déconnexion</button>
      </div>

      <section style={{ marginBottom: 28 }}>
        <h4 className="salon-serif" style={{ fontSize: 17, margin: "0 0 10px" }}>Personnages & permis</h4>
        {data.characters.length === 0 && <p style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 14 }}>Aucun personnage créé pour l'instant.</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {data.characters.map((c) => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: "9px 12px", fontSize: 13 }}>
              <span>{c.firstName} {c.lastName} <span className="salon-mono" style={{ color: COLORS.textMuted, fontSize: 11 }}>· {c.idNumber} · @{c.pseudo}</span></span>
              <button className="salon-btn" onClick={() => deleteCharacter(c.pseudo)} style={{ background: "transparent", color: COLORS.red }}><Trash2 size={15} /></button>
            </div>
          ))}
        </div>

        {data.characters.length > 0 && (
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Délivrer un permis</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <select className="salon-input" value={licenseChar} onChange={(e) => setLicenseChar(e.target.value)} style={{ flex: 1, minWidth: 160, padding: "9px 10px", fontSize: 13 }}>
                <option value="">Choisir un personnage</option>
                {data.characters.map((c) => <option key={c.id} value={c.pseudo}>{c.firstName} {c.lastName} (@{c.pseudo})</option>)}
              </select>
              <select className="salon-input" value={licenseType} onChange={(e) => setLicenseType(e.target.value)} style={{ flex: 1, minWidth: 160, padding: "9px 10px", fontSize: 13 }}>
                {LICENSE_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
              <button className="salon-btn" onClick={issueLicense} disabled={!licenseChar} style={{ padding: "9px 16px", borderRadius: 8, background: COLORS.blue, color: "#0B0E14", fontSize: 13, opacity: licenseChar ? 1 : 0.5 }}>Délivrer</button>
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {data.licenses.map((l) => (
            <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: "8px 12px", fontSize: 12.5 }}>
              <span>{l.type} — @{l.characterPseudo} <span className="salon-mono" style={{ color: COLORS.textMuted }}>· {l.number}</span></span>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="salon-btn" onClick={() => toggleLicenseStatus(l.id)} title="Valider / révoquer" style={{ background: "transparent", color: l.status === "valide" ? COLORS.green : COLORS.red }}><Ban size={14} /></button>
                <button className="salon-btn" onClick={() => deleteLicense(l.id)} style={{ background: "transparent", color: COLORS.textMuted }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h4 className="salon-serif" style={{ fontSize: 17, margin: "0 0 10px", display: "flex", alignItems: "center", gap: 8 }}><CreditCard size={16} color={COLORS.blue} /> Banque</h4>
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Créditer / débiter un joueur</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select className="salon-input" value={walletChar} onChange={(e) => setWalletChar(e.target.value)} style={{ flex: 1, minWidth: 160, padding: "9px 10px", fontSize: 13 }}>
              <option value="">Choisir un personnage</option>
              {data.characters.map((c) => <option key={c.id} value={c.pseudo}>{c.firstName} {c.lastName} (@{c.pseudo})</option>)}
            </select>
            <input className="salon-input" type="number" placeholder="Montant (négatif pour débiter)" value={walletAmount} onChange={(e) => setWalletAmount(e.target.value)} style={{ flex: 1, minWidth: 160, padding: "9px 10px", fontSize: 13 }} />
            <button className="salon-btn" onClick={creditWallet} disabled={!walletChar} style={{ padding: "9px 16px", borderRadius: 8, background: COLORS.blue, color: "#0B0E14", fontSize: 13, opacity: walletChar ? 1 : 0.5 }}>Valider</button>
          </div>
        </div>
        <div className="salon-scroll" style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
          {data.characters.map((c) => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: "7px 12px", fontSize: 12.5 }}>
              <span>@{c.pseudo}</span>
              <span className="salon-mono" style={{ color: COLORS.green, fontWeight: 700 }}>{formatMoney(getBalance(data, c.pseudo))}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h4 className="salon-serif" style={{ fontSize: 17, margin: "0 0 10px" }}>Publier une actu</h4>
        <input className="salon-input" placeholder="Titre" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} style={{ width: "100%", padding: "10px 12px", fontSize: 14, marginBottom: 8 }} />
        <textarea className="salon-input" placeholder="Contenu de l'article" value={newBody} onChange={(e) => setNewBody(e.target.value)} rows={3} style={{ width: "100%", padding: "10px 12px", fontSize: 14, marginBottom: 8, resize: "vertical" }} />
        <button className="salon-btn" onClick={addPost} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, background: COLORS.gold, color: "#0B0E14", fontSize: 13 }}><Plus size={15} /> Publier</button>
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          {data.newsPosts.map((p) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: "9px 12px", fontSize: 13 }}>
              <span>{p.title}</span>
              <button className="salon-btn" onClick={() => deletePost(p.id)} style={{ background: "transparent", color: COLORS.red }}><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h4 className="salon-serif" style={{ fontSize: 17, margin: "0 0 10px" }}>Modérer le JT ({data.jtEditions.length})</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {data.jtEditions.map((e) => (
            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: "9px 12px", fontSize: 13 }}>
              <span>{e.live ? "🔴 " : ""}{e.title} — {e.author}</span>
              <button className="salon-btn" onClick={() => deleteJt(e.id)} style={{ background: "transparent", color: COLORS.red }}><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11.5, color: COLORS.textMuted, marginTop: 8 }}>Le mot de passe rédaction pour publier des éditions JT est distinct du mot de passe admin.</p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h4 className="salon-serif" style={{ fontSize: 17, margin: "0 0 10px" }}>Modérer le fil ({data.feedPosts.length})</h4>
        <div className="salon-scroll" style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
          {data.feedPosts.map((p) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: "7px 12px", fontSize: 12.5 }}>
              <span><b style={{ color: COLORS.blue }}>{p.pseudo}</b> : {p.text}</span>
              <button className="salon-btn" onClick={() => deleteFeedPost(p.id)} style={{ background: "transparent", color: COLORS.red }}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h4 className="salon-serif" style={{ fontSize: 17, margin: "0 0 10px" }}>Modérer le chat ({data.chatMessages.length})</h4>
        <div className="salon-scroll" style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
          {data.chatMessages.map((m) => (
            <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: "7px 12px", fontSize: 12.5 }}>
              <span><b style={{ color: COLORS.blue }}>{m.pseudo}</b> : {m.text}</span>
              <button className="salon-btn" onClick={() => deleteMessage(m.id)} style={{ background: "transparent", color: COLORS.red }}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h4 className="salon-serif" style={{ fontSize: 17, margin: "0 0 10px" }}>Modérer les vidéos ({data.videos.length})</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {data.videos.map((v) => (
            <div key={v.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: "9px 12px", fontSize: 13 }}>
              <span>@{v.author} — {v.caption || "sans légende"}</span>
              <button className="salon-btn" onClick={() => deleteVideo(v.id)} style={{ background: "transparent", color: COLORS.red }}><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h4 className="salon-serif" style={{ fontSize: 17, margin: "0 0 10px" }}>Modérer le marché ({(data.marketListings || []).length})</h4>
        <div className="salon-scroll" style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
          {(data.marketListings || []).map((l) => (
            <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: "7px 12px", fontSize: 12.5 }}>
              <span><b style={{ color: COLORS.blue }}>{l.seller}</b> : {l.title} — {l.price}</span>
              <button className="salon-btn" onClick={() => deleteMarketListing(l.id)} style={{ background: "transparent", color: COLORS.red }}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h4 className="salon-serif" style={{ fontSize: 17, margin: "0 0 10px" }}>Modérer le marché noir ({(data.blackListings || []).length})</h4>
        <div className="salon-scroll" style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
          {(data.blackListings || []).map((l) => (
            <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: "7px 12px", fontSize: 12.5 }}>
              <span><b style={{ color: COLORS.gold }}>{l.seller}</b> : {l.title} — {l.price}</span>
              <button className="salon-btn" onClick={() => deleteBlackListing(l.id)} style={{ background: "transparent", color: COLORS.red }}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11.5, color: COLORS.textMuted, marginTop: 8 }}>Le code d'accès du marché noir et du dark chat est le même code de vérification RP.</p>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Crest / logo mark                                                   */
/* ------------------------------------------------------------------ */
function Crest() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
      <path d="M15 2 L27 7 V15 C27 22 22 27 15 28 C8 27 3 22 3 15 V7 Z" fill="url(#g)" stroke={COLORS.gold} strokeWidth="1" />
      <text x="15" y="19" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="11" fontWeight="700" fill="#0B0E14">LC</text>
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="30" y2="30">
          <stop offset="0" stopColor={COLORS.gold} />
          <stop offset="1" stopColor={COLORS.blue} />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  App shell                                                            */
/* ------------------------------------------------------------------ */
const TABS = [
  { id: "chat", label: "Dark Chat", icon: MessageCircle },
  { id: "news", label: "Salon Actu", icon: Newspaper },
  { id: "jt", label: "JT", icon: Radio },
  { id: "feed", label: "Fil", icon: Hash },
  { id: "videos", label: "Vidéos", icon: Clapperboard },
  { id: "search", label: "Noggle", icon: Search },
  { id: "bank", label: "Banque", icon: CreditCard },
  { id: "market", label: "Marché", icon: ShoppingBag },
  { id: "blackmarket", label: "Marché noir", icon: Skull },
  { id: "character", label: "Personnage", icon: User },
  { id: "admin", label: "Admin", icon: ShieldCheck },
];

export default function App() {
  const [verified, setVerified] = useState(null);
  const [tab, setTab] = useState("chat");
  const [data, setData] = useState(emptyData);
  const [loaded, setLoaded] = useState(false);
  const [pseudo, setPseudo] = usePseudo();

  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get("age-verified", false);
        setVerified(!!(res && res.value === "1"));
      } catch (e) { setVerified(false); }
    })();
  }, []);

  const refresh = useCallback((d) => setData(d), []);

  useEffect(() => {
    if (!verified) return;
    let active = true;
    (async () => { const d = await loadData(); if (active) { setData(d); setLoaded(true); } })();
    const interval = setInterval(async () => { const d = await loadData(); if (active) setData(d); }, 6000);
    return () => { active = false; clearInterval(interval); };
  }, [verified]);

  if (verified === null) return <div className="salon-root" style={{ minHeight: "100vh" }}><GlobalStyle /></div>;

  if (!verified) return <div className="salon-root"><GlobalStyle /><AgeGate onVerified={() => setVerified(true)} /></div>;

  return (
    <div className="salon-root">
      <GlobalStyle />
      <div className="salon-shell">
        <aside className="salon-sidebar">
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 26, padding: "0 12px" }}>
            <Crest />
            <div>
              <div className="salon-serif" style={{ fontSize: 16, lineHeight: 1.1 }}>La Centrale</div>
              <div className="salon-mono" style={{ fontSize: 9.5, color: COLORS.textMuted, letterSpacing: 0.5 }}>réseau rp · nocturne</div>
            </div>
          </div>
          <nav className="salon-navlist" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)} className={`salon-btn salon-navbtn ${active ? "active" : ""}`}>
                  <Icon size={16} /> {t.label}
                </button>
              );
            })}
          </nav>
          {pseudo && (
            <div style={{ marginTop: "auto", paddingTop: 18, borderTop: `1px solid ${COLORS.line}`, fontSize: 11.5, color: COLORS.textMuted }}>
              Connecté comme <span style={{ color: COLORS.text, fontWeight: 600 }}>{pseudo}</span>
            </div>
          )}
        </aside>

        <div className="salon-main-col">
          <main style={{ maxWidth: 720, padding: "26px 24px 60px" }}>
            {!loaded ? (
              <p style={{ color: COLORS.textMuted, fontSize: 13 }}>Chargement…</p>
            ) : (
              <>
                {tab === "chat" && (
                  <AccessGate storageKey="darkchat-verified" code={DARKCHAT_CODE} accent={COLORS.red} title="Accès Dark Chat" desc="Salon nocturne réservé. Un code d'accès RP est nécessaire pour entrer.">
                    <ChatTab data={data} refresh={refresh} pseudo={pseudo} setPseudo={setPseudo} />
                  </AccessGate>
                )}
                {tab === "news" && <NewsTab data={data} refresh={refresh} pseudo={pseudo} setPseudo={setPseudo} />}
                {tab === "jt" && <JtTab data={data} refresh={refresh} pseudo={pseudo} setPseudo={setPseudo} />}
                {tab === "feed" && <FeedTab data={data} refresh={refresh} pseudo={pseudo} setPseudo={setPseudo} />}
                {tab === "videos" && <VideoTab data={data} refresh={refresh} pseudo={pseudo} setPseudo={setPseudo} />}
                {tab === "search" && <SearchTab data={data} />}
                {tab === "bank" && <BankTab data={data} refresh={refresh} pseudo={pseudo} setPseudo={setPseudo} />}
                {tab === "market" && (
                  <MarketTab
                    data={data} refresh={refresh} pseudo={pseudo} setPseudo={setPseudo}
                    listKey="marketListings" title="Marché" accent={COLORS.blue} icon={ShoppingBag}
                    desc="Petites annonces publiques du salon — objets, services, tout ce qui se vend au grand jour."
                  />
                )}
                {tab === "blackmarket" && (
                  <AccessGate storageKey="darkchat-verified" code={DARKCHAT_CODE} accent={COLORS.gold} title="Accès Marché noir" desc="Marché parallèle réservé. Le code d'accès RP du dark chat ouvre aussi cette section.">
                    <MarketTab
                      data={data} refresh={refresh} pseudo={pseudo} setPseudo={setPseudo}
                      listKey="blackListings" title="Marché noir" accent={COLORS.gold} icon={Skull}
                      desc="Annonces discrètes du réseau — à utiliser librement en RP."
                    />
                  </AccessGate>
                )}
                {tab === "character" && <CharacterTab data={data} refresh={refresh} pseudo={pseudo} setPseudo={setPseudo} />}
                {tab === "admin" && <AdminTab data={data} refresh={refresh} />}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
