let selectedInterests = [];
let chatHistory = [];
let quizData = {};
let currentQuiz = {
  questions: [],
  currentQuestion: 0,
  answers: [],
  score: 0,
  skillLevel: 'Take Quiz'
};

// Quiz questions database organized by topic
const quizQuestions = {
  'python': [
    {
      question: "What is the correct way to define a function in Python?",
      options: ["function myFunc():", "def myFunc():", "func myFunc():", "define myFunc():"],
      correct: 1,
      difficulty: "beginner"
    },
    {
      question: "Which data structure is ordered and mutable in Python?",
      options: ["tuple", "set", "list", "frozenset"],
      correct: 2,
      difficulty: "beginner"
    },
    {
      question: "What is a Python decorator?",
      options: ["A design pattern", "A function that modifies another function", "A data type", "A loop construct"],
      correct: 1,
      difficulty: "intermediate"
    },
    {
      question: "Which method is used for deep copying in Python?",
      options: ["copy.copy()", "copy.deepcopy()", "object.copy()", "clone()"],
      correct: 1,
      difficulty: "intermediate"
    },
    {
      question: "What does the GIL (Global Interpreter Lock) prevent?",
      options: ["Memory leaks", "Syntax errors", "True multithreading", "Import errors"],
      correct: 2,
      difficulty: "advanced"
    }
  ],
  'javascript': [
    {
      question: "What is the correct way to declare a variable in JavaScript?",
      options: ["var x = 5;", "variable x = 5;", "v x = 5;", "declare x = 5;"],
      correct: 0,
      difficulty: "beginner"
    },
    {
      question: "Which method adds an element to the end of an array?",
      options: ["add()", "append()", "push()", "insert()"],
      correct: 2,
      difficulty: "beginner"
    },
    {
      question: "What is a closure in JavaScript?",
      options: ["A loop", "A function with access to outer variables", "An object", "A promise"],
      correct: 1,
      difficulty: "intermediate"
    },
    {
      question: "What does 'this' refer to in an arrow function?",
      options: ["The function itself", "The global object", "The lexical scope", "undefined"],
      correct: 2,
      difficulty: "intermediate"
    },
    {
      question: "What is the event loop in JavaScript?",
      options: ["A syntax error", "A mechanism for handling asynchronous operations", "A type of loop", "A debugging tool"],
      correct: 1,
      difficulty: "advanced"
    }
  ],
  'data-science': [
    {
      question: "Which Python library is primarily used for data manipulation?",
      options: ["NumPy", "Pandas", "Matplotlib", "Scikit-learn"],
      correct: 1,
      difficulty: "beginner"
    },
    {
      question: "What does CSV stand for?",
      options: ["Computer System Values", "Comma Separated Values", "Code Source Variables", "Central System Variables"],
      correct: 1,
      difficulty: "beginner"
    },
    {
      question: "What is the purpose of normalization in data preprocessing?",
      options: ["Remove duplicates", "Scale features to similar ranges", "Handle missing values", "Create new features"],
      correct: 1,
      difficulty: "intermediate"
    },
    {
      question: "Which metric is best for imbalanced classification problems?",
      options: ["Accuracy", "F1-score", "Mean Squared Error", "R-squared"],
      correct: 1,
      difficulty: "intermediate"
    },
    {
      question: "What is the curse of dimensionality?",
      options: ["Too many features causing performance issues", "Lack of data", "Overfitting", "Underfitting"],
      correct: 0,
      difficulty: "advanced"
    }
  ],
  'machine-learning': [
    {
      question: "What is supervised learning?",
      options: ["Learning without labels", "Learning with input-output pairs", "Clustering data", "Reducing dimensions"],
      correct: 1,
      difficulty: "beginner"
    },
    {
      question: "Which algorithm is used for classification?",
      options: ["K-means", "Linear Regression", "Logistic Regression", "PCA"],
      correct: 2,
      difficulty: "beginner"
    },
    {
      question: "What is cross-validation used for?",
      options: ["Data cleaning", "Model evaluation", "Feature selection", "Data visualization"],
      correct: 1,
      difficulty: "intermediate"
    },
    {
      question: "What is regularization in machine learning?",
      options: ["Data preprocessing", "Technique to prevent overfitting", "Feature scaling", "Model deployment"],
      correct: 1,
      difficulty: "intermediate"
    },
    {
      question: "What is the difference between bagging and boosting?",
      options: ["No difference", "Bagging reduces variance, boosting reduces bias", "Bagging is for regression only", "Boosting is unsupervised"],
      correct: 1,
      difficulty: "advanced"
    }
  ],
  'web-development': [
    {
      question: "What does HTML stand for?",
      options: ["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlink Text Markup Language"],
      correct: 0,
      difficulty: "beginner"
    },
    {
      question: "Which CSS property controls the text size?",
      options: ["font-weight", "text-size", "font-size", "text-style"],
      correct: 2,
      difficulty: "beginner"
    },
    {
      question: "What is the box model in CSS?",
      options: ["A layout technique", "Content, padding, border, margin", "A design pattern", "A CSS framework"],
      correct: 1,
      difficulty: "intermediate"
    },
    {
      question: "What is the purpose of a web framework?",
      options: ["Design websites", "Provide structure and tools for web development", "Host websites", "Test websites"],
      correct: 1,
      difficulty: "intermediate"
    },
    {
      question: "What is server-side rendering (SSR)?",
      options: ["Rendering on the client", "Rendering HTML on the server", "A graphics technique", "A database operation"],
      correct: 1,
      difficulty: "advanced"
    }
  ]
};

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  setupCustomSelect();
  setupChatbot();
  setupQuiz();
  loadAllContent();
  loadInitialPlatforms();
  updateStatsDisplay();
});

function setupQuiz() {
  document.getElementById('startQuiz').addEventListener('click', startQuiz);
  document.getElementById('showRecommendations').addEventListener('click', showRecommendationsFromQuiz);
  document.getElementById('nextQuestion').addEventListener('click', nextQuestion);
  document.getElementById('skipQuestion').addEventListener('click', skipQuestion);
}

