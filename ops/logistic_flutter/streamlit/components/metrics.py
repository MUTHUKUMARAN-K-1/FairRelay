"""
Metrics and Statistics Display Components
"""

import streamlit as st
from datetime import datetime

def impact_metrics_display(metrics_data):
    """
    Display impact metrics in a grid
    
    Args:
        metrics_data: dict with keys like 'women_helped', 'jobs_posted', etc.
    """
    st.markdown("## 📊 Our Impact")
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        women_helped = metrics_data.get('women_helped', 0)
        growth = metrics_data.get('monthly_growth', 0)
        st.metric("Women Helped", f"{women_helped:,}+", f"+{growth}%")
    
    with col2:
        jobs_posted = metrics_data.get('jobs_posted', 0)
        st.metric("Jobs Posted", f"{jobs_posted:,}+", "+8%")
    
    with col3:
        courses = metrics_data.get('courses_available', 0)
        st.metric("Courses", f"{courses:,}+", "+20")
    
    with col4:
        mentors = metrics_data.get('mentors_active', 0)
        st.metric("Mentors", f"{mentors:,}+", "+12%")

def user_stats_display(user_data):
    """
    Display user-specific statistics
    
    Args:
        user_data: dict with user activity data
    """
    st.markdown("### 📈 Your Activity")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.markdown("""
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        padding: 20px; border-radius: 15px; text-align: center; color: white;">
                <h2 style="margin: 0; color: white;">{}</h2>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">Courses Enrolled</p>
            </div>
        """.format(user_data.get('courses_enrolled', 0)), unsafe_allow_html=True)
    
    with col2:
        st.markdown("""
            <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); 
                        padding: 20px; border-radius: 15px; text-align: center; color: white;">
                <h2 style="margin: 0; color: white;">{}</h2>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">Jobs Applied</p>
            </div>
        """.format(user_data.get('jobs_applied', 0)), unsafe_allow_html=True)
    
    with col3:
        st.markdown("""
            <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); 
                        padding: 20px; border-radius: 15px; text-align: center; color: white;">
                <h2 style="margin: 0; color: white;">{}</h2>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">Community Posts</p>
            </div>
        """.format(user_data.get('posts_created', 0)), unsafe_allow_html=True)

def progress_indicator(current, total, label="Progress"):
    """
    Display a progress bar with percentage
    
    Args:
        current: Current progress value
        total: Total/target value
        label: Label for the progress bar
    """
    percentage = int((current / total) * 100) if total > 0 else 0
    
    st.markdown(f"**{label}:** {current}/{total}")
    st.progress(percentage / 100)
    st.caption(f"{percentage}% Complete")

def achievement_badge(title, description, icon="🏆", color="#667eea"):
    """
    Display an achievement badge
    
    Args:
        title: Achievement title
        description: Achievement description
        icon: Emoji icon
        color: Background color
    """
    st.markdown(f"""
        <div style="background: linear-gradient(135deg, {color} 0%, #764ba2 100%); 
                    padding: 20px; border-radius: 15px; text-align: center; color: white; margin: 10px 0;">
            <div style="font-size: 48px; margin-bottom: 10px;">{icon}</div>
            <h3 style="margin: 10px 0; color: white;">{title}</h3>
            <p style="margin: 5px 0; opacity: 0.9; font-size: 14px;">{description}</p>
        </div>
    """, unsafe_allow_html=True)

def stats_card(icon, number, label, color="#667eea", delta=None):
    """
    Display a statistic card with optional delta
    
    Args:
        icon: Emoji icon
        number: The main number to display
        label: Label for the stat
        color: Background gradient color
        delta: Optional change indicator (e.g., "+15%")
    """
    delta_html = f'<p style="color: #10b981; font-size: 14px; margin: 5px 0;">▲ {delta}</p>' if delta else ""
    
    st.markdown(f"""
        <div style="background: linear-gradient(135deg, {color} 0%, #764ba2 100%); 
                    padding: 25px; border-radius: 15px; text-align: center; color: white;">
            <div style="font-size: 40px; margin-bottom: 10px;">{icon}</div>
            <h2 style="margin: 10px 0; color: white; font-size: 36px;">{number}</h2>
            <p style="margin: 5px 0; opacity: 0.9;">{label}</p>
            {delta_html}
        </div>
    """, unsafe_allow_html=True)

def leaderboard_display(users_data, title="🏆 Top Contributors"):
    """
    Display a leaderboard of users
    
    Args:
        users_data: List of dicts with 'name', 'score', 'rank' keys
        title: Leaderboard title
    """
    st.markdown(f"### {title}")
    
    for user in users_data[:10]:  # Top 10
        rank = user.get('rank', 0)
        name = user.get('name', 'Anonymous')
        score = user.get('score', 0)
        
        medal = "🥇" if rank == 1 else "🥈" if rank == 2 else "🥉" if rank == 3 else f"#{rank}"
        
        st.markdown(f"""
            <div style="background: #f0f2f6; padding: 15px; border-radius: 10px; margin: 10px 0; 
                        display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <span style="font-size: 24px;">{medal}</span>
                    <span style="font-weight: 600; color: #262730;">{name}</span>
                </div>
                <span style="color: #667eea; font-weight: 600;">{score} points</span>
            </div>
        """, unsafe_allow_html=True)
