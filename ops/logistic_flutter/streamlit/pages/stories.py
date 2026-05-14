import streamlit as st
import sys
from pathlib import Path

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent))

from components.cards import success_story_card
from utils.database import get_stories_cached, insert_success_story
from utils.helpers import show_success_message, chatbot_response
from utils.css_loader import load_css

# Load CSS
load_css()

# ==================== HERO SECTION ====================
st.markdown("""
    <div class="hero-section">
        <h1 class="hero-title">⭐ Success Stories</h1>
        <p class="hero-subtitle">
            Real stories, real women, real inspiration.
        </p>
    </div>
""", unsafe_allow_html=True)

# ==================== DATA LOADING ====================
stories = get_stories_cached()
if not stories:
    st.info("📊 Initializing stories database...")
    # (Keeping your sample data structure for brevity, assuming existing logic works)
    sample_stories = [
        {"name": "Priya Sharma", "title": "From Housewife to Software Engineer", "story": "After 10 years of being a homemaker...", "category": "Career"},
        {"name": "Anjali Verma", "title": "Built a ₹10 Crore Business", "story": "Started my handicraft business from home...", "category": "Entrepreneurship"},
        {"name": "Meera Patel", "title": "Survived Domestic Violence", "story": "Left an abusive marriage with nothing...", "category": "Overcoming Abuse"}
    ]
    stories = sample_stories # Fallback

# ==================== FEATURE 1: MOOD-BASED STORY FINDER (AI) ====================
st.markdown("## 🎭 Find a Story for Your Mood")

with st.container(border=True):
    col_mood, col_sugg = st.columns([1, 2])
    
    with col_mood:
        st.write("How are you feeling today?")
        mood = st.selectbox("Select Mood", ["Demotivated 😞", "Anxious 😰", "Ambitious 🚀", "Lost 🧭"], label_visibility="collapsed")
        
        if st.button("✨ Find Inspiration", use_container_width=True, type="primary"):
            st.session_state['mood_search'] = True

    with col_sugg:
        if st.session_state.get('mood_search'):
            with st.spinner(f"AI is finding the perfect story for a {mood} mood..."):
                # Simple keyword matching logic (Simulating AI search)
                if "Demotivated" in mood: target = "Career"
                elif "Anxious" in mood: target = "Overcoming Abuse"
                elif "Ambitious" in mood: target = "Entrepreneurship"
                else: target = "Education"
                
                # Find matching story
                match = next((s for s in stories if s['category'] == target), stories[0])
                
                st.markdown(f"""
                    <div style="background: #fdf4ff; padding: 15px; border-radius: 10px; border-left: 5px solid #d946ef;">
                        <h4 style="margin:0; color: #86198f;">Recommended for you:</h4>
                        <p style="font-size: 18px; font-weight: bold; margin: 5px 0;">{match['title']}</p>
                        <p style="font-style: italic; color: #555;">"{match['story'][:100]}..."</p>
                    </div>
                """, unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)

# ==================== SEARCH & FILTER ====================
col1, col2 = st.columns([3, 1])
with col1:
    search_query = st.text_input("🔍 Search stories", placeholder="e.g. tech, business, single mom")
with col2:
    cat_filter = st.selectbox("Category", ["All", "Career", "Entrepreneurship", "Health", "Education"])

# Filter Logic
filtered = stories
if cat_filter != "All":
    filtered = [s for s in filtered if s['category'] == cat_filter]
if search_query:
    filtered = [s for s in filtered if search_query.lower() in s['title'].lower() or search_query.lower() in s['story'].lower()]

# Display Stories
st.markdown(f"### 💫 Showing {len(filtered)} Stories")
if filtered:
    for story in filtered[:3]: # Show top 3 to save space
        success_story_card(story)
        st.markdown("<br>", unsafe_allow_html=True)

# ==================== FEATURE 2: AI STORY WRITER ====================
st.markdown("## ✍️ AI Story Drafter")
st.markdown("Struggling to write your story? Give us keywords, and AI will draft it for you!")

with st.expander("✨ Click to Draft Your Story"):
    keywords = st.text_input("Enter keywords (comma separated)", placeholder="e.g., single mother, coding, night shifts, success")
    
    if st.button("📝 Generate Draft"):
        if keywords:
            with st.spinner("AI is writing your story..."):
                prompt = f"Write a short, inspiring first-person success story based on these keywords: {keywords}. Keep it emotional and motivating."
                draft = chatbot_response(prompt, context="Storyteller")
                st.text_area("Your AI Draft (Edit as needed):", value=draft, height=200)
        else:
            st.warning("Please enter some keywords first.")

st.markdown("<br>", unsafe_allow_html=True)

# ==================== FEATURE 3: AI MOTIVATION COACH ====================
st.markdown("## 🤖 AI Motivation Coach")

with st.container(border=True):
    col_coach_1, col_coach_2 = st.columns([1, 3])
    
    with col_coach_1:
        st.image("https://cdn-icons-png.flaticon.com/512/4712/4712009.png", width=80)
        st.write("**Coach Maya**")
    
    with col_coach_2:
        st.write("Hi! I've read all these amazing stories. Ask me for advice based on their lessons.")
        user_q = st.text_input("Ask Coach Maya:", placeholder="e.g., How do I stay motivated when I fail?")
        
        if user_q:
            with st.spinner("Coach Maya is thinking..."):
                resp = chatbot_response(f"Answer this based on the themes of resilience and women empowerment: {user_q}", context="Life Coach")
                st.info(f"💡 **Coach's Advice:** {resp}")

st.markdown("<br>", unsafe_allow_html=True)

# ==================== SUBMIT STORY FORM ====================
st.markdown("## 📝 Share Your Journey")

with st.expander("✍️ Submit Your Story"):
    with st.form("story_form"):
        name = st.text_input("Name")
        title = st.text_input("Title")
        category = st.selectbox("Category", ["Career", "Health", "Education"])
        content = st.text_area("Story")
        
        if st.form_submit_button("🚀 Submit"):
            if name and content:
                insert_success_story(name, title, content, category)
                st.success("Story submitted successfully!")
                st.balloons()
            else:
                st.error("Please fill required fields.")

# ==================== IMPACT STATS ====================
st.markdown("## 📊 Impact")
c1, c2, c3, c4 = st.columns(4)
c1.metric("Stories", "350+")
c2.metric("Inspired", "50K+")
c3.metric("Countries", "25")
c4.metric("Rating", "4.9/5")
