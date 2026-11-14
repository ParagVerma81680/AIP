import math
import re
import hashlib
from typing import List

def generate_local_embedding(text: str, dim: int = 384) -> List[float]:
    """
    Fast deterministic pseudo-semantic vector embedding for local/zero-cost environments.
    Uses multi-hash character and word n-gram projection normalized to unit L2 length.
    Compatible with cosine similarity search in both SQLite and pgvector.
    """
    cleaned = re.sub(r'[^a-zA-Z0-9\s]', ' ', text.lower()).strip()
    words = cleaned.split()
    vector = [0.0] * dim

    for i, word in enumerate(words):
        # Hash word
        h_word = int(hashlib.md5(word.encode('utf-8')).hexdigest(), 16)
        idx = h_word % dim
        vector[idx] += 1.0

        # Bigram
        if i > 0:
            bi = f"{words[i-1]}_{word}"
            h_bi = int(hashlib.sha256(bi.encode('utf-8')).hexdigest(), 16)
            vector[h_bi % dim] += 1.5

    # L2 normalize
    norm = math.sqrt(sum(v * v for v in vector))
    if norm > 0:
        vector = [v / norm for v in vector]
    else:
        vector[0] = 1.0

    return vector

def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Computes cosine similarity between two unit vectors."""
    if len(vec_a) != len(vec_b):
        return 0.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    return float(dot)