function startQuiz() {
  if (selectedInterests.length === 0) {
    showNotification('⚠️ Please select at least one interest to start the quiz!');
    return;
  }
  
  // Generate quiz based on selected interests
  generateQuiz();
  
  // Show quiz section
  document.getElementById('quizSection').style.display = 'block';
  document.getElementById('quizResults').style.display = 'none';
  document.getElementById('quizContent').style.display = 'block';
  
  // Reset quiz state
  currentQuiz.currentQuestion = 0;
  currentQuiz.answers = [];
  currentQuiz.score = 0;
  
  // Show first question
  showQuestion();
}

function generateQuiz() {
  currentQuiz.questions = [];
  
  // Get questions from selected interests
  selectedInterests.forEach(interest => {
    if (quizQuestions[interest]) {
      // Add questions from this interest (mix of difficulties)
      const questions = quizQuestions[interest];
      currentQuiz.questions.push(...questions);
    }
  });
  
  // If no specific questions found, use general web development questions
  if (currentQuiz.questions.length === 0) {
    currentQuiz.questions = quizQuestions['web-development'];
  }
  
  // Shuffle and limit to 5 questions
  currentQuiz.questions = shuffleArray(currentQuiz.questions).slice(0, 5);
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function showQuestion() {
  const question = currentQuiz.questions[currentQuiz.currentQuestion];
  
  document.getElementById('questionText').textContent = question.question;
  document.getElementById('progressText').textContent = `Question ${currentQuiz.currentQuestion + 1} of ${currentQuiz.questions.length}`;
  document.getElementById('progressFill').style.width = `${((currentQuiz.currentQuestion + 1) / currentQuiz.questions.length) * 100}%`;
  
  // Create option buttons
  const optionsContainer = document.getElementById('questionOptions');
  optionsContainer.innerHTML = '';
  
  question.options.forEach((option, index) => {
    const button = document.createElement('button');
    button.className = 'option-button';
    button.textContent = option;
    button.onclick = () => selectOption(index, button);
    optionsContainer.appendChild(button);
  });
  
  // Reset next button
  document.getElementById('nextQuestion').disabled = true;
}

function selectOption(selectedIndex, buttonElement) {
  // Remove previous selection
  document.querySelectorAll('.option-button').forEach(btn => btn.classList.remove('selected'));
  
  // Mark current selection
  buttonElement.classList.add('selected');
  
  // Store answer
  currentQuiz.answers[currentQuiz.currentQuestion] = selectedIndex;
  
  // Enable next button
  document.getElementById('nextQuestion').disabled = false;
}

function nextQuestion() {
  // Check if answer is correct
  const question = currentQuiz.questions[currentQuiz.currentQuestion];
  const userAnswer = currentQuiz.answers[currentQuiz.currentQuestion];
  
  if (userAnswer === question.correct) {
    currentQuiz.score++;
  }
  
  currentQuiz.currentQuestion++;
  
  if (currentQuiz.currentQuestion < currentQuiz.questions.length) {
    showQuestion();
  } else {
    showQuizResults();
  }
}

function skipQuestion() {
  currentQuiz.answers[currentQuiz.currentQuestion] = -1; // Mark as skipped
  nextQuestion();
}

function showQuizResults() {
  document.getElementById('quizContent').style.display = 'none';
  document.getElementById('quizResults').style.display = 'block';
  
  const percentage = Math.round((currentQuiz.score / currentQuiz.questions.length) * 100);
  
  // Determine skill level based on score
  if (percentage >= 80) {
    currentQuiz.skillLevel = 'Advanced';
  } else if (percentage >= 60) {
    currentQuiz.skillLevel = 'Intermediate';
  } else {
    currentQuiz.skillLevel = 'Beginner';
  }
  
  console.log('Quiz completed. New skill level:', currentQuiz.skillLevel);
  
  // Update display
  document.getElementById('finalScore').textContent = `${currentQuiz.score}/${currentQuiz.questions.length}`;
  document.getElementById('finalLevel').textContent = currentQuiz.skillLevel;
  document.getElementById('finalAccuracy').textContent = `${percentage}%`;
  
  // Update stats display
  updateStatsDisplay();
  
  // Update learning tips with new skill level
  generateLearningTips();
  
  showNotification(`🎉 Quiz completed! You scored ${percentage}% and reached ${currentQuiz.skillLevel} level!`, 'success');
}

function showRecommendationsFromQuiz() {
  console.log('Showing recommendations from quiz with skill level:', currentQuiz.skillLevel);
  
  // Hide quiz section
  document.getElementById('quizSection').style.display = 'none';
  
  // Ensure interests are selected
  if (selectedInterests.length === 0) {
    showNotification('Please select your interests first to get recommendations!', 'error');
    return;
  }
  
  // Update learning tips with current skill level
  generateLearningTips();
  
  // Scroll to recommendations section
  const platformsSection = document.querySelector('.platforms-section');
  if (platformsSection) {
    platformsSection.scrollIntoView({ behavior: 'smooth' });
  }
  
  // Fetch updated recommendations
  setTimeout(() => {
    fetchPlatforms();
  }, 500);
}

function setupCustomSelect() {
  console.log('Setting up custom select...');
  const customSelect = document.getElementById('customSelect');
  const selectTrigger = customSelect?.querySelector('.select-trigger');
  const selectLabel = document.getElementById('selectLabel');
  const selectedTagsContainer = document.getElementById('selectedTags');
  const options = customSelect?.querySelectorAll('.option');
  
  console.log('Custom select elements:', {
    customSelect: !!customSelect,
    selectTrigger: !!selectTrigger,
    selectLabel: !!selectLabel,
    selectedTagsContainer: !!selectedTagsContainer,
    optionsCount: options?.length || 0
  });
  
  if (!customSelect || !selectTrigger || !selectLabel || !selectedTagsContainer || !options) {
    console.error('Some required elements not found for custom select');
    return;
  }
  
  // Toggle dropdown
  selectTrigger.addEventListener('click', () => {
    console.log('Select trigger clicked');
    customSelect.classList.toggle('open');
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!customSelect.contains(e.target)) {
      customSelect.classList.remove('open');
    }
  });
  
  // Handle option selection
  options.forEach(option => {
    option.addEventListener('click', (e) => {
      console.log('Option clicked:', option.dataset.value);
      e.stopPropagation();
      const value = option.dataset.value;
      
      if (option.classList.contains('selected')) {
        // Deselect
        option.classList.remove('selected');
        selectedInterests = selectedInterests.filter(i => i !== value);
        console.log('Deselected:', value);
      } else {
        // Select
        option.classList.add('selected');
        selectedInterests.push(value);
        console.log('Selected:', value);
      }
      
      console.log('Current selected interests:', selectedInterests);
      updateSelectedTags();
      updateSelectLabel();
      updatePlatforms();
      updateStatsDisplay();
            updateSelectedTags();
      updateSelectLabel();
      updatePlatforms();
      updateStatsDisplay();
      // Don't close dropdown to allow multiple selections
    });
  });
  
  function updateSelectLabel() {
    if (selectedInterests.length === 0) {
      selectLabel.textContent = 'Choose your interests...';
    } else if (selectedInterests.length === 1) {
      selectLabel.textContent = `${selectedInterests.length} interest selected`;
    } else {
      selectLabel.textContent = `${selectedInterests.length} interests selected`;
    }
  }
  
  function updateSelectedTags() {
    selectedTagsContainer.innerHTML = '';
    selectedInterests.forEach(interest => {
      const tag = document.createElement('span');
      tag.className = 'tag active';
      // Get display name from option
      const option = document.querySelector(`.option[data-value="${interest}"]`);
      tag.textContent = option ? option.textContent : interest.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
      tag.onclick = () => removeInterest(interest);
      selectedTagsContainer.appendChild(tag);
    });
  }
  
  function removeInterest(interest) {
    selectedInterests = selectedInterests.filter(i => i !== interest);
    // Update option state
    const option = document.querySelector(`.option[data-value="${interest}"]`);
    if (option) {
      option.classList.remove('selected');
    }
    updateSelectedTags();
    updateSelectLabel();
    updatePlatforms();
    updateStatsDisplay();
  }
}

