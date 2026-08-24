def validate_positive_number(val: int, name: str) -> None:
    """Verifies numeric input parameters are strictly positive."""
    if val <= 0:
        raise ValueError(f"Parameter '{name}' must be greater than zero.")
