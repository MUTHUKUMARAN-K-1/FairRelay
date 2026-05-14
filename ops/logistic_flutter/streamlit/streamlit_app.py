import streamlit as st
from pathlib import Path
import sys
import random

# Add project root to path
sys.path.append(str(Path(__file__).parent))

from utils.css_loader import load_css
from components.cards import feature_card, stat_card
from config.settings import APP_CONFIG, IMPACT_METRICS

# Page configuration - MUST BE FIRST
st.set_page_config(
    page_title=APP_CONFIG["app_name"],
    page_icon="💜",
    layout="wide",
    initial_sidebar_state="expanded",
    menu_items={
        'About': '# Women Empowerment Hub\nEmpowering women through technology, education, and community.'
    }
)

# Load custom CSS
load_css()

# ==================== SIDEBAR ====================
st.sidebar.markdown("""
    <div style="text-align: center; padding: 20px 0;">
        <div style="font-size: 60px; margin-bottom: 10px;">💜</div>
        <h2 style="color: white; margin: 0; font-size: 22px;">Women Empowerment Hub</h2>
        <p style="color: rgba(255,255,255,0.8); font-size: 13px;">Empowering women, transforming lives</p>
    </div>
""", unsafe_allow_html=True)

st.sidebar.markdown("### 📊 Live Impact")
metrics = [
    ("Women Helped", f"{IMPACT_METRICS['women_helped']:,}+"),
    ("Jobs Posted", f"{IMPACT_METRICS['jobs_posted']:,}+"),
    ("Free Courses", f"{IMPACT_METRICS['courses_available']}+"),
    ("Active Mentors", f"{IMPACT_METRICS['mentors_active']}+")
]

for label, value in metrics:
    st.sidebar.markdown(f"""
        <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 10px; margin-bottom: 10px;">
            <div style="font-size: 24px; font-weight: bold; color: white;">{value}</div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.8);">{label}</div>
        </div>
    """, unsafe_allow_html=True)

# ==================== HERO SECTION ====================
st.markdown("""
    <div class="hero-section">
        <h1 class="hero-title">💜 Women Empowerment Hub</h1>
        <p class="hero-subtitle">
            Empowering women through safety, education, careers, health & community
        </p>
        <p style="font-size: 16px; margin-top: 20px; opacity: 0.9;">
            Your one-stop platform for resources, support, and opportunities
        </p>
    </div>
""", unsafe_allow_html=True)

# ==================== DAILY INSPIRATION (NEW) ====================
quotes = [
    "“There is no limit to what we, as women, can accomplish.” – Michelle Obama",
    "“I am not free while any woman is unfree, even when her shackles are very different from my own.” – Audre Lorde",
    "“A woman with a voice is, by definition, a strong woman.” – Melinda Gates",
    "“Think like a queen. A queen is not afraid to fail.” – Oprah Winfrey"
]
daily_quote = random.choice(quotes)

st.markdown(f"""
    <div style="background: white; border-left: 5px solid #667eea; padding: 20px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); margin-bottom: 30px;">
        <h4 style="color: #667eea; margin: 0;">✨ Daily Inspiration</h4>
        <p style="font-size: 18px; font-style: italic; color: #555; margin-top: 10px;">{daily_quote}</p>
    </div>
""", unsafe_allow_html=True)

# ==================== IMPACT METRICS ====================
st.markdown("## 📊 Our Impact")
col1, col2, col3, col4 = st.columns(4)

with col1: stat_card("👩", f"{IMPACT_METRICS['women_helped']:,}+", "Women Helped")
with col2: stat_card("💼", f"{IMPACT_METRICS['jobs_posted']:,}+", "Jobs Posted", "#10b981")
with col3: stat_card("📚", f"{IMPACT_METRICS['courses_available']:,}+", "Courses Available", "#f59e0b")
with col4: stat_card("👥", f"{IMPACT_METRICS['mentors_active']:,}+", "Active Mentors", "#ef4444")

st.markdown("<br>", unsafe_allow_html=True)

# ==================== FEATURES OVERVIEW ====================
st.markdown("## ✨ Explore Our Features")
col1, col2, col3 = st.columns(3)

with col1:
    feature_card("🛡️", "Women Safety", "Emergency contacts, legal resources, and safety tips to keep you protected 24/7")
    st.markdown("<br>", unsafe_allow_html=True)
    feature_card("❤️", "Health & Wellness", "Track your health, access medical resources, and learn about women's healthcare")

with col2:
    feature_card("💼", "Career Opportunities", "Discover jobs from companies committed to diversity and women empowerment")
    st.markdown("<br>", unsafe_allow_html=True)
    feature_card("⚖️", "Legal Rights", "Know your rights! Access information about laws protecting women")

with col3:
    feature_card("📚", "Education & Skills", "Free courses, certifications, and resources to boost your career")
    st.markdown("<br>", unsafe_allow_html=True)
    feature_card("⭐", "Success Stories", "Be inspired by amazing stories of women who overcame challenges")

st.markdown("<br>", unsafe_allow_html=True)

