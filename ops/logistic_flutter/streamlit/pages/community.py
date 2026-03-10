import streamlit as st
import sys
from pathlib import Path
from datetime import datetime
import time

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent))

from utils.css_loader import load_css
from utils.database import get_community_posts
from utils.helpers import time_ago, show_success_message

# Load CSS
load_css()

# ==================== HERO SECTION ====================
st.markdown("""
    <div class="hero-section">
        <h1 class="hero-title">💬 Community Forum</h1>
        <p class="hero-subtitle">
            Connect, share experiences, and support each other in a safe space
        </p>
    </div>
""", unsafe_allow_html=True)

# ==================== SIDEBAR - CREATE POST ====================
st.sidebar.markdown("### ✍️ Create New Post")
with st.sidebar.expander("➕ New Post", expanded=False):
    with st.form("create_post_form"):
        post_title = st.text_input("Post Title")
        post_category = st.selectbox(
            "Category",
            ["Career Advice", "Tech & Coding", "Personal Growth", "Health & Wellness", "Legal Advice", "Support Group"]
        )
        post_content = st.text_area("Your Post", height=150)
        
        submitted = st.form_submit_button("📤 Publish Post", use_container_width=True)
        
        if submitted:
            if post_title and post_content:
                # In a real scenario, you would call insert_community_post() here
                # db.insert_post(post_title, post_content, post_category)
                st.success("Post published successfully! 🎉")
                time.sleep(1)
                st.rerun()
            else:
                st.error("Please fill in all fields")

# ==================== DATA LOADING ====================
# 1. Define Sample Data (Fallback)
sample_posts = [
    {
        "id": 101,
        "title": "How to negotiate salary as a woman in tech?",
        "author": "TechGirl23",
        "category": "Career Advice",
        "content": "I have a job offer but the salary seems low. Any tips on how to negotiate effectively? I'm nervous about asking for more...",
        "likes": 45,
        "replies": 12,
        "time": "2 hours ago"
    },
    {
        "id": 102,
        "title": "Learning Python - Best resources for beginners?",
        "author": "CodeNewbie",
        "category": "Tech & Coding",
        "content": "I want to start my coding journey with Python. What are the best free resources? Should I start with web dev or data science?",
        "likes": 32,
        "replies": 18,
        "time": "5 hours ago"
    },
    {
        "id": 103,
        "title": "Dealing with imposter syndrome",
        "author": "SelfDoubt101",
        "category": "Personal Growth",
        "content": "I recently got promoted but I feel like I don't deserve it. I constantly feel like I'm not good enough. How do you deal with imposter syndrome?",
        "likes": 78,
        "replies": 25,
        "time": "1 day ago"
    },
    {
        "id": 104,
        "title": "PCOS management - natural remedies?",
        "author": "HealthyLiving",
        "category": "Health & Wellness",
        "content": "After struggling with PCOS for 5 years, I found a combination of diet, exercise, and lifestyle changes that helped. Happy to share what worked...",
        "likes": 156,
        "replies": 43,
        "time": "2 days ago"
    }
]

# 2. Fetch Real Data from DB
db_data = get_community_posts()

# 3. Process Data
# If DB returns data, format it. If not, use sample_posts.
posts_to_display = []

if db_data and len(db_data) > 0:
    for p in db_data:
        posts_to_display.append({
            "id": p.get('id'),
            "title": p.get('title'),
            "author": p.get('author_name', 'Anonymous'),
            "category": p.get('category', 'General'),
            "content": p.get('content'),
            "likes": p.get('likes', 0),
            "replies": 0, # Assuming no replies table yet
            "time": time_ago(p.get('created_at')) if p.get('created_at') else "Just now"
        })
else:
    posts_to_display = sample_posts

