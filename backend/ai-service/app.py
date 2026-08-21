from flask import Flask, request, jsonify
import math

app = Flask(__name__)

# Predefined Knowledge Base for Women Safety, Emergency Advice & Platform Features
SAFETY_KNOWLEDGE = {
    "emergency": {
        "keywords": ["unsafe", "following", "danger", "stalker", "threat", "scared", "help", "emergency", "sos"],
        "title": "🚨 Immediate Emergency Guidance",
        "reply": "If you are in immediate danger:\n1. Move toward a well-lit, crowded public area (store, station, guarded gate).\n2. Tap the RED SOS button on your screen bottom bar to alert emergency contacts and campus security.\n3. Trigger a Fake Call from the main screen or shortcut to deter suspicious individuals.\n4. Call Emergency Hotline 112 or Women Helpline 1091 immediately.",
        "actions": [{"label": "Trigger SOS", "action": "sos"}, {"label": "Start Fake Call", "action": "fake_call"}, {"label": "Call 112", "action": "call_112"}]
    },
    "report": {
        "keywords": ["report", "anonymous", "complain", "incident", "evidence", "privacy", "file"],
        "title": "🛡️ Reporting & Anonymity Assistance",
        "reply": "You can report safety hazards, harassment, or unsafe conditions with 100% cryptographic identity protection:\n• Toggle 'Anonymous Report' when submitting.\n• Upload photo, video, or audio evidence securely.\n• Your identity is encrypted via SHA-256 tokens visible only under high-level authority investigation.\n• You can track live verification and resolution progress in 'Track Status'.",
        "actions": [{"label": "Report Incident", "action": "open_report"}, {"label": "Track Status", "action": "track_report"}]
    },
    "route": {
        "keywords": ["route", "map", "path", "safe route", "walk", "night", "dark", "lighting", "heatmap"],
        "title": "🗺️ Safe Routing & Area Risk",
        "reply": "SafeRoute evaluates live community incident clusters, lighting levels, and security geofences:\n• Switch to 'Safest Route' mode on the Map tab to prioritize well-guarded corridors over dark shortcuts.\n• Enable 'Heatmap' overlay to view real-time high-risk zones.\n• Activate 'Safe Companion' timer when walking alone at night.",
        "actions": [{"label": "Open Safe Map", "action": "open_map"}, {"label": "Start Companion", "action": "start_companion"}]
    },
    "legal": {
        "keywords": ["rights", "law", "police", "legal", "fir", "zero fir", "helpline", "ipc", "bns"],
        "title": "⚖️ Legal Rights & Helplines",
        "reply": "Key Legal Protections:\n• Zero FIR: You can register an emergency FIR at ANY police station regardless of jurisdiction.\n• Right to Anonymity: Law protects women's identity from public disclosure during investigation.\n• Free Legal Aid: Available under District Legal Services Authority (DLSA).\n• Key Hotlines: 112 (Emergency), 1091 (Women Helpline), 1090 (Crime Stopper).",
        "actions": [{"label": "Call 1091 Helpline", "action": "call_1091"}]
    }
}

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "AI Risk & Safety Assistance Microservice Operational",
        "version": "1.1.0",
        "service": "GuardianX AI Engine"
    })

@app.route('/predict-risk', methods=['POST'])
def predict_risk():
    data = request.get_json() or {}
    lat = data.get('latitude', 19.0486)
    lon = data.get('longitude', 72.9393)
    incidents_count = data.get('incidents_count', 2)
    time_of_day = data.get('time_of_day', 'night')
    
    base_score = incidents_count * 20
    if time_of_day in ['night', 'late_night']:
        base_score += 25
    
    score = min(100, max(5, base_score))
    
    if score >= 75:
        level = "Critical"
    elif score >= 55:
        level = "High"
    elif score >= 30:
        level = "Medium"
    else:
        level = "Low"

    return jsonify({
        "status": "success",
        "latitude": lat,
        "longitude": lon,
        "risk_score": score,
        "risk_level": level,
        "factors": ["Community incident density cluster", f"Time factor: {time_of_day}"]
    })

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json() or {}
    user_msg = (data.get('message') or '').strip().lower()
    
    if not user_msg:
        return jsonify({
            "status": "error",
            "reply": "Hello! I am your SafeRoute AI Assistant. How can I assist you with safety, route guidance, or emergency advice today?"
        }), 400

    # Match user query against safety knowledge categories
    matched_cat = None
    for cat_key, cat_val in SAFETY_KNOWLEDGE.items():
        if any(kw in user_msg for kw in cat_val["keywords"]):
            matched_cat = cat_val
            break

    if matched_cat:
        return jsonify({
            "status": "success",
            "title": matched_cat["title"],
            "reply": matched_cat["reply"],
            "actions": matched_cat.get("actions", [])
        })

    # Default Intelligent AI Guidance Response
    default_reply = (
        f"I'm here to support your safety on campus and across town. "
        f"You can ask me about safe walking routes, triggering emergency SOS, reporting incidents anonymously, "
        f"or legal rights. How can I help you right now?"
    )
    return jsonify({
        "status": "success",
        "title": "🤖 SafeRoute AI Guard",
        "reply": default_reply,
        "actions": [
            {"label": "Is my location safe?", "action": "check_risk"},
            {"label": "Emergency SOS Info", "action": "sos"},
            {"label": "Report Hazard", "action": "open_report"}
        ]
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)

