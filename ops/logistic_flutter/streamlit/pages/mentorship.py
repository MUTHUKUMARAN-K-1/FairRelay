import streamlit as st
import sys
from pathlib import Path
import re

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent))

from components.cards import mentor_card
from utils.database import get_mentors_cached, get_db_connection_simple
from utils.helpers import show_success_message, chatbot_response
from utils.css_loader import load_css

# Load CSS
load_css()

# ==================== HERO SECTION ====================
st.markdown("""
    <div class="hero-section">
        <h1 class="hero-title">👥 Mentorship & Networking</h1>
        <p class="hero-subtitle">
            Connect with experienced mentors who can guide your career journey
        </p>
    </div>
""", unsafe_allow_html=True)

# ==================== DATA LOADING ====================
mentors = get_mentors_cached()

# If no mentors, add sample data
if not mentors:
    st.info("📊 Initializing mentor database with sample data...")
    
    sample_mentors = [
        {
            "name": "Dr. Priya Sharma",
            "email": "priya.sharma@example.com",
            "expertise": "Software Engineering, Tech Leadership",
            "bio": "20+ years in tech industry. Led engineering teams at top companies. Passionate about helping women break into tech.",
            "linkedin_url": "https://linkedin.com/in/priyasharma",
            "available_slots": 5, "rating": 4.9, "total_mentees": 45
        },
        {
            "name": "Anjali Verma",
            "email": "anjali.verma@example.com",
            "expertise": "Digital Marketing, Brand Strategy",
            "bio": "Marketing executive with 15 years experience. Built multiple successful brands. Help women entrepreneurs grow their business.",
            "linkedin_url": "https://linkedin.com/in/anjaliverma",
            "available_slots": 3, "rating": 4.8, "total_mentees": 38
        },
        {
            "name": "Kavita Reddy",
            "email": "kavita.reddy@example.com",
            "expertise": "Data Science, Analytics",
            "bio": "Data scientist specializing in AI/ML. Mentored 50+ women transitioning into data careers. PhD in Computer Science.",
            "linkedin_url": "https://linkedin.com/in/kavitareddy",
            "available_slots": 4, "rating": 4.9, "total_mentees": 52
        },
        {
            "name": "Meera Patel",
            "email": "meera.patel@example.com",
            "expertise": "UI/UX Design, Product Design",
            "bio": "Lead designer at Fortune 500 company. 12 years of design experience. Love teaching design thinking and user research.",
            "linkedin_url": "https://linkedin.com/in/meerapatel",
            "available_slots": 6, "rating": 4.7, "total_mentees": 35
        },
        {
            "name": "Nisha Kapoor",
            "email": "nisha.kapoor@example.com",
            "expertise": "Entrepreneurship, Startup Growth",
            "bio": "Serial entrepreneur. Founded 3 successful startups. Angel investor focusing on women-led ventures.",
            "linkedin_url": "https://linkedin.com/in/nishakapoor",
            "available_slots": 2, "rating": 5.0, "total_mentees": 28
        },
        {
            "name": "Rekha Menon",
            "email": "rekha.menon@example.com",
            "expertise": "Finance, Investment Banking",
            "bio": "VP at investment bank. 18 years in finance. Help women understand financial markets and career growth in finance.",
            "linkedin_url": "https://linkedin.com/in/rekhamenon",
            "available_slots": 4, "rating": 4.8, "total_mentees": 31
        },
        {
            "name": "Swati Gupta",
            "email": "swati.gupta@example.com",
            "expertise": "Healthcare, Medical Career",
            "bio": "Doctor with 25 years experience. Guide young women pursuing medical careers. Focus on work-life balance in medicine.",
            "linkedin_url": "https://linkedin.com/in/swatigupta",
            "available_slots": 3, "rating": 4.9, "total_mentees": 42
        },
        {
            "name": "Pooja Singh",
            "email": "pooja.singh@example.com",
            "expertise": "HR, Career Development",
            "bio": "HR Director at multinational company. Expert in career transitions, resume building, and interview preparation.",
            "linkedin_url": "https://linkedin.com/in/poojasingh",
            "available_slots": 7, "rating": 4.6, "total_mentees": 60
        }
    ]
    
    mentors = sample_mentors

