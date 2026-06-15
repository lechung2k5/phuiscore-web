import React, { useEffect, useState } from 'react';
import './varOverlay.css';

const VarOverlay = ({ zIndex, visible, data }) => {
  const [show, setShow] = useState(false);
  const reason = data?.reason || 'VAR CHECK';

  useEffect(() => {
    if (visible) {
      setShow(true);
    } else {
      const timer = setTimeout(() => setShow(false), 500); // 0.5s fade out
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!show && !visible) return null;

  return (
    <div className={`var-overlay-container ${visible ? 'show' : 'hide'}`} style={{ zIndex }}>
      {/* VAR Reason Tag (Top Right) */}
      <div className="var-reason-tag">
        {reason}
      </div>
    </div>
  );
};

export default VarOverlay;
