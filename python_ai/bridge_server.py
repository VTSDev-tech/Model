from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)  

# Trạng thái ban đầu
camera_status = {
    "CAM-01": "online",
    "CAM-02": "online"
}

# Biến phụ để kiểm soát việc ghi log lịch sử
last_recorded_status = {
    "CAM-01": "online",
    "CAM-02": "online"
}

detection_history = []

@app.route('/alert', methods=['POST'])
def receive_alert():
    data = request.json
    cam_id = data.get("camId")
    status = data.get("status", "alert") 
    behavior = data.get("behavior", "Standing")
    
    # Giả lập link video ghi hình sau khi detect
    # Trong thực tế, đây sẽ là link tới file .mp4 do AI lưu lại
    video_url = f"http://127.0.0.1:1984/stream.html?src={cam_id.lower()}&mode=webrtc"

    if cam_id in camera_status:
        camera_status[cam_id] = status

        if status == "alert" and last_recorded_status[cam_id] == "online":
            now = datetime.now()
            new_event = {
                "id": len(detection_history) + 1,
                "camId": cam_id,
                "time": now.strftime("%H:%M:%S"),
                "date": now.strftime("%d/%m/%Y"),
                "behavior": behavior, 
                "event": "Không làm việc",
                "type": "Cảnh báo",
                "videoSrc": video_url  # Thêm link video vào đây
            }
            detection_history.insert(0, new_event)
            if len(detection_history) > 50:
                detection_history.pop()
            print(f"[LOG] {cam_id} phát hiện {behavior} lúc {new_event['time']}")
        
        last_recorded_status[cam_id] = status
        return jsonify({"message": "Success", "status": status}), 200
    
    return jsonify({"message": "Invalid CamID"}), 400

@app.route('/get_status', methods=['GET'])
def get_status():
    return jsonify({
        "cameras": camera_status,
        "history": detection_history
    })

@app.route('/reset', methods=['GET'])
def reset_status():
    for key in camera_status:
        camera_status[key] = "online"
        last_recorded_status[key] = "online"
    detection_history.clear()
    return "Đã Reset hệ thống"

if __name__ == "__main__":
    app.run(port=5000, debug=False)