# ==================== INTERACTIVE POLL (EQUAL HEIGHT FIX) ====================
st.markdown("## 🗳️ What's your focus today?")
col_poll, col_news = st.columns([2, 1])

# --- LEFT COLUMN (POLL) ---
with col_poll:
    with st.container(border=True):
        goal = st.radio(
            "Select your main goal:", 
            ["Finding a Job 💼", "Learning a New Skill 📚", " Improving Health ❤️", "Finding a Mentor 👥"], 
            horizontal=True
        )
        
        # Added spacers to match the height of the right column
        st.markdown("<br>" * 2, unsafe_allow_html=True)
        
        if st.button("🚀 Let's Go!", use_container_width=True):
            if "Job" in goal: st.switch_page("pages/jobs.py")
            elif "Skill" in goal: st.switch_page("pages/education.py")
            elif "Health" in goal: st.switch_page("pages/health.py")
            elif "Mentor" in goal: st.switch_page("pages/mentorship.py")

# --- RIGHT COLUMN (NEWSLETTER) ---
with col_news:
    with st.container(border=True):
        # Reduced padding from 25px to 15px to save vertical space
        st.markdown("""
            <div style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); padding: 15px; border-radius: 10px; text-align: center; margin-bottom: 10px;">
                <h4 style="margin:0; color:#333;">💌 Join Newsletter</h4>
                <p style="font-size:12px; color:#555; margin: 5px 0 0 0;">Weekly updates & jobs.</p>
            </div>
        """, unsafe_allow_html=True)
        
        email = st.text_input("Enter Email", placeholder="you@example.com", label_visibility="collapsed")
        
        if st.button("Subscribe", use_container_width=True):
            if email: 
                st.success("Subscribed!")
                st.balloons()
            else: 
                st.warning("Enter valid email")


# ==================== QUICK ACTIONS ====================
st.markdown("## 🚀 Quick Actions")
col1, col2, col3, col4 = st.columns(4)

with col1:
    if st.button("🆘 Emergency Help", use_container_width=True): st.switch_page("pages/safety.py")
with col2:
    if st.button("🔍 Find Jobs", use_container_width=True): st.switch_page("pages/jobs.py")
with col3:
    if st.button("📖 Browse Courses", use_container_width=True): st.switch_page("pages/education.py")
with col4:
    if st.button("👥 Find Mentor", use_container_width=True): st.switch_page("pages/mentorship.py")

st.markdown("<br>", unsafe_allow_html=True)

# ==================== TESTIMONIALS ====================
st.markdown("## 💬 What Women Are Saying")
col1, col2, col3 = st.columns(3)

with col1:
    st.markdown("""
        <div class="testimonial-card">
            <p style="font-style: italic; color: #666; line-height: 1.8; margin-bottom: 15px;">
                "This platform helped me find my dream job and connected me with an amazing mentor. Forever grateful!"
            </p>
            <p style="color: #667eea; font-weight: 600;">- Priya S., Software Engineer</p>
        </div>
    """, unsafe_allow_html=True)

with col2:
    st.markdown("""
        <div class="testimonial-card">
            <p style="font-style: italic; color: #666; line-height: 1.8; margin-bottom: 15px;">
                "The free courses here helped me transition from housewife to freelance designer. Now I support my family!"
            </p>
            <p style="color: #667eea; font-weight: 600;">- Anita M., Graphic Designer</p>
        </div>
    """, unsafe_allow_html=True)

with col3:
    st.markdown("""
        <div class="testimonial-card">
            <p style="font-style: italic; color: #666; line-height: 1.8; margin-bottom: 15px;">
                "The emergency resources and legal information gave me the courage to stand up for my rights."
            </p>
            <p style="color: #667eea; font-weight: 600;">- Rekha T., Legal Advocate</p>
        </div>
    """, unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)

# ==================== FOOTER CALL TO ACTION (REDESIGNED) ====================
st.markdown("<br>", unsafe_allow_html=True)

# Container for the banner
with st.container():
    st.markdown("""
        <div style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 50px;
            border-radius: 20px;
            text-align: center;
            color: white;
            box-shadow: 0 10px 30px rgba(118, 75, 162, 0.3);
            margin-top: 20px;
        ">
            <h1 style="color: white; margin-bottom: 15px; font-size: 36px;">🚀 Ready to Start Your Journey?</h1>
            <p style="font-size: 18px; margin-bottom: 30px; opacity: 0.9;">
                Join thousands of women who are transforming their lives today.
            </p>
        </div>
    """, unsafe_allow_html=True)

    # Centering the button using columns
    c1, c2, c3 = st.columns([1.5, 1, 1.5])
    with c2:
        # Negative margin pulls the button up into the banner visually
        st.markdown('<div style="margin-top: -25px;"></div>', unsafe_allow_html=True)
        if st.button("✨ Get Started Now", type="primary", use_container_width=True):
            st.balloons()
            st.toast("Welcome aboard! Use the sidebar to navigate 👈")

# ==================== END OF HOME PAGE ====================