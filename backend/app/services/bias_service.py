import re
from typing import Dict, Any, Tuple, List

class BiasService:
    def __init__(self):
        # We will screen using modular rules that target common stereotype structures
        self.rules = [
            {
                "category": "GENDER_BIAS",
                "pattern": re.compile(
                    r'\b(?:women|men|females|males|girls|boys)\b.*\b(?:should not|cannot|always|never|emotional|weak|aggressive|stay in the kitchen|worse at|inferior to|incapable of)\b', 
                    re.IGNORECASE
                ),
                "score": 80,
                "description": "Detected sweeping generalizations or gender-based stereotypes."
            },
            {
                "category": "RACE_ETHNICITY_BIAS",
                "pattern": re.compile(
                    r'\b(?:blacks|whites|asians|hispanics|indigenous|immigrants|foreigners|refugees)\b.*\b(?:lazy|criminals|untrustworthy|all of them|stealing jobs|inferior|savage)\b', 
                    re.IGNORECASE
                ),
                "score": 85,
                "description": "Detected racially or ethnically biased stereotypes or generalizations."
            },
            {
                "category": "AGE_BIAS",
                "pattern": re.compile(
                    r'\b(?:elderly|old people|seniors|boomers|young people|millennials|gen-z)\b.*\b(?:useless|incompetent|lazy|frail|entitled|incapable of learning|burden)\b', 
                    re.IGNORECASE
                ),
                "score": 75,
                "description": "Detected ageist generalizations or stereotypes targeting specific generations."
            },
            {
                "category": "DISABILITY_BIAS",
                "pattern": re.compile(
                    r'\b(?:disabled|handicapped|wheelchair users|deaf|blind|autistic|mental illness)\b.*\b(?:burden|cannot work|unproductive|defective|useless|incapable of living)\b', 
                    re.IGNORECASE
                ),
                "score": 80,
                "description": "Detected generalizations that stereotype or demean individuals with physical or cognitive disabilities."
            }
        ]

    def evaluate(self, text: str) -> Tuple[int, Dict[str, Any]]:
        """
        Scans text for bias and stereotypes.
        Returns:
            - score (int: 0 to 100)
            - report (dict containing findings, count, explanation, confidence)
        """
        if not text:
            return 0, {"detected": False, "category": None, "matched_rule": None, "count": 0, "explanation": "No text provided", "confidence": 1.0}

        findings = []
        max_score = 0
        detected = False
        primary_category = None
        matched_rule = None
        explanation = "No biased stereotypes or generalizations detected."

        for rule in self.rules:
            # Look for matches. We check if the pattern matches anywhere in the string.
            matches = rule["pattern"].findall(text)
            if matches:
                detected = True
                findings.append({
                    "category": rule["category"],
                    "score": rule["score"],
                    "explanation": rule["description"]
                })
                if rule["score"] > max_score:
                    max_score = rule["score"]
                    primary_category = rule["category"]
                    matched_rule = str(rule["pattern"].pattern)
                    explanation = rule["description"]

        count = len(findings)
        confidence = 0.80 if detected else 0.95

        return max_score, {
            "detected": detected,
            "category": primary_category,
            "matched_rule": matched_rule,
            "count": count,
            "explanation": explanation,
            "confidence": confidence
        }