function updateStatsDisplay() {
  document.getElementById('totalInterests').textContent = selectedInterests.length;
  if (currentQuiz.skillLevel !== 'Take Quiz') {
    document.getElementById('skillLevel').textContent = currentQuiz.skillLevel;
    document.getElementById('quizScore').textContent = currentQuiz.score ? `${Math.round((currentQuiz.score / currentQuiz.questions.length) * 100)}%` : 'Not taken';
  } else {
    document.getElementById('skillLevel').textContent = 'Take Quiz';
    document.getElementById('quizScore').textContent = 'Not taken';
  }
}

function generateLearningTips() {
  const tips = document.getElementById('learningTips');
  
  let tipContent = '';
  let suggestions = [];
  
  // Generate personalized tips based on quiz results and interests
  if (selectedInterests.length === 0) {
    tipContent = "👋 Start by selecting your interests above and take the skill assessment quiz!";
  } else if (currentQuiz.skillLevel === 'Beginner') {
    tipContent = `🌱 Great start! Based on your ${currentQuiz.skillLevel} level in ${selectedInterests[0].replace('-', ' ')}, here's your learning path:`;
    suggestions = getBeginnerSuggestions(selectedInterests[0]);
  } else if (currentQuiz.skillLevel === 'Intermediate') {
    tipContent = `🚀 You're making great progress! As an ${currentQuiz.skillLevel} learner, here are your next challenges:`;
    suggestions = getIntermediateSuggestions(selectedInterests);
  } else if (currentQuiz.skillLevel === 'Advanced') {
    tipContent = `🎯 Impressive! You've reached ${currentQuiz.skillLevel} level. Time for expert challenges:`;
    suggestions = getAdvancedSuggestions(selectedInterests);
  } else {
    tipContent = `🧠 Take our skill assessment quiz to get personalized recommendations based on your knowledge level!`;
  }
  
  if (tipContent) {
    tips.innerHTML = `
      <div class="tip-header">
        <span class="tip-icon">💡</span>
        <h3 class="tip-title">Learning Path for You</h3>
      </div>
      <div class="tip-content">${tipContent}</div>
      ${suggestions.length > 0 ? `
        <div class="tip-suggestions">
          <h4>Recommended Topics:</h4>
          <div class="suggestion-list">
            ${suggestions.map(s => `<span class="suggestion-item">${s}</span>`).join('')}
          </div>
        </div>
      ` : ''}
      ${currentQuiz.skillLevel === 'Take Quiz' ? `
        <button onclick="startQuiz()" class="quiz-btn" style="margin-top: 15px;">Take Skill Assessment</button>
      ` : ''}
    `;
    tips.classList.add('show');
  }
}

function getBeginnerSuggestions(interest) {
  const suggestions = {
    'python': ['Python Syntax', 'Variables & Data Types', 'Control Structures', 'Functions Basics'],
    'javascript': ['JS Fundamentals', 'DOM Basics', 'Events', 'Basic Functions'],
    'data-science': ['Statistics Intro', 'Excel/Spreadsheets', 'Data Visualization', 'Python for Data'],
    'machine-learning': ['Math Foundations', 'Statistics', 'Python Programming', 'Data Analysis'],
    'web-development': ['HTML Basics', 'CSS Fundamentals', 'JavaScript Intro', 'Responsive Design'],
    'nepali-tech': ['Local IT Education', 'University Programs', 'Career Guidance', 'Industry Connections'],
    'nepali-training': ['Basic Programming', 'Local Workshops', 'Certification Prep', 'Job Training'],
    'nepali-online': ['Nepali Tutorials', 'Local Context Learning', 'Community Support', 'Language Friendly'],
    'digital-literacy': ['Computer Basics', 'Internet Skills', 'Digital Government', 'Online Safety'],
    'fintech': ['Banking Software', 'Digital Payments', 'Financial Technology', 'Local Market']
  };
  
  return suggestions[interest] || ['Fundamentals', 'Basic Concepts', 'Getting Started', 'Practice Projects'];
}

