import re

from sqlalchemy import Grouping, case, func, literal


def normalize_phone_number(phone: str) -> str:
    digits = re.sub(r"[^0-9]", "", phone)
    if digits.startswith("00260") and len(digits) == 14:
        return "0" + digits[5:]
    if digits.startswith("260") and len(digits) == 12:
        return "0" + digits[3:]
    return digits


def normalized_phone_expression(phone_column):
    digits = func.regexp_replace(phone_column, r"[^0-9]", "", "g")
    normalized = case(
        (
            digits.like("00260%") & (func.length(digits) == 14),
            literal("0") + func.substr(digits, 6),
        ),
        (
            digits.like("260%") & (func.length(digits) == 12),
            literal("0") + func.substr(digits, 4),
        ),
        else_=digits,
    )
    # PostgreSQL needs CASE grouped in an index, and text concatenation must be immutable.
    return Grouping(normalized)
