# 🎓 Personalized Learning Platform with AI Recommendations

A comprehensive learning platform that combines intelligent course recommendations with a dynamic quiz system and local Nepali educational institutions. The platform features AI-powered recommendations, interactive quizzes, and integrated chat support.

## ✨ Features

### 🎯 Intelligent Recommendation System
- **Hybrid AI Recommendations**: Combines collaborative filtering, content-based filtering, and popularity algorithms
- **Dynamic Quiz Assessment**: 125+ questions across 5 technical domains with adaptive difficulty
- **Skill Level Detection**: Automatic beginner/intermediate/advanced classification based on quiz performance
- **Real-time Adaptation**: Epsilon-greedy bandit algorithm for personalized learning paths

### 🌏 Local Integration
- **Nepali Educational Institutions**: 15+ local universities, training centers, and online platforms
- **Cultural Context**: Special focus on Nepal-based learning opportunities
- **Bilingual Support**: Content available for both international and local learners

### 🎨 Modern User Interface
- **Professional Design**: Glass-morphism effects with gradient themes
- **Responsive Layout**: Optimized for desktop and mobile devices
- **Interactive Elements**: Smooth animations and hover effects
- **Accessibility**: User-friendly navigation and clear visual hierarchy

### 🤖 AI Chat Integration
- **Gemini AI Chatbot**: Integrated learning assistant
- **Context-Aware Responses**: AI understands your learning progress
- **24/7 Support**: Get help anytime with your learning journey

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- MongoDB (local or Atlas)
- Git

### Installation

1. **Clone the repository**:
```bash
git clone https://github.com/Susandhungana1/Learning-Platform-Recommendtaion-system.git
cd Learning-Platform-Recommendtaion-system
```

2. **Create virtual environment**:
```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

3. **Install dependencies**:
```powershell
pip install -r requirements.txt
```

4. **Configure environment**:
```powershell
Copy-Item .env.example .env
# Edit .env with your MongoDB URI and Gemini API key
```

5. **Seed the database**:
```powershell
python scripts/seed_db.py
```

6. **Run the application**:
```powershell
python -m app.main
```

7. **Access the platform**:
- Main Platform: http://127.0.0.1:5000
- Health Check: http://127.0.0.1:5000/health

## 🎮 How to Use

### 1. Interest Selection
- Choose from 15+ learning domains including programming, data science, and Nepali-specific topics
- Multiple selection support for diverse learning paths

### 2. Quiz Assessment
- Take adaptive quizzes in your selected interests
- Questions span from basic concepts to advanced topics
- Automatic skill level assessment based on performance

### 3. Get Recommendations
- Receive personalized course recommendations
- Browse local Nepali institutions alongside international platforms
- Filter by skill level and learning preferences

### 4. AI Chat Support
- Use the integrated Gemini AI chatbot for learning assistance
- Get explanations, study tips, and career guidance

## 🏗️ Architecture

### Backend (Flask)
```
app/
├── main.py                 # Main Flask application
├── recommendation/         # AI recommendation engine
├── models/                # Data models
└── utils/                 # Utility functions
```

### Frontend (Vanilla JS)
```
app/web/
├── index.html             # Main interface
├── main.js               # Quiz system & platform logic
└── styles.css            # Professional styling
```

### Database Schema
- **users**: User profiles and preferences
- **items**: Course and platform information
- **events**: Learning interactions and quiz results
- **rl_state**: Reinforcement learning states

## 🌟 Special Features

### Nepal-Focused Content
- **Kathmandu University**: Local computer science programs
- **Tribhuvan University**: Traditional academic courses
- **NAST**: Research and development opportunities
- **IT Training Centers**: Practical skill development
- **Local Startups**: Industry-relevant training

### Quiz System
- **125+ Questions** across Python, JavaScript, Data Science, Machine Learning, and Web Development
- **Adaptive Difficulty**: Questions adjust based on previous answers
- **Instant Feedback**: Immediate scoring and skill assessment
- **Progress Tracking**: Monitor improvement over time

## 🔧 API Endpoints

### Core Endpoints
- `GET /` - Main platform interface
- `GET /health` - System health check
- `POST /recommend` - Get personalized recommendations
- `POST /events` - Log learning interactions
- `POST /users` - User management

### Quiz System
- `POST /quiz/submit` - Submit quiz responses
- `GET /quiz/questions` - Fetch quiz questions
- `POST /quiz/results` - Store quiz results

## 🌐 Technology Stack

- **Backend**: Flask 3.0.3, Python
- **Database**: MongoDB with hybrid recommendation algorithms
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **AI**: Google Gemini API for chatbot
- **ML**: TF-IDF, Collaborative Filtering, Content-Based Filtering
- **Deployment**: Git, GitHub

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "Add your feature"`
4. Push to branch: `git push origin feature/your-feature`
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙋‍♂️ Support

For questions or support:
- Create an issue on GitHub
- Contact: [Your Email]
- Use the integrated AI chatbot for learning assistance

## 🎯 Future Enhancements

- [ ] Multi-language support (Nepali, Hindi)
- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Integration with more local institutions
- [ ] Certificate generation system
- [ ] Peer-to-peer learning features

---

**Made with ❤️ for learners in Nepal and beyond**
