import streamlit as st

def feature_card(icon, title, description, link=None):
    """Display a feature card with icon, title, and description"""
    st.markdown(f"""
        <div class="feature-card">
            <div style="font-size: 48px; margin-bottom: 15px;">{icon}</div>
            <h3 style="color: #667eea; margin-bottom: 10px;">{title}</h3>
            <p style="color: #666; line-height: 1.6;">{description}</p>
            {f'<a href="{link}" style="color: #667eea; text-decoration: none; font-weight: 600;">Learn More →</a>' if link else ''}
        </div>
    """, unsafe_allow_html=True)

def job_card(job):
    """Display a job posting card"""
    st.markdown(f"""
        <div class="feature-card">
            <h3 style="color: #667eea; margin-bottom: 5px;">{job.get('title', 'N/A')}</h3>
            <p style="color: #999; font-size: 14px; margin-bottom: 10px;">
                🏢 {job.get('company', 'N/A')} | 📍 {job.get('location', 'N/A')}
            </p>
            <p style="color: #666; margin-bottom: 10px;">
                💼 {job.get('job_type', 'N/A')} | 💰 {job.get('salary_range', 'N/A')}
            </p>
            <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
                {job.get('description', 'N/A')[:150]}...
            </p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #999; font-size: 12px;">Posted: {job.get('posted_date', 'N/A')}</span>
            </div>
        </div>
    """, unsafe_allow_html=True)

def course_card(course):
    """Display a course card"""
    st.markdown(f"""
        <div class="feature-card">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                <h3 style="color: #667eea; margin: 0;">{course.get('title', 'N/A')}</h3>
                <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                             color: white; padding: 5px 15px; border-radius: 15px; font-size: 12px;">
                    {course.get('level', 'N/A')}
                </span>
            </div>
            <p style="color: #999; font-size: 14px; margin-bottom: 10px;">
                👨‍🏫 {course.get('instructor', 'N/A')} | ⏱️ {course.get('duration', 'N/A')}
            </p>
            <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
                {course.get('description', 'N/A')[:120]}...
            </p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #667eea; font-size: 18px; font-weight: 600;">
                    {'FREE' if course.get('is_free') else f"₹{course.get('price', 0)}"}
                </span>
                <span style="color: #f59e0b;">⭐ {course.get('rating', 0.0)}</span>
            </div>
        </div>
    """, unsafe_allow_html=True)

def success_story_card(story):
    """Display a success story card"""
    st.markdown(f"""
        <div class="testimonial-card">
            <h3 style="color: #667eea; margin-bottom: 5px;">{story.get('name', 'Anonymous')}</h3>
            <p style="color: #999; font-size: 14px; margin-bottom: 15px;">{story.get('title', 'N/A')}</p>
            <p style="color: #666; line-height: 1.8; font-style: italic; margin-bottom: 15px;">
                "{story.get('story', 'N/A')[:200]}..."
            </p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="background: #f0f2f6; padding: 5px 15px; border-radius: 15px; font-size: 12px; color: #667eea;">
                    {story.get('category', 'General')}
                </span>
                <span style="color: #999; font-size: 12px;">{story.get('date_posted', 'N/A')}</span>
            </div>
        </div>
    """, unsafe_allow_html=True)

def mentor_card(mentor):
    """Display a mentor profile card"""
    st.markdown(f"""
        <div class="feature-card">
            <h3 style="color: #667eea; margin-bottom: 5px;">{mentor.get('name', 'N/A')}</h3>
            <p style="color: #999; font-size: 14px; margin-bottom: 10px;">
                💼 {mentor.get('expertise', 'N/A')}
            </p>
            <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
                {mentor.get('bio', 'N/A')[:150]}...
            </p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #f59e0b;">⭐ {mentor.get('rating', 0.0)} ({mentor.get('total_mentees', 0)} mentees)</span>
                <span style="color: #10b981;">✅ {mentor.get('available_slots', 0)} slots</span>
            </div>
        </div>
    """, unsafe_allow_html=True)

def stat_card(icon, number, label, color="#667eea"):
    """Display a statistics card"""
    st.markdown(f"""
        <div style="background: linear-gradient(135deg, {color} 0%, #764ba2 100%); 
                    padding: 30px; border-radius: 15px; text-align: center; color: white;">
            <div style="font-size: 48px; margin-bottom: 10px;">{icon}</div>
            <div class="stat-number" style="color: white; -webkit-text-fill-color: white;">{number}</div>
            <p style="font-size: 18px; margin-top: 10px; opacity: 0.9;">{label}</p>
        </div>
    """, unsafe_allow_html=True)

def emergency_button(service, number, description):
    """Display an emergency contact button"""
    if st.button(f"📞 {service}: {number}", key=f"emergency_{service}"):
        st.markdown(f"""
            <div class="success-box">
                <h3>📞 {service}</h3>
                <h2 style="font-size: 36px; margin: 20px 0;">{number}</h2>
                <p>{description}</p>
                <p style="margin-top: 15px; font-size: 14px; opacity: 0.8;">
                    💡 Tip: Save this number in your phone for quick access
                </p>
            </div>
        """, unsafe_allow_html=True)