# ==================== FEATURE 1: AI MENTOR MATCHMAKER (NEW) ====================
st.markdown("## 🤖 Find Your Perfect Mentor (AI Match)")

with st.expander("✨ Describe your goals, and AI will find the best mentor for you", expanded=False):
    col_ai_1, col_ai_2 = st.columns([3, 1])
    with col_ai_1:
        user_goal = st.text_input("What is your career goal?", placeholder="e.g., I want to transition from marketing to data science.")
    with col_ai_2:
        st.write("") # Spacer
        st.write("") # Spacer
        find_mentor_btn = st.button("🔍 AI Match", use_container_width=True)

    if find_mentor_btn and user_goal:
        with st.spinner("AI is analyzing mentor profiles to find your match..."):
            # Prepare mentor data for context
            mentor_list_text = "\n".join([f"- {m['name']} (Expertise: {m['expertise']}, Bio: {m['bio']})" for m in mentors])
            
            prompt = f"""
            I am looking for a mentor. My goal is: "{user_goal}".
            Here is a list of available mentors:
            {mentor_list_text}
            
            Based on my goal, recommend the Top 2 best mentors from this list.
            Explain briefly why they are a good match.
            """
            
            recommendation = chatbot_response(prompt, context="Mentor Matchmaker")
            
            st.markdown(f"""
                <div style="background: #f0fdf4; border-left: 5px solid #22c55e; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
                    <h4 style="margin-top:0; color: #166534;">🎯 AI Recommendations:</h4>
                    <div style="white-space: pre-line; line-height: 1.6; color: #15803d;">{recommendation}</div>
                </div>
            """, unsafe_allow_html=True)


# ==================== SEARCH AND FILTER ====================
st.markdown("### 🔍 Browse All Mentors")
col1, col2 = st.columns([3, 1])

with col1:
    search_expertise = st.text_input("Search by expertise", placeholder="e.g., Software Engineering, Marketing", label_visibility="collapsed")

with col2:
    sort_by = st.selectbox("Sort By", ["Rating", "Experience", "Available"], label_visibility="collapsed")

st.markdown("<br>", unsafe_allow_html=True)

# Filter mentors
filtered_mentors = mentors
if search_expertise:
    filtered_mentors = [m for m in filtered_mentors if search_expertise.lower() in m['expertise'].lower()]

# Sort mentors
if sort_by == "Rating":
    filtered_mentors = sorted(filtered_mentors, key=lambda x: x.get('rating', 0), reverse=True)
elif sort_by == "Experience":
    filtered_mentors = sorted(filtered_mentors, key=lambda x: x.get('total_mentees', 0), reverse=True)
else:
    filtered_mentors = sorted(filtered_mentors, key=lambda x: x.get('available_slots', 0), reverse=True)

# ==================== MENTOR GRID DISPLAY ====================
st.markdown(f"**Showing {len(filtered_mentors)} Mentors**")

