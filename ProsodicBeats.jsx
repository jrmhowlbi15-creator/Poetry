import { useState, useEffect, useRef, useCallback } from "react";

const meters = {
  iambic: {
    name: "Iambic",
    pattern: [0, 1],
    symbol: "da-DUM",
    color: "#00f5d4",
    description: "Unstressed → Stressed (the most common in English poetry)",
    examples: [
      {
        text: "Shall I compare thee to a summer's day?",
        syllables: ["Shall","I","com","pare","thee","to","a","sum","mer's","day"],
        stress: [0,1,0,1,0,1,0,1,0,1],
      },
      {
        text: "To be or not to be, that is the question",
        syllables: ["To","be","or","not","to","be","that","is","the","ques","tion"],
        stress: [0,1,0,1,0,1,0,1,0,1,0],
      },
    ],
  },
  trochaic: {
    name: "Trochaic",
    pattern: [1, 0],
    symbol: "DUM-da",
    color: "#f72585",
    description: "Stressed → Unstressed (bold, driving rhythm)",
    examples: [
      {
        text: "Tiger, tiger, burning bright",
        syllables: ["Ti","ger","ti","ger","burn","ing","bright"],
        stress: [1,0,1,0,1,0,1],
      },
      {
        text: "Double, double, toil and trouble",
        syllables: ["Dou","ble","dou","ble","toil","and","trou","ble"],
        stress: [1,0,1,0,1,0,1,0],
      },
    ],
  },
};

const TEMPO_MS = 500;

