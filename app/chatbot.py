"""
Gemini-powered chatbot with web search capabilities
"""
import os
import requests
import google.generativeai as genai
from typing import Dict, List, Any, Optional

class GeminiChatbot:
    def __init__(self):
        self.gemini_api_key = os.getenv('GEMINI_API_KEY')
        self.serp_api_key = os.getenv('SERP_API_KEY')
        
        if not self.gemini_api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        genai.configure(api_key=self.gemini_api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        
    def search_web(self, query: str, num_results: int = 5) -> List[Dict[str, Any]]:
        """Search the web using SERP API"""
        if not self.serp_api_key:
            return []
            
        try:
            url = "https://serpapi.com/search"
            params = {
                "engine": "google",
                "q": query,
                "api_key": self.serp_api_key,
                "num": num_results
            }
            
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            
            results = []
            if "organic_results" in data:
                for result in data["organic_results"][:num_results]:
                    results.append({
                        "title": result.get("title", ""),
                        "link": result.get("link", ""),
                        "snippet": result.get("snippet", ""),
                        "source": result.get("source", "")
                    })
                    
            return results
        except Exception as e:
            print(f"Web search error: {e}")
            return []
    
    def get_learning_platforms(self, topic: str) -> List[Dict[str, str]]:
        """Get recommended learning platforms for a specific topic"""
        platform_map = {
            "python": [
                {"name": "Python.org", "url": "https://python.org", "description": "Official Python documentation and tutorials"},
                {"name": "Codecademy", "url": "https://codecademy.com/learn/learn-python-3", "description": "Interactive Python courses"},
                {"name": "Real Python", "url": "https://realpython.com", "description": "Practical Python tutorials"},
                {"name": "Python Crash Course", "url": "https://nostarch.com/pythoncrashcourse2e", "description": "Popular Python book"}
            ],
            "data science": [
                {"name": "Kaggle Learn", "url": "https://kaggle.com/learn", "description": "Free micro-courses in data science"},
                {"name": "Coursera Data Science", "url": "https://coursera.org/specializations/jhu-data-science", "description": "Johns Hopkins Data Science Specialization"},
                {"name": "DataCamp", "url": "https://datacamp.com", "description": "Interactive data science courses"},
                {"name": "edX MIT", "url": "https://edx.org/course/introduction-to-computational-thinking-and-data-4", "description": "MIT's Introduction to Data Science"}
            ],
            "machine learning": [
                {"name": "Coursera ML", "url": "https://coursera.org/learn/machine-learning", "description": "Andrew Ng's Machine Learning Course"},
                {"name": "Fast.ai", "url": "https://fast.ai", "description": "Practical deep learning courses"},
                {"name": "Udacity ML", "url": "https://udacity.com/school-of-ai", "description": "Machine Learning Nanodegrees"},
                {"name": "Google AI Education", "url": "https://ai.google/education", "description": "Google's AI and ML courses"}
            ],
            "web development": [
                {"name": "FreeCodeCamp", "url": "https://freecodecamp.org", "description": "Free full-stack web development curriculum"},
                {"name": "MDN Web Docs", "url": "https://developer.mozilla.org", "description": "Comprehensive web development documentation"},
                {"name": "The Odin Project", "url": "https://theodinproject.com", "description": "Free full-stack curriculum"},
                {"name": "Scrimba", "url": "https://scrimba.com", "description": "Interactive coding screencasts"}
            ],
            "javascript": [
                {"name": "JavaScript.info", "url": "https://javascript.info", "description": "Modern JavaScript tutorial"},
                {"name": "Eloquent JavaScript", "url": "https://eloquentjavascript.net", "description": "Free JavaScript book"},
                {"name": "You Don't Know JS", "url": "https://github.com/getify/You-Dont-Know-JS", "description": "Deep dive into JavaScript"},
                {"name": "Codecademy JS", "url": "https://codecademy.com/learn/introduction-to-javascript", "description": "Interactive JavaScript course"}
            ]
        }
        
        # Find matching platforms
        topic_lower = topic.lower()
        for key, platforms in platform_map.items():
            if key in topic_lower or any(word in topic_lower for word in key.split()):
                return platforms
        
        # Default platforms for general learning
        return [
            {"name": "Coursera", "url": "https://coursera.org", "description": "University-level courses from top institutions"},
            {"name": "edX", "url": "https://edx.org", "description": "High-quality courses from universities and institutions"},
            {"name": "Udemy", "url": "https://udemy.com", "description": "Wide variety of practical courses"},
            {"name": "Khan Academy", "url": "https://khanacademy.org", "description": "Free courses on many subjects"}
        ]
    
    def chat(self, message: str, context: Optional[str] = None) -> Dict[str, Any]:
        """Chat with Gemini, optionally including web search results"""
        try:
            # Check if this seems like a question that would benefit from web search
            search_triggers = ["latest", "recent", "current", "news", "what's new", "2024", "2025", "how to", "best practices", "tutorial"]
            should_search = any(trigger in message.lower() for trigger in search_triggers)
            
            web_results = []
            if should_search:
                # Extract key terms for search
                search_query = message
                if "how to" in message.lower():
                    search_query += " tutorial guide"
                elif "latest" in message.lower() or "recent" in message.lower():
                    search_query += " 2024 2025"
                
                web_results = self.search_web(search_query, 3)
            
            # Build the prompt
            prompt = f"User question: {message}\n\n"
            
            if context:
                prompt += f"Context about user's learning interests: {context}\n\n"
            
            if web_results:
                prompt += "Recent web search results:\n"
                for i, result in enumerate(web_results, 1):
                    prompt += f"{i}. {result['title']}\n   {result['snippet']}\n   Source: {result['link']}\n\n"
            
            prompt += """Please provide a helpful, accurate response. If you used web search results, mention that you found recent information. 
            Focus on learning resources, tutorials, and educational content when relevant. 
            Be concise but informative."""
            
            response = self.model.generate_content(prompt)
            
            return {
                "response": response.text,
                "web_results": web_results,
                "has_search": bool(web_results)
            }
            
        except Exception as e:
            return {
                "response": f"I'm having trouble connecting right now. Please try again later. Error: {str(e)}",
                "web_results": [],
                "has_search": False
            }
