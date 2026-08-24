import re
from typing import Dict, Any, Tuple, List, Optional


class HallucinationService:
    @staticmethod
    def extract_keywords(text: str) -> List[str]:
        # Filter out common stop words and keep significant words (3+ chars)
        stop_words = {
            'the', 'is', 'are', 'was', 'were', 'and', 'but', 'for', 'with', 'this', 
            'that', 'these', 'those', 'they', 'them', 'their', 'have', 'has', 'had'
        }
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        return [w for w in words if w not in stop_words]

    @staticmethod
    def extract_numbers(text: str) -> List[str]:
        # Find numeric facts like 72, 100, 2026, 1.5, $10,000, 45%
        return re.findall(r'\d+(?:[\.,]\d+)?', text)


    def evaluate(self, response: str, context: Optional[str] = None) -> Tuple[int, Dict[str, Any]]:
        """
        Compares response claims against trusted context.
        Returns:
            - score (int: 0 to 100, where 100 means extreme hallucination)
            - report (dict containing findings list, overall status)
        """
        if not context or not context.strip():
            # If no context is supplied
            return 30, {
                "status": "UNABLE_TO_VERIFY",
                "score": 30,
                "claims": [],
                "explanation": "No trusted context was supplied for fact verification. Verification confidence is low.",
                "confidence": 0.30
            }

        # Clean strings
        clean_context = context.strip()
        clean_response = response.strip()

        # Split response into sentences/claims
        sentences = [s.strip() for s in re.split(r'[.!?]+', clean_response) if s.strip()]
        
        claims_report = []
        context_words = set(self.extract_keywords(clean_context))
        context_numbers = set(self.extract_numbers(clean_context))

        total_claims = len(sentences)
        if total_claims == 0:
            return 0, {"status": "SUPPORTED", "claims": [], "explanation": "Empty response.", "confidence": 1.0}

        unsupported_count = 0
        partially_supported_count = 0
        supported_count = 0
        unverifiable_identifiers_count = 0

        for idx, sentence in enumerate(sentences):
            words = self.extract_keywords(sentence)
            numbers = self.extract_numbers(sentence)

            # Check if all numbers/figures are present in context
            unsupported_numbers = [num for num in numbers if num not in context_numbers]
            
            if not words and not numbers:
                continue

            # Calculate word overlap
            matching_words = [w for w in words if w in context_words]
            overlap_pct = (len(matching_words) / len(words)) if words else 1.0

            # Classification logic
            if unsupported_numbers:
                # Numerical mismatch is a high-risk hallucination
                status = "UNSUPPORTED"
                reason = f"Numerical facts {unsupported_numbers} not found in trusted context."
                unverifiable_identifiers_count += 1
                claim_score = 95
            elif overlap_pct >= 0.70:
                status = "SUPPORTED"
                reason = "Claim words show high correlation with trusted context."
                supported_count += 1
                claim_score = 0
            elif overlap_pct >= 0.30:
                status = "PARTIALLY_SUPPORTED"
                reason = "Claim words show moderate correlation with trusted context."
                partially_supported_count += 1
                claim_score = 40
            else:
                status = "UNSUPPORTED"
                reason = "Claim words have low correlation with trusted context."
                unsupported_count += 1
                claim_score = 90

            claims_report.append({
                "claim_index": idx + 1,
                "text": sentence,
                "status": status,
                "score": claim_score,
                "reason": reason,
                "overlap_percentage": round(overlap_pct * 100, 2)
            })

        # Calculate average hallucination score based on claim performance
        # Weighted score: UNSUPPORTED claims are heavily weighted
        # Weighting: Supported = 0, Partially = 40, Unsupported = 90, Unsupported Numbers = 100
        total_score_sum = sum(c["score"] for c in claims_report)
        avg_score = round(total_score_sum / len(claims_report)) if claims_report else 0

        # Overall assessment classification
        if unsupported_count > 0 or unverifiable_identifiers_count > 0:
            overall_status = "UNSUPPORTED"
            explanation = "One or more statements in the response are unsupported by the trusted context."
        elif partially_supported_count > 0:
            overall_status = "PARTIALLY_SUPPORTED"
            explanation = "Response contains statements that are only partially verifiable through the context."
        else:
            overall_status = "SUPPORTED"
            explanation = "All statements are fully supported by the trusted context."

        confidence = 0.90 if len(claims_report) > 0 else 1.0

        return avg_score, {
            "status": overall_status,
            "claims": claims_report,
            "explanation": explanation,
            "confidence": confidence
        }
