from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)  


camera_status = {
    "CAM-01": "online",
    "CAM-02": "online"
}


detection_history = []

@app.route('/alert', methods=['POST'])
def receive_alert():
    data = request.json
    cam_id = data.get("camId")
    status = data.get("status", "alert")
    
    if cam_id in camera_status:

        camera_status[cam_id] = status
        
        now = datetime.now()
        new_event = {
            "id": len(detection_history) + 1,
            "camId": cam_id,
            "time": now.strftime("%H:%M:%S"),
            "date": now.strftime("%d/%m/%Y"),
            "event": "Phát hiện xâm nhập",
            "type": "Motion Detection"
        }
        

        if status == "alert":
            detection_history.insert(0, new_event)
            if len(detection_history) > 50:
                detection_history.pop()

        print(f"[ALERT] {cam_id} phát hiện người lúc {new_event['time']}")
        return jsonify({"message": "Success", "history_count": len(detection_history)}), 200
    
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
    # Xóa luôn lịch sử nếu muốn (tùy chọn)
    # detection_history.clear()
    return "Đã reset trạng thái camera và lịch sử"

if __name__ == "__main__":
    print("--------------------------------------------------")
    print("[START] Server THUVISION đang chạy tại port 5000...")
    print("[INFO] Đang sẵn sàng nhận dữ liệu từ AI và gửi cho Web")
    print("--------------------------------------------------")
    app.run(port=5000, debug=False)