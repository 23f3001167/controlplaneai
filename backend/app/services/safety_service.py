import re
from typing import Dict, Any, Tuple, List

class SafetyService:
    def __init__(self):
        # Configurable rules: (category, pattern, score, explanation)
        self.rules = [
            (
                "MALWARE_AND_RANSOMWARE",
                re.compile(r'\b(?:malware|ransomware|trojan|keylogger|rootkit|botnet|reverse shell|payload generator|infect systems)\b', re.IGNORECASE),
                95,
                "Detected references to malicious software, payload delivery, or unauthorized machine control."
            ),
            (
                "WEAPONS_AND_EXPLOSIVES",
                re.compile(r'\b(?:bomb|explosives?|pipe-bomb|firearm|makeshift gun|weaponized chemical|dirty bomb|assassination|how to craft explosives)\b', re.IGNORECASE),
                98,
                "Detected attempts to query instructions or references to physical violence, weapons, or explosives."
            ),
            (
                "PHISHING_AND_SOCIAL_ENGINEERING",
                re.compile(r'\b(?:phishing|spoofing|credential harvesting|fake login|impersonate bank|social engineering kit)\b', re.IGNORECASE),
                85,
                "Detected phrases indicating creation of fraudulent landing pages or unauthorized access campaigns."
            ),
            (
                "CREDENTIAL_THEFT",
                re.compile(r'\b(?:steal password|brute force|bypass MFA|hashcat|mimikatz|dump credentials|bruteforcing)\b', re.IGNORECASE),
                90,
                "Detected references to credential cracking, dumping access keys, or defeating authorization mechanisms."
            ),
        ]

    def evaluate(self, text: str) -> Tuple[int, Dict[str, Any]]:
        """
        Scans text for safety threats.
        Returns:
            - score (int: 0 to 100)
            - report (dict containing findings, detected flag, category, explanation)
        """
        if not text:
            return 0, {"detected": False, "category": None, "findings": [], "explanation": "No text provided", "confidence": 1.0}

        findings = []
        max_score = 0
        detected = False
        primary_category = None
        explanation = "No safety violations detected."

        for category, pattern, score, desc in self.rules:
            matches = pattern.findall(text)
            if matches:
                detected = True
                findings.append({
                    "category": category,
                    "score": score,
                    "matches": list(set(matches)),
                    "explanation": desc
                })
                if score > max_score:
                    max_score = score
                    primary_category = category
                    explanation = desc

        confidence = 0.90 if detected else 0.95

        return max_score, {
            "detected": detected,
            "category": primary_category,
            "findings": findings,
            "explanation": explanation,
            "confidence": confidence
        }
