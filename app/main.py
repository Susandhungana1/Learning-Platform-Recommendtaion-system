from flask import Blueprint, Flask, jsonify, request
from dotenv import load_dotenv
import os
from datetime import datetime
from .utils.db import get_client_and_db
from .recommenders.hybrid import HybridRecommender
from flask import current_app, send_from_directory
from .chatbot import GeminiChatbot

bp = Blueprint('main', __name__)

load_dotenv()

_REC = None
_ITEMS_CACHE = []
_EVENTS_CACHE = []
_USERS_CACHE = {}
_CHATBOT = None


def _get_chatbot():
    global _CHATBOT
    if _CHATBOT is None:
        try:
            _CHATBOT = GeminiChatbot()
        except Exception as e:
            print(f"Chatbot initialization error: {e}")
            _CHATBOT = None
    return _CHATBOT


def _get_rec():
    global _REC
    if _REC is None:
        epsilon = float(os.getenv('REC_EPSILON', '0.1'))
        _REC = HybridRecommender(epsilon=epsilon)
        _refresh_model()
    return _REC


def _refresh_model():
    global _ITEMS_CACHE, _EVENTS_CACHE, _USERS_CACHE
    try:
        client, db = get_client_and_db()
        _ITEMS_CACHE = list(db.items.find({}, {'_id': 1, 'title': 1, 'description': 1, 'tags': 1, 'type': 1}))
        _EVENTS_CACHE = list(db.events.find({}, {'_id': 0}))
        _USERS_CACHE = {u['_id']: u for u in db.users.find({}, {'_id': 1, 'interests': 1, 'goals': 1})}
        if _REC:
            _REC.fit(_ITEMS_CACHE, _EVENTS_CACHE)
    except Exception:
        # Keep caches as-is if DB isn't available; service endpoints like /health still work
        pass


@bp.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


@bp.route('/', methods=['GET'])
def index():
    # Redirect to the learning hub UI
    return ui_index()


@bp.route('/ui', methods=['GET'])
def ui_index():
    # Serve the single-page UI
    return send_from_directory(current_app.static_folder, 'index.html')


@bp.route('/users', methods=['POST'])
def create_user():
    client, db = get_client_and_db()
    data = request.get_json(force=True)
    if '_id' not in data:
        return jsonify({'error': 'missing _id'}), 400
    db.users.update_one({'_id': data['_id']}, {'$set': data}, upsert=True)
    _refresh_model()
    return jsonify({'ok': True})


@bp.route('/events', methods=['POST'])
def ingest_event():
    client, db = get_client_and_db()
    data = request.get_json(force=True)
    required = ['user_id', 'item_id', 'type']
    if any(r not in data for r in required):
        return jsonify({'error': 'missing required fields'}), 400
    db.events.insert_one({**data})
    _refresh_model()
    return jsonify({'ok': True})


@bp.route('/recommendations', methods=['GET'])
def recommend():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    limit = int(request.args.get('limit', '10'))
    _get_rec()
    user = _USERS_CACHE.get(user_id)
    if not user:
        return jsonify({'error': 'unknown user'}), 404
    rec_ids = _REC.recommend(user, _ITEMS_CACHE, _EVENTS_CACHE, limit=limit)
    # attach item payloads
    item_map = {it['_id']: it for it in _ITEMS_CACHE}
    recs = [item_map[rid] for rid in rec_ids if rid in item_map]
    return jsonify({'user_id': user_id, 'recommendations': recs})


@bp.route('/recommend', methods=['POST'])
def recommend_post():
    """New quiz-based recommendation endpoint"""
    try:
        data = request.get_json(force=True)
        interests = data.get('interests', [])
        level = data.get('level', 'Beginner')
        current_tab = data.get('current_tab', 'all')
        
        # Generate mock recommendations based on interests and skill level
        platforms = generate_mock_platforms(interests, level)
        
        return jsonify({
            'platforms': platforms,
            'total': len(platforms),
            'level': level,
            'interests': interests
        })
        
    except Exception as e:
        print(f"Error in recommend_post: {e}")
        return jsonify({'error': str(e)}), 500