function getIntermediateSuggestions(interests) {
  const suggestions = {
    'python': ['OOP Concepts', 'Modules & Packages', 'Error Handling', 'File Operations'],
    'javascript': ['ES6 Features', 'Async Programming', 'APIs', 'Frameworks Intro'],
    'data-science': ['Pandas & NumPy', 'Data Cleaning', 'Statistical Analysis', 'Machine Learning Basics'],
    'machine-learning': ['Supervised Learning', 'Model Evaluation', 'Feature Engineering', 'Scikit-learn'],
    'web-development': ['Backend Development', 'Databases', 'RESTful APIs', 'Version Control'],
    'nepali-tech': ['Advanced Coursework', 'Industry Projects', 'Research Opportunities', 'Thesis Work'],
    'nepali-training': ['Professional Certification', 'Internship Programs', 'Real Projects', 'Industry Mentorship'],
    'nepali-online': ['Advanced Tutorials', 'Community Projects', 'Local Case Studies', 'Peer Learning'],
    'digital-literacy': ['Advanced Government Services', 'Digital Business', 'Online Entrepreneurship', 'Tech Leadership'],
    'fintech': ['Advanced Banking Tech', 'Blockchain in Finance', 'Payment Systems', 'Regulatory Compliance']
  };
  
  const result = [];
  interests.forEach(interest => {
    if (suggestions[interest]) {
      result.push(...suggestions[interest].slice(0, 2));
    }
  });
  
  return result.length > 0 ? result : ['Advanced Concepts', 'Real Projects', 'Best Practices', 'Industry Tools'];
}

function getAdvancedSuggestions(interests) {
  const suggestions = {
    'python': ['Advanced OOP', 'Decorators', 'Metaclasses', 'Performance Optimization'],
    'javascript': ['TypeScript', 'Advanced Patterns', 'Node.js', 'Testing Frameworks'],
    'data-science': ['Deep Learning', 'Big Data Tools', 'MLOps', 'Advanced Statistics'],
    'machine-learning': ['Neural Networks', 'NLP', 'Computer Vision', 'Production ML'],
    'web-development': ['Microservices', 'DevOps', 'System Design', 'Performance Optimization'],
    'nepali-tech': ['Research & Development', 'PhD Programs', 'Innovation Labs', 'Startup Incubation'],
    'nepali-training': ['Training Others', 'Corporate Training', 'Consultancy', 'Business Solutions'],
    'nepali-online': ['Content Creation', 'Platform Development', 'Community Building', 'Tech Leadership'],
    'digital-literacy': ['Policy Making', 'Digital Transformation', 'Smart City Initiatives', 'Innovation Strategy'],
    'fintech': ['Fintech Innovation', 'Regulatory Technology', 'Blockchain Development', 'Financial AI']
  };
  
  const result = [];
  interests.forEach(interest => {
    if (suggestions[interest]) {
      result.push(...suggestions[interest].slice(0, 2));
    }
  });
  
  return result.length > 0 ? result : ['Expert Topics', 'Research Areas', 'Cutting-edge Tech', 'Innovation Projects'];
}