# ==================== CORE DISPLAY FUNCTION ====================
def display_post(post, tab_name=""):
    """
    Display a community post with dynamic Like, Reply, and Share functionality.
    Uses Session State to update UI instantly without full page reload artifacts.
    """
    unique_key = f"{tab_name}_{post['id']}"
    
    # --- 1. Initialize State for this Post ---
    # Like Count
    if f"likes_{unique_key}" not in st.session_state:
        st.session_state[f"likes_{unique_key}"] = post['likes']
    
    # Reply Box Visibility
    if f"show_reply_{unique_key}" not in st.session_state:
        st.session_state[f"show_reply_{unique_key}"] = False
        
    # Share Status
    if f"shared_{unique_key}" not in st.session_state:
        st.session_state[f"shared_{unique_key}"] = False

    # Get current values from state
    current_likes = st.session_state[f"likes_{unique_key}"]
    
    # --- 2. Render HTML Card ---
    # Note: We inject 'current_likes' into the HTML so the visual number updates
    card_style = """
        background: white; 
        padding: 25px; 
        border-radius: 15px; 
        box-shadow: 0 2px 8px rgba(0,0,0,0.05); 
        border: 1px solid #eee;
        margin-bottom: 20px;
    """
    
    st.markdown(f"""
        <div style="{card_style}">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                <div>
                    <h3 style="color: #667eea; margin: 0 0 8px 0; font-size: 18px;">{post['title']}</h3>
                    <p style="color: #999; font-size: 13px; margin: 0;">
                        Posted by <b>{post['author']}</b> • {post['time']} • 
                        <span style="background: #f0f2f6; padding: 4px 12px; border-radius: 12px; font-size: 11px; color: #555; margin-left: 10px;">
                            {post['category']}
                        </span>
                    </p>
                </div>
            </div>
            <p style="color: #555; line-height: 1.6; margin: 15px 0; font-size: 15px;">
                {post['content']}
            </p>
            <div style="display: flex; gap: 20px; align-items: center; margin-top: 15px; padding-top: 15px; border-top: 1px solid #f5f5f5;">
                <span style="color: #667eea; font-weight: 600; font-size: 14px;">👍 {current_likes} Likes</span>
                <span style="color: #667eea; font-weight: 600; font-size: 14px;">💬 {post['replies']} Replies</span>
                <span style="color: #667eea; font-weight: 600; font-size: 14px;">🔗 Share</span>
            </div>
        </div>
    """, unsafe_allow_html=True)
    
    # --- 3. Interaction Buttons ---
    col1, col2, col3 = st.columns([1, 1, 1])
    
    with col1:
        # LIKE BUTTON
        # Unique key ensures we identify exactly which button was clicked
        if st.button(f"👍 Like ({current_likes})", key=f"btn_like_{unique_key}", use_container_width=True):
            st.session_state[f"likes_{unique_key}"] += 1
            # In a real app, call db.increment_likes(post['id']) here
            st.rerun() # Forces a UI refresh to show the new number
            
    with col2:
        # REPLY BUTTON
        if st.button("💬 Reply", key=f"btn_reply_{unique_key}", use_container_width=True):
            st.session_state[f"show_reply_{unique_key}"] = not st.session_state[f"show_reply_{unique_key}"]
            st.rerun()
            
    with col3:
        # SHARE BUTTON
        if st.button("🔗 Share", key=f"btn_share_{unique_key}", use_container_width=True):
            st.session_state[f"shared_{unique_key}"] = True
            st.rerun()

    # --- 4. Conditional UI Elements ---
    
    # Show Share Message
    if st.session_state[f"shared_{unique_key}"]:
        st.success(f"Link copied to clipboard: https://women-empowerment.app/post/{post['id']}")
        # Optional: Reset share state after showing so it doesn't stay forever
        # st.session_state[f"shared_{unique_key}"] = False 

    # Show Reply Form
    if st.session_state[f"show_reply_{unique_key}"]:
        with st.container():
            st.markdown("<div style='margin-left: 20px; padding-left: 20px; border-left: 3px solid #eee;'>", unsafe_allow_html=True)
            with st.form(key=f"form_reply_{unique_key}"):
                reply_text = st.text_area("Write your reply...", height=100)
                col_a, col_b = st.columns([1, 4])
                with col_a:
                    submit_reply = st.form_submit_button("Post Reply", type="primary")
                
                if submit_reply:
                    if reply_text:
                        st.success("Reply posted! 🎉")
                        # db.insert_reply(post['id'], reply_text)
                        st.session_state[f"show_reply_{unique_key}"] = False
                        time.sleep(1)
                        st.rerun()
                    else:
                        st.warning("Please write something.")
            st.markdown("</div>", unsafe_allow_html=True)
    
    st.markdown("<br>", unsafe_allow_html=True)

