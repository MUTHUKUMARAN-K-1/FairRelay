import streamlit as st
from pathlib import Path

def load_css():
    """Load all CSS files and inject into Streamlit app"""
    
    # Main CSS with animations
    main_css = """
    <style>
    /* Import Google Fonts */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    
    /* Global Styles */
    * {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    
    /* --- FIX: Do NOT hide header completely, or you lose the sidebar toggle --- */
    /* Hide only specific Streamlit branding elements */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    
    /* Ensure header background is transparent/clean if visible */
    header[data-testid="stHeader"] {
        background: transparent;
    }

    /* Smooth scrolling */
    html {
        scroll-behavior: smooth;
    }
    
    /* ==================== FEATURE CARDS ==================== */
    .feature-card {
        background: #ffffff;
        padding: 35px 25px;
        border-radius: 18px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        transition: all 0.3s ease;
        border: 1px solid #f0f0f0;
        margin: 16px 0;
        min-height: 340px;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        text-align: center;
    }
    
    .feature-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 12px 28px rgba(102, 126, 234, 0.15);
        border-color: #667eea;
    }
    
    .feature-card h3 {
        color: #667eea !important;
        font-weight: 700;
        font-size: 20px;
        line-height: 1.3;
        margin: 15px 0;
    }
    
    .feature-card p {
        color: #555 !important;
        line-height: 1.7;
        font-size: 15px;
        margin: 0;
    }
    
    /* ==================== TESTIMONIAL CARDS ==================== */
    .testimonial-card {
        background: #f8f9fa;
        padding: 30px;
        border-radius: 20px;
        text-align: center;
        min-height: 280px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        border-left: 5px solid #667eea;
        transition: all 0.3s ease;
        margin: 10px 0;
    }
    
    .testimonial-card:hover {
        background: white;
        box-shadow: 0 8px 20px rgba(0,0,0,0.08);
        transform: translateY(-5px);
    }

    /* ==================== SIDEBAR STYLING ==================== */
    [data-testid="stSidebar"] {
        background: linear-gradient(180deg, #667eea 0%, #764ba2 100%) !important;
    }
    
    /* Sidebar Text Color Fix */
    [data-testid="stSidebar"] * {
        color: white !important; 
    }
    
    /* Navigation Links */
    [data-testid="stSidebarNav"] a {
        color: white !important;
        background: rgba(255, 255, 255, 0.1) !important;
        border-radius: 10px !important;
        padding: 10px 15px !important;
        transition: all 0.2s ease !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        margin-bottom: 5px !important;
    }
    
    [data-testid="stSidebarNav"] a:hover {
        background: rgba(255, 255, 255, 0.2) !important;
        transform: translateX(5px) !important;
    }
    
    /* Active Link Styling */
    [data-testid="stSidebarNav"] a[aria-current="page"] {
        background: white !important;
        color: #667eea !important;
        font-weight: 600 !important;
        box-shadow: 0 4px 10px rgba(0,0,0,0.2) !important;
    }
    
    /* Active Link Text Color Override */
    [data-testid="stSidebarNav"] a[aria-current="page"] span {
        color: #667eea !important;
    }
    
    /* Sidebar Headers */
    [data-testid="stSidebar"] h1, [data-testid="stSidebar"] h2, [data-testid="stSidebar"] h3 {
        color: white !important;
    }
    
    /* Sidebar Toggle Button (The arrow >) */
    button[kind="header"] {
        background: transparent !important;
        color: #333 !important; /* Make toggle visible on white bg */
    }
    
    /* ==================== ANIMATIONS ==================== */
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes slideInLeft {
        from { opacity: 0; transform: translateX(-50px); }
        to { opacity: 1; transform: translateX(0); }
    }
    
    @keyframes slideInRight {
        from { opacity: 0; transform: translateX(50px); }
        to { opacity: 1; transform: translateX(0); }
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
    
    /* ==================== HERO SECTION ==================== */
    .hero-section {
        animation: fadeIn 1s ease-out;
        padding: 60px 20px;
        text-align: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 20px;
        margin-bottom: 40px;
        box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
    }
    
    .hero-title {
        font-size: 42px;
        font-weight: 800;
        margin-bottom: 20px;
        animation: slideInLeft 0.8s ease-out;
    }
    
    .hero-subtitle {
        font-size: 18px;
        font-weight: 400;
        opacity: 0.95;
        animation: slideInRight 0.8s ease-out;
    }
    
    /* ==================== BUTTONS ==================== */
    .stButton > button {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 12px;
        padding: 12px 30px;
        font-weight: 600;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        width: 100%;
    }
    
    .stButton > button:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
    }
    
    /* Primary (Red/Pink) Buttons */
    .stButton > button[kind="primary"] {
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
        box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
    }
    
    /* ==================== INFO BOXES ==================== */
    .info-box { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 15px; color: white; margin: 20px 0; animation: fadeIn 0.8s ease-out; }
    .success-box { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 20px; border-radius: 15px; color: white; margin: 20px 0; animation: fadeIn 0.8s ease-out; }
    .warning-box { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 20px; border-radius: 15px; color: white; margin: 20px 0; animation: fadeIn 0.8s ease-out; }
    
    /* ==================== INPUTS ==================== */
    .stTextInput > div > div > input, .stTextArea > div > div > textarea, .stSelectbox > div > div > select {
        border-radius: 10px; border: 2px solid #e0e0e0; padding: 10px 15px; transition: all 0.3s ease;
    }
    
    .stTextInput > div > div > input:focus, .stTextArea > div > div > textarea:focus {
        border-color: #667eea; box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
    }
    
    /* ==================== RESPONSIVE ==================== */
    @media (max-width: 768px) {
        .hero-title { font-size: 32px; }
        .hero-subtitle { font-size: 16px; }
        .feature-card { padding: 20px; min-height: auto; }
    }
    </style>
    """
    
    st.markdown(main_css, unsafe_allow_html=True)