function setupChatbot() {
  const chatInput = document.getElementById('chatInput');
  const chatSend = document.getElementById('chatSend');
  const chatMessages = document.getElementById('chatMessages');
  
  // Add welcome message
  addChatMessage('🤖 Hi! I\'m your AI learning assistant. Ask me anything about programming, data science, web development, or any tech topic. I can provide the latest information from the web!', 'bot');
  
  chatSend.addEventListener('click', sendChatMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendChatMessage();
    }
  });
  
  async function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Disable input while processing
    chatInput.disabled = true;
    chatSend.disabled = true;
    chatSend.textContent = 'Thinking...';
    
    // Add user message
    addChatMessage(message, 'user');
    chatInput.value = '';
    
    try {
      const userId = document.getElementById('userId').value || 'u1';
      const response = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          user_id: userId
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        addChatMessage('Sorry, I encountered an error: ' + data.error, 'bot');
      } else {
        addChatMessage(data.response, 'bot', data.web_results, data.learning_platforms);
      }
    } catch (error) {
      addChatMessage('Sorry, I\'m having trouble connecting right now. Please try again.', 'bot');
    }
    
    // Re-enable input
    chatInput.disabled = false;
    chatSend.disabled = false;
    chatSend.textContent = 'Send';
    chatInput.focus();
  }
  
  function addChatMessage(text, sender, webResults = null, learningPlatforms = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    
    const avatar = document.createElement('div');
    avatar.className = `message-avatar ${sender}`;
    avatar.textContent = sender === 'user' ? '👤' : '🤖';
    
    const content = document.createElement('div');
    content.className = `message-content ${sender}`;
    content.innerHTML = text.replace(/\n/g, '<br>');
    
    // Add web results if available
    if (webResults && webResults.length > 0) {
      const webResultsDiv = document.createElement('div');
      webResultsDiv.className = 'web-results';
      webResultsDiv.innerHTML = '<h5>📰 Recent Web Results:</h5>';
      
      webResults.forEach(result => {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'web-result';
        resultDiv.innerHTML = `<a href="${result.link}" target="_blank">${result.title}</a>`;
        webResultsDiv.appendChild(resultDiv);
      });
      
      content.appendChild(webResultsDiv);
    }
    
    // Add learning platforms if available
    if (learningPlatforms && learningPlatforms.length > 0) {
      const platformsDiv = document.createElement('div');
      platformsDiv.className = 'learning-platforms-in-chat';
      platformsDiv.innerHTML = '<h5>🎓 Recommended Learning Platforms:</h5>';
      
      learningPlatforms.forEach(platform => {
        const platformDiv = document.createElement('div');
        platformDiv.className = 'platform-in-chat';
        platformDiv.innerHTML = `<a href="${platform.url}" target="_blank">${platform.name}</a> - ${platform.description}`;
        platformsDiv.appendChild(platformDiv);
      });
      
      content.appendChild(platformsDiv);
    }
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

async function updatePlatforms() {
  if (selectedInterests.length === 0) {
    loadInitialPlatforms();
    return;
  }
  
  const platformsContainer = document.getElementById('learningPlatforms');
  platformsContainer.innerHTML = '<div class="loading">Loading platforms...</div>';
  
  try {
    // Get platforms for the first selected interest
    const topic = selectedInterests[0];
    const response = await fetch(`/learning-platforms/${encodeURIComponent(topic)}`);
    const data = await response.json();
    
    displayPlatforms(data.platforms);
  } catch (error) {
    platformsContainer.innerHTML = '<div class="loading">Could not load platforms</div>';
  }
}

function loadInitialPlatforms() {
  const platforms = [
    {name: "Coursera", url: "https://coursera.org", description: "University-level courses from top institutions"},
    {name: "edX", url: "https://edx.org", description: "High-quality courses from universities and institutions"}, 
    {name: "Udemy", url: "https://udemy.com", description: "Wide variety of practical courses"},
    {name: "Khan Academy", url: "https://khanacademy.org", description: "Free courses on many subjects"},
    {name: "FreeCodeCamp", url: "https://freecodecamp.org", description: "Free coding bootcamp with certificates"},
    {name: "Codecademy", url: "https://codecademy.com", description: "Interactive coding courses"}
  ];
  displayPlatforms(platforms);
}

function displayPlatforms(platforms) {
  const container = document.getElementById('learningPlatforms');
  
  if (!platforms || platforms.length === 0) {
    container.innerHTML = '<div class="loading">No platforms found</div>';
    return;
  }
  
  container.innerHTML = platforms.map(platform => `
    <div class="platform-card">
      <h4>${platform.name}</h4>
      <p>${platform.description}</p>
      <a href="${platform.url}" target="_blank" class="platform-link">Visit Platform</a>
    </div>
  `).join('');
}

document.getElementById('btnFetch').addEventListener('click', async () => {
  const userId = document.getElementById('userId').value || 'u1';
  const container = document.getElementById('recommendations');
  
  // Generate learning tips first
  generateLearningTips();
  
  container.innerHTML = '<div class="loading">🤖 AI is analyzing your learning pattern and preferences...</div>';
  
  try {
    // Update user profile if interests are selected
    if (selectedInterests.length > 0) {
      await updateUserProfile(userId, selectedInterests);
    }
    
    const res = await fetch(`/recommendations?user_id=${encodeURIComponent(userId)}&limit=12`);
    const data = await res.json();
    
    if (data.recommendations && data.recommendations.length > 0) {
      // Filter recommendations based on user history
      const filteredRecs = filterRecommendations(data.recommendations);
      displayContent(filteredRecs, container, true);
    } else {
      container.innerHTML = '<div class="loading">No recommendations found. Try selecting some interests!</div>';
    }
  } catch (e) {
    container.innerHTML = '<div class="loading">Error loading recommendations</div>';
  }
});

function filterRecommendations(recommendations) {
  // Prioritize content based on user history and interests
  return recommendations.map(rec => {
    // Add completion status
    rec.isCompleted = userHistory.completedCourses.includes(rec._id);
    rec.isInProgress = userHistory.inProgressCourses.includes(rec._id);
    
    // Calculate relevance score
    let relevanceScore = 0;
    if (rec.tags) {
      rec.tags.forEach(tag => {
        if (selectedInterests.some(interest => interest.includes(tag) || tag.includes(interest))) {
          relevanceScore += 2;
        }
      });
    }
    
    // Boost score for next logical steps
    if (userHistory.skillLevel === 'Beginner' && rec.tags?.includes('beginner')) {
      relevanceScore += 3;
    } else if (userHistory.skillLevel === 'Intermediate' && rec.tags?.includes('intermediate')) {
      relevanceScore += 3;
    } else if (userHistory.skillLevel === 'Expert' && rec.tags?.includes('advanced')) {
      relevanceScore += 3;
    }
    
    rec.relevanceScore = relevanceScore;
    return rec;
  }).sort((a, b) => b.relevanceScore - a.relevanceScore);
}

async function updateUserProfile(userId, interests) {
  try {
    await fetch('/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        _id: userId,
        interests: interests,
        goals: ['learn new skills']
      })
    });
  } catch (e) {
    console.log('Could not update user profile');
  }
}