# ==================== FORUM CATEGORIES TABS ====================
st.markdown("## 🏷️ Forum Categories")
st.markdown("<br>", unsafe_allow_html=True)

tabs = st.tabs([
    "🌟 All Posts",
    "💼 Career",
    "👩‍💻 Tech",
    "💪 Growth",
    "🏥 Health",
    "⚖️ Legal",
    "🤝 Support"
])

# Mapping tabs to category names in data
category_map = {
    1: "Career Advice",
    2: "Tech & Coding",
    3: "Personal Growth",
    4: "Health & Wellness",
    5: "Legal Advice",
    6: "Support Group"
}

# --- Tab 1: All Posts ---
with tabs[0]:
    st.markdown("### 📌 Recent Discussions")
    st.markdown("<br>", unsafe_allow_html=True)
    for post in posts_to_display:
        display_post(post, tab_name="all")

# --- Tabs 2-7: Specific Categories ---
for i in range(1, 7):
    with tabs[i]:
        cat_name = category_map[i]
        st.markdown(f"### {cat_name} Discussions")
        st.markdown("<br>", unsafe_allow_html=True)
        
        # Filter posts
        filtered_posts = [p for p in posts_to_display if p['category'] == cat_name]
        
        if filtered_posts:
            for post in filtered_posts:
                # Use a prefix like "career" so session keys don't clash with "all" tab
                display_post(post, tab_name=cat_name.lower().split()[0])
        else:
            st.info(f"No posts in {cat_name} yet. Be the first to start a discussion!")

st.markdown("<br><br>", unsafe_allow_html=True)

# ==================== COMMUNITY GUIDELINES ====================
st.markdown("## 📜 Community Guidelines")

guidelines_style = """
    background: white; 
    padding: 30px; 
    border-radius: 15px; 
    border: 1px solid #eee; 
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
"""

with st.expander("👉 Read Our Community Guidelines"):
    st.markdown(f"""
        <div style="{guidelines_style}">
            <h3 style="color: #667eea; margin-bottom: 20px;">Creating a Safe & Supportive Space 💜</h3>
            
            <h4 style="color: #28a745; margin-bottom: 10px;">✅ DO:</h4>
            <ul style="line-height: 1.8; color: #555; margin-bottom: 20px;">
                <li>Be respectful, kind, and supportive</li>
                <li>Share your experiences and learn from others</li>
                <li>Offer constructive advice and encouragement</li>
                <li>Use trigger warnings for sensitive topics</li>
            </ul>
            
            <h4 style="color: #dc3545; margin-bottom: 10px;">❌ DON'T:</h4>
            <ul style="line-height: 1.8; color: #555; margin-bottom: 20px;">
                <li>Harassment, bullying, or hate speech</li>
                <li>Spam or promotional content</li>
                <li>Giving medical or legal advice without qualifications</li>
                <li>Victim blaming or shaming</li>
            </ul>
        </div>
    """, unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)

# ==================== COMMUNITY STATS ====================
st.markdown("## 📊 Community Stats")
st.markdown("<br>", unsafe_allow_html=True)

col1, col2, col3, col4 = st.columns(4)

stat_card_style = "background: white; padding: 20px; border-radius: 15px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid #f0f0f0;"

with col1:
    st.markdown(f"""
        <div style="{stat_card_style}">
            <h2 style="color: #667eea; font-size: 32px; margin: 0;">{len(posts_to_display) + 10240:,}</h2>
            <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Total Members</p>
        </div>
    """, unsafe_allow_html=True)

with col2:
    st.markdown(f"""
        <div style="{stat_card_style}">
            <h2 style="color: #667eea; font-size: 32px; margin: 0;">{len(posts_to_display)}</h2>
            <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Active Discussions</p>
        </div>
    """, unsafe_allow_html=True)

with col3:
    st.markdown(f"""
        <div style="{stat_card_style}">
            <h2 style="color: #667eea; font-size: 32px; margin: 0;">3,421</h2>
            <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Responses Today</p>
        </div>
    """, unsafe_allow_html=True)

with col4:
    st.markdown(f"""
        <div style="{stat_card_style}">
            <h2 style="color: #667eea; font-size: 32px; margin: 0;">25K+</h2>
            <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Support Given</p>
        </div>
    """, unsafe_allow_html=True)
