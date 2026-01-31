import cv2
import requests
import time
from ultralytics import YOLO

# --- CẤU HÌNH ---
MODEL_PATH = "../model/best_pose.pt"
WEB_API_URL = "http://127.0.0.1:5000/alert"
CONFIDENCE_THRESHOLD = 0.5

# Danh sách camera: ID và Link tương ứng
CAMERAS = [
    {"id": "CAM-01", "link": "rtsp://admin:Doanhhackduoc3m@192.168.1.11:554/Streaming/Channels/101"},
    {"id": "CAM-02", "link": "rtsp://admin:12345@192.168.1.64:554/Streaming/Channels/101"}
]

def run_ai_worker():
    print(f"[INFO] Đang nạp bộ não AI: {MODEL_PATH}...")
    model = YOLO(MODEL_PATH)
    
    # Mở kết nối cho tất cả camera trong danh sách
    caps = []
    for cam in CAMERAS:
        cap = cv2.VideoCapture(cam["link"])
        if cap.isOpened():
            caps.append({"id": cam["id"], "cap": cap, "last_alert": 0})
            print(f"[OK] Đã kết nối {cam['id']}")
        else:
            print(f"[ERROR] Không thể kết nối {cam['id']}")

    print("--- HỆ THỐNG ĐANG CHẠY (Nhấn 'q' để thoát) ---")

    while True:
        for cam_obj in caps:
            ret, frame = cam_obj["cap"].read()
            if not ret:
                continue

            # Chạy AI cho từng khung hình của từng Cam
            results = model(frame, conf=CONFIDENCE_THRESHOLD, stream=True, verbose=False)

            for r in results:
                # Nếu có người
                if len(r.boxes) > 0:
                    current_time = time.time()
                    # Giới hạn 2 giây báo 1 lần cho mỗi cam
                    if current_time - cam_obj["last_alert"] > 2:
                        print(f">>> CẢNH BÁO: {cam_obj['id']} phát hiện đối tượng!")
                        try:
                            requests.post(WEB_API_URL, json={"camId": cam_obj["id"], "status": "alert"})
                            cam_obj["last_alert"] = current_time
                        except:
                            pass

                # Hiển thị cửa sổ riêng cho từng Cam để bạn dễ quan sát
                annotated_frame = r.plot()
                cv2.imshow(f"MONITOR - {cam_obj['id']}", annotated_frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    for cam_obj in caps:
        cam_obj["cap"].release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    run_ai_worker()