if filtered_mentors:
    cols = st.columns(2)
    for idx, mentor in enumerate(filtered_mentors):
        with cols[idx % 2]:
            mentor_card(mentor)
            
            col_a, col_b = st.columns(2)
            with col_a:
                mentor_id = mentor.get('id', idx)
                if st.button(f"📅 Book Session", key=f"book_{mentor_id}_{idx}", use_container_width=True):
                    st.session_state[f'booking_{mentor_id}'] = True
            
            with col_b:
                if st.button(f"💬 Message", key=f"msg_{mentor_id}_{idx}", use_container_width=True):
                    st.session_state[f'message_{mentor_id}'] = True
            
            # --- BOOKING MODAL ---
            if st.session_state.get(f'booking_{mentor_id}', False):
                with st.expander(f"📅 Book Session with {mentor['name']}", expanded=True):
                    session_date = st.date_input("Preferred Date", key=f"date_{mentor_id}_{idx}")
                    session_time = st.time_input("Preferred Time", key=f"time_{mentor_id}_{idx}")
                    if st.button("✅ Confirm Booking", key=f"confirm_{mentor_id}_{idx}"):
                        show_success_message(f"Session booked with {mentor['name']} on {session_date} at {session_time}!")
                        st.balloons()
                        st.session_state[f'booking_{mentor_id}'] = False
            
            # --- FEATURE 2: AI ICEBREAKER (NEW) ---
                        # --- FEATURE 2: AI ICEBREAKER (UPDATED) ---
            if st.session_state.get(f'message_{mentor_id}', False):
                with st.expander(f"💬 Send Message to {mentor['name']}", expanded=True):
                    st.info("💡 Not sure what to say? Use AI to generate a professional intro!")
                    
                    user_context = st.text_input("What do you want to ask?", placeholder="e.g., I want advice on leading a team.", key=f"ctx_{mentor_id}_{idx}")
                    
                    # AI Generator Button
                    if st.button("✨ Generate AI Draft", key=f"gen_{mentor_id}_{idx}"):
                        with st.spinner("Drafting message..."):
                            prompt = f"""
                            Draft a short, professional LinkedIn connection message (under 300 chars) to a mentor named {mentor['name']}.
                            Her expertise is {mentor['expertise']}.
                            My specific question/goal is: "{user_context}".
                            """
                            draft = chatbot_response(prompt, context="Professional Networking")
                            st.session_state[f'draft_{mentor_id}'] = draft # Store draft in session state
                    
                    # Text Area for Editing/Typing (Pre-filled if AI generated)
                    final_msg = st.text_area("Your Message:", value=st.session_state.get(f'draft_{mentor_id}', ""), height=100, key=f"final_msg_{mentor_id}_{idx}")
                    
                    col_send, col_close = st.columns([1, 1])
                    with col_send:
                        # --- NEW SEND BUTTON ---
                        if st.button("🚀 Send Message", key=f"send_final_{mentor_id}_{idx}", use_container_width=True):
                            if final_msg:
                                show_success_message(f"Message sent to {mentor['name']}!")
                                st.balloons()
                                st.session_state[f'message_{mentor_id}'] = False # Close modal
                            else:
                                st.warning("Please type a message first.")
                    
                    with col_close:
                        if st.button("Cancel", key=f"close_msg_{mentor_id}_{idx}", use_container_width=True):
                            st.session_state[f'message_{mentor_id}'] = False

            st.markdown("<br>", unsafe_allow_html=True)
else:
    st.warning("No mentors found matching your search.")

st.markdown("<br><br>", unsafe_allow_html=True)

# ==================== BECOME A MENTOR ====================
st.markdown("## 🌟 Become a Mentor")
st.markdown("""
    <div class="info-box">
        <h3>Share Your Expertise, Empower Others</h3>
        <p>Have experience you'd like to share? Join our mentor community and help other women succeed!</p>
    </div>
""", unsafe_allow_html=True)

with st.expander("📝 Apply to Become a Mentor"):
    mentor_name = st.text_input("Full Name")
    mentor_email = st.text_input("Email Address")
    mentor_expertise = st.text_input("Your Expertise", placeholder="e.g., Software Engineering")
    mentor_bio = st.text_area("Tell us about yourself", height=100)
    
    if st.button("🚀 Submit Application", use_container_width=True):
        if mentor_name and mentor_email:
            show_success_message("Application submitted! We'll review and get back to you.")
            st.balloons()
        else:
            st.error("Please fill in required fields")

st.markdown("<br>", unsafe_allow_html=True)

# ==================== EVENTS SECTION ====================
st.markdown("## 🎉 Upcoming Networking Events")
col1, col2, col3 = st.columns(3)

events = [
    ("🎤 Women in Tech Summit", "Jan 15, 2026", "Virtual"),
    ("💼 Career Growth Workshop", "Jan 22, 2026", "Bangalore"),
    ("🚀 Startup Founder Meetup", "Feb 5, 2026", "Mumbai")
]

for i, (title, date, loc) in enumerate(events):
    with [col1, col2, col3][i]:
        st.markdown(f"""
            <div class="feature-card">
                <h4>{title}</h4>
                <p><b>Date:</b> {date}</p>
                <p><b>Location:</b> {loc}</p>
            </div>
        """, unsafe_allow_html=True)
        if st.button("🎟️ Register", key=f"event{i}", use_container_width=True):
            st.success("✅ Registered!")
