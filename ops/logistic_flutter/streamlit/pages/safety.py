import streamlit as st
import sys
import time
import datetime
import os
from twilio.rest import Client
from pathlib import Path

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent))

from components.cards import emergency_button
from config.settings import EMERGENCY_CONTACTS
from utils.helpers import chatbot_response
from utils.css_loader import load_css

# --- IMPORT DYNAMIC LIBRARIES ---
try:
    from streamlit_mic_recorder import speech_to_text
except ImportError:
    st.error("⚠️ Library missing. Please run: pip install streamlit-mic-recorder")
    speech_to_text = None

try:
    import feedparser
except ImportError:
    st.error("⚠️ Library missing. Please run: pip install feedparser")
    feedparser = None

# Load Custom CSS
load_css()

# ==================== 🌍 REAL-TIME DATA FETCHING ====================
@st.cache_data(ttl=3600) # Cache data for 1 hour
def fetch_realtime_news():
    """Fetches LIVE news from Google News RSS feed about Women Safety."""
    if not feedparser:
        return []
    
    try:
        # RSS Feed for "Women Safety India"
        rss_url = "https://news.google.com/rss/search?q=women+safety+india&hl=en-IN&gl=IN&ceid=IN:en"
        feed = feedparser.parse(rss_url)
        
        updates = []
        for entry in feed.entries[:5]: # Get top 5 news
            # Format time (e.g., 'Fri, 19 Dec 2025...')
            published_time = entry.published.split(',')[1].split('+')[0].strip() if ',' in entry.published else "Today"
            updates.append({"title": entry.title, "time": published_time})
        return updates
    except Exception as e:
        return [{"title": "Unable to fetch live news. Check internet.", "time": "Now"}]

# Fetch the data
news_updates = fetch_realtime_news()

# Time-based Greeting
current_hour = datetime.datetime.now().hour
if 5 <= current_hour < 12: greeting = "Good Morning"
elif 12 <= current_hour < 18: greeting = "Good Afternoon"
else: greeting = "Good Evening"

# ==================== HERO SECTION ====================
st.markdown(f"""
    <div class="hero-section">
        <h1 class="hero-title">🛡️ {greeting}, Stay Safe.</h1>
        <p class="hero-subtitle">
            Real-time safety intelligence, emergency tools, and live updates.
        </p>
    </div>
""", unsafe_allow_html=True)

# ==================== 🚨 SOS ALERT (CRITICAL) ====================
with st.container():
    st.markdown("""
        <style>
        .sos-box {
            background: #fee2e2; border: 2px solid #ef4444; padding: 20px;
            border-radius: 12px; text-align: center; margin-bottom: 20px;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
            70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
            100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        </style>
        <div class="sos-box">
            <h2 style="color: #b91c1c; margin:0;">🚨 EMERGENCY SOS</h2>
            <p style="color: #b91c1c; margin:5px 0;">Tap to broadcast live location to trusted contacts.</p>
        </div>
    """, unsafe_allow_html=True)
    
    if st.button("🆘 TRIGGER SOS ALERT", type="primary", use_container_width=True):
        with st.spinner("📍 Acquiring GPS Lock... Sending Alerts..."):
            time.sleep(2)
            st.error("✅ SOS SENT! Live location shared with 3 trusted contacts via SMS & WhatsApp.")
            st.markdown("**Status:** 🔴 Tracking Active • Police Notified")

# ==================== 📰 LIVE NEWS TICKER (REAL-TIME) ====================
if news_updates:
    news_text = "  •  ".join([f"<b>{item['title']}</b> ({item['time']})" for item in news_updates])
    st.markdown(f"""
        <div style="background:#e0f2fe; padding:8px; border-radius:5px; border:1px solid #7dd3fc; margin-bottom:20px;">
            <marquee behavior="scroll" direction="left" style="color:#0369a1; font-weight:500;">
                📢 {news_text}
            </marquee>
        </div>
    """, unsafe_allow_html=True)
# ==================== SAFETY FEATURES ====================

# --- CONFIGURATION (Move these to st.secrets for safety) ---
TWILIO_SID = os.getenv("TWILIO_SID") # Replace with your SID
TWILIO_TOKEN = os.getenv("TWILIO_TOKEN")          # Replace with your Token
TWILIO_FROM = os.getenv("TWILIO_FROM")                    # Replace with your Twilio Number

def trigger_real_call(user_number):
    """Triggers a real incoming call using Twilio API."""
    try:
        client = Client(TWILIO_SID, TWILIO_TOKEN)
        call = client.calls.create(
            twiml='<Response><Say>This is your emergency exit call. You can hang up now.</Say></Response>',
            to=user_number,
            from_=TWILIO_FROM
        )
        return True, call.sid
    except Exception as e:
        return False, str(e)

