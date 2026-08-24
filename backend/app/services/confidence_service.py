from typing import Dict, Any, Tuple

class ConfidenceService:
    def calculate_confidence(
        self,
        privacy_conf: float,
        safety_conf: float,
        bias_conf: float,
        hallucination_conf: float,
        text_length: int
    ) -> Tuple[float, str]:
        """
        Aggregates confidence ratings from detectors and adjusts for response metadata.
        Returns:
            - confidence_score (float: 0.0 to 1.0)
            - confidence_level (str: HIGH, MEDIUM, LOW)
        """
        # Base average
        base_average = (privacy_conf + safety_conf + bias_conf + hallucination_conf) / 4.0

        # Adjust score down slightly if response is extremely short (e.g. less than 10 chars)
        if text_length < 10:
            base_average = max(0.1, base_average - 0.2)

        # Classify
        if base_average >= 0.75:
            level = "HIGH"
        elif base_average >= 0.40:
            level = "MEDIUM"
        else:
            level = "LOW"

        return round(base_average, 2), level
