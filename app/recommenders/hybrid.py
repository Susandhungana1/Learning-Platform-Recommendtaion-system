from typing import List, Dict, Any
import numpy as np
from .content_based import ContentBasedRecommender
from .collaborative import CollaborativeRecommender


class EpsilonGreedyBandit:
    def __init__(self, epsilon: float = 0.1):
        self.epsilon = epsilon
        # state: {arm_id: {count: int, total_reward: float}}
        self.state: Dict[str, Dict[str, float]] = {}

    def update(self, arm_id: str, reward: float):
        st = self.state.setdefault(arm_id, {"count": 0.0, "total_reward": 0.0})
        st["count"] += 1.0
        st["total_reward"] += float(reward)

    def select(self, candidates: List[str]) -> str:
        if not candidates:
            return None
        import random
        if random.random() < self.epsilon:
            return random.choice(candidates)
        # exploit: pick highest average reward
        best_arm = None
        best_val = -1e9
        for arm in candidates:
            st = self.state.get(arm)
            avg = (st["total_reward"] / st["count"]) if st and st["count"] > 0 else 0.0
            if avg > best_val:
                best_val = avg
                best_arm = arm
        return best_arm or candidates[0]


class HybridRecommender:
    def __init__(self, epsilon: float = 0.1):
        self.cbf = ContentBasedRecommender()
        self.cf = CollaborativeRecommender()
        self.bandits: Dict[str, EpsilonGreedyBandit] = {}
        self.epsilon = epsilon

    def fit(self, items: List[Dict[str, Any]], events: List[Dict[str, Any]]):
        self.cbf.fit(items)
        self.cf.fit(events)

    def _user_profile_text(self, user: Dict[str, Any]) -> str:
        interests = ' '.join(user.get('interests', []) or [])
        goals = ' '.join(user.get('goals', []) or [])
        return f"{interests} {goals}".strip()

    def recommend(self, user: Dict[str, Any], items: List[Dict[str, Any]], events: List[Dict[str, Any]], limit: int = 10) -> List[str]:
        user_id = user['_id']
        seen = [e['item_id'] for e in events if e['user_id'] == user_id]
        # candidates: unseen items
        candidates = [it for it in items if it['_id'] not in seen]
        if not candidates:
            return []
        # CBF scores
        cbf_scores = self.cbf.score_user_to_items(self._user_profile_text(user), candidates)
        # CF scores (align to candidates)
        cf_pairs = {iid: s for iid, s in self.cf.recommend(user_id, exclude_item_ids=seen, top_k=len(candidates))}
        cf_scores = np.array([cf_pairs.get(it['_id'], 0.0) for it in candidates])
        # popularity prior
        pop = {}
        for e in events:
            pop[e['item_id']] = pop.get(e['item_id'], 0.0) + 1.0
        pop_scores = np.array([pop.get(it['_id'], 0.0) for it in candidates])
        # blend
        # normalize each
        def norm(v):
            v = v.astype(float)
            if v.size == 0:
                return v
            m = v.mean() if np.std(v) > 0 else 0.0
            s = v.std() if np.std(v) > 0 else 1.0
            return (v - m) / (s + 1e-8)

        cbf_n = norm(cbf_scores)
        cf_n = norm(cf_scores)
        pop_n = norm(pop_scores)
        blend = 0.5 * cbf_n + 0.4 * cf_n + 0.1 * pop_n
        order = np.argsort(-blend)
        ranked = [candidates[i]['_id'] for i in order]
        # RL bandit selection on top-K arms
        top_k = ranked[: max(5, min(20, limit * 2))]
        bandit = self.bandits.setdefault(user_id, EpsilonGreedyBandit(self.epsilon))
        # Re-rank by bandit preference: put best arm first, keep rest order
        best = bandit.select(top_k)
        if best and best in top_k:
            top_k.remove(best)
            ranked = [best] + top_k + [r for r in ranked if r not in top_k and r != best]
        return ranked[:limit]

    def feedback(self, user_id: str, item_id: str, reward: float):
        bandit = self.bandits.setdefault(user_id, EpsilonGreedyBandit(self.epsilon))
        bandit.update(item_id, reward)
