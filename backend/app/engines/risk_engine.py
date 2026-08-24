from typing import Dict, Any, Tuple

class RiskEngine:
    def __init__(self):
        # Default weights
        self.weights = {
            "privacy": 0.30,
            "safety": 0.30,
            "bias": 0.20,
            "hallucination": 0.20
        }
        # Normalize weights just in case
        total = sum(self.weights.values())
        if total != 1.0:
            self.weights = {k: v / total for k, v in self.weights.items()}

    def calculate_risk(
        self,
        privacy_score: int,
        safety_score: int,
        bias_score: int,
        hallucination_score: int
    ) -> Tuple[int, str, str]:
        """
        Calculates normalized weighted risk score and level, enforcing strong-signal escalation.
        Returns:
            - overall_score (int: 0 to 100)
            - level (str: LOW, MEDIUM, HIGH, CRITICAL)
            - explanation (str)
        """
        # 1. Weighted Average Calculation
        weighted_score = (
            (privacy_score * self.weights["privacy"]) +
            (safety_score * self.weights["safety"]) +
            (bias_score * self.weights["bias"]) +
            (hallucination_score * self.weights["hallucination"])
        )
        overall_score = int(round(weighted_score))
        escalated = False
        escalation_source = None

        # 2. Strong-Signal Escalation:
        # If any single detector score is >= 80, the overall risk is escalated
        # to the maximum of those scores. This protects against dangerous actions
        # being average-diluted.
        max_detector_score = max(privacy_score, safety_score, bias_score, hallucination_score)
        if max_detector_score >= 80 and max_detector_score > overall_score:
            overall_score = max_detector_score
            escalated = True
            # Find which detector triggered it
            if max_detector_score == privacy_score:
                escalation_source = "Privacy"
            elif max_detector_score == safety_score:
                escalation_source = "Safety"
            elif max_detector_score == bias_score:
                escalation_source = "Bias"
            else:
                escalation_source = "Hallucination"

        # 3. Determine Risk Level
        # 0-39 = LOW, 40-69 = MEDIUM, 70-89 = HIGH, 90-100 = CRITICAL
        if overall_score >= 90:
            level = "CRITICAL"
        elif overall_score >= 70:
            level = "HIGH"
        elif overall_score >= 40:
            level = "MEDIUM"
        else:
            level = "LOW"

        # Explanation assembly
        if escalated:
            explanation = (
                f"Overall risk escalated to {overall_score} ({level}) due to a severe "
                f"{escalation_source} violation (score: {max_detector_score}). Weighted average was {int(round(weighted_score))}."
            )
        else:
            explanation = (
                f"Overall risk calculated as {overall_score} ({level}) using a weighted average "
                f"(Privacy: {int(privacy_score*self.weights['privacy'])}, "
                f"Safety: {int(safety_score*self.weights['safety'])}, "
                f"Bias: {int(bias_score*self.weights['bias'])}, "
                f"Hallucination: {int(hallucination_score*self.weights['hallucination'])})."
            )

        return overall_score, level, explanation