export default function ProsodicBeats() {
  const [activeMeter, setActiveMeter] = useState("iambic");
  const [activeExample, setActiveExample] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentSyl, setCurrentSyl] = useState(-1);
  const [highlighted, setHighlighted] = useState([]);
  const audioCtx = useRef(null);
  const timeouts = useRef([]);

  const meter = meters[activeMeter];
  const example = meter.examples[activeExample];

  const getAudioCtx = () => {
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx.current;
  };

  const playTone = useCallback((stressed) => {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = stressed ? 440 : 280;
    gain.gain.setValueAtTime(stressed ? 0.5 : 0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (stressed ? 0.3 : 0.2));
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  }, []);

  const stop = useCallback(() => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
    setPlaying(false);
    setCurrentSyl(-1);
  }, []);

  const play = useCallback(() => {
    stop();
    setPlaying(true);
    setHighlighted([]);
    example.syllables.forEach((_, i) => {
      const t = setTimeout(() => {
        setCurrentSyl(i);
        setHighlighted(prev => [...prev, i]);
        playTone(example.stress[i] === 1);
        if (i === example.syllables.length - 1) {
          setTimeout(() => setPlaying(false), TEMPO_MS);
        }
      }, i * TEMPO_MS);
      timeouts.current.push(t);
    });
  }, [example, playTone, stop]);

  useEffect(() => { stop(); setHighlighted([]); }, [activeMeter, activeExample]);
  useEffect(() => () => stop(), []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      fontFamily: "'Georgia', serif",
      color: "#e8e0d5",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "40px 20px",
      backgroundImage: "radial-gradient(ellipse at 20% 20%, #1a0a2e 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, #0a1a2e 0%, transparent 60%)",
    }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 11, letterSpacing: 6, color: "#888", textTransform: "uppercase", marginBottom: 8 }}>
          Prosody Lab
        </div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 400, margin: 0, letterSpacing: 2, color: "#fff" }}>
          The Beat of Poetry
        </h1>
        <p style={{ color: "#888", marginTop: 10, fontSize: 14, fontStyle: "italic" }}>
          See and hear stressed syllables in real time
        </p>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 40 }}>
        {Object.entries(meters).map(([key, m]) => (
          <button
            key={key}
            onClick={() => { setActiveMeter(key); setActiveExample(0); }}
            style={{
              padding: "12px 28px",
              borderRadius: 4,
              border: `2px solid ${activeMeter === key ? m.color : "#333"}`,
              background: activeMeter === key ? m.color + "20" : "transparent",
              color: activeMeter === key ? m.color : "#666",
              cursor: "pointer",
              fontSize: 15,
              fontFamily: "Georgia, serif",
              letterSpacing: 1,
              transition: "all 0.2s",
              fontWeight: activeMeter === key ? 700 : 400,
            }}
          >
            {m.name}
            <div style={{ fontSize: 11, marginTop: 3, opacity: 0.8 }}>{m.symbol}</div>
          </button>
        ))}
      </div>

      <div style={{
        background: "#111118",
        border: `1px solid ${meter.color}30`,
        borderRadius: 12,
        padding: "20px 32px",
        marginBottom: 32,
        textAlign: "center",
        maxWidth: 500,
        width: "100%",
      }}>
        <div style={{ fontSize: 12, color: "#666", letterSpacing: 3, marginBottom: 12, textTransform: "uppercase" }}>
          Pattern
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 12 }}>
          {[...Array(4)].map((_, fi) =>
            meter.pattern.map((s, si) => (
              <div key={`${fi}-${si}`} style={{
                width: s ? 40 : 24,
                height: s ? 40 : 24,
                borderRadius: "50%",
                background: s ? meter.color : "#333",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: s ? 10 : 8,
                color: s ? "#000" : "#666",
                fontWeight: 700,
                alignSelf: "center",
                flexShrink: 0,
              }}>
                {s ? "S" : "u"}
              </div>
            ))
          )}
        </div>
        <div style={{ fontSize: 13, color: "#aaa", fontStyle: "italic" }}>{meter.description}</div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        {meter.examples.map((ex, i) => (
          <button
            key={i}
            onClick={() => setActiveExample(i)}
            style={{
              padding: "8px 18px",
              borderRadius: 20,
              border: `1px solid ${activeExample === i ? meter.color : "#333"}`,
              background: activeExample === i ? meter.color + "15" : "transparent",
              color: activeExample === i ? meter.color : "#555",
              cursor: "pointer",
              fontSize: 12,
              fontFamily: "Georgia, serif",
              transition: "all 0.2s",
            }}
          >
            Example {i + 1}
          </button>
        ))}
      </div>

      <div style={{
        background: "#111118",
        border: `1px solid ${meter.color}25`,
        borderRadius: 16,
        padding: "32px 24px",
        maxWidth: 680,
        width: "100%",
        marginBottom: 32,
      }}>
        <div style={{
          fontSize: 14,
          color: "#555",
          fontStyle: "italic",
          marginBottom: 28,
          textAlign: "center",
          letterSpacing: 0.5,
        }}>
          "{example.text}"
        </div>

        <div style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "12px 4px",
          marginBottom: 28,
        }}>
          {example.syllables.map((syl, i) => {
            const isActive = currentSyl === i;
            const isStressed = example.stress[i] === 1;
            const wasSeen = highlighted.includes(i);
            return (
              <div key={i} style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                transition: "transform 0.1s",
                transform: isActive ? (isStressed ? "scale(1.3) translateY(-4px)" : "scale(1.1)") : "scale(1)",
              }}>
                <div style={{
                  fontSize: 18,
                  color: isActive ? meter.color : (wasSeen && isStressed ? meter.color + "88" : "#333"),
                  transition: "color 0.2s",
                  lineHeight: 1,
                }}>
                  {isStressed ? "ˈ" : "˘"}
                </div>
                <div style={{
                  padding: isStressed ? "8px 14px" : "6px 10px",
                  borderRadius: 6,
                  background: isActive
                    ? (isStressed ? meter.color : meter.color + "55")
                    : (wasSeen ? (isStressed ? meter.color + "30" : "#222") : "#1a1a22"),
                  border: `1px solid ${isActive ? meter.color : (wasSeen && isStressed ? meter.color + "50" : "#2a2a35")}`,
                  color: isActive ? (isStressed ? "#000" : "#fff") : (wasSeen ? (isStressed ? meter.color : "#777") : "#444"),
                  fontFamily: "Georgia, serif",
                  fontSize: isStressed ? 18 : 14,
                  fontWeight: isStressed ? 700 : 400,
                  letterSpacing: 0.5,
                  transition: "all 0.15s",
                  minWidth: 28,
                  textAlign: "center",
                  textTransform: isStressed ? "uppercase" : "none",
                }}>
                  {syl}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 24, fontSize: 12, color: "#555" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: meter.color + "40", border: `1px solid ${meter.color}` }} />
            <span>Stressed (ˈ)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: "#222", border: "1px solid #444" }} />
            <span>Unstressed (˘)</span>
          </div>
        </div>
      </div>

      <button
        onClick={playing ? stop : play}
        style={{
          padding: "16px 48px",
          borderRadius: 50,
          border: `2px solid ${meter.color}`,
          background: playing ? meter.color + "30" : meter.color,
          color: playing ? meter.color : "#000",
          cursor: "pointer",
          fontSize: 16,
          fontFamily: "Georgia, serif",
          letterSpacing: 2,
          fontWeight: 700,
          transition: "all 0.2s",
          boxShadow: playing ? "none" : `0 0 30px ${meter.color}50`,
        }}
      >
        {playing ? "■  Stop" : "▶  Play Beat"}
      </button>

      <p style={{ marginTop: 16, fontSize: 12, color: "#444", fontStyle: "italic" }}>
        Syllables light up in sequence • Bigger = stressed • Higher pitch = stressed
      </p>
    </div>
  );
}
