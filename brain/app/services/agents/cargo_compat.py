"""
Shared cargo compatibility table — single source of truth for all agents.

Import from here in ValidationAgent and CompatibilityAgent to avoid
divergence between the two sets of incompatible-pair rules.
"""

# Known incompatible cargo pairs (unordered — order does not matter)
INCOMPATIBLE_PAIRS: set = {
    ("HAZARDOUS", "PERISHABLE"),
    ("HAZARDOUS", "PHARMACEUTICALS"),
    ("HAZARDOUS", "FRAGILE"),
    ("HAZARDOUS", "ELECTRONICS"),
    ("LIQUID", "ELECTRONICS"),
    ("PERISHABLE", "HEAVY_MACHINERY"),
    ("FRAGILE", "HEAVY_MACHINERY"),
}

# Cargo compatibility scores (1.0 = fully compatible, 0.0 = hard-blocked)
CARGO_COMPAT: dict = {
    ("GENERAL", "GENERAL"): 1.0,
    ("GENERAL", "TEXTILES"): 0.9,
    ("GENERAL", "ELECTRONICS"): 0.7,
    ("GENERAL", "AUTOMOTIVE"): 0.6,
    ("FRAGILE", "FRAGILE"): 0.8,
    ("FRAGILE", "ELECTRONICS"): 0.7,
    ("PERISHABLE", "PERISHABLE"): 0.9,
    ("PERISHABLE", "PHARMACEUTICALS"): 0.7,
    ("HAZARDOUS", "HAZARDOUS"): 0.6,
    ("ELECTRONICS", "ELECTRONICS"): 0.9,
    ("PHARMACEUTICALS", "PHARMACEUTICALS"): 0.9,
    ("TEXTILES", "TEXTILES"): 1.0,
    ("AUTOMOTIVE", "AUTOMOTIVE"): 0.8,
    ("HEAVY_MACHINERY", "HEAVY_MACHINERY"): 0.7,
    ("LIQUID", "LIQUID"): 0.8,
}


def cargo_compatibility(a: str, b: str) -> float:
    """Return compatibility score [0,1] between two cargo types.

    Returns 0.0 for known hard-incompatible pairs, 1.0 for same type,
    and a lookup value (defaulting to 0.5) otherwise.
    """
    if a == b:
        return 1.0
    key = (a, b)
    rev = (b, a)
    if key in INCOMPATIBLE_PAIRS or rev in INCOMPATIBLE_PAIRS:
        return 0.0
    return CARGO_COMPAT.get(key, CARGO_COMPAT.get(rev, 0.5))


def is_incompatible(a: str, b: str) -> bool:
    """Return True if the two cargo types cannot share a truck."""
    return cargo_compatibility(a, b) == 0.0
