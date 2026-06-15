import os
import json
import cv2
import numpy as np
import easyocr
from thefuzz import process, fuzz

# Load rosters
with open("rosters.json", "r", encoding="utf-8") as f:
    rosters = json.load(f)

# Initialize OpenCV DNN Face Detector
print("Loading OpenCV DNN Face Detector...")
net = cv2.dnn.readNetFromCaffe('deploy.prototxt', 'res10_300x300_ssd_iter_140000.caffemodel')

# Initialize EasyOCR
print("Initializing EasyOCR (this may download models if first time)...")
reader = easyocr.Reader(['vi', 'en'], gpu=False)

# Directory configs
TEAMS_DATA_DIR = "teams_data"
UPLOADS_DIR = "apps/server/uploads/teams/avatars"
os.makedirs(UPLOADS_DIR, exist_ok=True)

avatar_mapping = []

# Map team names to local directory names
dir_name_mapping = {
    "Danh Nhi FC": "danhnhi",
    "Vân Tuyền FC": "vantuyen",
    "Hải Đăng Vivaco FC": "haidang",
    "Hòa Đen FC": "hoaden",
    "Ngọc Giàu FC": "ngocgiau",
    "Nhi Phong FC": "nhiphong",
    "Lọc Nước - Mặt Trời Việt FC": "locnuoc",
    "Khang Nguyễn FC": "khangnguyen"
}

def process_team(team_dir_name, team_data):
    team_id = team_data["id"]
    team_short = team_data["short_name"]
    members = team_data["members"]
    
    member_names = {m["name"]: m["id"] for m in members}
    
    team_dir = os.path.join(TEAMS_DATA_DIR, team_dir_name)
    if not os.path.exists(team_dir):
        print(f"Directory {team_dir} not found.")
        return

    print(f"\n================ Processing team: {team_data['name']} ================")
    
    for filename in os.listdir(team_dir):
        if not filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
            continue
        if filename.startswith('danhsach') or filename.startswith('Logo_doi'):
            continue
            
        filepath = os.path.join(team_dir, filename)
        
        # Read image
        img = cv2.imread(filepath)
        if img is None:
            print(f"Could not read {filepath}")
            continue
            
        # 1. OCR to find name
        results = reader.readtext(img, detail=0)
        all_text = " ".join(results)
        
        if not all_text.strip():
            print(f"[{filename}] No text detected.")
            continue

        # Fuzzy match against member names
        match, score = process.extractOne(all_text, list(member_names.keys()), scorer=fuzz.token_set_ratio)
        
        if score > 50:  # Allow some leniency
            best_member_id = member_names[match]
            print(f"[{filename}] OCR: '{all_text}' -> Matched: {match} (Score: {score})")
        else:
            print(f"[{filename}] OCR: '{all_text}' -> NO MATCH (Best was {match} with {score})")
            continue
            
        # 2. Face Detection & Cropping using DNN
        h, w = img.shape[:2]
        blob = cv2.dnn.blobFromImage(cv2.resize(img, (300, 300)), 1.0, (300, 300), (104.0, 177.0, 123.0))
        net.setInput(blob)
        detections = net.forward()
        
        best_face = None
        max_confidence = 0
        
        for i in range(0, detections.shape[2]):
            confidence = detections[0, 0, i, 2]
            if confidence > 0.5 and confidence > max_confidence: # 50% confidence threshold
                max_confidence = confidence
                box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
                best_face = box.astype("int")
                
        if best_face is None:
            print(f"  -> No face detected, skipping crop.")
            continue
            
        (startX, startY, endX, endY) = best_face
        
        # Create a square crop around the face, expanded by 1.8x
        face_w = endX - startX
        face_h = endY - startY
        center_x = startX + face_w // 2
        center_y = startY + face_h // 2
        side = int(max(face_w, face_h) * 1.8)
        
        x_new = max(0, center_x - side // 2)
        y_new = max(0, center_y - side // 2)
        x_end = min(w, x_new + side)
        y_end = min(h, y_new + side)
        
        face_crop = img[y_new:y_end, x_new:x_end]
        
        # Check if crop is valid
        if face_crop.size == 0:
            continue

        # Resize to a standard 256x256 avatar to save space
        face_crop_resized = cv2.resize(face_crop, (256, 256), interpolation=cv2.INTER_AREA)
        
        out_filename = f"{team_short}_{best_member_id}.jpg"
        out_filepath = os.path.join(UPLOADS_DIR, out_filename)
        cv2.imwrite(out_filepath, face_crop_resized)
        
        # FIX: Port should be 5000
        url = f"http://localhost:5000/uploads/teams/avatars/{out_filename}"
        avatar_mapping.append({
            "member_id": best_member_id,
            "avatar": url
        })
        print(f"  -> Saved avatar to {out_filepath}")

for team in rosters:
    dir_name = dir_name_mapping.get(team["name"])
    if dir_name:
        process_team(dir_name, team)

with open("avatar_mapping.json", "w", encoding="utf-8") as f:
    json.dump(avatar_mapping, f, ensure_ascii=False, indent=2)

print("\nDone! Saved avatar_mapping.json with", len(avatar_mapping), "avatars.")
