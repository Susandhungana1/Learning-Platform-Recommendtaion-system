from typing import List, Dict, Any, Tuple
import numpy as np


class CollaborativeRecommender:
    """
    Lightweight user-based CF using cosine similarity over implicit feedback.
    Interactions are aggregated per (user,item) with a weight from events.
    """

    def __init__(self):
        self.user_index = {}
        self.item_index = {}
        self.user_item = None  # np.ndarray
        self.users: List[str] = []
        self.items: List[str] = []

    @staticmethod
    def _event_weight(evt: Dict[str, Any]) -> float:
        # simple mapping; customize as needed
        et = evt.get('type', 'view')
        score = float(evt.get('score', 0))
        if et == 'complete':
            return 3.0
        if et == 'quiz':
            return 1.0 + score
        if et == 'like':
            return 1.5
        if et == 'view':
            return 1.0
        return 0.5

    def fit(self, events: List[Dict[str, Any]]):
        # build indices
        user_set = set()
        item_set = set()
        for e in events:
            user_set.add(e['user_id'])
            item_set.add(e['item_id'])
        self.users = sorted(user_set)
        self.items = sorted(item_set)
        self.user_index = {u: i for i, u in enumerate(self.users)}
        self.item_index = {it: i for i, it in enumerate(self.items)}
        if not self.users or not self.items:
            self.user_item = np.zeros((0, 0))
            return
        M = np.zeros((len(self.users), len(self.items)), dtype=np.float32)
        for e in events:
            ui = self.user_index[e['user_id']]
            ii = self.item_index[e['item_id']]
            M[ui, ii] += self._event_weight(e)
        # normalize rows
        norms = np.linalg.norm(M, axis=1, keepdims=True) + 1e-8
        self.user_item = M / norms

    def recommend(self, user_id: str, exclude_item_ids: List[str], top_k: int = 10) -> List[Tuple[str, float]]:
        if self.user_item is None or user_id not in self.user_index:
            return []
        u_idx = self.user_index[user_id]
        u_vec = self.user_item[u_idx]
        sims = self.user_item @ u_vec
        # score items by similar users
        scores = sims @ self.user_item
        # zero out already seen
        for ex in exclude_item_ids:
            if ex in self.item_index:
                scores[self.item_index[ex]] = -1e9
        order = np.argsort(-scores)
        recs = []
        for j in order:
            if scores[j] <= -1e8:
                continue
            recs.append((self.items[j], float(scores[j])))
            if len(recs) >= top_k:
                break
        return recs
