"""
Application Configuration Settings
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Application Configuration
APP_CONFIG = {
    "app_name": os.getenv("APP_NAME", "Women Empowerment Hub"),
    "app_version": os.getenv("APP_VERSION", "1.0.0"),
    "app_description": "Empowering women through technology, education, and community",
    "author": "Your Name",
    "github": "https://github.com/yourusername/women-empowerment-hub",
    "debug": os.getenv("DEBUG", "False").lower() == "true",
}

# Theme colors
COLORS = {
    "primary": "#667eea",
    "secondary": "#764ba2",
    "success": "#10b981",
    "warning": "#f59e0b",
    "danger": "#ef4444",
    "info": "#3b82f6",
    "light": "#f0f2f6",
    "dark": "#262730",
    "gradient_start": "#667eea",
    "gradient_end": "#764ba2",
}

# Impact metrics (mock data - replace with database queries in production)
IMPACT_METRICS = {
    "women_helped": 50000,
    "jobs_posted": 1200,
    "courses_available": 500,
    "mentors_active": 800,
    "success_stories": 350,
    "community_members": 10000,
    "monthly_growth": 15,
    "satisfaction_rate": 95,
}

# Emergency contacts by country
EMERGENCY_CONTACTS = {
    "india": {
        "women_helpline": "1091",
        "police": "100",
        "ambulance": "102",
        "legal_aid": "1800-180-1111",
        "domestic_violence": "181",
        "national_emergency": "112",
        "cyber_crime": "1930",
    },
    "usa": {
        "emergency": "911",
        "domestic_violence": "1-800-799-7233",
        "sexual_assault": "1-800-656-4673",
    },
    "uk": {
        "emergency": "999",
        "domestic_violence": "0808-2000-247",
        "women_aid": "0808-2000-247",
    }
}

# Job categories
JOB_CATEGORIES = [
    "Technology",
    "Marketing",
    "Design",
    "Finance",
    "Healthcare",
    "Education",
    "Human Resources",
    "Sales",
    "Operations",
    "Customer Service",
    "Data Science",
    "Product Management",
    "Business Development",
    "Content Writing",
    "Other"
]

# Course categories
COURSE_CATEGORIES = [
    "Technology",
    "Business",
    "Design",
    "Health",
    "Personal Development",
    "Finance",
    "Marketing",
    "Data Science",
    "Programming",
    "Soft Skills"
]

# Course levels
COURSE_LEVELS = [
    "Beginner",
    "Intermediate",
    "Advanced",
    "Expert"
]

# Legal categories
LEGAL_CATEGORIES = [
    "Constitutional Rights",
    "Workplace Rights",
    "Family Laws",
    "Protection Laws",
    "Property Rights",
    "Divorce & Maintenance",
    "Child Custody",
    "Domestic Violence",
    "Sexual Harassment",
    "Equal Pay"
]

# Success story categories
STORY_CATEGORIES = [
    "Career",
    "Education",
    "Entrepreneurship",
    "Health",
    "Overcoming Abuse",
    "Personal Growth",
    "Leadership",
    "Other"
]

# Community forum categories
FORUM_CATEGORIES = [
    "Career Advice",
    "Tech & Coding",
    "Personal Growth",
    "Health & Wellness",
    "Legal Advice",
    "Support Group",
    "Entrepreneurship",
    "Education",
    "General Discussion"
]

# Health tracking categories
HEALTH_CATEGORIES = [
    "General Health",
    "Nutrition",
    "Mental Wellness",
    "Period Tracking",
    "Exercise",
    "Sleep",
    "Medication"
]

# Safety tips categories
SAFETY_CATEGORIES = [
    "Home Safety",
    "Public Safety",
    "Online Safety",
    "Travel Safety",
    "Workplace Safety",
    "Digital Privacy"
]

# Feature flags
FEATURES = {
    "enable_ai_chatbot": True,
    "enable_mentorship": True,
    "enable_job_board": True,
    "enable_courses": True,
    "enable_health_tracking": True,
    "enable_community": True,
    "enable_success_stories": True,
    "enable_legal_resources": True,
    "enable_notifications": False,  # Future feature
    "enable_payments": False,  # Future feature
}

# Pagination settings
PAGINATION = {
    "jobs_per_page": 10,
    "courses_per_page": 12,
    "stories_per_page": 9,
    "posts_per_page": 15,
    "mentors_per_page": 12,
}

# API Configuration
API_CONFIG = {
    "openai_model": "gpt-3.5-turbo",
    "openai_max_tokens": 300,
    "openai_temperature": 0.7,
    "request_timeout": 30,
}

# Cache settings (for Streamlit caching)
CACHE_CONFIG = {
    "ttl": 300,  # Time to live in seconds (5 minutes)
    "max_entries": 1000,
}

# Email templates (for future use)
EMAIL_TEMPLATES = {
    "welcome": {
        "subject": "Welcome to Women Empowerment Hub! 💜",
        "template": "welcome_email.html"
    },
    "mentor_match": {
        "subject": "You've been matched with a mentor!",
        "template": "mentor_match.html"
    },
    "job_alert": {
        "subject": "New job opportunities matching your profile",
        "template": "job_alert.html"
    }
}

# Social media links
SOCIAL_MEDIA = {
    "instagram": "https://instagram.com/womenempowerhub",
    "twitter": "https://twitter.com/womenempowerhub",
    "linkedin": "https://linkedin.com/company/women-empowerment-hub",
    "facebook": "https://facebook.com/womenempowerhub",
    "youtube": "https://youtube.com/@womenempowerhub",
}

# Support contacts
SUPPORT_CONTACTS = {
    "email": "support@womenempowerment.org",
    "phone": "+91-1800-XXX-XXXX",
    "whatsapp": "+91-98765-43210",
    "address": "Bangalore, Karnataka, India",
}

# File upload settings
UPLOAD_CONFIG = {
    "max_file_size_mb": 5,
    "allowed_image_types": ["jpg", "jpeg", "png", "gif"],
    "allowed_document_types": ["pdf", "doc", "docx"],
    "upload_folder": "uploads/"
}

# Security settings
SECURITY_CONFIG = {
    "session_timeout_minutes": 30,
    "max_login_attempts": 5,
    "password_min_length": 8,
    "require_email_verification": False,  # Future feature
}

# Localization settings
LOCALIZATION = {
    "default_language": "en",
    "supported_languages": ["en", "hi", "ta", "te", "bn"],
    "default_timezone": "Asia/Kolkata",
    "date_format": "%B %d, %Y",
    "time_format": "%I:%M %p"
}

# Analytics settings (for future integration)
ANALYTICS = {
    "google_analytics_id": None,
    "track_page_views": False,
    "track_events": False,
}

# Database table names
DB_TABLES = {
    "users": "users",
    "jobs": "jobs",
    "courses": "courses",
    "success_stories": "success_stories",
    "resources": "resources",
    "mentors": "mentors",
    "community_posts": "community_posts",
    "emergency_contacts": "emergency_contacts",
    "health_records": "health_records",
    "legal_rights": "legal_rights",
}

# Validation rules
VALIDATION_RULES = {
    "email_regex": r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    "phone_regex": r'^[\d\s\+\-\(\)]{10,}$',
    "url_regex": r'^https?://[^\s]+$',
}

# Default values
DEFAULTS = {
    "profile_image": "https://via.placeholder.com/150",
    "company_logo": "https://via.placeholder.com/100",
    "course_thumbnail": "https://via.placeholder.com/300x200",
    "avatar_colors": ["#667eea", "#764ba2", "#f093fb", "#4facfe", "#fa709a"],
}

# Rate limiting (for API endpoints)
RATE_LIMITS = {
    "ai_chatbot_per_hour": 50,
    "job_applications_per_day": 20,
    "posts_per_day": 10,
    "messages_per_hour": 30,
}

# Success messages
SUCCESS_MESSAGES = {
    "profile_updated": "✅ Profile updated successfully!",
    "job_applied": "✅ Application submitted successfully!",
    "course_enrolled": "✅ Successfully enrolled in course!",
    "story_submitted": "✅ Story submitted for review!",
    "post_created": "✅ Post published successfully!",
    "mentor_booked": "✅ Mentor session booked!",
}

# Error messages
ERROR_MESSAGES = {
    "generic": "❌ Something went wrong. Please try again.",
    "network": "❌ Network error. Please check your connection.",
    "database": "❌ Database error. Please try again later.",
    "validation": "❌ Please fill in all required fields correctly.",
    "unauthorized": "❌ You need to log in to perform this action.",
    "not_found": "❌ Requested resource not found.",
}

# Info messages
INFO_MESSAGES = {
    "loading": "⏳ Loading...",
    "processing": "⏳ Processing your request...",
    "saving": "💾 Saving...",
    "uploading": "📤 Uploading...",
    "searching": "🔍 Searching...",
}

# Warning messages
WARNING_MESSAGES = {
    "unsaved_changes": "⚠️ You have unsaved changes!",
    "incomplete_profile": "⚠️ Please complete your profile.",
    "verification_pending": "⚠️ Your submission is pending verification.",
    "expiring_soon": "⚠️ This opportunity expires soon!",
}

# App metadata for SEO and sharing
APP_METADATA = {
    "title": "Women Empowerment Hub - Empowering Women Through Technology",
    "description": "A comprehensive platform providing safety resources, career opportunities, education, health tracking, and community support for women empowerment.",
    "keywords": "women empowerment, women safety, career opportunities, online courses, mentorship, women's health, legal rights, community support",
    "og_image": "https://yourdomain.com/og-image.jpg",
    "twitter_card": "summary_large_image",
}

# Development settings
DEV_CONFIG = {
    "show_debug_info": APP_CONFIG["debug"],
    "enable_profiling": False,
    "log_level": "INFO",
    "mock_data": True,  # Use sample data instead of real database
}

# Export commonly used settings
__all__ = [
    'APP_CONFIG',
    'COLORS',
    'IMPACT_METRICS',
    'EMERGENCY_CONTACTS',
    'FEATURES',
    'SUPPORT_CONTACTS',
]
