def calculate_risk_score(incidents_count, time_of_day, lighting_quality="medium"):
    """
    Computes 0-100 Area Risk Score based on incident frequency, temporal factor, and lighting.
    """
    score = incidents_count * 18

    if time_of_day in ["night", "late_night"]:
        score += 25
    elif time_of_day == "evening":
        score += 10

    if lighting_quality == "poor":
        score += 20
    elif lighting_quality == "medium":
        score += 5

    final_score = min(100, max(5, score))

    if final_score >= 75:
        level = "Critical"
    elif final_score >= 55:
        level = "High"
    elif final_score >= 30:
        level = "Medium"
    else:
        level = "Low"

    return final_score, level
