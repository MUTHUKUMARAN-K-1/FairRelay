import streamlit as st
import sys
from pathlib import Path
from streamlit_mic_recorder import speech_to_text

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent))

from utils.database import get_legal_rights
from utils.helpers import chatbot_response
from utils.css_loader import load_css

# Load CSS
load_css()

# ==================== HERO SECTION ====================
st.markdown("""
    <div class="hero-section">
        <h1 class="hero-title">⚖️ Legal Rights & Workplace Laws</h1>
        <p class="hero-subtitle">
            Know your rights, stand up for equality, and access legal resources
        </p>
    </div>
""", unsafe_allow_html=True)

# ==================== LEGAL CATEGORIES ====================
# ==================== LEGAL CATEGORIES (REVAMPED UI) ====================
st.markdown("## 📚 Women's Legal Rights in India")

# Custom CSS for styling tabs
st.markdown("""
<style>
    .stTabs [data-baseweb="tab-list"] { gap: 10px; }
    .stTabs [data-baseweb="tab"] {
        height: 50px;
        white-space: pre-wrap;
        border-radius: 4px 4px 0px 0px;
        font-weight: 600;
    }
</style>
""", unsafe_allow_html=True)

tab1, tab2, tab3, tab4, tab5 = st.tabs([
    "⚖️ Constitutional", 
    "💼 Workplace", 
    "👨‍👩‍👧 Family", 
    "🛡️ Protection",
    "🏛️ Property"
])

def legal_card(icon, title, desc, color="#e0f2fe", border="#0284c7"):
    st.markdown(f"""
        <div style="
            background-color: {color}; 
            border-left: 5px solid {border}; 
            padding: 15px; 
            border-radius: 8px; 
            margin-bottom: 15px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        ">
            <h4 style="margin: 0; color: #333; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 24px;">{icon}</span> {title}
            </h4>
            <p style="margin: 8px 0 0 0; color: #555; line-height: 1.5;">{desc}</p>
        </div>
    """, unsafe_allow_html=True)

with tab1:
    col_a, col_b = st.columns(2)
    with col_a:
        legal_card("📜", "Article 14: Equality", "The State guarantees equality before the law. You have equal status with men in all legal matters.")
        legal_card("🚫", "Article 15: No Discrimination", "Discrimination on grounds of religion, race, caste, sex, or place of birth is strictly prohibited.")
    with col_b:
        legal_card("👔", "Article 16: Employment", "Equal opportunity in public employment. No citizen can be discriminated against based on gender.")
        legal_card("🗣️", "Article 19: Freedom", "Right to freedom of speech, expression, and to practice any profession anywhere in India.")

with tab2:
    col_a, col_b = st.columns(2)
    with col_a:
        legal_card("🚫", "POSH Act 2013", "Protection against sexual harassment. Organizations with 10+ employees MUST have an Internal Complaints Committee (ICC).", "#fdf2f8", "#db2777")
        legal_card("💰", "Equal Pay Act", "Prohibits gender discrimination in wages. Equal pay for equal work is your legal right.", "#fdf2f8", "#db2777")
    with col_b:
        legal_card("🤰", "Maternity Benefit", "26 weeks of paid leave. Firing an employee during pregnancy or maternity leave is illegal.", "#fdf2f8", "#db2777")
        legal_card("🌙", "Night Shifts", "Women cannot be forced to work night shifts (7 PM - 6 AM) without safety measures and consent.", "#fdf2f8", "#db2777")

with tab3:
    st.info("💡 Marriage age for women is now legal at 21 years.")
    col_a, col_b = st.columns(2)
    with col_a:
        legal_card("💍", "Marriage Rights", "Marriage must be with full consent. Child marriage is illegal and voidable by law.", "#fff7ed", "#ea580c")
        legal_card("💔", "Divorce Rights", "You have the right to seek divorce on grounds like cruelty, desertion, or adultery.", "#fff7ed", "#ea580c")
    with col_b:
        legal_card("💵", "Maintenance", "Right to claim financial maintenance from husband during and after divorce (Section 125 CrPC).", "#fff7ed", "#ea580c")
        legal_card("👶", "Child Custody", "In custody battles, the child's welfare is paramount. Mothers often get custody of children under 5.", "#fff7ed", "#ea580c")

