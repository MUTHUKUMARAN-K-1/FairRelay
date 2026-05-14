"""
Utility Functions Package
"""

from .helpers import (
    format_date,
    time_ago,
    validate_email,
    validate_phone,
    show_success_message,
    show_error_message,
    show_info_message,
    chatbot_response,
    generate_job_recommendation,
    generate_course_recommendation,
    search_filter,
    paginate
)

from .css_loader import load_css

from .animations import (
    fade_in,
    slide_in,
    pulse_animation,
    typing_effect
)

__all__ = [
    'format_date',
    'time_ago',
    'validate_email',
    'validate_phone',
    'show_success_message',
    'show_error_message',
    'show_info_message',
    'chatbot_response',
    'generate_job_recommendation',
    'generate_course_recommendation',
    'search_filter',
    'paginate',
    'load_css',
    'fade_in',
    'slide_in',
    'pulse_animation',
    'typing_effect',
]
