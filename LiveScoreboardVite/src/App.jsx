import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { AnimatePresence, motion } from "framer-motion";

import heroAsset from "./assets/hero.png";

import teamHome from "../../ScoreboardWeb/assets/team_home.png";
import teamAway from "../../ScoreboardWeb/assets/team_away.png";
import scoreTime from "../../ScoreboardWeb/assets/score_time.png";
import leagueLogo from "./assets/logo_giai.png";
import periodBg from "../../ScoreboardWeb/assets/period_bg.png";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3107";

const initialState = {
  homeName: "NGỌC GIÀU",
  awayName: "HẢI ĐĂNG",
  homeScore: 1,
  awayScore: 3,
  clockSeconds: 0,
  period: "1ST",
  running: false,
  addedMinutes: 0,
  showOverlay: false,
  overlayTeam: "home",
  homeLogo: localStorage.getItem("homeLogo") || null,
  awayLogo: localStorage.getItem("awayLogo") || null,
};

function formatClock(total) {
  const seconds = Math.max(0, Math.floor(total || 0));
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function initials(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "FC";
}

function useScoreboardSocket() {
  const [state, setState] = useState(initialState);
  const [event, setEvent] = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    let reconnectTimer;

    const connect = () => {
      const socket = new WebSocket(WS_URL);
      socketRef.current = socket;

      socket.addEventListener("open", () => setConnected(true));
      socket.addEventListener("close", () => {
        setConnected(false);
        reconnectTimer = setTimeout(connect, 900);
      });
      socket.addEventListener("message", (message) => {
        const packet = JSON.parse(message.data);
        if (packet.type === "state") {
          setState((prev) => ({ ...prev, ...packet.payload }));
        }
        if (packet.type === "event") setEvent({ ...packet.payload, id: Date.now() });
      });
    };

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      socketRef.current?.close();
    };
  }, []);

  const send = (payload) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    }
  };

  return { state, event, connected, send, setState };
}

function TeamOverlay({ show, team, state }) {
  const isVisible = show;
  const name = team === "away" ? state.awayName : state.homeName;
  const logo = team === "away" ? state.awayLogo : state.homeLogo;
  const initialsText = initials(name);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="team-overlay-wrapper"
          initial={{ x: "-110%" }}
          animate={{ x: 0 }}
          exit={{ x: "-110%" }}
          transition={{ type: "spring", stiffness: 80, damping: 15 }}
        >
          <div className="team-overlay-bar">
            <AnimatePresence mode="wait">
              <motion.span
                key={name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="team-overlay-name"
              >
                {name}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="team-overlay-frame">
            <img src={heroAsset} alt="" className="team-overlay-asset" />
            <AnimatePresence mode="wait">
              <motion.div
                key={logo || initialsText}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="team-overlay-logo"
              >
                {logo ? <img src={logo} alt="" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'contain'}} /> : initialsText}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ScoreboardOverlay({ state, event }) {
  const rootRef = useRef(null);
  const logoRef = useRef(null);
  const goalRef = useRef(null);
  const trailRef = useRef(null);
  const wipeRef = useRef(null);
  const panelRef = useRef(null);
  const runnerRef = useRef(null);
  const homeLabelRef = useRef(null);
  const awayLabelRef = useRef(null);
  const sparkRefs = useRef([]);
  const homeScoreRef = useRef(null);
  const awayScoreRef = useRef(null);
  const periodRef = useRef(null);

  const centerBgRef = useRef(null);
  const homeBgRef = useRef(null);
  const awayBgRef = useRef(null);
  const periodBgRef = useRef(null);

  useEffect(() => {
    gsap.set([goalRef.current, trailRef.current, wipeRef.current, panelRef.current], { autoAlpha: 0 });
  }, []);

  const eventId = event?.id;
  const eventName = event?.name;
  const eventSide = event?.side;

  useEffect(() => {
    if (eventName !== "goal") return;
    playGoal(eventSide, {
      logo: logoRef.current,
      goal: goalRef.current,
      trail: trailRef.current,
      wipe: wipeRef.current,
      panel: panelRef.current,
      runner: runnerRef.current,
      homeLabel: homeLabelRef.current,
      awayLabel: awayLabelRef.current,
      sparks: sparkRefs.current,
      score: eventSide === "home" ? homeScoreRef.current : awayScoreRef.current,
      bgs: [centerBgRef.current, homeBgRef.current, awayBgRef.current],
    });
  }, [eventId, eventName, eventSide]);

  const sideClass = event?.side === "away" ? "away-goal" : "home-goal";

  return (
    <main className="broadcast">
      <section ref={rootRef} className={`scorebug ${sideClass}`}>
        <img ref={centerBgRef} className="asset center-frame" src={scoreTime} alt="" />
        <img ref={homeBgRef} className="asset home-frame" src={teamHome} alt="" />
        <img ref={awayBgRef} className="asset away-frame" src={teamAway} alt="" />
        <img ref={periodBgRef} className="asset period-frame" src={periodBg} alt="" />

        <div className="fx-rim" />
        <div ref={homeLabelRef} className="team-label home-label">{state.homeName}</div>
        <div ref={awayLabelRef} className="team-label away-label">{state.awayName}</div>
        <div ref={homeScoreRef} className="score-value home-score">{state.homeScore}</div>
        <div ref={awayScoreRef} className="score-value away-score">{state.awayScore}</div>
        <div className="clock-value">{formatClock(state.clockSeconds)}</div>
        <div ref={periodRef} className="period-value">{state.period}</div>

        <div ref={logoRef} className="league-logo">
          <img src={leagueLogo} alt="" />
        </div>

        <div ref={goalRef} className="goal-system">
          <div ref={trailRef} className="goal-trail" />
          <div ref={wipeRef} className="goal-wipe" />
          <div ref={runnerRef} className="team-runner">
            {initials(event?.side === "away" ? state.awayName : state.homeName)}
          </div>
          <div ref={panelRef} className="goal-panel">
            <img className="goal-plate-bg" src={event?.side === "away" ? teamAway : teamHome} alt="" />
            
            <div 
              className="goal-watermark-wrapper"
              style={{
                WebkitMaskImage: `url(${event?.side === "away" ? teamAway : teamHome})`,
                WebkitMaskSize: "100% 100%",
                WebkitMaskRepeat: "no-repeat",
                maskImage: `url(${event?.side === "away" ? teamAway : teamHome})`,
                maskSize: "100% 100%",
                maskRepeat: "no-repeat"
              }}
            >
              {(event?.side === "away" ? state.awayLogo : state.homeLogo) && (
                <img 
                  className={`goal-watermark-logo ${event?.side === "away" ? "away-side" : "home-side"}`}
                  src={event?.side === "away" ? state.awayLogo : state.homeLogo} 
                  alt="" 
                />
              )}
            </div>

            <div className="goal-text-wrapper">
              <span className="goal-text" data-text="GOALLL!!!">GOALLL!!!</span>
            </div>
            
            <div className={`goal-team-logo-container ${event?.side === "away" ? "away-side" : "home-side"}`}>
              <img src={leagueLogo} alt="" className="goal-league-logo" />
            </div>
          </div>
          <div className="goal-particles">
            {Array.from({ length: 14 }).map((_, index) => (
              <i
                key={index}
                ref={(node) => {
                  sparkRefs.current[index] = node;
                }}
                className={`spark spark-${index % 3}`}
              />
            ))}
          </div>
        </div>

        {state.addedMinutes > 0 && <div className="added-time">+{state.addedMinutes}</div>}
        <TeamOverlay show={state.showOverlay} team={state.overlayTeam} state={state} />
      </section>
    </main>
  );
}

