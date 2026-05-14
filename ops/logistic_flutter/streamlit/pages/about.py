import streamlit as st
import sys
import os
import razorpay
from pathlib import Path
from dotenv import load_dotenv
import streamlit.components.v1 as components

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent))

from utils.css_loader import load_css
from config.settings import IMPACT_METRICS

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

# Load CSS
load_css()

# ==================== HERO SECTION ====================
st.markdown("""
    <div class="hero-section">
        <h1 class="hero-title">ℹ️ About Women Empowerment Hub</h1>
        <p class="hero-subtitle">
            Empowering women through technology, education, and community
        </p>
    </div>
""", unsafe_allow_html=True)

# ==================== DONATION SECTION (WORKING POPUP) ====================
try:
    client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
except:
    client = None

# ==================== DONATION SECTION (REDIRECT LINK) ====================
st.markdown("## ❤️ Support Our Mission")
st.write("Your contribution helps us provide free resources to women.")

with st.container(border=True):
    col1, col2 = st.columns([2, 1])
    
    with col1:
        amount = st.number_input("Enter Amount (₹)", min_value=10, value=100, step=10)
        st.caption("Secure payment via Razorpay (GPay/UPI/Card)")
        
    with col2:
        st.write("") 
        st.write("") 
        
        if st.button("💖 Donate Now", type="primary", use_container_width=True):
            if client:
                try:
                    # 1. Create Payment Link
                    payment_link = client.payment_link.create({
                        "amount": amount * 100, # Paise
                        "currency": "INR",
                        "accept_partial": False,
                        "description": "Women Empowerment Hub Donation",
                        "customer": {
                            "name": "Donor",
                            "email": "donor@example.com",
                            "contact": "7904140161"
                        },
                        "notify": {"sms": False, "email": False},
                        "reminder_enable": False,
                        "callback_url": "http://localhost:8501/about", # Returns user to app
                        "callback_method": "get"
                    })
                    
                    # 2. Get URL
                    pay_url = payment_link['short_url']
                    
                    # 3. Show Link Button
                    st.markdown(f"""
                        <a href="{pay_url}" target="_blank" style="text-decoration: none;">
                            <div style="
                                background-color: #16a34a; 
                                color: white; 
                                padding: 15px; 
                                border-radius: 8px; 
                                text-align: center; 
                                font-weight: bold;
                                margin-top: 10px;
                                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                            ">
                                ✅ Click here to Pay ₹{amount} Securely ↗
                            </div>
                        </a>
                    """, unsafe_allow_html=True)
                    
                except Exception as e:
                    st.error(f"Error: {str(e)}")
            else:
                st.error("Razorpay keys missing.")

# ==================== MISSION & VISION ====================
st.markdown("## 🎯 Our Mission")
st.markdown("<br>", unsafe_allow_html=True)

card_style = """
    background: white; 
    padding: 30px; 
    border-radius: 20px; 
    box-shadow: 0 4px 15px rgba(0,0,0,0.05); 
    text-align: center; 
    height: 320px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border: 1px solid #f0f0f0;
    transition: transform 0.3s ease;
"""

col1, col2 = st.columns(2)

with col1:
    st.markdown(f"""
        <div style="{card_style}">
            <h3 style="color: #667eea; font-size: 24px; margin-bottom: 15px;">🚀 Mission</h3>
            <p style="color: #666; line-height: 1.8; font-size: 16px;">
                To create a comprehensive platform that empowers women by providing access to 
                resources, opportunities, support, and a community that uplifts and inspires. 
                We believe every woman deserves the chance to reach her full potential.
            </p>
        </div>
    """, unsafe_allow_html=True)

with col2:
    st.markdown(f"""
        <div style="{card_style}">
            <h3 style="color: #667eea; font-size: 24px; margin-bottom: 15px;">🌟 Vision</h3>
            <p style="color: #666; line-height: 1.8; font-size: 16px;">
                A world where every woman has equal opportunities, feels safe, knows her rights, 
                and has access to resources that enable her to achieve her dreams. We envision 
                a future where gender equality is not just an aspiration, but a reality.
            </p>
        </div>
    """, unsafe_allow_html=True)

st.markdown("<br><br>", unsafe_allow_html=True)

# ==================== WHAT WE OFFER ====================
st.markdown("## 💜 What We Offer")
st.markdown("<br>", unsafe_allow_html=True)

