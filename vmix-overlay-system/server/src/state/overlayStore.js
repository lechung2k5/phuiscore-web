const stateMap = new Map();

const getInitialState = (matchId) => {
  return {
    match: {
      id: matchId,
      tournamentName: "Giải bóng đá mặc định",
      roundName: "Vòng bảng",
      stadium: "Sân vận động chính",
      status: "PRE_MATCH", // PRE_MATCH, FIRST_HALF, HALF_TIME, SECOND_HALF, EXTRA_TIME, PENALTIES, FULL_TIME
      period: "H1",
      clock: "00:00",
      extraTime: 0,
      teamA: {
        id: "team_a",
        name: "Đội A",
        shortName: "A",
        logo: "https://via.placeholder.com/150",
        score: 0,
        penaltyScore: 0,
        lineup: [],
        subs: [],
        coach: ""
      },
      teamB: {
        id: "team_b",
        name: "Đội B",
        shortName: "B",
        logo: "https://via.placeholder.com/150",
        score: 0,
        penaltyScore: 0,
        lineup: [],
        subs: [],
        coach: ""
      }
    },
    layers: {
      scoreboardTop: { visible: false, zIndex: 50 },
      scoreboardBottom: { visible: false, zIndex: 40 },
      goalPopup: { visible: false, zIndex: 80, data: null },
      substitution: { visible: false, zIndex: 80, data: null },
      cardPopup: { visible: false, zIndex: 80, data: null },
      lineup: { visible: false, zIndex: 70, data: null },
      penaltyBoard: { visible: false, zIndex: 75 },
      sponsorOverlay: { visible: false, zIndex: 60, data: null },
      mediaLogo: { visible: false, zIndex: 30, data: { logo: "", name: "" } },
      prematchBanner: { visible: false, zIndex: 90 },
      eventTicker: { visible: false, zIndex: 65, data: [] }
    }
  };
};

const getOverlayState = (matchId) => {
  if (!stateMap.has(matchId)) {
    stateMap.set(matchId, getInitialState(matchId));
  }
  return stateMap.get(matchId);
};

const updateOverlayState = (matchId, newState) => {
  // Simple merge
  const currentState = getOverlayState(matchId);
  const updatedState = {
    ...currentState,
    ...newState,
    match: { ...currentState.match, ...(newState.match || {}) },
    layers: { ...currentState.layers, ...(newState.layers || {}) }
  };
  stateMap.set(matchId, updatedState);
  return updatedState;
};

const resetOverlayState = (matchId) => {
  const initialState = getInitialState(matchId);
  stateMap.set(matchId, initialState);
  return initialState;
};

module.exports = {
  getOverlayState,
  updateOverlayState,
  resetOverlayState
};
