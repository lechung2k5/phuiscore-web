import React, { useEffect, useState, useMemo, memo } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../socket/socket';

import ScoreboardTop from '../overlays/ScoreboardTop';
import ScoreboardBottom from '../overlays/ScoreboardBottom';
import GoalPopup from '../overlays/GoalPopup';
import SubstitutionOverlay from '../overlays/SubstitutionOverlay';
import CardPopup from '../overlays/CardPopup';
import CoachOverlay from '../overlays/CoachOverlay';
import LineupOverlay from '../overlays/LineupOverlay';
import PenaltyScoreboard from '../overlays/PenaltyScoreboard';
import SponsorOverlay from '../overlays/SponsorOverlay';
import MediaLogo from '../overlays/MediaLogo';
import MatchIntroBanner from '../overlays/MatchIntroBanner';
import EventTicker from '../overlays/EventTicker';
import VarOverlay from '../overlays/VarOverlay';
import HighlightOverlay from '../overlays/HighlightOverlay';
import CommentatorOverlay from '../overlays/CommentatorOverlay';

const LiveOverlayPage = () => {
  const { matchId } = useParams();
  const [overlayState, setOverlayState] = useState(null);

  useEffect(() => {
    socket.connect();
    const onConnect = () => { socket.emit('join-match', matchId); };
    socket.on('connect', onConnect);
    if (socket.connected) onConnect();
    const handleStateUpdate = (newState) => { setOverlayState(newState); };
    socket.on('overlay:state', handleStateUpdate);
    
    // Lắng nghe sự kiện tick riêng lẻ
    const handleClockTick = ({ time }) => {
      setOverlayState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          matchInfo: { ...prev.matchInfo, time }
        };
      });
    };
    socket.on('clock:tick', handleClockTick);

    return () => {
      socket.off('connect', onConnect);
      socket.off('overlay:state', handleStateUpdate);
      socket.off('clock:tick', handleClockTick);
      socket.disconnect();
    };
  }, [matchId]);

  if (!overlayState) return null;

  const { matchInfo, homeTeam, awayTeam, layers, scoreboardEvent: rootScoreboardEvent } = overlayState;

  return (
    <StableOverlays
      matchInfo={matchInfo}
      homeTeam={homeTeam}
      awayTeam={awayTeam}
      layers={layers}
      rootScoreboardEvent={rootScoreboardEvent}
    />
  );
};

