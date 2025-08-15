from typing import List, Dict, Any
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class ContentBasedRecommender:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2))
        self.item_ids: List[str] = []
        self.item_matrix = None

    @staticmethod
    def _item_text(item: Dict[str, Any]) -> str:
        parts = [
            item.get('title', ''),
            item.get('description', ''),
            ' '.join(item.get('tags', []) or []),
            item.get('type', ''),
        ]
        return ' '.join([p for p in parts if p])

    def fit(self, items: List[Dict[str, Any]]):
        self.item_ids = [it['_id'] for it in items]
        corpus = [self._item_text(it) for it in items]
        if not corpus:
            self.item_matrix = np.zeros((0, 1))
            return
        tfidf = self.vectorizer.fit_transform(corpus)
        self.item_matrix = tfidf

    def similar_items(self, item_id: str, top_k: int = 20) -> List[str]:
        if self.item_matrix is None or item_id not in self.item_ids:
            return []
        idx = self.item_ids.index(item_id)
        sims = cosine_similarity(self.item_matrix[idx], self.item_matrix).flatten()
        order = np.argsort(-sims)
        recs = []
        for j in order:
            if j == idx:
                continue
            recs.append(self.item_ids[j])
            if len(recs) >= top_k:
                break
        return recs

    def score_user_to_items(self, user_profile_text: str, candidate_items: List[Dict[str, Any]]):
        # Build temporary matrix for candidates
        texts = [self._item_text(it) for it in candidate_items]
        if not texts:
            return np.array([])
        X = self.vectorizer.transform(texts)
        q = self.vectorizer.transform([user_profile_text])
        sims = cosine_similarity(q, X).flatten()
        return sims
