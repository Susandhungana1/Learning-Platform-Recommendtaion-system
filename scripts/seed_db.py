import os
from dotenv import load_dotenv
from pymongo import MongoClient
from datetime import datetime, timedelta

load_dotenv()

uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
db_name = os.getenv('MONGO_DB', 'learning_rec')
client = MongoClient(uri)
db = client[db_name]

# Sample items
items = [
    {
        '_id': 'i1',
        'title': 'Intro to Python',
        'description': 'Learn Python basics with examples',
        'tags': ['python', 'basics'],
        'type': 'video'
    },
    {
        '_id': 'i2',
        'title': 'Data Science with Python',
        'description': 'Pandas, NumPy, and plotting',
        'tags': ['data', 'python', 'pandas'],
        'type': 'pdf'
    },
    {
        '_id': 'i3',
        'title': 'Machine Learning Crash Course',
        'description': 'Supervised learning overview',
        'tags': ['ml', 'supervised'],
        'type': 'video'
    },
    {
        '_id': 'i4',
        'title': 'Deep Learning with PyTorch',
        'description': 'Build neural networks',
        'tags': ['deep', 'pytorch'],
        'type': 'video'
    },
    {
        '_id': 'i5',
        'title': 'Exercises: Python Loops',
        'description': 'Practice problems on loops',
        'tags': ['python', 'exercise'],
        'type': 'exercise'
    },
]

users = [
    {'_id': 'u1', 'interests': ['python', 'data'], 'goals': ['become data analyst']},
    {'_id': 'u2', 'interests': ['ml', 'deep'], 'goals': ['learn deep learning']},
]

now = datetime.utcnow()

# Sample events
events = [
    {'user_id': 'u1', 'item_id': 'i1', 'type': 'view', 'score': 1, 'ts': now.isoformat()},
    {'user_id': 'u1', 'item_id': 'i2', 'type': 'quiz', 'score': 0.8, 'ts': (now - timedelta(days=1)).isoformat()},
    {'user_id': 'u2', 'item_id': 'i3', 'type': 'complete', 'score': 1, 'ts': (now - timedelta(days=2)).isoformat()},
    {'user_id': 'u2', 'item_id': 'i4', 'type': 'view', 'score': 1, 'ts': (now - timedelta(days=3)).isoformat()},
]

print('Seeding database...')
db.items.delete_many({})
db.items.insert_many(items)
db.users.delete_many({})
db.users.insert_many(users)
db.events.delete_many({})
db.events.insert_many(events)
print('Done.')
