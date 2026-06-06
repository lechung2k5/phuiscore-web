import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../socket/socket';

// Layers (Sẽ tạo ở các bước tiếp theo)
import ScoreboardTop from '../overlays/ScoreboardTop';
import ScoreboardBottom from '../overlays/ScoreboardBottom';
import GoalPopup from '../overlays/GoalPopup';
import SubstitutionOverlay from '../overlays/SubstitutionOverlay';
import CardPopup from '../overlays/CardPopup';
import LineupOverlay from '../overlays/LineupOverlay';
import PenaltyBoard from '../overlays/PenaltyBoard';
import SponsorOverlay from '../overlays/SponsorOverlay';
import MediaLogo from '../overlays/MediaLogo';
import PrematchBanner from '../overlays/PrematchBanner';
import EventTicker from '../overlays/EventTicker';

const LiveOverlayPage = () => {
  const { matchId } = useParams();
  const [overlayState, setOverlayState] = useState(null);

  useEffect(() => {
    socket.connect();
    socket.emit('join-match', matchId);

    const handleStateUpdate = (newState) => {
      setOverlayState(newState);
    };

    socket.on('overlay:state', handleStateUpdate);

    return () => {
      socket.off('overlay:state', handleStateUpdate);
      socket.disconnect();
    };
  }, [matchId]);

  if (!overlayState) return null; // Hoặc loading spinner (nhưng overlay thì nên để trống)

  const { match, layers } = overlayState;

  return (
    <div className="relative w-[1920px] h-[1080px] bg-transparent overflow-hidden text-white cursor-none">
      {/* Các layers render dùng absolute */}
      
      {layers.prematchBanner?.visible && (
        <PrematchBanner zIndex={layers.prematchBanner.zIndex} match={match} />
      )}
      
      {layers.scoreboardTop?.visible && (
        <ScoreboardTop zIndex={layers.scoreboardTop.zIndex} match={match} />
      )}
      
      {layers.scoreboardBottom?.visible && (
        <ScoreboardBottom zIndex={layers.scoreboardBottom.zIndex} match={match} />
      )}
      
      {layers.lineup?.visible && (
        <LineupOverlay zIndex={layers.lineup.zIndex} match={match} data={layers.lineup.data} />
      )}
      
      {layers.penaltyBoard?.visible && (
        <PenaltyBoard zIndex={layers.penaltyBoard.zIndex} match={match} />
      )}
      
      {layers.sponsorOverlay?.visible && (
        <SponsorOverlay zIndex={layers.sponsorOverlay.zIndex} data={layers.sponsorOverlay.data} />
      )}
      
      {/* Popups (tự động tắt hoặc tuỳ admin) */}
      {layers.goalPopup?.visible && (
        <GoalPopup zIndex={layers.goalPopup.zIndex} data={layers.goalPopup.data} />
      )}
      
      {layers.cardPopup?.visible && (
        <CardPopup zIndex={layers.cardPopup.zIndex} data={layers.cardPopup.data} />
      )}
      
      {layers.substitution?.visible && (
        <SubstitutionOverlay zIndex={layers.substitution.zIndex} data={layers.substitution.data} />
      )}
      
      {/* Ticker chạy chữ góc dưới */}
      {layers.eventTicker?.visible && (
        <EventTicker zIndex={layers.eventTicker.zIndex} data={layers.eventTicker.data} />
      )}
      
      {/* Logo nhà đài */}
      {layers.mediaLogo?.visible && (
        <MediaLogo zIndex={layers.mediaLogo.zIndex} data={layers.mediaLogo.data} />
      )}

    </div>
  );
};

export default LiveOverlayPage;
