export const MEDIA_DASHBOARD_CSS = `
  .md-root { background: #060908; min-height: 100vh; color: white; padding: 40px 20px; font-family: 'Inter', sans-serif; }
  .md-container { max-width: 1200px; margin: 0 auto; }
  .ql-toolbar { background: #f0f0f0 !important; border-radius: 8px 8px 0 0 !important; }
  .ql-container { border-radius: 0 0 8px 8px !important; background: white !important; color: #333 !important; }
  .md-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; }
  .md-title { font-size: 32px; font-weight: 900; color: #22c55e; text-transform: uppercase; letter-spacing: -0.5px; }
  
  .md-tabs { display: flex; gap: 30px; margin-bottom: 30px; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .md-tab { background: transparent; border: none; color: #5a6a5e; font-size: 16px; font-weight: 700; padding: 10px 0 15px; cursor: pointer; position: relative; transition: color 0.2s; }
  .md-tab.active { color: white; }
  .md-tab.active::after { content: ''; position: absolute; bottom: -1px; left: 0; width: 100%; height: 3px; background: #22c55e; border-radius: 4px; }

  .md-card { background: rgba(14,26,17,0.6); border: 1px solid rgba(34,197,94,0.1); border-radius: 20px; padding: 30px; margin-bottom: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
  .md-section-title { font-size: 20px; font-weight: 800; margin-bottom: 25px; display: flex; align-items: center; gap: 10px; }
  
  .form-group { margin-bottom: 20px; }
  .form-label { display: block; font-size: 13px; font-weight: 700; color: #7a8c7e; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; }
  .form-input { width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 12px 16px; color: white; font-size: 15px; outline: none; transition: border-color 0.2s; }
  .form-input:focus { border-color: #22c55e; }
  
  .md-editor-wrap { background: white; border-radius: 12px; overflow: hidden; margin-top: 10px; }
  .ql-container { min-height: 400px; font-size: 16px; color: #333; }
  
  .upload-area { border: 2px dashed rgba(34,197,94,0.2); border-radius: 16px; padding: 30px; text-align: center; cursor: pointer; transition: all 0.2s; }
  .upload-area:hover { border-color: #22c55e; background: rgba(34,197,94,0.05); }
  .upload-preview { max-width: 100%; max-height: 200px; border-radius: 12px; margin-top: 15px; object-fit: cover; }
  
  .md-btn { background: #22c55e; color: black; border: none; padding: 12px 30px; border-radius: 12px; font-size: 15px; font-weight: 800; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px; }
  .md-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(34,197,94,0.4); }
  .md-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  
  .md-btn-outline { background: transparent; border: 1px solid #22c55e; color: #22c55e; }
  
  .toast { position: fixed; bottom: 30px; right: 30px; padding: 16px 24px; border-radius: 12px; background: #22c55e; color: black; font-weight: 700; box-shadow: 0 10px 30px rgba(0,0,0,0.5); transform: translateY(100px); opacity: 0; transition: all 0.3s; z-index: 1000; }
  .toast.show { transform: translateY(0); opacity: 1; }
  
  .image-overlay { 
    position: absolute; inset: 0; background: rgba(0,0,0,0.4); 
    opacity: 0; display: flex; align-items: center; 
    justify-content: center; transition: 0.3s; 
  }
  .upload-area:hover .image-overlay { opacity: 1; }

  .md-match-card-premium {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 24px;
    padding: 24px;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
    gap: 20px;
    position: relative;
    overflow: hidden;
  }
  .md-match-card-premium:hover {
    background: rgba(34, 197, 94, 0.05);
    border-color: #22c55e;
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  }
  .md-match-card-premium .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .md-match-card-premium .tournament-tag {
    font-size: 10px;
    font-weight: 900;
    color: #5a6a5e;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .md-match-card-premium .status-tag {
    font-size: 10px;
    font-weight: 900;
    padding: 4px 10px;
    border-radius: 100px;
  }
  .md-match-card-premium .status-tag.live,
  .md-match-card-premium .status-tag.inprogress {
    background: #ef4444;
    color: white;
    animation: pulse 1.5s infinite;
  }
  .md-match-card-premium .status-tag.notstarted {
    background: rgba(255,255,255,0.1);
    color: #5a6a5e;
  }
  .md-match-card-premium .card-body {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
  }
  .md-match-card-premium .team {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
  .md-match-card-premium .team img {
    width: 50px;
    height: 50px;
    object-fit: contain;
  }
  .md-match-card-premium .team span {
    font-size: 13px;
    font-weight: 800;
    text-align: center;
    color: #fff;
  }
  .md-match-card-premium .score-area {
    text-align: center;
  }
  .md-match-card-premium .score {
    font-size: 32px;
    font-weight: 900;
    color: #22c55e;
    letter-spacing: -2px;
  }
  .md-match-card-premium .time {
    font-size: 11px;
    font-weight: 800;
    color: #5a6a5e;
    margin-top: 5px;
  }
  .md-match-card-premium .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 5px;
    padding-top: 15px;
    border-top: 1px solid rgba(255,255,255,0.05);
  }
  .md-match-card-premium .card-footer span {
    font-size: 11px;
    color: #5a6a5e;
    font-weight: 700;
  }
  .md-match-card-premium .select-btn {
    background: #22c55e;
    color: white;
    border: none;
    padding: 6px 15px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
  }

  .score-btn {
    width: 50px;
    height: 50px;
    border-radius: 15px;
    background: #22c55e;
    border: none;
    color: white;
    font-size: 24px;
    font-weight: 900;
    cursor: pointer;
    transition: all 0.2s;
  }
  .score-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 10px 20px rgba(34, 197, 94, 0.3);
  }
  .score-btn.minus {
    background: rgba(255, 255, 255, 0.05);
    color: #5a6a5e;
  }
  .score-btn:active {
    transform: scale(0.9);
  }

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }

  .animate-fade-in {
    animation: fadeIn 0.5s ease-out forwards;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .pulse-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: rgba(34, 197, 94, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid rgba(34, 197, 94, 0.1);
    animation: pulseBorder 2s infinite;
  }
  @keyframes pulseBorder {
    0% { border-color: rgba(34, 197, 94, 0.1); }
    50% { border-color: rgba(34, 197, 94, 0.4); }
    100% { border-color: rgba(34, 197, 94, 0.1); }
  }
`
