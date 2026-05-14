import streamlit as st
import sys
from pathlib import Path
import random

import json
from openai import OpenAI

# Initialize client (Make sure OPENAI_API_KEY is in .env or st.secrets)
try:
    client = OpenAI()
except:
    client = None

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent))

from components.cards import course_card
from utils.database import get_courses_cached, insert_course
from utils.css_loader import load_css
from utils.helpers import chatbot_response, search_filter

# Load CSS
load_css()

# ==================== HERO SECTION ====================
st.markdown("""
    <div class="hero-section">
        <h1 class="hero-title">📚 AI Learning Hub</h1>
        <p class="hero-subtitle">
            Personalized education powered by AI. No static lists—just learning tailored to you.
        </p>
    </div>
""", unsafe_allow_html=True)

# ==================== FEATURE 1: AI SKILL GAP ANALYZER ====================
st.markdown("## 🛣️ Career Roadmap Generator")
with st.container(border=True):
    col1, col2 = st.columns([1, 1])
    with col1:
        current_role = st.text_input("Current Role", placeholder="e.g. Marketing Intern")
    with col2:
        target_role = st.text_input("Target Role", placeholder="e.g. Digital Marketing Manager")
    
    if st.button("🚀 Generate Learning Path", type="primary", use_container_width=True):
        if current_role and target_role:
            with st.spinner(f"AI is analyzing the gap between {current_role} and {target_role}..."):
                # DYNAMIC AI CALL
                prompt = f"""
                I am a {current_role} wanting to become a {target_role}.
                Create a step-by-step learning roadmap. 
                List 3 key skills I need to learn and 1 project idea to build my portfolio.
                Format as HTML with bullet points.
                """
                roadmap = chatbot_response(prompt, context="Career Coach")
                
                st.markdown(f"""
                    <div style="background: #f0fdfa; padding: 20px; border-radius: 10px; border-left: 5px solid #0d9488;">
                        <h3 style="color: #115e59; margin-top:0;">Your Personalized Roadmap</h3>
                        <div style="color: #134e4a; line-height: 1.6;">{roadmap}</div>
                    </div>
                """, unsafe_allow_html=True)
        else:
            st.warning("Please enter both roles.")

st.markdown("<br>", unsafe_allow_html=True)

# ==================== FEATURE 2: AI COURSE GENERATOR ====================
st.markdown("## 🎓 Generate a Custom Course")
st.write("Can't find the right course? Let AI build one for you instantly.")

with st.expander("✨ Build My Course Syllabus"):
    topic = st.text_input("What do you want to learn?", placeholder="e.g. Sustainable Fashion Design, Python for Finance")
    level = st.select_slider("Difficulty", options=["Beginner", "Intermediate", "Advanced"])
    
    if st.button("🛠️ Create Syllabus"):
        if topic:
            with st.spinner(f"Designing {level} syllabus for {topic}..."):
                # DYNAMIC AI CALL
                prompt = f"""
                Create a structured 4-week course syllabus for '{topic}' at a {level} level.
                Include:
                - Course Title
                - Week 1-4 Topics
                - Final Project Idea
                Keep it concise.
                """
                syllabus = chatbot_response(prompt, context="Curriculum Designer")
                
                st.markdown(f"""
                    <div style="background: white; padding: 25px; border-radius: 15px; border: 1px solid #ddd; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                        <h2 style="color: #4f46e5; margin-top:0;">📘 AI-Generated Course: {topic}</h2>
                        <div style="color: #333; line-height: 1.7; white-space: pre-wrap;">{syllabus}</div>
                        <br>
                        <button style="background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 5px;">Start Learning</button>
                    </div>
                """, unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)

# ==================== FEATURE 3: DYNAMIC AI QUIZ (OPENAI JSON) ====================
st.markdown("## 🧠 Test Your Knowledge")
st.write("Take a quick AI-generated quiz on any topic.")

# Quiz Setup
with st.container(border=True):
    col_q1, col_q2 = st.columns([3, 1])
    with col_q1:
        quiz_topic = st.text_input("Enter Quiz Topic", "Women's Legal Rights")
    with col_q2:
        st.write("")
        st.write("")
        if st.button("Generate Quiz", use_container_width=True):
            st.session_state['quiz_data'] = None 
            st.session_state['quiz_ready'] = False
            st.session_state['current_topic'] = quiz_topic
            st.rerun()

# Quiz Generation using OpenAI JSON Mode
if st.session_state.get('current_topic') and not st.session_state.get('quiz_ready'):
    if not client:
        st.error("OpenAI Client not found. Please set OPENAI_API_KEY.")
    else:
        with st.spinner(f"🤖 AI is crafting a quiz on {st.session_state['current_topic']}..."):
            try:
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo-1106", # Supports JSON mode
                    messages=[
                        {"role": "system", "content": "You are a quiz generator. Output a valid JSON object with keys: 'question', 'options' (array of 4 strings), and 'answer_index' (0-3)."},
                        {"role": "user", "content": f"Generate a multiple-choice question about: {st.session_state['current_topic']}"}
                    ],
                    response_format={"type": "json_object"}
                )
                
                # Parse JSON directly - 100% reliable structure
                quiz_json = json.loads(response.choices[0].message.content)
                
                st.session_state['quiz_data'] = {
                    "question": quiz_json['question'],
                    "options": quiz_json['options'],
                    "correct_idx": quiz_json['answer_index']
                }
                st.session_state['quiz_ready'] = True
                st.rerun()
                
            except Exception as e:
                st.error(f"Error: {str(e)}")

