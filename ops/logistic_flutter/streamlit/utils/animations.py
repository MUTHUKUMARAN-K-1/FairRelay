"""
Animation Utility Functions
"""

import streamlit as st
import time

def fade_in(element_html, duration=0.5):
    """
    Apply fade-in animation to HTML element
    
    Args:
        element_html: HTML string to animate
        duration: Animation duration in seconds
    """
    st.markdown(f"""
        <style>
        @keyframes fadeIn {{
            from {{ opacity: 0; }}
            to {{ opacity: 1; }}
        }}
        .fade-in-element {{
            animation: fadeIn {duration}s ease-in;
        }}
        </style>
        <div class="fade-in-element">
            {element_html}
        </div>
    """, unsafe_allow_html=True)

def slide_in(element_html, direction="left", duration=0.5):
    """
    Apply slide-in animation to HTML element
    
    Args:
        element_html: HTML string to animate
        direction: 'left', 'right', 'up', or 'down'
        duration: Animation duration in seconds
    """
    transforms = {
        "left": "translateX(-100%)",
        "right": "translateX(100%)",
        "up": "translateY(-100%)",
        "down": "translateY(100%)"
    }
    
    start_transform = transforms.get(direction, "translateX(-100%)")
    
    st.markdown(f"""
        <style>
        @keyframes slideIn {{
            from {{ 
                transform: {start_transform}; 
                opacity: 0; 
            }}
            to {{ 
                transform: translate(0); 
                opacity: 1; 
            }}
        }}
        .slide-in-element {{
            animation: slideIn {duration}s ease-out;
        }}
        </style>
        <div class="slide-in-element">
            {element_html}
        </div>
    """, unsafe_allow_html=True)

def pulse_animation(element_html, duration=1.5):
    """
    Apply pulse animation to HTML element
    
    Args:
        element_html: HTML string to animate
        duration: Animation duration in seconds
    """
    st.markdown(f"""
        <style>
        @keyframes pulse {{
            0%, 100% {{ transform: scale(1); }}
            50% {{ transform: scale(1.05); }}
        }}
        .pulse-element {{
            animation: pulse {duration}s ease-in-out infinite;
        }}
        </style>
        <div class="pulse-element">
            {element_html}
        </div>
    """, unsafe_allow_html=True)

def typing_effect(text, delay=0.05):
    """
    Display text with typing effect (simulated)
    
    Args:
        text: Text to display
        delay: Delay between characters in seconds
    """
    placeholder = st.empty()
    displayed_text = ""
    
    for char in text:
        displayed_text += char
        placeholder.markdown(f"**{displayed_text}▌**")
        time.sleep(delay)
    
    placeholder.markdown(f"**{displayed_text}**")

def loading_spinner(message="Loading..."):
    """
    Display a custom loading spinner
    
    Args:
        message: Loading message to display
    """
    st.markdown(f"""
        <div style="text-align: center; padding: 40px;">
            <div class="spinner"></div>
            <p style="color: #667eea; margin-top: 20px;">{message}</p>
        </div>
        <style>
        .spinner {{
            border: 4px solid #f0f2f6;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }}
        @keyframes spin {{
            0% {{ transform: rotate(0deg); }}
            100% {{ transform: rotate(360deg); }}
        }}
        </style>
    """, unsafe_allow_html=True)

def gradient_text(text, gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"):
    """
    Display text with gradient color
    
    Args:
        text: Text to display
        gradient: CSS gradient string
    """
    st.markdown(f"""
        <h2 style="background: {gradient}; 
                   -webkit-background-clip: text; 
                   -webkit-text-fill-color: transparent;
                   font-weight: 700;
                   margin: 20px 0;">
            {text}
        </h2>
    """, unsafe_allow_html=True)

def confetti_animation():
    """Display confetti animation"""
    st.balloons()
    
def snow_animation():
    """Display snow animation"""
    st.snow()
