import re
from typing import Dict, Any, Tuple, List

# Define Regex Patterns
EMAIL_REGEX = re.compile(r'\b([a-zA-Z0-9_.+-]+)@([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)\b')
PHONE_REGEX = re.compile(r'\b(?:\+?\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}\b')
AADHAAR_REGEX = re.compile(r'\b\d{4}[ -]\d{4}[ -]\d{4}\b|\b\d{12}\b')
CREDIT_CARD_REGEX = re.compile(r'\b(?:4[0-9]{12}(?:[0-9]{3})?|[56][1-9][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6011[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b')
IP_REGEX = re.compile(r'\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b')
API_KEY_REGEX = re.compile(r'\b(sk-[a-zA-Z0-9]{32,}|AIzaSy[a-zA-Z0-9_-]{33}|bearer\s+[a-zA-Z0-9\-_\.]{20,})\b', re.IGNORECASE)

class PrivacyService:
    @staticmethod
    def mask_email(email_str: str) -> str:
        parts = email_str.split('@')
        if len(parts) != 2:
            return "***********.com"
        mailbox, domain = parts[0], parts[1]
        if len(mailbox) <= 2:
            masked_mailbox = "**"
        else:
            masked_mailbox = mailbox[0] + "*" * (len(mailbox) - 2) + mailbox[-1]
        return f"{masked_mailbox}@{domain}"

    @staticmethod
    def mask_phone(phone_str: str) -> str:
        clean = re.sub(r'\D', '', phone_str)
        if len(clean) >= 4:
            return f"***-***-{clean[-4:]}"
        return "***-***-****"

    @staticmethod
    def mask_aadhaar(aadhaar_str: str) -> str:
        clean = re.sub(r'\D', '', aadhaar_str)
        if len(clean) >= 4:
            return f"XXXX-XXXX-{clean[-4:]}"
        return "XXXX-XXXX-XXXX"

    @staticmethod
    def mask_credit_card(cc_str: str) -> str:
        clean = re.sub(r'\D', '', cc_str)
        if len(clean) >= 4:
            return f"XXXX-XXXX-XXXX-{clean[-4:]}"
        return "XXXX-XXXX-XXXX-XXXX"

    @staticmethod
    def mask_ip(ip_str: str) -> str:
        parts = ip_str.split('.')
        if len(parts) == 4:
            return f"{parts[0]}.{parts[1]}.X.X"
        return "XXX.XXX.XXX.XXX"

    @staticmethod
    def mask_api_key(key_str: str) -> str:
        if key_str.lower().startswith("sk-"):
            return f"sk-{"*" * 8}{key_str[-4:]}"
        return "API_KEY_XXXXXXXX"

    def evaluate(self, text: str) -> Tuple[int, Dict[str, Any], str]:
        """
        Scans text for privacy violations.
        Returns:
            - score (int: 0 to 100)
            - findings (dict with list of detected entities and locations)
            - masked_text (str: sanitised version of text)
        """
        if not text:
            return 0, {"detected": [], "count": 0}, ""

        findings: List[Dict[str, Any]] = []
        masked_text = text
        score = 0

        # 1. API Keys (Severity: 95)
        for match in API_KEY_REGEX.finditer(text):
            val = match.group(0)
            findings.append({
                "type": "API_KEY",
                "severity": 95,
                "confidence": 0.95
            })
            masked_text = masked_text.replace(val, self.mask_api_key(val))
            score = max(score, 95)

        # 2. Credit Cards (Severity: 90)
        for match in CREDIT_CARD_REGEX.finditer(text):
            val = match.group(0)
            findings.append({
                "type": "CREDIT_CARD",
                "severity": 90,
                "confidence": 0.90
            })
            masked_text = masked_text.replace(val, self.mask_credit_card(val))
            score = max(score, 90)

        # 3. Aadhaar Number (Severity: 80)
        for match in AADHAAR_REGEX.finditer(text):
            val = match.group(0)
            findings.append({
                "type": "AADHAAR_NUMBER",
                "severity": 80,
                "confidence": 0.90
            })
            masked_text = masked_text.replace(val, self.mask_aadhaar(val))
            score = max(score, 80)

        # 4. Emails (Severity: 40)
        for match in EMAIL_REGEX.finditer(text):
            val = match.group(0)
            findings.append({
                "type": "EMAIL_ADDRESS",
                "severity": 40,
                "confidence": 0.99
            })
            masked_text = masked_text.replace(val, self.mask_email(val))
            score = max(score, 40)

        # 5. Phones (Severity: 40)
        for match in PHONE_REGEX.finditer(text):
            val = match.group(0)
            findings.append({
                "type": "PHONE_NUMBER",
                "severity": 40,
                "confidence": 0.85
            })
            masked_text = masked_text.replace(val, self.mask_phone(val))
            score = max(score, 40)

        # 6. IP Addresses (Severity: 30)
        for match in IP_REGEX.finditer(text):
            val = match.group(0)
            findings.append({
                "type": "IP_ADDRESS",
                "severity": 30,
                "confidence": 0.95
            })
            masked_text = masked_text.replace(val, self.mask_ip(val))
            score = max(score, 30)

        return score, {"detected": findings, "count": len(findings)}, masked_text