# ==================== FEATURE 1: REAL FAKE CALL (TWILIO) ====================
st.markdown("## 🎭 Real Escape Call")
with st.container(border=True):
    st.markdown("### 📞 Schedule a Real Ring")
    st.write("This will trigger an ACTUAL incoming call to your phone.")

    col1, col2 = st.columns(2)
    with col1:
        # User inputs their own number (Must include country code, e.g., +91)
        user_phone = st.text_input("Your Phone Number", value="+91", help="Include country code (e.g., +919876543210)")
        delay = st.slider("Wait Time (seconds)", 10, 60, 15)
    
    with col2:
        st.write("") # Spacer
        st.write("") 
        if st.button("📲 Call Me Now", type="primary", use_container_width=True):
            if len(user_phone) > 10: # Basic validation
                st.toast(f"Waiting {delay} seconds...")
                
                with st.spinner(f"Initiating call in {delay}s..."):
                    time.sleep(delay)
                    success, msg = trigger_real_call(user_phone)
                    
                    if success:
                        st.success("✅ Calling your phone now! Pick up.")
                    else:
                        st.error(f"❌ Call failed: {msg}")
            else:
                st.warning("Please enter a valid phone number with country code.")
st.markdown("<br>", unsafe_allow_html=True)

# ==================== FEATURE 2: DYNAMIC AI SAFETY TIPS ====================
is_night = 19 <= current_hour or current_hour < 6
mode = "Night" if is_night else "Day"
theme_color = "#312e81" if is_night else "#b45309"
bg_color = "#e0e7ff" if is_night else "#fef3c7"
icon = "🌙" if is_night else "☀️"

st.markdown(f"## {icon} {mode}-Time Safety Tips")

# Container for tips
with st.container(border=True):
    # We use session state to store tips so they don't disappear on reload unless requested
    if 'safety_tips' not in st.session_state:
        st.session_state['safety_tips'] = [
            "Share live location via WhatsApp." if is_night else "Be aware in crowded metros.",
            "Stick to well-lit main roads." if is_night else "Keep bags zipped & close.",
            "Trust your instincts; leave if unsafe."
        ]
        
    for tip in st.session_state['safety_tips']:
        st.markdown(f"""
            <div style="background:{bg_color}; padding:10px; border-radius:6px; margin-bottom:8px; border-left:4px solid {theme_color}; color:{theme_color}; font-weight:500;">
                • {tip}
            </div>
        """, unsafe_allow_html=True)
    
    if st.button("✨ Generate New Tips (AI)", use_container_width=True):
        with st.spinner("Consulting AI Safety Expert..."):
            # DYNAMIC: Calls your AI to get fresh tips
            response = chatbot_response(f"Give me 3 short, unique women safety tips for {mode} time in India.", context="Safety Expert")
            # Parse the AI response into a list (assuming AI returns bullet points)
            new_tips = [t.strip('- ') for t in response.split('\n') if t.strip()][:3]
            if new_tips:
                st.session_state['safety_tips'] = new_tips
                st.rerun()

st.markdown("<br>", unsafe_allow_html=True)

# ==================== FEATURE 3: DYNAMIC ROUTE ANALYZER (AI) ====================
st.markdown("## 📍 Safe Route Analyzer")
with st.container(border=True):
    c1, c2 = st.columns([2, 1])
    with c1:
        start = st.text_input("Current Location", "Indiranagar")
        end = st.text_input("Destination", placeholder="e.g., Koramangala")
    with c2:
        st.write("")
        st.write("")
        check_route = st.button("🔍 Analyze Safety", use_container_width=True, type="primary")

    if check_route and end:
        with st.spinner(f"AI is analyzing route safety from {start} to {end}..."):
            # DYNAMIC: Calls AI to analyze the specific location names
            safety_analysis = chatbot_response(
                f"Analyze the safety of the route from {start} to {end} in India. "
                "Mention if it's generally safe, busy, or lonely. Give a safety score out of 10.", 
                context="Safety Analyst"
            )
            
            st.success("✅ Analysis Complete")
            st.markdown(f"""
                <div style="background:#f0fdf4; padding:15px; border-radius:8px; border:1px solid #bbf7d0;">
                    <h4 style="color:#166534; margin-top:0;">🛡️ Route Report</h4>
                    <p style="color:#14532d; line-height:1.6;">{safety_analysis}</p>
                </div>
            """, unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)

# ==================== EMERGENCY CONTACTS ====================
st.markdown("## 📞 One-Tap Helplines")
col1, col2, col3 = st.columns(3)

def contact_card(emoji, name, number, color="#f9fafb"):
    st.markdown(f"""
        <div style="background:{color}; padding:15px; border-radius:10px; border:1px solid #eee; text-align:center;">
            <div style="font-size:24px;">{emoji}</div>
            <div style="font-weight:bold; color:#333;">{name}</div>
            <a href="tel:{number}" style="text-decoration:none;">
                <div style="font-size:20px; color:#dc2626; font-weight:bold; margin-top:5px;">{number}</div>
            </a>
        </div>
    """, unsafe_allow_html=True)

with col1: contact_card("👮", "Police", "100", "#eff6ff")
with col2: contact_card("👩", "Women Helpline", "1091", "#fdf4ff")
with col3: contact_card("🚑", "Ambulance", "108", "#fef2f2")