def generate_mock_platforms(interests, level):
    """Generate mock learning platforms based on interests and skill level"""
    
    # Base platform templates
    platform_templates = {
        'python': [
            {
                'name': 'Python Complete Course',
                'category': 'Programming',
                'description': 'Master Python from basics to advanced concepts',
                'image': 'https://via.placeholder.com/100x100/3776ab/white?text=PY',
                'rating': 4.8,
                'url': 'https://python.org',
                'interests': ['python'],
                'level': 'Beginner'
            },
            {
                'name': 'Advanced Python Programming',
                'category': 'Programming',
                'description': 'Deep dive into Python decorators, metaclasses, and async programming',
                'image': 'https://via.placeholder.com/100x100/3776ab/white?text=PY+',
                'rating': 4.9,
                'url': 'https://python.org',
                'interests': ['python'],
                'level': 'Advanced'
            }
        ],
        'javascript': [
            {
                'name': 'JavaScript Fundamentals',
                'category': 'Web Development',
                'description': 'Learn modern JavaScript ES6+ features and DOM manipulation',
                'image': 'https://via.placeholder.com/100x100/f7df1e/black?text=JS',
                'rating': 4.7,
                'url': 'https://developer.mozilla.org',
                'interests': ['javascript'],
                'level': 'Beginner'
            },
            {
                'name': 'Advanced JavaScript & Node.js',
                'category': 'Web Development',
                'description': 'Master async/await, closures, and server-side JavaScript',
                'image': 'https://via.placeholder.com/100x100/339933/white?text=NODE',
                'rating': 4.8,
                'url': 'https://nodejs.org',
                'interests': ['javascript', 'nodejs'],
                'level': 'Advanced'
            }
        ],
        'data-science': [
            {
                'name': 'Data Science with Python',
                'category': 'Data Science',
                'description': 'Learn pandas, numpy, and data visualization techniques',
                'image': 'https://via.placeholder.com/100x100/ff6b6b/white?text=DS',
                'rating': 4.6,
                'url': 'https://kaggle.com',
                'interests': ['data-science', 'python'],
                'level': 'Beginner'
            },
            {
                'name': 'Advanced Data Analytics',
                'category': 'Data Science',
                'description': 'Statistical modeling, hypothesis testing, and advanced analytics',
                'image': 'https://via.placeholder.com/100x100/4ecdc4/white?text=ADA',
                'rating': 4.9,
                'url': 'https://kaggle.com',
                'interests': ['data-science', 'statistics'],
                'level': 'Advanced'
            }
        ],
        'machine-learning': [
            {
                'name': 'Machine Learning Basics',
                'category': 'AI/ML',
                'description': 'Introduction to supervised and unsupervised learning',
                'image': 'https://via.placeholder.com/100x100/9b59b6/white?text=ML',
                'rating': 4.7,
                'url': 'https://scikit-learn.org',
                'interests': ['machine-learning'],
                'level': 'Beginner'
            },
            {
                'name': 'Deep Learning & Neural Networks',
                'category': 'AI/ML',
                'description': 'Advanced ML with TensorFlow and PyTorch',
                'image': 'https://via.placeholder.com/100x100/e74c3c/white?text=DL',
                'rating': 4.9,
                'url': 'https://tensorflow.org',
                'interests': ['machine-learning', 'deep-learning'],
                'level': 'Advanced'
            }
        ],
        'web-development': [
            {
                'name': 'Complete Web Development',
                'category': 'Web Development',
                'description': 'HTML, CSS, JavaScript, and responsive design',
                'image': 'https://via.placeholder.com/100x100/2ecc71/white?text=WEB',
                'rating': 4.5,
                'url': 'https://developer.mozilla.org',
                'interests': ['web-development'],
                'level': 'Beginner'
            },
            {
                'name': 'Full Stack Development',
                'category': 'Web Development', 
                'description': 'React, Node.js, databases, and deployment',
                'image': 'https://via.placeholder.com/100x100/3498db/white?text=FULL',
                'rating': 4.8,
                'url': 'https://reactjs.org',
                'interests': ['web-development', 'react', 'nodejs'],
                'level': 'Advanced'
            }
        ],
        # Nepali Local Organizations and Platforms
        'nepali-tech': [
            {
                'name': 'Deerwalk Institute of Technology',
                'category': 'Higher Education',
                'description': 'Leading IT education with industry partnerships in Nepal',
                'image': 'https://via.placeholder.com/100x100/dc143c/white?text=DIT',
                'rating': 4.7,
                'url': 'https://deerwalk.edu.np',
                'interests': ['programming', 'web-development', 'data-science'],
                'level': 'Intermediate',
                'location': 'Nepal'
            },
            {
                'name': 'Kathmandu University (KU)',
                'category': 'University',
                'description': 'Computer Science and Engineering programs',
                'image': 'https://via.placeholder.com/100x100/8b0000/white?text=KU',
                'rating': 4.6,
                'url': 'https://ku.edu.np',
                'interests': ['programming', 'machine-learning', 'web-development'],
                'level': 'Advanced',
                'location': 'Nepal'
            },
            {
                'name': 'Pulchowk Campus (IOE)',
                'category': 'Engineering College',
                'description': 'Premier engineering education in Nepal',
                'image': 'https://via.placeholder.com/100x100/000080/white?text=IOE',
                'rating': 4.8,
                'url': 'https://pcampus.edu.np',
                'interests': ['programming', 'machine-learning', 'data-science'],
                'level': 'Advanced',
                'location': 'Nepal'
            },
            {
                'name': 'NIST College',
                'category': 'IT College',
                'description': 'Nepal Institute of Science and Technology',
                'image': 'https://via.placeholder.com/100x100/4169e1/white?text=NIST',
                'rating': 4.5,
                'url': 'https://nist.edu.np',
                'interests': ['programming', 'web-development', 'cybersecurity'],
                'level': 'Intermediate',
                'location': 'Nepal'
            }
        ],
        'nepali-training': [
            {
                'name': 'Leapfrog Technology',
                'category': 'IT Training',
                'description': 'Professional software development training and internships',
                'image': 'https://via.placeholder.com/100x100/00a86b/white?text=LFT',
                'rating': 4.9,
                'url': 'https://leapfrogacademy.com',
                'interests': ['web-development', 'mobile-development', 'programming'],
                'level': 'Intermediate',
                'location': 'Nepal'
            },
            {
                'name': 'Broadway Infosys',
                'category': 'IT Training Center',
                'description': 'Comprehensive IT training and certification programs',
                'image': 'https://via.placeholder.com/100x100/ff6b35/white?text=BI',
                'rating': 4.4,
                'url': 'https://broadwayinfosys.com',
                'interests': ['programming', 'web-development', 'data-science'],
                'level': 'Beginner',
                'location': 'Nepal'
            },
            {
                'name': 'Skill Development Nepal',
                'category': 'Training Institute',
                'description': 'Professional skills training for IT and digital marketing',
                'image': 'https://via.placeholder.com/100x100/9c88ff/white?text=SDN',
                'rating': 4.3,
                'url': 'https://skilldevelopmentnepal.com',
                'interests': ['web-development', 'digital-marketing', 'programming'],
                'level': 'Beginner',
                'location': 'Nepal'
            },
            {
                'name': 'F1Soft Academy',
                'category': 'Tech Training',
                'description': 'Banking software and fintech training programs',
                'image': 'https://via.placeholder.com/100x100/1e90ff/white?text=F1',
                'rating': 4.6,
                'url': 'https://f1soft.com',
                'interests': ['programming', 'web-development', 'fintech'],
                'level': 'Intermediate',
                'location': 'Nepal'
            }
        ],
        'nepali-online': [
            {
                'name': 'Hamro Patro Tech',
                'category': 'Online Learning',
                'description': 'Local tech tutorials and programming courses in Nepali',
                'image': 'https://via.placeholder.com/100x100/ff4757/white?text=HP',
                'rating': 4.2,
                'url': 'https://hamropatro.com',
                'interests': ['programming', 'web-development', 'mobile-development'],
                'level': 'Beginner',
                'location': 'Nepal'
            },
            {
                'name': 'CodeKatha Nepal',
                'category': 'Programming Community',
                'description': 'Learn programming through storytelling in Nepali context',
                'image': 'https://via.placeholder.com/100x100/2ed573/white?text=CK',
                'rating': 4.1,
                'url': 'https://codekatha.com',
                'interests': ['programming', 'web-development', 'algorithms'],
                'level': 'Beginner',
                'location': 'Nepal'
            },
            {
                'name': 'Tech Pana Nepal',
                'category': 'Tech News & Learning',
                'description': 'Latest tech trends and learning resources for Nepali developers',
                'image': 'https://via.placeholder.com/100x100/ffa502/white?text=TPN',
                'rating': 4.0,
                'url': 'https://techpana.com',
                'interests': ['programming', 'web-development', 'tech-news'],
                'level': 'Beginner',
                'location': 'Nepal'
            }
        ],
        'nepali-government': [
            {
                'name': 'Digital Nepal Framework',
                'category': 'Government Initiative',
                'description': 'Government digital literacy and IT skills programs',
                'image': 'https://via.placeholder.com/100x100/ff3838/white?text=DN',
                'rating': 4.0,
                'url': 'https://digitalnepal.gov.np',
                'interests': ['digital-literacy', 'cybersecurity', 'e-governance'],
                'level': 'Beginner',
                'location': 'Nepal'
            },
            {
                'name': 'NRNA Knowledge Society',
                'category': 'Professional Network',
                'description': 'Non-Resident Nepali tech professionals knowledge sharing',
                'image': 'https://via.placeholder.com/100x100/00d2d3/white?text=NRNA',
                'rating': 4.3,
                'url': 'https://nrna.org',
                'interests': ['programming', 'entrepreneurship', 'networking'],
                'level': 'Advanced',
                'location': 'Global Nepali'
            }
        ]
    }
    
    # Generate platforms based on selected interests and skill level
    selected_platforms = []
    
    # Always include some relevant Nepali platforms for local context
    nepali_categories = ['nepali-tech', 'nepali-training', 'nepali-online', 'nepali-government']
    
    for interest in interests:
        # Add international platforms
        if interest in platform_templates:
            for platform in platform_templates[interest]:
                # Filter by skill level appropriately
                if level == 'Beginner':
                    # Show all levels for beginners, but prioritize beginner courses
                    selected_platforms.append(platform)
                elif level == 'Intermediate':
                    # Show beginner and intermediate, avoid basic beginner courses
                    if platform['level'] in ['Beginner', 'Intermediate', 'Advanced']:
                        selected_platforms.append(platform)
                elif level == 'Advanced':
                    # Prioritize intermediate and advanced courses
                    if platform['level'] in ['Intermediate', 'Advanced']:
                        selected_platforms.append(platform)
    
    # Add relevant Nepali platforms based on interests
    for nepali_category in nepali_categories:
        if nepali_category in platform_templates:
            for platform in platform_templates[nepali_category]:
                # Check if this Nepali platform matches user interests
                platform_interests = platform.get('interests', [])
                if any(interest in platform_interests for interest in interests):
                    # Apply same skill level filtering
                    if level == 'Beginner':
                        selected_platforms.append(platform)
                    elif level == 'Intermediate':
                        if platform['level'] in ['Beginner', 'Intermediate', 'Advanced']:
                            selected_platforms.append(platform)
                    elif level == 'Advanced':
                        if platform['level'] in ['Intermediate', 'Advanced']:
                            selected_platforms.append(platform)
    
    # If no specific interests, show some popular Nepali tech platforms
    if not interests or len(selected_platforms) < 3:
        popular_nepali = [
            platform_templates['nepali-tech'][0],  # Deerwalk
            platform_templates['nepali-training'][0],  # Leapfrog
            platform_templates['nepali-online'][0]  # Hamro Patro Tech
        ]
        for platform in popular_nepali:
            if platform not in selected_platforms:
                selected_platforms.append(platform)
    
    # Add some general courses if no specific interests selected
    if not selected_platforms:
        selected_platforms = [
            {
                'name': 'Choose Your Learning Path',
                'category': 'General',
                'description': 'Select your interests above to get personalized recommendations',
                'image': 'https://via.placeholder.com/100x100/95a5a6/white?text=?',
                'rating': 0,
                'url': '#',
                'interests': [],
                'level': 'Beginner'
            }
        ]
    
    return selected_platforms[:12]  # Return max 12 platforms


