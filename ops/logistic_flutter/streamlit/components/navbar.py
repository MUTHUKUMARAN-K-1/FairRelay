"""
Navigation Bar Components
"""

import streamlit as st

def custom_navbar():
    """Display a custom navigation bar at the top"""
    st.markdown("""
        <style>
        .custom-navbar {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 15px 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: white;
        }
        .navbar-brand {
            font-size: 24px;
            font-weight: 700;
            color: white;
        }
        .navbar-links {
            display: flex;
            gap: 20px;
        }
        .navbar-link {
            color: white;
            text-decoration: none;
            font-weight: 500;
            opacity: 0.9;
            transition: opacity 0.3s;
        }
        .navbar-link:hover {
            opacity: 1;
        }
        </style>
        
        <div class="custom-navbar">
            <div class="navbar-brand">💜 Women Empowerment Hub</div>
            <div class="navbar-links">
                <a href="#" class="navbar-link">Home</a>
                <a href="#" class="navbar-link">About</a>
                <a href="#" class="navbar-link">Resources</a>
                <a href="#" class="navbar-link">Contact</a>
            </div>
        </div>
    """, unsafe_allow_html=True)

def sidebar_menu():
    """Enhanced sidebar menu with categories"""
    st.sidebar.markdown("""
        <div style='text-align: center; padding: 20px 0;'>
            <h1 style='color: #667eea; margin: 0; font-size: 48px;'>💜</h1>
            <h2 style='color: #667eea; font-size: 24px; margin: 10px 0;'>Women Empowerment Hub</h2>
            <p style='color: #666; font-size: 14px;'>Empowering women, transforming lives</p>
        </div>
        <hr style='margin: 20px 0; border: 1px solid #eee;'>
    """, unsafe_allow_html=True)
    
    st.sidebar.info("👈 Navigate through sections")
    
    # Quick links
    st.sidebar.markdown("### 🔗 Quick Links")
    
    if st.sidebar.button("🆘 Emergency Help", use_container_width=True):
        st.switch_page("pages/02_🛡️_safety.py")
    
    if st.sidebar.button("💼 Find Jobs", use_container_width=True):
        st.switch_page("pages/03_💼_jobs.py")
    
    if st.sidebar.button("📚 Browse Courses", use_container_width=True):
        st.switch_page("pages/04_📚_education.py")