// -------------------------------------------------------
// Tách thành component riêng để dùng useMemo bên trong
// -------------------------------------------------------
const StableOverlays = memo(({ matchInfo, homeTeam, awayTeam, layers, rootScoreboardEvent }) => {

  // match TĨNH - không chứa clock (clock thay đổi mỗi giây)
  // MatchIntroBanner và các overlay tĩnh sẽ không re-render khi timer tick
  const matchStatic = useMemo(() => {
    const fixLogo = (url, fallbackName) => {
      if (!url) return url;
      if (url.includes('dicebear.com')) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName || 'T')}&background=random&color=fff&size=200`;
      }
      return url;
    };

    return {
      tournamentName: matchInfo?.tournamentName,
      roundName: matchInfo?.round,
      stadium: matchInfo?.venue,
      status: matchInfo?.status,
      period: matchInfo?.period || 'H1',
      extraTime: matchInfo?.extraTime || 0,
      teamA: {
        name: homeTeam?.name,
        shortName: homeTeam?.shortName || homeTeam?.name?.substring(0, 3).toUpperCase(),
        logo: fixLogo(homeTeam?.logo, homeTeam?.shortName || homeTeam?.name),
        score: homeTeam?.score,
        color: homeTeam?.color || '#991b1b',
        textColor: homeTeam?.textColor || '#ffffff',
        penalties: homeTeam?.penalties,
        goals: homeTeam?.goals,
      },
      teamB: {
        name: awayTeam?.name,
        shortName: awayTeam?.shortName || awayTeam?.name?.substring(0, 3).toUpperCase(),
        logo: fixLogo(awayTeam?.logo, awayTeam?.shortName || awayTeam?.name),
        score: awayTeam?.score,
        color: awayTeam?.color || '#1e3a8a',
        textColor: awayTeam?.textColor || '#ffffff',
        penalties: awayTeam?.penalties,
        goals: awayTeam?.goals,
      }
    };
  }, [
    matchInfo?.tournamentName, matchInfo?.round, matchInfo?.venue,
    matchInfo?.status, matchInfo?.period, matchInfo?.extraTime,
    homeTeam?.name, homeTeam?.shortName, homeTeam?.logo, homeTeam?.score, homeTeam?.color, homeTeam?.textColor, homeTeam?.penalties, homeTeam?.goals,
    awayTeam?.name, awayTeam?.shortName, awayTeam?.logo, awayTeam?.score, awayTeam?.color, awayTeam?.textColor, awayTeam?.penalties, awayTeam?.goals,
  ]);

  // clock riêng - chỉ truyền xuống ScoreboardTop/Bottom (component biết xử lý)
  const clock = useMemo(() => {
    const t = matchInfo?.time || 0;
    return `${Math.floor(t / 60).toString().padStart(2, '0')}:${(t % 60).toString().padStart(2, '0')}`;
  }, [matchInfo?.time]);

  // match đầy đủ (có clock) - chỉ dùng cho Scoreboard
  const matchFull = useMemo(() => ({ ...matchStatic, clock }), [matchStatic, clock]);

  // scoreboardEvent - memoize để không tạo object mới mỗi frame
  const scoreboardEvent = useMemo(() => {
    const ev = rootScoreboardEvent;
    if (!ev || ev.type !== 'scoreboard_goal') return null;
    return {
      id: ev.id,
      name: 'goal',
      side: (ev.team === 'home' || ev.teamId === 'teamA') ? 'home' : 'away',
    };
  }, [rootScoreboardEvent?.id, rootScoreboardEvent?.type, rootScoreboardEvent?.team, rootScoreboardEvent?.teamId]);

  return (
    <div className="relative w-[1920px] h-[1080px] bg-transparent overflow-hidden text-white cursor-none">

      {/* Banner intro: dùng matchStatic - KHÔNG re-render khi clock tick */}
      <MatchIntroBanner
        zIndex={layers.prematchBanner?.zIndex || 90}
        visible={layers.prematchBanner?.visible}
        match={matchStatic}
      />

      {/* Scoreboard: dùng matchFull - có clock */}
      <ScoreboardTop
        zIndex={layers.scoreboardTop?.zIndex || 10}
        visible={layers.scoreboardTop?.visible && !layers.penaltyBoard?.visible}
        match={matchFull}
        event={scoreboardEvent}
      />

      <ScoreboardBottom
        zIndex={layers.scoreboardBottom?.zIndex || 10}
        visible={layers.scoreboardBottom?.visible}
        match={matchFull}
        goalData={layers.goalPopup?.data}
        goalVisible={layers.goalPopup?.visible}
      />

      <LineupOverlay 
        zIndex={layers.lineup?.zIndex || 70} 
        data={layers.lineup?.data} 
        visible={layers.lineup?.visible} 
        tournamentLogo={layers.mediaLogo?.tournamentLogo}
      />

      <PenaltyScoreboard 
        zIndex={layers.penaltyBoard?.zIndex || 75} 
        match={matchStatic} 
        visible={layers.penaltyBoard?.visible}
        tournamentLogo={layers.mediaLogo?.tournamentLogo}
      />

      {layers.sponsorOverlay?.visible && (
        <SponsorOverlay zIndex={9999} data={layers.sponsorOverlay.data} />
      )}

      {/* Popups luôn mount để GSAP xử lý in/out */}
      <GoalPopup
        zIndex={layers.goalPopup?.zIndex || 70}
        data={layers.goalPopup?.data}
        match={matchStatic}
        visible={layers.goalPopup?.visible}
      />

      <CardPopup
        zIndex={layers.cardPopup?.zIndex || 50}
        data={layers.cardPopup?.data}
        match={matchStatic}
        visible={layers.cardPopup?.visible}
      />

      <CoachOverlay
        zIndex={layers.coachPopup?.zIndex || 82}
        data={layers.coachPopup?.data}
        visible={layers.coachPopup?.visible}
      />

      <SubstitutionOverlay
        zIndex={layers.substitution?.zIndex || 60}
        data={layers.substitution?.data}
        match={matchStatic}
        visible={layers.substitution?.visible}
      />

      {layers.eventTicker?.visible && (
        <EventTicker zIndex={layers.eventTicker.zIndex} data={layers.eventTicker.data} />
      )}

      {layers.mediaLogo?.visible && (
        <MediaLogo 
          zIndex={10000} 
          data={layers.mediaLogo.data} 
          tournamentLogo={layers.mediaLogo.tournamentLogo}
        />
      )}

      {/* ================= NEW VAR OVERLAY ================= */}
      <VarOverlay
        zIndex={layers.varOverlay?.zIndex || 80}
        visible={layers.varOverlay?.visible}
        data={layers.varOverlay?.data}
      />

      {/* ================= HIGHLIGHT OVERLAY ================= */}
      <HighlightOverlay
        zIndex={layers.highlightOverlay?.zIndex || 85}
        visible={layers.highlightOverlay?.visible}
        tournamentLogo={layers.mediaLogo?.tournamentLogo}
      />

      {/* ================= COMMENTATOR OVERLAY ================= */}
      <CommentatorOverlay
        zIndex={layers.commentatorOverlay?.zIndex || 86}
        visible={layers.commentatorOverlay?.visible}
        data={layers.commentatorOverlay?.data}
        tournamentLogo={layers.mediaLogo?.tournamentLogo}
      />

    </div>
  );
});

export default LiveOverlayPage;