feat_style = """
    background: white; 
    padding: 25px; 
    border-radius: 15px; 
    box-shadow: 0 4px 12px rgba(0,0,0,0.05); 
    text-align: center; 
    height: 300px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border: 1px solid #eee;
"""

col1, col2, col3 = st.columns(3)

with col1:
    st.markdown(f"""
        <div style="{feat_style}">
            <div style="font-size: 48px; margin-bottom: 15px;">🛡️</div>
            <h4 style="color: #667eea; font-size: 18px; margin-bottom: 10px;">Safety & Resources</h4>
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
                Emergency contacts, legal resources, safety tips, and 24/7 support for women in need.
            </p>
        </div>
    """, unsafe_allow_html=True)
    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown(f"""
        <div style="{feat_style}">
            <div style="font-size: 48px; margin-bottom: 15px;">⚖️</div>
            <h4 style="color: #667eea; font-size: 18px; margin-bottom: 10px;">Legal Rights</h4>
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
                Comprehensive information about women's rights, laws, and access to legal aid.
            </p>
        </div>
    """, unsafe_allow_html=True)

with col2:
    st.markdown(f"""
        <div style="{feat_style}">
            <div style="font-size: 48px; margin-bottom: 15px;">💼</div>
            <h4 style="color: #667eea; font-size: 18px; margin-bottom: 10px;">Career Growth</h4>
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
                Job opportunities, mentorship, salary negotiation tips, and career guidance.
            </p>
        </div>
    """, unsafe_allow_html=True)
    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown(f"""
        <div style="{feat_style}">
            <div style="font-size: 48px; margin-bottom: 15px;">❤️</div>
            <h4 style="color: #667eea; font-size: 18px; margin-bottom: 10px;">Health & Wellness</h4>
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
                Health tracking, wellness resources, mental health support, and medical information.
            </p>
        </div>
    """, unsafe_allow_html=True)

with col3:
    st.markdown(f"""
        <div style="{feat_style}">
            <div style="font-size: 48px; margin-bottom: 15px;">📚</div>
            <h4 style="color: #667eea; font-size: 18px; margin-bottom: 10px;">Education</h4>
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
                Free courses, certifications, skill development resources, and learning paths.
            </p>
        </div>
    """, unsafe_allow_html=True)
    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown(f"""
        <div style="{feat_style}">
            <div style="font-size: 48px; margin-bottom: 15px;">💬</div>
            <h4 style="color: #667eea; font-size: 18px; margin-bottom: 10px;">Community</h4>
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
                Safe space to connect, share experiences, and support each other.
            </p>
        </div>
    """, unsafe_allow_html=True)

st.markdown("<br><br>", unsafe_allow_html=True)

# ==================== OUR IMPACT ====================
st.markdown("## 📊 Our Impact")
st.markdown("<br>", unsafe_allow_html=True)

col1, col2, col3, col4 = st.columns(4)

metric_style = "padding: 25px; border-radius: 15px; text-align: center; color: white; height: 160px; display: flex; flex-direction: column; justify-content: center;"

with col1:
    st.markdown(f"""
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); {metric_style}">
            <h2 style="font-size: 42px; margin: 0; color: white;">50K+</h2>
            <p style="font-size: 14px; margin-top: 5px; opacity: 0.9;">Women Helped</p>
        </div>
    """, unsafe_allow_html=True)

with col2:
    st.markdown(f"""
        <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); {metric_style}">
            <h2 style="font-size: 42px; margin: 0; color: white;">1.2K+</h2>
            <p style="font-size: 14px; margin-top: 5px; opacity: 0.9;">Jobs Posted</p>
        </div>
    """, unsafe_allow_html=True)

with col3:
    st.markdown(f"""
        <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); {metric_style}">
            <h2 style="font-size: 42px; margin: 0; color: white;">500+</h2>
            <p style="font-size: 14px; margin-top: 5px; opacity: 0.9;">Free Courses</p>
        </div>
    """, unsafe_allow_html=True)

with col4:
    st.markdown(f"""
        <div style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); {metric_style}">
            <h2 style="font-size: 42px; margin: 0; color: white;">800+</h2>
            <p style="font-size: 14px; margin-top: 5px; opacity: 0.9;">Active Mentors</p>
        </div>
    """, unsafe_allow_html=True)

