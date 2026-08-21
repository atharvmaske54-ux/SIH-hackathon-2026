def extract_incident_features(raw_incident):
    """
    Transforms raw report coordinates and metadata into ML feature vector.
    """
    return {
        "latitude": raw_incident.get("latitude", 0.0),
        "longitude": raw_incident.get("longitude", 0.0),
        "is_night": 1 if "night" in str(raw_incident.get("dateTime", "")).lower() else 0,
        "category_weight": 2.5 if "Sexual" in raw_incident.get("type", "") else 1.0
    }
