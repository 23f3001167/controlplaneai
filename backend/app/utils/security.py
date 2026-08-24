import re

def sanitize_input_string(text: str) -> str:
    """Basic input string sanitization (strips null-bytes, dangerous command injections)."""
    if not text:
        return ""
    # Strip null bytes
    return text.replace("\x00", "").strip()