st.markdown("<br><br>", unsafe_allow_html=True)

# ==================== TECH STACK ====================
st.markdown("## 🛠️ Built With")
st.markdown("<br>", unsafe_allow_html=True)

st.markdown(f"""
    <div style="{card_style} height: auto; min-height: 250px; align-items: flex-start; text-align: left; padding: 40px;">
        <h3 style="color: #667eea; margin-bottom: 20px;">Technology Stack</h3>
        <p style="color: #666; line-height: 2.0; font-size: 16px; margin-bottom: 20px;">
            <b>Frontend:</b> Streamlit (Python) with custom CSS animations<br>
            <b>Database:</b> PostgreSQL (Neon)<br>
            <b>AI/ML:</b> OpenAI GPT-3.5 for chatbot and recommendations<br>
            <b>Deployment:</b> Streamlit Cloud<br>
            <b>Version Control:</b> Git & GitHub
        </p>
        <p style="color: #666; line-height: 1.8; margin: 0;">
            This platform was built with ❤️ using modern web technologies to ensure 
            a fast, secure, and user-friendly experience for all women.
        </p>
    </div>
""", unsafe_allow_html=True)

st.markdown("<br><br>", unsafe_allow_html=True)

# ==================== GET INVOLVED (CLEANED UP) ====================
st.markdown("## 🤝 Get Involved")
st.markdown("<br>", unsafe_allow_html=True)

action_style = """
    background: white; 
    padding: 25px; 
    border-radius: 15px; 
    border: 1px solid #eee; 
    text-align: center; 
    height: 180px; 
    display: flex; 
    flex-direction: column; 
    justify-content: center;
    margin-bottom: 15px;
"""

col1, col2 = st.columns(2)

with col1:
    st.markdown(f"""
        <div style="{action_style}">
            <h4 style="color: #667eea; font-size: 18px; margin-bottom: 10px;">🎤 Become a Mentor</h4>
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
                Share your expertise and guide other women in their career journey.
            </p>
        </div>
    """, unsafe_allow_html=True)
    if st.button("Apply to Mentor", use_container_width=True):
        st.switch_page("pages/mentorship.py")

with col2:
    st.markdown(f"""
        <div style="{action_style}">
            <h4 style="color: #667eea; font-size: 18px; margin-bottom: 10px;">✍️ Share Your Story</h4>
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
                Inspire others by sharing your success story and journey.
            </p>
        </div>
    """, unsafe_allow_html=True)
    if st.button("Share Story", use_container_width=True):
        st.switch_page("pages/success_stories.py")

st.markdown("<br><br>", unsafe_allow_html=True)

# ==================== FEEDBACK FORM ====================
st.markdown("## 💬 Send Us Feedback")

with st.expander("📝 We'd love to hear from you!", expanded=True):
    with st.form("feedback_form"):
        col1, col2 = st.columns(2)
        with col1:
            feedback_name = st.text_input("Your Name (Optional)")
        with col2:
            feedback_email = st.text_input("Your Email (Optional)")
            
        feedback_type = st.selectbox("Feedback Type", ["Suggestion", "Bug Report", "Feature Request", "General Feedback", "Compliment"])
        feedback_message = st.text_area("Your Message", height=150)
        
        submitted = st.form_submit_button("📤 Send Feedback", use_container_width=True)
        
        if submitted:
            if feedback_message:
                st.success("✅ Thank you for your feedback! We'll review it and get back to you soon.")
                st.balloons()
            else:
                st.error("Please write your feedback message")

st.markdown("<br><br>", unsafe_allow_html=True)

# ==================== FOOTER ====================
st.markdown("---")
st.markdown("""
    <div style="text-align: center; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                border-radius: 15px; color: white; margin-top: 40px;">
        <h2 style="color: white; margin-bottom: 15px;">💜 Thank You for Being Part of Our Community</h2>
        <p style="font-size: 18px; margin-bottom: 25px; opacity: 0.9;">
            Together, we're creating a world where every woman can thrive
        </p>
        <p style="font-size: 14px; opacity: 0.8;">
            Made with ❤️ for Women Empowerment | © 2025 Women Empowerment Hub | All Rights Reserved
        </p>
    </div>
""", unsafe_allow_html=True)