function playGoal(side, refs) {
  const isHome = side === "home";

  gsap.killTweensOf([
    refs.logo,
    refs.goal,
    refs.trail,
    refs.wipe,
    refs.panel,
    refs.runner,
    refs.score,
    refs.homeLabel,
    refs.awayLabel,
    refs.sparks,
    ...refs.bgs,
  ]);

  const tl = gsap.timeline({
    defaults: { ease: "expo.out" },
    onComplete: () => {
      gsap.set([refs.goal, refs.trail, refs.wipe, refs.panel], { autoAlpha: 0, y: 0, scale: 1 });
      gsap.set(refs.runner, { autoAlpha: 0 });
      gsap.set([refs.homeLabel, refs.awayLabel, ...refs.bgs], { autoAlpha: 1, y: 0 });
      gsap.set(refs.score, { scale: 1, color: "#ffffff" });
    },
  });

  tl.set(refs.goal, { autoAlpha: 1 })
    .set([refs.trail, refs.wipe, refs.runner], { autoAlpha: 0 })
    .set(refs.panel, { autoAlpha: 0, scale: 0.8, transformOrigin: "center center" })
    .set(refs.sparks, { autoAlpha: 0, x: 0, y: 0, scale: 0.1 })
    .to(refs.bgs, { autoAlpha: 0, duration: 0.1 }, 0)
    .to(isHome ? refs.homeLabel : refs.awayLabel, { autoAlpha: 0, duration: 0.1 }, 0)
    .to(refs.panel, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "back.out(2)" }, 0)
    .to(refs.score, { scale: 1.6, color: "#ceff40", duration: 0.2 }, 0)
    .to(refs.score, { scale: 1, color: "#ffffff", duration: 0.6, ease: "elastic.out(1, 0.4)" }, 0.2)
    .to(refs.sparks, {
      autoAlpha: 1,
      x: (i) => (isHome ? 1 : -1) * (Math.random() * 200 - 100),
      y: () => (Math.random() - 0.5) * 160,
      scale: () => 0.5 + Math.random() * 1.5,
      rotation: () => Math.random() * 360,
      duration: 0.8,
      ease: "power3.out",
      stagger: 0.015,
    }, 0)
    .to(refs.sparks, { autoAlpha: 0, y: "+=50", duration: 0.5 }, 0.6)
    .to(refs.panel, { autoAlpha: 0, scale: 1.1, duration: 0.4, ease: "power2.in" }, 3.5)
    .to(isHome ? refs.homeLabel : refs.awayLabel, { autoAlpha: 1, duration: 0.3 }, 3.8)
    .to(refs.bgs, { autoAlpha: 1, duration: 0.3 }, 3.8)
    .to(refs.goal, { autoAlpha: 0, duration: 0.2 }, 4.0);
}

