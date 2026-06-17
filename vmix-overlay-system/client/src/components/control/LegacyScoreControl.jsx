import React, { useMemo, useState } from 'react';
import { Modal } from 'antd';
import '../../overlays/scoreboard.css';

function initials(name) {
  if (!name) return "";
  return name.substring(0, 3).toUpperCase();
}

function formatClock(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const LegacyScoreControl = ({ matchState, updateMatch, triggerEvent }) => {
  const { homeTeam, awayTeam, matchInfo } = matchState;
  
  const clock = useMemo(() => formatClock(matchInfo?.time || 0), [matchInfo?.time]);
  const [customMinute, setCustomMinute] = useState('');
  const [customEt, setCustomEt] = useState('');

  const sendAction = (action, payload) => {
    if (action === "goal") {
      const side = payload.side;
      // Kích hoạt animation NGAY LẬP TỨC trước
      triggerEvent({ type: 'scoreboard_goal', team: side, id: Date.now() });
      // Cộng điểm SAU 1 giây để animation hiện ra trước rồi mới đổi số
      setTimeout(() => {
        if (side === "home") {
          updateMatch({ homeTeam: { ...homeTeam, score: homeTeam.score + 1 } });
        } else {
          updateMatch({ awayTeam: { ...awayTeam, score: awayTeam.score + 1 } });
        }
      }, 1000);
    }
    
    if (action === "score") {
      updateMatch({ 
        homeTeam: { ...homeTeam, score: payload.homeScore },
        awayTeam: { ...awayTeam, score: payload.awayScore }
      });
    }

    if (action === "start") {
      const newStatus = matchInfo.status === 'Scheduled' || matchInfo.status === 'PRE_MATCH' ? 'FIRST_HALF' : matchInfo.status;
      updateMatch({ matchInfo: { ...matchInfo, isRunning: true, status: newStatus } });
    }
    if (action === "pause") updateMatch({ matchInfo: { ...matchInfo, isRunning: false } });
    if (action === "clock") updateMatch({ matchInfo: { ...matchInfo, time: payload.time * 60 } });
    if (action === "period") {
      let status = "FIRST_HALF";
      if (payload.period === "H2") status = "SECOND_HALF";
      updateMatch({ matchInfo: { ...matchInfo, period: payload.period, status } });
    }
    if (action === "finish_period") {
      if (payload.period === "FT") {
        Modal.confirm({
          title: 'Xác nhận kết thúc trận đấu',
          content: 'Bạn có chắc chắn muốn kết thúc trận đấu này không? Trận đấu sẽ chuyển sang trạng thái đã kết thúc.',
          okText: 'Kết thúc',
          cancelText: 'Hủy',
          okType: 'danger',
          onOk: () => {
            updateMatch({ matchInfo: { ...matchInfo, period: payload.period, isRunning: false, status: 'FINISHED' } });
          }
        });
      } else {
        updateMatch({ matchInfo: { ...matchInfo, period: payload.period, isRunning: false, status: 'HALF_TIME' } });
      }
    }
    if (action === "extraTime") {
        updateMatch({ matchInfo: { ...matchInfo, extraTime: payload.time } });
    }
    if (action === "reset") {
      updateMatch({
        homeTeam: { ...homeTeam, score: 0 },
        awayTeam: { ...awayTeam, score: 0 },
        matchInfo: { ...matchInfo, time: 0, period: "H1", extraTime: 0, isRunning: false }
      });
    }
  };

  const handleSetClock = () => {
    const mins = parseInt(customMinute);
    if (!isNaN(mins)) {
      sendAction("clock", { time: mins });
    }
  };

  const handleSetEt = () => {
    const et = parseInt(customEt);
    if (!isNaN(et)) {
      sendAction("extraTime", { time: et });
    }
  };

  const btnStyle = { minHeight: '40px', padding: '0 16px', fontSize: '15px', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: '0.2s' };
  const scoreBtnStyle = { minHeight: '40px', width: '50px', padding: '0', fontSize: '20px', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer' };

  const isRunning = matchInfo?.isRunning;
  const currentPeriod = matchInfo?.period;

  return (
    <main className="operator" style={{ minHeight: 'auto', padding: '16px', borderRadius: '8px', overflow: 'hidden' }}>
      <header style={{ flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <strong>BTS Control Panel</strong>
          <span className="online">ONLINE</span>
        </div>
        <time style={{ fontSize: '24px' }}>{clock}</time>
      </header>

      <section className="op-grid">
        <div className="op-card">
          <label>HOME</label>
          <div className="op-logo home-logo">
            {homeTeam?.logo ? <img src={homeTeam.logo} alt="" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'contain'}} /> : initials(homeTeam?.name)}
          </div>
          <div className="op-score" style={{ fontSize: '48px', margin: '10px 0' }}>{homeTeam?.score || 0}</div>
          <div className="op-row" style={{ justifyContent: 'center', gap: '10px' }}>
            <button style={{ ...scoreBtnStyle, background: '#333', color: '#fff' }} onClick={() => sendAction("score", { homeScore: Math.max(0, (homeTeam?.score || 0) - 1), awayScore: awayTeam?.score || 0 })}>-</button>
            <button style={{ ...scoreBtnStyle, background: '#44ff44', color: '#000' }} onClick={() => sendAction("goal", { side: "home" })}>+</button>
          </div>
        </div>

        <div className="op-card">
          <label>AWAY</label>
          <div className="op-logo away-logo">
            {awayTeam?.logo ? <img src={awayTeam.logo} alt="" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'contain'}} /> : initials(awayTeam?.name)}
          </div>
          <div className="op-score" style={{ fontSize: '48px', margin: '10px 0' }}>{awayTeam?.score || 0}</div>
          <div className="op-row" style={{ justifyContent: 'center', gap: '10px' }}>
            <button style={{ ...scoreBtnStyle, background: '#333', color: '#fff' }} onClick={() => sendAction("score", { homeScore: homeTeam?.score || 0, awayScore: Math.max(0, (awayTeam?.score || 0) - 1) })}>-</button>
            <button style={{ ...scoreBtnStyle, background: '#00e5ff', color: '#000' }} onClick={() => sendAction("goal", { side: "away" })}>+</button>
          </div>
        </div>

        <div className="op-card wide" style={{ padding: '20px' }}>
          <label style={{ fontSize: '16px', marginBottom: '15px' }}>Clock Control</label>
          
          <div className="op-row" style={{ justifyContent: 'center', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <button 
              style={{ ...btnStyle, background: isRunning ? '#aadd00' : '#ccff00', color: '#000', opacity: isRunning ? 0.6 : 1 }} 
              onClick={() => sendAction("start")}
              disabled={isRunning}
            >
              {isRunning ? "Running" : "Start"}
            </button>
            <button 
              style={{ ...btnStyle, background: !isRunning ? '#aadd00' : '#ccff00', color: '#000', opacity: !isRunning ? 0.6 : 1 }} 
              onClick={() => sendAction("pause")}
              disabled={!isRunning}
            >
              Pause
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', background: '#0d1117', border: '2px solid #ccff00', borderRadius: '6px', overflow: 'hidden' }}>
              <input 
                type="number" 
                placeholder="Phút"
                style={{ width: '90px', height: '36px', textAlign: 'center', background: 'transparent', color: '#fff', border: 'none', outline: 'none', fontSize: '15px', fontWeight: 'bold' }} 
                value={customMinute} 
                onChange={e => setCustomMinute(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSetClock()}
              />
              <button style={{ ...btnStyle, background: '#ccff00', color: '#000', borderRadius: 0, minHeight: '40px' }} onClick={handleSetClock}>Set</button>
            </div>
          </div>
          
          <div className="op-row" style={{ justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
            <button 
              style={{ ...btnStyle, background: currentPeriod === 'H1' ? '#aadd00' : '#ccff00', color: '#000', opacity: currentPeriod === 'H1' ? 1 : 0.5 }} 
              onClick={() => sendAction("period", { period: "H1" })}
            >
              H1
            </button>
            <button 
              style={{ ...btnStyle, background: currentPeriod === 'H2' ? '#aadd00' : '#ccff00', color: '#000', opacity: currentPeriod === 'H2' ? 1 : 0.5 }} 
              onClick={() => sendAction("period", { period: "H2" })}
            >
              H2
            </button>
            <button 
              style={{ ...btnStyle, background: currentPeriod === 'HT' ? '#ffaa00' : '#ccff00', color: currentPeriod === 'HT' ? '#fff' : '#000', opacity: currentPeriod === 'HT' ? 1 : 0.5 }} 
              onClick={() => sendAction("finish_period", { period: "HT" })}
            >
              Hết H1 (HT)
            </button>
            <button 
              style={{ ...btnStyle, background: currentPeriod === 'FT' ? '#ff4d4f' : '#ccff00', color: currentPeriod === 'FT' ? '#fff' : '#000', opacity: currentPeriod === 'FT' ? 1 : 0.5 }} 
              onClick={() => sendAction("finish_period", { period: "FT" })}
            >
              Kết Thúc (FT)
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', background: '#0d1117', border: '2px solid #ffaa00', borderRadius: '6px', overflow: 'hidden', marginLeft: '10px' }}>
              <span style={{ color: '#ffaa00', paddingLeft: '8px', fontWeight: 'bold' }}>+</span>
              <input 
                type="number" 
                placeholder="Phút"
                style={{ width: '70px', height: '36px', textAlign: 'center', background: 'transparent', color: '#ffaa00', border: 'none', outline: 'none', fontSize: '15px', fontWeight: 'bold' }} 
                value={customEt} 
                onChange={e => setCustomEt(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleSetEt()}
              />
              <button style={{ ...btnStyle, background: '#ffaa00', color: '#000', borderRadius: 0, borderRight: '1px solid #000', minHeight: '40px' }} onClick={handleSetEt}>Show</button>
              <button style={{ ...btnStyle, background: '#333', color: '#fff', borderRadius: 0, minHeight: '40px' }} onClick={() => sendAction('extraTime', { time: 0 })}>Hide</button>
            </div>

            <button style={{ ...btnStyle, background: '#ff145b', color: '#fff', marginLeft: 'auto' }} onClick={() => sendAction("reset")}>Reset</button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default React.memo(LegacyScoreControl);