async function loadAllContent() {
  const container = document.getElementById('allContent');
  container.innerHTML = '<div class="loading">Loading content...</div>';
  
  // Enhanced content with platform links
  const allContent = [
    {
      _id: 'i1',
      title: 'Introduction to Python Programming',
      description: 'Learn Python basics with hands-on examples and exercises',
      tags: ['python', 'beginner'],
      type: 'video',
      platforms: [
        {name: 'Python.org', url: 'https://python.org'},
        {name: 'Codecademy', url: 'https://codecademy.com/learn/learn-python-3'}
      ]
    },
    {
      _id: 'i2', 
      title: 'Data Science with Python',
      description: 'Master pandas, NumPy, and data visualization techniques',
      tags: ['python', 'data-science', 'pandas'],
      type: 'pdf',
      platforms: [
        {name: 'Kaggle Learn', url: 'https://kaggle.com/learn'},
        {name: 'DataCamp', url: 'https://datacamp.com'}
      ]
    },
    {
      _id: 'i3',
      title: 'Machine Learning Fundamentals',
      description: 'Understand supervised learning algorithms and their applications',
      tags: ['machine-learning', 'algorithms'],
      type: 'video',
      platforms: [
        {name: 'Coursera ML', url: 'https://coursera.org/learn/machine-learning'},
        {name: 'Fast.ai', url: 'https://fast.ai'}
      ]
    },
    {
      _id: 'i4',
      title: 'Deep Learning with PyTorch',
      description: 'Build neural networks and train deep learning models',
      tags: ['machine-learning', 'deep-learning', 'pytorch'],
      type: 'video',
      platforms: [
        {name: 'PyTorch Tutorials', url: 'https://pytorch.org/tutorials/'},
        {name: 'Fast.ai', url: 'https://fast.ai'}
      ]
    },
    {
      _id: 'i5',
      title: 'Python Coding Exercises',
      description: 'Practice your Python skills with interactive challenges',
      tags: ['python', 'practice'],
      type: 'exercise',
      platforms: [
        {name: 'LeetCode', url: 'https://leetcode.com'},
        {name: 'HackerRank', url: 'https://hackerrank.com'}
      ]
    },
    {
      _id: 'i6',
      title: 'Web Development with JavaScript',
      description: 'Build interactive websites and web applications',
      tags: ['javascript', 'web-development'],
      type: 'video',
      platforms: [
        {name: 'FreeCodeCamp', url: 'https://freecodecamp.org'},
        {name: 'MDN Web Docs', url: 'https://developer.mozilla.org'}
      ]
    },
    {
      _id: 'i7',
      title: 'React Frontend Development',
      description: 'Learn modern React development with hooks and state management',
      tags: ['react', 'frontend', 'javascript'],
      type: 'video',
      platforms: [
        {name: 'React Docs', url: 'https://reactjs.org'},
        {name: 'Scrimba', url: 'https://scrimba.com'}
      ]
    },
    {
      _id: 'i8',
      title: 'Cloud Computing with AWS',
      description: 'Master Amazon Web Services for scalable applications',
      tags: ['aws', 'cloud-computing'],
      type: 'pdf',
      platforms: [
        {name: 'AWS Training', url: 'https://aws.amazon.com/training/'},
        {name: 'A Cloud Guru', url: 'https://acloudguru.com'}
      ]
    }
  ];
  
  displayContent(allContent, container, false);
}

function displayContent(items, container, isRecommendation = false) {
  if (!items || items.length === 0) {
    container.innerHTML = '<div class="loading">No content available</div>';
    return;
  }
  
  container.innerHTML = items.map(item => {
    const isCompleted = item.isCompleted || false;
    const isInProgress = item.isInProgress || false;
    const statusBadge = isCompleted ? '<span class="status-badge completed">✅ Completed</span>' 
                      : isInProgress ? '<span class="status-badge in-progress">⏳ In Progress</span>'
                      : '';
    
    return `
    <div class="content-card ${isCompleted ? 'completed' : ''} ${isInProgress ? 'in-progress' : ''}">
      ${statusBadge}
      <h3>${item.title}</h3>
      <p>${item.description}</p>
      <div class="content-meta">
        <span class="content-type">${getTypeIcon(item.type)} ${item.type}</span>
        ${item.relevanceScore ? `<span class="relevance-score">🎯 ${item.relevanceScore}</span>` : ''}
      </div>
      <div class="content-tags">
        ${item.tags ? item.tags.map(tag => `<span class="content-tag">${tag}</span>`).join('') : ''}
      </div>
      ${item.platforms ? `
        <div class="content-platforms">
          <h5>🌐 Learn on:</h5>
          ${item.platforms.map(platform => 
            `<a href="${platform.url}" target="_blank" class="platform-link">${platform.name}</a>`
          ).join(' ')}
        </div>
      ` : ''}
      <div class="content-actions">
        ${isRecommendation && !isCompleted ? `
          <button class="interact-btn like-btn" onclick="recordInteraction('${item._id}', 'like')">👍 Like</button>
          <button class="interact-btn start-btn" onclick="startCourse('${item._id}')">🚀 Start Learning</button>
          ${isInProgress ? `<button class="interact-btn complete-btn" onclick="completeCourse('${item._id}')">✅ Mark Complete</button>` : ''}
        ` : isCompleted ? `
          <button class="interact-btn review-btn" onclick="reviewCourse('${item._id}')">📝 Review</button>
        ` : ''}
      </div>
    </div>
  `;
  }).join('');
}

async function startCourse(itemId) {
  if (!userHistory.inProgressCourses.includes(itemId)) {
    userHistory.inProgressCourses.push(itemId);
    saveUserHistory();
    updateStatsDisplay();
    
    // Record interaction with backend
    await recordCourseAction(itemId, 'start');
    
    // Update UI
    const card = document.querySelector(`[onclick*="${itemId}"]`).closest('.content-card');
    card.classList.add('in-progress');
    card.querySelector('.content-actions').innerHTML += `
      <button class="interact-btn complete-btn" onclick="completeCourse('${itemId}')">✅ Mark Complete</button>
    `;
    
    showNotification('🚀 Course started! Good luck with your learning journey!');
  }
}

async function completeCourse(itemId) {
  // Move from in-progress to completed
  userHistory.inProgressCourses = userHistory.inProgressCourses.filter(id => id !== itemId);
  if (!userHistory.completedCourses.includes(itemId)) {
    userHistory.completedCourses.push(itemId);
    
    // Add quiz result simulation
    const score = Math.floor(Math.random() * 30) + 70; // 70-100 score
    userHistory.quizResults.push({
      courseId: itemId,
      score: score,
      date: new Date().toISOString()
    });
  }
  
  userHistory.skillLevel = calculateSkillLevel();
  saveUserHistory();
  updateStatsDisplay();
  
  // Record interaction with backend
  const response = await recordCourseAction(itemId, 'complete');
  if (response && response.skill_level) {
    userHistory.skillLevel = response.skill_level;
    document.getElementById('skillLevel').textContent = response.skill_level;
  }
  
  // Update UI
  const card = document.querySelector(`[onclick*="${itemId}"]`).closest('.content-card');
  card.classList.remove('in-progress');
  card.classList.add('completed');
  
  const statusBadge = '<span class="status-badge completed">✅ Completed</span>';
  if (!card.querySelector('.status-badge')) {
    card.insertAdjacentHTML('afterbegin', statusBadge);
  }
  
  showNotification('🎉 Congratulations! Course completed successfully!');
}