with tab4:
    col_a, col_b = st.columns(2)
    with col_a:
        legal_card("🏠", "Domestic Violence Act", "Covers physical, verbal, emotional, and economic abuse. Ensures your right to reside in the shared household.", "#fef2f2", "#dc2626")
        legal_card("⛔", "Dowry Prohibition", "Giving or taking dowry is a crime punishable by up to 5 years in prison.", "#fef2f2", "#dc2626")
    with col_b:
        legal_card("🔗", "Section 498A IPC", "Protects against cruelty and harassment by husband or his relatives. It is a non-bailable offense.", "#fef2f2", "#dc2626")
        legal_card("📞", "Cyber Stalking", "Online harassment, stalking, or sharing private photos without consent is a punishable cyber crime.", "#fef2f2", "#dc2626")

with tab5:
    col_a, col_b = st.columns(2)
    with col_a:
        legal_card("🏡", "Hindu Succession Act", "Daughters have equal rights as sons in ancestral property (since 2005 amendment).", "#f0fdf4", "#16a34a")
    with col_b:
        legal_card("📝", "Will & Testament", "Women have full rights to dispose of their self-acquired property/earnings to anyone via a Will.", "#f0fdf4", "#16a34a")


st.markdown("<br>", unsafe_allow_html=True)


# ==================== FEATURE 1: AI DOCUMENT SIMPLIFIER ====================
st.markdown("## 📄 AI Legal Document Simplifier")

# Create a clean card layout
with st.container(border=True):
    col_upload, col_action = st.columns([2, 1])
    
    with col_upload:
        st.markdown("### 📤 Upload Document")
        st.markdown("<p style='font-size: 14px; color: #666; margin-bottom: 10px;'>Upload an employment contract, rental agreement, or legal notice (PDF/TXT) to get a simple summary.</p>", unsafe_allow_html=True)
        uploaded_file = st.file_uploader("Choose a file", type=['txt', 'pdf'], label_visibility="collapsed")

    with col_action:
        st.write("") 
        st.write("") 
        st.write("") 
        
        # --- CSS TO FORCE WHITE TEXT ---
   
                # --- CSS TO FORCE WHITE TEXT ON DISABLED BUTTONS ---
        st.markdown("""
            <style>
            /* Force white text on disabled buttons */
            div.stButton > button:disabled {
                color: #ffffff !important;
                opacity: 0.7 !important; /* Optional: Makes it look slightly faded but readable */
            }
            div.stButton > button:disabled * {
                color: #ffffff !important;
            }
            </style>
        """, unsafe_allow_html=True)


        
        if uploaded_file:
            analyze_btn = st.button("✨ Simplify Now", use_container_width=True, type="primary")
        else:
            st.button("✨ Simplify Now", disabled=True, use_container_width=True)

    # Result Section
    if uploaded_file and 'analyze_btn' in locals() and analyze_btn:
        st.divider() 
        
        with st.spinner("🔍 AI is analyzing the legal text..."):
            doc_name = uploaded_file.name
            prompt = f"""
            Summarize this legal document: '{doc_name}'.
            Translate complex legal jargon into simple English.
            Highlight any "Red Flags" or unfair clauses.
            """
            summary = chatbot_response(prompt, context="Legal Expert")
            
            st.markdown(f"""
                <div style="background-color: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 8px; padding: 20px;">
                    <h4 style="color: #db2777; margin-top: 0; display: flex; align-items: center;">
                        📑 Document Analysis: {doc_name}
                    </h4>
                    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #db2777; margin-top: 10px;">
                        <p style="color: #444; line-height: 1.6; white-space: pre-line;">{summary}</p>
                    </div>
                </div>
            """, unsafe_allow_html=True)