@bp.route('/feedback', methods=['POST'])
def feedback():
    data = request.get_json(force=True)
    required = ['user_id', 'item_id', 'reward']
    if any(r not in data for r in required):
        return jsonify({'error': 'missing required fields'}), 400
    _get_rec().feedback(data['user_id'], data['item_id'], float(data['reward']))
    # persist bandit state per-user (optional): We'll store in collection rl_state
    client, db = get_client_and_db()
    # naive: overwrite with latest in-memory state
    # For simplicity, store only the updated arm
    db.rl_state.update_one(
        {'user_id': data['user_id'], 'arm': data['item_id']},
        {
            '$inc': {'count': 1, 'total_reward': float(data['reward'])},
            '$set': {'last_reward': float(data['reward'])}
        },
        upsert=True,
    )
    return jsonify({'ok': True})


@bp.route('/train', methods=['POST'])
def train():
    _refresh_model()
    return jsonify({'ok': True})


@bp.route('/chat', methods=['POST'])
def chat():
    chatbot = _get_chatbot()
    if not chatbot:
        return jsonify({'error': 'Chatbot not available. Please check API keys.'}), 500
    
    data = request.get_json(force=True)
    message = data.get('message', '')
    user_id = data.get('user_id', '')
    
    if not message:
        return jsonify({'error': 'Message is required'}), 400
    
    # Get user context for personalized responses
    context = None
    if user_id and user_id in _USERS_CACHE:
        user = _USERS_CACHE[user_id]
        if 'interests' in user:
            context = f"User is interested in: {', '.join(user['interests'])}"
    
    response_data = chatbot.chat(message, context)
    
    # Add learning platform recommendations if relevant
    if any(topic in message.lower() for topic in ['learn', 'course', 'tutorial', 'study']):
        # Extract potential topics from message
        topics = []
        for word in message.lower().split():
            if word in ['python', 'javascript', 'data', 'machine', 'web', 'ai']:
                topics.append(word)
        
        if topics:
            platforms = chatbot.get_learning_platforms(' '.join(topics))
            response_data['learning_platforms'] = platforms
    
    return jsonify(response_data)


