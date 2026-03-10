import streamlit as st
from datetime import datetime, timedelta
import os
import time
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def format_date(date_obj):
    """Format datetime object to readable string"""
    if isinstance(date_obj, str):
        return date_obj
    return date_obj.strftime("%B %d, %Y")

def time_ago(date_obj):
    """Convert datetime to 'time ago' format"""
    if not date_obj:
        return ""
        
    now = datetime.now()
    # Ensure dt is offset-naive if now is offset-naive
    if date_obj.tzinfo is None and now.tzinfo is None:
        pass # Both naive, do nothing
    elif date_obj.tzinfo and now.tzinfo:
        pass # Both aware, do nothing
    else:
        # Mix of naive and aware - remove tz info for simplicity
        date_obj = date_obj.replace(tzinfo=None)
        now = now.replace(tzinfo=None)
        
    diff = now - date_obj
    
    if diff.days > 365:
        return f"{diff.days // 365} year{'s' if diff.days // 365 > 1 else ''} ago"
    elif diff.days > 30:
        return f"{diff.days // 30} month{'s' if diff.days // 30 > 1 else ''} ago"
    elif diff.days > 0:
        return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
    elif diff.seconds > 3600:
        return f"{diff.seconds // 3600} hour{'s' if diff.seconds // 3600 > 1 else ''} ago"
    elif diff.seconds > 60:
        return f"{diff.seconds // 60} minute{'s' if diff.seconds // 60 > 1 else ''} ago"
    else:
        return "Just now"

def validate_email(email):
    """Validate email format"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_phone(phone):
    """Validate phone number format"""
    import re
    pattern = r'^[\d\s\+\-\(\)]{10,}$'
    return re.match(pattern, phone) is not None

def show_success_message(message, duration=3):
    """Display success message with animation"""
    placeholder = st.empty()
    placeholder.markdown(f"""
        <div class="success-box">
            <h3>✅ Success!</h3>
            <p>{message}</p>
        </div>
    """, unsafe_allow_html=True)
    time.sleep(duration)
    placeholder.empty()

def show_error_message(message):
    """Display error message with animation"""
    st.markdown(f"""
        <div class="warning-box">
            <h3>⚠️ Error</h3>
            <p>{message}</p>
        </div>
    """, unsafe_allow_html=True)

def show_info_message(message):
    """Display info message with animation"""
    st.markdown(f"""
        <div class="info-box">
            <h3>ℹ️ Info</h3>
            <p>{message}</p>
        </div>
    """, unsafe_allow_html=True)

def chatbot_response(user_message, context="women empowerment"):
    """Get AI-powered chatbot response with Fallback for Demo Mode"""
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": f"You are a helpful assistant for a women empowerment platform. Context: {context}"
                },
                {
                    "role": "user",
                    "content": user_message
                }
            ],
            max_tokens=300,
            temperature=0.7
        )
        return response.choices[0].message.content
    except Exception as e:
        # FALLBACK RESPONSE FOR DEMO (Handles Quota Exceeded / Network Issues)
        error_str = str(e).lower()
        if 'insufficient_quota' in error_str or '429' in error_str:
            return (
                "💡 **Demo Mode Response:** \n\n"
                "It seems the AI service is currently busy (Quota Exceeded). Here is some general advice:\n\n"
                "**Health:** Focus on a balanced diet rich in iron (spinach, lentils) and calcium. Stay hydrated and aim for 30 mins of exercise daily.\n"
                "**Career:** Upskill regularly, network with peers, and don't hesitate to negotiate for your worth.\n\n"
                "*(Please check your OpenAI billing to enable real-time AI responses)*"
            )
        return f"I'm having trouble connecting right now. Please try again later. Error: {str(e)}"

def generate_job_recommendation(user_skills, user_experience):
    """Generate personalized job recommendations with Fallback"""
    try:
        prompt = f"Suggest 3 jobs for Skills: {user_skills}, Exp: {user_experience}"
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200
        )
        return response.choices[0].message.content
    except Exception:
        return (
            "✨ **Recommended Roles (Demo):**\n"
            "1. **Frontend Developer** - Matches your technical skills.\n"
            "2. **Data Analyst** - Great for your analytical background.\n"
            "3. **Product Manager** - Leverages your experience."
        )

def generate_course_recommendation(interests, current_level):
    """Generate personalized course recommendations with Fallback"""
    try:
        prompt = f"Suggest 3 courses for Interests: {interests}, Level: {current_level}"
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200
        )
        return response.choices[0].message.content
    except Exception:
        return (
            "📚 **Recommended Path (Demo):**\n"
            "1. **Python for Beginners** (Udemy) - Great starting point.\n"
            "2. **Google Data Analytics Cert** (Coursera) - Align with your interests.\n"
            "3. **Intro to Web Dev** (freeCodeCamp)."
        )

def search_filter(items, query, search_fields):
    """Filter items based on search query"""
    if not query:
        return items
    
    query = query.lower()
    filtered = []
    
    for item in items:
        for field in search_fields:
            if field in item and query in str(item[field]).lower():
                filtered.append(item)
                break
    
    return filtered

def paginate(items, page=1, items_per_page=10):
    """Paginate a list of items"""
    start = (page - 1) * items_per_page
    end = start + items_per_page
    return items[start:end], len(items)

def get_sample_data_if_none(data, sample_data):
    """Return sample data if database data is empty or None"""
    if data and len(data) > 0:
        return data
    return sample_data

def format_currency(amount, currency="₹"):
    """Format currency value"""
    if amount is None:
        return f"{currency}0"
    return f"{currency}{amount:,.2f}"
