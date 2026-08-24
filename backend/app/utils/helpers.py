import json
from datetime import datetime
from typing import Any, Dict

def serialize_datetime(dt: datetime) -> str:
    """Format datetime consistently for JSON responses."""
    return dt.isoformat() if dt else ""

def safe_json_load(data_str: str) -> Dict[str, Any]:
    """Safely decode JSON strings to dictionary format."""
    if not data_str:
        return {}
    try:
        return json.loads(data_str)
    except Exception:
        return {}