function OperatorPanel({ state, event, connected, send, setState }) {
  const [homeName, setHomeName] = useState(state.homeName);
  const [awayName, setAwayName] = useState(state.awayName);
  const clock = useMemo(() => formatClock(state.clockSeconds), [state.clockSeconds]);

  const handleLogoUpload = (side, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 256;
        let { width, height } = img;
        if (width > height && width > MAX) {
          height *= MAX / width;
          width = MAX;
        } else if (height > MAX) {
          width *= MAX / height;
          height = MAX;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/png");
        localStorage.setItem(side === "home" ? "homeLogo" : "awayLogo", dataUrl);
        send({ action: "teams", [side === "home" ? "homeLogo" : "awayLogo"]: dataUrl });
        setState && setState(prev => ({ ...prev, [side === "home" ? "homeLogo" : "awayLogo"]: dataUrl }));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <main className="operator">
      <header>
        <div>
          <strong>BTS Control Panel</strong>
          <span className={connected ? "online" : "offline"}>{connected ? "ONLINE" : "OFFLINE"}</span>
        </div>
        <time>{clock}</time>
      </header>

      <section className="control-preview">
        <div className="preview-scorebug">
          <ScoreboardOverlay state={state} event={event} />
        </div>
      </section>

      <section className="op-grid">
        <div className="op-card">
          <label>HOME</label>
          <div className="op-logo home-logo">
            {state.homeLogo ? <img src={state.homeLogo} alt="" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'contain'}} /> : initials(state.homeName)}
          </div>
          <input value={homeName} onChange={(event) => setHomeName(event.target.value)} />
          <input type="file" accept="image/*" onChange={(e) => handleLogoUpload("home", e.target.files[0])} style={{marginTop: '8px', fontSize: '12px', width: '100%'}} />
          <div className="op-score">{state.homeScore}</div>
          <div className="op-row">
            <button className="goal-btn" onClick={() => send({ action: "goal", side: "home" })}>GOAL HOME</button>
            <button onClick={() => send({ action: "toggle_overlay", show: !(state.showOverlay && state.overlayTeam === "home"), team: "home" })}>
              {state.showOverlay && state.overlayTeam === "home" ? "HIDE OVERLAY" : "SHOW OVERLAY"}
            </button>
          </div>
        </div>

        <div className="op-card">
          <label>AWAY</label>
          <div className="op-logo away-logo">
            {state.awayLogo ? <img src={state.awayLogo} alt="" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'contain'}} /> : initials(state.awayName)}
          </div>
          <input value={awayName} onChange={(event) => setAwayName(event.target.value)} />
          <input type="file" accept="image/*" onChange={(e) => handleLogoUpload("away", e.target.files[0])} style={{marginTop: '8px', fontSize: '12px', width: '100%'}} />
          <div className="op-score">{state.awayScore}</div>
          <div className="op-row">
            <button className="goal-btn cyan" onClick={() => send({ action: "goal", side: "away" })}>GOAL AWAY</button>
            <button onClick={() => send({ action: "toggle_overlay", show: !(state.showOverlay && state.overlayTeam === "away"), team: "away" })}>
              {state.showOverlay && state.overlayTeam === "away" ? "HIDE OVERLAY" : "SHOW OVERLAY"}
            </button>
          </div>
        </div>

        <div className="op-card wide">
          <label>Clock</label>
          <div className="op-row">
            <button onClick={() => send({ action: "start" })}>Start</button>
            <button onClick={() => send({ action: "pause" })}>Pause</button>
            <button onClick={() => send({ action: "clock", time: "45:00" })}>45:00</button>
            <button onClick={() => send({ action: "period", period: "2ND" })}>2ND</button>
            <button onClick={() => send({ action: "added", minutes: state.addedMinutes + 1 })}>+ET</button>
          </div>
          <div className="op-row">
            <button onClick={() => send({ action: "teams", homeName, awayName, homeLogo: localStorage.getItem("homeLogo") || undefined, awayLogo: localStorage.getItem("awayLogo") || undefined })}>Update Teams</button>
            <button onClick={() => send({ action: "score", homeScore: Math.max(0, state.homeScore - 1), awayScore: state.awayScore })}>Home -1</button>
            <button onClick={() => send({ action: "score", homeScore: state.homeScore, awayScore: Math.max(0, state.awayScore - 1) })}>Away -1</button>
            <button className="danger" onClick={() => send({ action: "reset" })}>Reset</button>
          </div>
        </div>
      </section>
    </main>
  );
}

function App() {
  const { state, event, connected, send, setState } = useScoreboardSocket();
  const params = new URLSearchParams(window.location.search);
  const route = window.location.pathname.includes("control")
    ? "control"
    : params.get("view") || "overlay";

  if (route === "control") {
    return <OperatorPanel state={state} event={event} connected={connected} send={send} setState={setState} />;
  }

  return <ScoreboardOverlay state={state} event={event} />;
}

export default App;
