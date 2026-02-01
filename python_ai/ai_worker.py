import cv2
import requests
import time
import numpy as np
from ultralytics import YOLO
import os

os.environ['OPENCV_FFMPEG_LOGLEVEL'] = '-1'

# --- CẤU HÌNH ---
POSE_MODEL_PATH = "../model/best_pose.pt" 
WEB_API_URL = "http://127.0.0.1:5000/alert"
CONFIDENCE_THRESHOLD = 0.4 

CAMERAS = [
    {"id": "CAM-01", "link": "rtsp://admin:Doanhhackduoc3m@192.168.1.11:554/Streaming/Channels/101"},
    {"id": "CAM-02", "link": "rtsp://admin:12345@192.168.1.64:554/Streaming/Channels/101"}
]

def run_ai_worker():
    pose_model = YOLO(POSE_MODEL_PATH)
    caps = []
    for cam in CAMERAS:
        cap = cv2.VideoCapture(cam["link"])
        if cap.isOpened():
            caps.append({
                "id": cam["id"], "cap": cap, "last_status": "online",
                "history": ["Sitting"] * 5  # Bộ nhớ đệm 5 khung hình gần nhất
            })

    print("--- CHẾ ĐỘ DEMO ĐÃ SẴN SÀNG ---")

    while True:
        for cam_obj in caps:
            ret, frame = cam_obj["cap"].read()
            if not ret: continue

            results = pose_model(frame, conf=CONFIDENCE_THRESHOLD, verbose=False)
            raw_label = "Sitting" 
            
            for r in results:
                if r.keypoints is not None and len(r.keypoints.data) > 0:
                    kpts = r.keypoints.xy.cpu().numpy()[0] 
                    if len(kpts) >= 17:
                        # Lấy tọa độ Y của Hông (11,12) và Cổ chân (15,16)
                        hip_y = (kpts[11][1] + kpts[12][1]) / 2
                        ankle_y = (kpts[15][1] + kpts[16][1]) / 2
                        shoulder_y = (kpts[5][1] + kpts[6][1]) / 2

                        # Chiều cao Thân và Chiều cao Chân
                        torso_h = abs(hip_y - shoulder_y)
                        leg_h = abs(ankle_y - hip_y)

                        # LOGIC DEMO: 
                        # 1. Nếu không thấy cổ chân (bị bàn che) -> Dùng đầu gối (13,14)
                        if ankle_y == 0 or abs(ankle_y - hip_y) < 5:
                            knee_y = (kpts[13][1] + kpts[14][1]) / 2
                            leg_h = abs(knee_y - hip_y) * 1.8 # Ước lượng chiều dài chân từ hông-gối

                        # 2. Ngưỡng an toàn: Chân dài > 0.7 thân là Đứng
                        if leg_h > torso_h * 0.7:
                            raw_label = "Standing"

            # BỘ LỌC ĐA SỐ (Majority Vote): Tránh việc nhãn nhảy liên tục
            cam_obj["history"].pop(0)
            cam_obj["history"].append(raw_label)
            
            # Chỉ đổi trạng thái nếu 4/5 khung hình gần nhất cùng một kết quả
            final_label = max(set(cam_obj["history"]), key=cam_obj["history"].count)
            new_status = "alert" if final_label == "Standing" else "online"

            if new_status != cam_obj["last_status"]:
                try:
                    requests.post(WEB_API_URL, json={
                        "camId": cam_obj["id"], "status": new_status,
                        "behavior": final_label
                    }, timeout=1)
                    cam_obj["last_status"] = new_status
                    print(f"[{cam_obj['id']}] Chuyển trạng thái: {final_label}")
                except: pass

            # Hiển thị thực tế để bạn chỉnh dáng khi demo
            color = (0, 0, 255) if final_label == "Standing" else (0, 255, 0)
            cv2.putText(frame, f"STATUS: {final_label}", (50, 50), 2, 1.2, color, 3)
            cv2.imshow("DEMO MONITOR", frame)

        if cv2.waitKey(1) & 0xFF == ord("q"): break
    cv2.destroyAllWindows()

if __name__ == "__main__":
    run_ai_worker()