# Display Quiz
if st.session_state.get('quiz_ready') and st.session_state.get('quiz_data'):
    q = st.session_state['quiz_data']
    
    st.markdown(f"### ❓ {q['question']}")
    
    # User Selection
    user_choice = st.radio("Choose one:", q['options'], index=None, key=f"q_{st.session_state['current_topic']}")
    
    if st.button("Check Answer", type="primary"):
        if user_choice:
            # Get index of user choice
            try:
                user_idx = q['options'].index(user_choice)
                if user_idx == q['correct_idx']:
                    st.success("✅ Correct! Brilliant job.")
                    st.balloons()
                else:
                    correct_text = q['options'][q['correct_idx']]
                    st.error(f"❌ Incorrect. The right answer was: **{correct_text}**")
            except:
                st.error("Error validating answer.")
        else:
            st.warning("Please select an option.")

# ==================== DYNAMIC COURSE FEED (FROM DATABASE) ====================
st.markdown("## 📂 Community Courses")
st.write("Courses shared by the community.")

# Load real data
courses = get_courses_cached()

# Dynamic Filtering
col_f1, col_f2 = st.columns([3, 1])
with col_f1:
    search_q = st.text_input("Filter Courses", placeholder="Search DB...")
with col_f2:
    level_f = st.selectbox("Level", ["All", "Beginner", "Advanced"])

filtered_courses = courses
if search_q:
    filtered_courses = search_filter(filtered_courses, search_q, ['title', 'category'])
if level_f != "All":
    filtered_courses = [c for c in filtered_courses if c.get('level') == level_f]

if filtered_courses:
    cols = st.columns(2)
    for idx, course in enumerate(filtered_courses):
        with cols[idx % 2]:
            course_card(course)
            if st.button(f"Enroll", key=f"c_{idx}", use_container_width=True):
                st.toast(f"Enrolled in {course['title']}")
else:
    st.info("No courses found in database. Add one via the Admin panel!")

st.markdown("<br>", unsafe_allow_html=True)


# ==================== DYNAMIC YOUTUBE RESOURCES ====================
st.markdown("## 🎥 Trending Learning Videos")

# Category Selector
selected_cat = st.selectbox("Select Category", ["Tech", "Business", "Design"], label_visibility="collapsed")

# Updated Data with High-Res Thumbnails
video_data = {
    "Tech": [
        {"title": "Python basics", "img": "https://i.ytimg.com/vi/x7X9w_GIm1s/hqdefault.jpg", "link": "https://youtu.be/K5KVEU3aaeQ?si=zuYJFY8hGWQRQPYV"},
        {"title": "AI Roadmap 2025", "img": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQmYz2IFaonldKNEN9AGy9MUm5q342vsUddCg&s", "link": "https://youtu.be/PSWUr5E_OKY?si=qVz2N7DRh2iodb6H"}
    ],
    "Business": [
        {"title": "Marketing 101", "img": "https://i.ytimg.com/vi/bixR-KIJKYM/hqdefault.jpg", "link": "https://youtu.be/bixR-KIJKYM"},
        {"title": "Start a Business", "img": "https://i.ytimg.com/vi/lJjILQu2xM8/hqdefault.jpg", "link": "https://youtu.be/lJjILQu2xM8"}
    ],
    "Design": [
        {"title": "Figma Tutorial", "img": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTfNm1MaoPU2yg7WfCpXQu4YLbBoR10HPRkUw&s", "link": "https://youtu.be/jQ1sfKIl50E?si=myxOfxFMrQWRx-4Q"},
        {"title": "Color Theory", "img": "https://i.ytimg.com/vi/AvgCkHrcj90/hqdefault.jpg", "link": "https://youtu.be/AvgCkHrcj90"}
    ]
}

# Display Grid
videos = video_data.get(selected_cat, [])
v_cols = st.columns(len(videos))

for i, vid in enumerate(videos):
    with v_cols[i]:
        # Improved Card UI
        st.markdown(f"""
            <a href="{vid['link']}" target="_blank" style="text-decoration: none; color: inherit;">
                <div style="
                    background: white; 
                    border-radius: 12px; 
                    overflow: hidden; 
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08); 
                    transition: transform 0.2s;
                    border: 1px solid #f0f0f0;
                    height: 100%;
                " onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                    <div style="position: relative; height: 160px; overflow: hidden;">
                        <img src="{vid['img']}" style="width: 100%; height: 100%; object-fit: cover;">
                        <div style="
                            position: absolute; 
                            bottom: 10px; right: 10px; 
                            background: rgba(0,0,0,0.7); 
                            color: white; padding: 2px 8px; 
                            border-radius: 4px; font-size: 12px;
                        ">▶ Play</div>
                    </div>
                    <div style="padding: 15px;">
                        <h4 style="margin: 0 0 5px 0; font-size: 16px; color: #333; line-height: 1.4;">{vid['title']}</h4>
                        <p style="margin: 0; font-size: 13px; color: #666;">Watch on YouTube ↗</p>
                    </div>
                </div>
            </a>
        """, unsafe_allow_html=True)