st.markdown("<br>", unsafe_allow_html=True)

#
# ==================== FEATURE 2: REAL-TIME VOICE ASSISTANT ====================
st.markdown("## 🎙️ Voice-Enabled Legal Assistant")

with st.container(border=True):
    col_voice_1, col_voice_2 = st.columns([1, 3])

    with col_voice_1:
        st.write("") # Spacer
        st.markdown("**Tap to Speak:**")
        
        # 🎤 REAL MICROPHONE INPUT
        # This button records audio and converts it to text immediately
        text_output = speech_to_text(
            language='en', 
            start_prompt="🎤 Start", 
            stop_prompt="🛑 Stop", 
            just_once=True,
            use_container_width=True
        )

    with col_voice_2:
        # If voice input is detected, use it. Otherwise, allow typing.
        user_query = st.text_input(
            "Your Question:", 
            placeholder="Recording will appear here...", 
            value=text_output if text_output else ""
        )
        
        if user_query:
            with st.spinner("🤖 AI is processing your legal query..."):
                # Call your existing chatbot function
                response = chatbot_response(user_query, context="Indian Legal Rights")
                
                st.markdown(f"""
                    <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 4px; margin-top: 10px;">
                        <p style="margin: 0; font-weight: 500; color: #1e293b;">⚖️ AI Advice:</p>
                        <p style="margin-top: 5px; color: #475569; line-height: 1.6;">{response}</p>
                    </div>
                """, unsafe_allow_html=True)


st.markdown("<br>", unsafe_allow_html=True)

# ==================== QUICK LEGAL HELP ====================
st.markdown("## 🆘 Quick Legal Help")

col1, col2 = st.columns(2)

with col1:
    st.markdown("""
        <div class="warning-box">
            <h3>📞 Legal Helplines</h3>
            <ul style="line-height: 2.0;">
                <li><b>National Commission for Women:</b> 011-26942369</li>
                <li><b>Legal Aid:</b> 1800-180-1111</li>
                <li><b>Women Helpline:</b> 1091</li>
                <li><b>Domestic Violence:</b> 181</li>
            </ul>
        </div>
    """, unsafe_allow_html=True)

with col2:
    st.markdown("""
        <div class="info-box">
            <h3>🏛️ File a Complaint</h3>
            <ul style="line-height: 2.0;">
                <li>Police Station (FIR)</li>
                <li>National Commission for Women</li>
                <li>State Women's Commission</li>
                <li>Internal Complaints Committee (workplace)</li>
            </ul>
        </div>
    """, unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)

# ==================== FIND LEGAL AID ====================
st.markdown("## 👩‍⚖️ Find Legal Aid")

with st.expander("🔍 Search for Legal Aid Providers"):
    col_la_1, col_la_2 = st.columns(2)
    with col_la_1:
        city = st.selectbox("Select City", ["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Chennai", "Kolkata", "Pune"])
    with col_la_2:
        legal_issue = st.selectbox("Type of Issue", ["Domestic Violence", "Workplace Harassment", "Property Rights", "Divorce", "Other"])
    
    if st.button("🔍 Find Legal Aid", use_container_width=True):
        st.markdown(f"""
            <div class="feature-card">
                <h4>Legal Aid in {city} for {legal_issue}:</h4>
                <ul style="line-height: 2.0; color: #666;">
                    <li><b>District Legal Services Authority</b> - Free legal aid</li>
                    <li><b>State Women's Commission</b> - Women's rights support</li>
                    <li><b>NGOs:</b> Majlis, Human Rights Law Network</li>
                    <li><b>Free Legal Clinics</b> - Weekly consultation services</li>
                </ul>
            </div>
        """, unsafe_allow_html=True)
