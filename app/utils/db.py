import os
from typing import Tuple
from pymongo import MongoClient

_client = None
_db = None


def get_client_and_db() -> Tuple[MongoClient, str]:
    global _client, _db
    if _client is None:
        uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
        db_name = os.getenv('MONGO_DB', 'learning_rec')
        _client = MongoClient(uri)
        _db = _client[db_name]
    return _client, _db