async function recordCourseAction(courseId, action) {
  const userId = document.getElementById('userId').value || 'u1';
  try {
    const response = await fetch('/course-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        course_id: courseId,
        action: action
      })
    });
    
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.log('Could not record course action');
  }
  return null;
}

function reviewCourse(itemId) {
  showNotification('📝 Review feature coming soon! Thanks for your interest.');
}

function showNotification(message, type = 'info') {
  console.log('Showing notification:', message);
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  // Add icon based on type
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  notification.innerHTML = `<span class="notification-icon">${icon}</span><span class="notification-text">${message}</span>`;
  
  // Add styles directly to ensure they work
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : '#3498db'};
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    font-family: 'Segoe UI', sans-serif;
    font-size: 14px;
    max-width: 400px;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    display: flex;
    align-items: center;
    gap: 10px;
  `;
  
  document.body.appendChild(notification);
  
  // Trigger animation
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  // Remove notification after 4 seconds
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 4000);
}

function getTypeIcon(type) {
  const icons = {
    video: '🎥',
    pdf: '📄', 
    exercise: '💡',
    quiz: '❓'
  };
  return icons[type] || '📚';
}

async function recordInteraction(itemId, type) {
  const userId = document.getElementById('userId').value || 'u1';
  try {
    // Record in events
    await fetch('/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        item_id: itemId,
        type: type,
        score: type === 'like' ? 1 : 0.5,
        ts: new Date().toISOString()
      })
    });
    
    // Send positive feedback to the RL system
    if (type === 'like') {
      await fetch('/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          item_id: itemId,
          reward: 1.0
        })
      });
    }
    
    // Record course action if it's a learning action
    if (['start', 'complete', 'like'].includes(type)) {
      await fetch('/course-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          course_id: itemId,
          action: type
        })
      });
    }
    
    if (type === 'like') {
      showNotification('👍 Thanks for the feedback!');
    }
  } catch (e) {
    console.log('Could not record interaction');
  }
}

// Platform filtering and display
function updatePlatforms() {
  // Filter platforms based on selected interests and skill level
  const platformCardsContainer = document.querySelector('.platform-cards');
  if (!platformCardsContainer) return;
  
  const allCards = platformCardsContainer.querySelectorAll('.platform-card');
  
  allCards.forEach(card => {
    const cardInterests = card.dataset.interests ? card.dataset.interests.split(',') : [];
    const cardLevel = card.dataset.level || 'Beginner';
    
    let showCard = false;
    
    // If no interests selected, show all cards
    if (selectedInterests.length === 0) {
      showCard = true;
    } else {
      // Check if card matches any selected interest
      showCard = cardInterests.some(interest => 
        selectedInterests.includes(interest.trim())
      );
      
      // Also filter by skill level if quiz has been taken
      if (currentQuiz.skillLevel !== 'Take Quiz') {
        if (currentQuiz.skillLevel === 'Beginner' && cardLevel === 'Advanced') {
          showCard = false;
        } else if (currentQuiz.skillLevel === 'Advanced' && cardLevel === 'Beginner') {
          showCard = false;
        }
      }
    }
    
    if (showCard) {
      card.style.display = 'block';
      card.style.opacity = '1';
    } else {
      card.style.display = 'none';
      card.style.opacity = '0';
    }
  });
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', function() {
  setupCustomSelect();
  updateStatsDisplay();
  generateLearningTips();
  updatePlatforms();
  
  // Initialize tabs if they exist
  if (document.querySelector('.tab-links')) {
    document.querySelector('.tab-links .tab-link').click();
  }
});

// Global variables for the rest of the application
let currentTab = 'all';
let platforms = [];

// Tab switching functionality
function showTab(tabName, element) {
  currentTab = tabName;
  
  // Update active tab
  document.querySelectorAll('.tab-link').forEach(tab => tab.classList.remove('active'));
  element.classList.add('active');
  
  // Update platform display
  updatePlatforms();
}

// Fetch platforms from backend
async function fetchPlatforms() {
  // Ensure we have a valid skill level
  const skillLevel = currentQuiz.skillLevel || 'Beginner';
  
  console.log('Fetching platforms with:', {
    interests: selectedInterests,
    level: skillLevel,
    current_tab: currentTab
  });
  
  if (selectedInterests.length === 0) {
    showNotification('Please select at least one interest first!', 'error');
    return;
  }
  
  try {
    showNotification('Loading personalized recommendations...', 'info');
    
    const response = await fetch('/recommend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        interests: selectedInterests,
        level: skillLevel,
        current_tab: currentTab
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Received recommendations:', data);
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    platforms = data.platforms || [];
    displayPlatforms(platforms);
    
    const levelText = skillLevel === 'Take Quiz' ? 'your selected interests' : `your ${skillLevel} level`;
    showNotification(`🎯 Found ${platforms.length} courses perfect for ${levelText}!`, 'success');
  } catch (error) {
    console.error('Error fetching platforms:', error);
    showNotification(`❌ Error loading recommendations: ${error.message}`, 'error');
    
    // Show fallback message
    const container = document.querySelector('.platform-cards') || document.getElementById('learningPlatforms');
    if (container) {
      container.innerHTML = `
        <div class="error-message" style="text-align: center; padding: 40px; color: #e74c3c;">
          <h3>⚠️ Unable to Load Recommendations</h3>
          <p>There was an issue connecting to the recommendation service.</p>
          <p>Error: ${error.message}</p>
          <button onclick="fetchPlatforms()" style="margin-top: 15px; padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Try Again
          </button>
        </div>
      `;
    }
  }
}

function displayPlatforms(platformsToShow) {
  // Try multiple container selectors to ensure we find the right one
  const container = document.querySelector('.platform-cards') || 
                   document.getElementById('learningPlatforms') ||
                   document.getElementById('recommendations');
  
  if (!container) {
    console.error('No platform container found');
    return;
  }
  
  console.log('Displaying platforms in container:', container.id || container.className);
  
  container.innerHTML = '';
  
  if (platformsToShow.length === 0) {
    container.innerHTML = `
      <div class="no-results" style="text-align: center; padding: 40px; color: #7f8c8d;">
        <div style="font-size: 48px; margin-bottom: 20px;">🔍</div>
        <h3>No courses found</h3>
        <p>Try selecting different interests or taking the quiz for better recommendations.</p>
        ${currentQuiz.skillLevel === 'Take Quiz' ? `
          <button onclick="startQuiz()" style="margin-top: 15px; padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Take Skill Assessment Quiz
          </button>
        ` : ''}
      </div>
    `;
    return;
  }
  
  platformsToShow.forEach(platform => {
    const card = document.createElement('div');
    card.className = 'platform-card';
    card.dataset.interests = platform.interests ? platform.interests.join(',') : '';
    card.dataset.level = platform.level || 'Beginner';
    
    // Check if this is a Nepali platform
    const isNepali = platform.location && (platform.location.includes('Nepal') || platform.location.includes('Nepali'));
    
    // Add inline styles to ensure the cards display correctly
    card.style.cssText = `
      background: ${isNepali ? 'linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)' : 'white'};
      border-radius: 12px;
      padding: 20px;
      margin: 15px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      border: ${isNepali ? '2px solid #dc143c' : '1px solid #e1e8ed'};
      min-width: 300px;
      max-width: 400px;
    `;
    
    card.innerHTML = `
      ${isNepali ? '<div style="background: linear-gradient(45deg, #dc143c, #ff6b6b); color: white; padding: 5px 10px; border-radius: 15px; font-size: 12px; margin-bottom: 10px; display: inline-block;">🇳🇵 Nepal Local</div>' : ''}
      <div class="platform-header" style="display: flex; align-items: center; margin-bottom: 15px;">
        <img src="${platform.image}" alt="${platform.name}" style="width: 60px; height: 60px; border-radius: 8px; margin-right: 15px; object-fit: cover;">
        <div class="platform-info" style="flex: 1;">
          <h3 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 18px;">${platform.name}</h3>
          <p style="margin: 0; color: #7f8c8d; font-size: 14px;">${platform.category}</p>
          ${platform.location ? `<p style="margin: 2px 0 0 0; color: #27ae60; font-size: 12px; font-weight: bold;">📍 ${platform.location}</p>` : ''}
        </div>
        <div class="platform-rating" style="text-align: right;">
          <span style="font-weight: bold; color: #f39c12;">${platform.rating || '4.5'}</span>
          <div style="color: #f39c12; font-size: 14px;">
            ${'★'.repeat(Math.floor(platform.rating || 4.5))}${'☆'.repeat(5 - Math.floor(platform.rating || 4.5))}
          </div>
        </div>
      </div>
      <p style="color: #34495e; margin-bottom: 15px; line-height: 1.5;">${platform.description}</p>
      <div class="platform-tags" style="margin-bottom: 15px;">
        ${(platform.interests || []).map(interest => 
          `<span style="background: #ecf0f1; color: #2c3e50; padding: 4px 8px; border-radius: 12px; font-size: 12px; margin-right: 5px; display: inline-block;">${interest}</span>`
        ).join('')}
        <span style="background: ${platform.level === 'Advanced' ? '#e74c3c' : platform.level === 'Intermediate' ? '#f39c12' : '#27ae60'}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; margin-left: 5px;">${platform.level || 'Beginner'}</span>
      </div>
      <div class="platform-footer" style="display: flex; justify-content: flex-end; align-items: center;">
        <a href="${platform.url}" target="_blank" style="background: ${isNepali ? '#dc143c' : '#3498db'}; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; transition: background 0.3s ease;" 
           onmouseover="this.style.background='${isNepali ? '#b91c3c' : '#2980b9'}'" onmouseout="this.style.background='${isNepali ? '#dc143c' : '#3498db'}'">
          ${isNepali ? 'Visit Nepal Platform' : 'Start Learning'}
        </a>
      </div>
    `;
    
    // Add hover effect
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-5px)';
      card.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
    });
    
    container.appendChild(card);
  });
  
  // Make container a flex container if it's not already
  container.style.cssText = `
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    justify-content: center;
    padding: 20px;
  `;
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ DOM loaded, initializing...');
  
  // Test if elements exist
  const customSelect = document.getElementById('customSelect');
  const selectLabel = document.getElementById('selectLabel');
  console.log('✅ Elements found:', {
    customSelect: !!customSelect,
    selectLabel: !!selectLabel
  });
  
  setupCustomSelect();
  updateStatsDisplay();
  generateLearningTips();
  updatePlatforms();
  
  // Initialize tabs if they exist
  if (document.querySelector('.tab-links')) {
    document.querySelector('.tab-links .tab-link').click();
  }
  
  // Set up event listeners
  const fetchBtn = document.getElementById('btnFetch');
  if (fetchBtn) {
    fetchBtn.addEventListener('click', fetchPlatforms);
    console.log('✅ Fetch button listener added');
  }
  
  // Set up quiz event listeners
  const startQuizBtn = document.getElementById('startQuiz');
  if (startQuizBtn) {
    startQuizBtn.addEventListener('click', startQuiz);
  }
  
  const nextBtn = document.getElementById('nextQuestion');
  if (nextBtn) {
    nextBtn.addEventListener('click', nextQuestion);
  }
  
  const skipBtn = document.getElementById('skipQuestion');
  if (skipBtn) {
    skipBtn.addEventListener('click', skipQuestion);
  }
  
  const showRecsBtn = document.getElementById('showRecommendations');
  if (showRecsBtn) {
    showRecsBtn.addEventListener('click', showRecommendationsFromQuiz);
  }
  
  console.log('✅ Initialization complete');
});
