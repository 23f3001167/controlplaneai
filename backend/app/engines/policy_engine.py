from typing import Dict, Any, Tuple

class PolicyEngine:
    def evaluate_policy(
        self,
        policy: Any, # Can be database Policy model or dict
        overall_risk_score: int,
        privacy_score: int,
        bias_score: int,
        confidence_score: float
    ) -> Tuple[str, str]:
        """
        Evaluates risk scores against the specified policy thresholds.
        Decision Hierarchy:
          1. Critical privacy violation (privacy_score >= 90) -> BLOCK
          2. Privacy threshold exceeded -> HUMAN_REVIEW
          3. Bias threshold exceeded -> HUMAN_REVIEW
          4. Overall risk >= block threshold -> BLOCK
          5. Overall risk >= human review threshold -> HUMAN_REVIEW
          6. Overall risk >= risk threshold -> MODIFY
          7. Low confidence (confidence_score <= 0.40) -> HUMAN_REVIEW
          8. Otherwise -> ALLOW
        """
        # Exposing thresholds
        risk_t = getattr(policy, "risk_threshold", 40)
        hr_t = getattr(policy, "human_review_threshold", 70)
        block_t = getattr(policy, "block_threshold", 90)
        priv_t = getattr(policy, "privacy_threshold", 70)
        bias_t = getattr(policy, "bias_threshold", 70)

        # 1. Critical privacy violation
        if privacy_score >= 90:
            return "BLOCK", f"Critical privacy violation detected (score: {privacy_score} >= 90)."

        # 2. Privacy threshold exceeded
        if privacy_score >= priv_t:
            return "HUMAN_REVIEW", f"Privacy threshold exceeded (score: {privacy_score} >= policy threshold: {priv_t})."

        # 3. Bias threshold exceeded
        if bias_score >= bias_t:
            return "HUMAN_REVIEW", f"Bias threshold exceeded (score: {bias_score} >= policy threshold: {bias_t})."

        # 4. Overall risk >= block threshold
        if overall_risk_score >= block_t:
            return "BLOCK", f"Overall risk score ({overall_risk_score}) meets or exceeds policy block threshold ({block_t})."

        # 5. Overall risk >= human review threshold
        if overall_risk_score >= hr_t:
            return "HUMAN_REVIEW", f"Overall risk score ({overall_risk_score}) meets or exceeds policy human review threshold ({hr_t})."

        # 6. Overall risk >= risk threshold
        if overall_risk_score >= risk_t:
            return "MODIFY", f"Overall risk score ({overall_risk_score}) meets or exceeds risk modification threshold ({risk_t}). Text will be sanitized or warning prepended."

        # 7. Low confidence (score <= 0.40)
        if confidence_score <= 0.40:
            return "HUMAN_REVIEW", f"Model confidence is insufficient ({confidence_score:.2f} <= 0.40), requiring manual verification."

        # 8. Otherwise
        return "ALLOW", f"AI interaction is within acceptable governance thresholds (Overall risk: {overall_risk_score} < policy threshold: {risk_t})."
        
        # Verify and format output