@bp.route('/learning-platforms/<topic>', methods=['GET'])
def get_learning_platforms(topic):
    chatbot = _get_chatbot()
    if not chatbot:
        return jsonify({'error': 'Service not available'}), 500
    
    platforms = chatbot.get_learning_platforms(topic)
    return jsonify({'topic': topic, 'platforms': platforms})


@bp.route('/user-history/<user_id>', methods=['GET', 'POST'])
def user_history(user_id):
    client, db = get_client_and_db()
    
    if request.method == 'GET':
        # Get user history
        history = db.user_history.find_one({'user_id': user_id})
        if not history:
            # Create default history
            history = {
                'user_id': user_id,
                'completed_courses': [],
                'in_progress_courses': [],
                'quiz_results': [],
                'skill_level': 'Beginner',
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            db.user_history.insert_one(history)
        
        return jsonify(history)
    
    elif request.method == 'POST':
        # Update user history
        data = request.get_json(force=True)
        
        update_data = {
            'updated_at': datetime.utcnow(),
            **{k: v for k, v in data.items() if k != 'user_id'}
        }
        
        result = db.user_history.update_one(
            {'user_id': user_id},
            {'$set': update_data},
            upsert=True
        )
        
        return jsonify({'ok': True, 'modified': result.modified_count})


@bp.route('/course-action', methods=['POST'])
def course_action():
    data = request.get_json(force=True)
    required = ['user_id', 'course_id', 'action']
    if any(r not in data for r in required):
        return jsonify({'error': 'missing required fields'}), 400
    
    client, db = get_client_and_db()
    user_id = data['user_id']
    course_id = data['course_id']
    action = data['action']
    
    # Record the action in events
    event_data = {
        'user_id': user_id,
        'item_id': course_id,
        'type': action,
        'score': 1.0 if action in ['start', 'complete'] else 0.5,
        'ts': datetime.utcnow().isoformat()
    }
    db.events.insert_one(event_data)
    
    # Update user history
    history = db.user_history.find_one({'user_id': user_id}) or {
        'user_id': user_id,
        'completed_courses': [],
        'in_progress_courses': [],
        'quiz_results': [],
        'skill_level': 'Beginner'
    }
    
    if action == 'start':
        if course_id not in history.get('in_progress_courses', []):
            history.setdefault('in_progress_courses', []).append(course_id)
    elif action == 'complete':
        # Move from in_progress to completed
        if 'in_progress_courses' in history:
            history['in_progress_courses'] = [c for c in history['in_progress_courses'] if c != course_id]
        if course_id not in history.get('completed_courses', []):
            history.setdefault('completed_courses', []).append(course_id)
        
        # Add simulated quiz result
        quiz_score = 70 + (hash(user_id + course_id) % 30)  # Deterministic score 70-100
        history.setdefault('quiz_results', []).append({
            'course_id': course_id,
            'score': quiz_score,
            'date': datetime.utcnow().isoformat()
        })
    
    # Update skill level
    completed_count = len(history.get('completed_courses', []))
    avg_score = 0
    if history.get('quiz_results'):
        avg_score = sum(q['score'] for q in history['quiz_results']) / len(history['quiz_results'])
    
    if completed_count >= 10 and avg_score >= 80:
        history['skill_level'] = 'Expert'
    elif completed_count >= 5 and avg_score >= 70:
        history['skill_level'] = 'Intermediate'
    elif completed_count >= 2:
        history['skill_level'] = 'Beginner+'
    else:
        history['skill_level'] = 'Beginner'
    
    history['updated_at'] = datetime.utcnow()
    
    db.user_history.update_one(
        {'user_id': user_id},
        {'$set': history},
        upsert=True
    )
    
    # Refresh model with new data
    _refresh_model()
    
    return jsonify({'ok': True, 'skill_level': history['skill_level']})


if __name__ == '__main__':
    # Allow running directly: python app/main.py
    app = Flask(__name__, static_folder='web', static_url_path='/web')
    app.register_blueprint(bp)
    port = int(os.getenv('PORT', '5000'))
    # Try waitress in production mode if available
    use_waitress = os.getenv('USE_WAITRESS', '0') == '1'
    if use_waitress:
        try:
            from waitress import serve
            serve(app, host='0.0.0.0', port=port)
        except Exception:
            app.run(host='0.0.0.0', port=port)
    else:
        app.run(host='127.0.0.1', port=port, debug=True)
