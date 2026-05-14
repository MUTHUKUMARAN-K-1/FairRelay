"""
Reusable Form Components
"""

import streamlit as st
from datetime import datetime
import re

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_phone(phone):
    """Validate phone number format"""
    pattern = r'^[\d\s\+\-\(\)]{10,}$'
    return re.match(pattern, phone) is not None

def contact_form(form_key="contact"):
    """Display a contact form"""
    st.markdown("### 📧 Contact Us")
    
    with st.form(key=f"{form_key}_form"):
        name = st.text_input("Your Name *", placeholder="Enter your full name")
        email = st.text_input("Email Address *", placeholder="your.email@example.com")
        phone = st.text_input("Phone Number", placeholder="+91-XXXXX-XXXXX")
        subject = st.text_input("Subject *", placeholder="What is this regarding?")
        message = st.text_area("Message *", placeholder="Tell us more...", height=150)
        
        submitted = st.form_submit_button("📤 Send Message", use_container_width=True)
        
        if submitted:
            if not name or not email or not subject or not message:
                st.error("❌ Please fill in all required fields (*)")
                return None
            
            if not validate_email(email):
                st.error("❌ Please enter a valid email address")
                return None
            
            if phone and not validate_phone(phone):
                st.error("❌ Please enter a valid phone number")
                return None
            
            st.success("✅ Message sent successfully! We'll get back to you soon.")
            st.balloons()
            
            return {
                "name": name,
                "email": email,
                "phone": phone,
                "subject": subject,
                "message": message,
                "timestamp": datetime.now()
            }
    
    return None

def job_application_form(job_title="", form_key="job_app"):
    """Display a job application form"""
    st.markdown(f"### 💼 Apply for: {job_title}")
    
    with st.form(key=f"{form_key}_form"):
        col1, col2 = st.columns(2)
        
        with col1:
            name = st.text_input("Full Name *", placeholder="Your full name")
            email = st.text_input("Email Address *", placeholder="your.email@example.com")
            phone = st.text_input("Phone Number *", placeholder="+91-XXXXX-XXXXX")
        
        with col2:
            current_role = st.text_input("Current Role", placeholder="e.g., Software Engineer")
            experience = st.number_input("Years of Experience", min_value=0, max_value=50, value=0)
            location = st.text_input("Current Location", placeholder="City, Country")
        
        st.markdown("#### 📄 Resume")
        resume = st.file_uploader("Upload Resume (PDF, DOC, DOCX)", type=["pdf", "doc", "docx"])
        
        linkedin = st.text_input("LinkedIn Profile URL", placeholder="https://linkedin.com/in/yourprofile")
        portfolio = st.text_input("Portfolio/Website URL (optional)", placeholder="https://yourportfolio.com")
        
        cover_letter = st.text_area(
            "Cover Letter / Why do you want this job? *",
            placeholder="Tell us why you're a great fit for this role...",
            height=200
        )
        
        availability = st.selectbox(
            "When can you start?",
            ["Immediately", "2 weeks notice", "1 month notice", "2+ months"]
        )
        
        salary_expectation = st.text_input("Salary Expectation (Optional)", placeholder="e.g., ₹15-20 LPA")
        
        submitted = st.form_submit_button("📤 Submit Application", use_container_width=True)
        
        if submitted:
            if not name or not email or not phone or not cover_letter:
                st.error("❌ Please fill in all required fields (*)")
                return None
            
            if not validate_email(email):
                st.error("❌ Please enter a valid email address")
                return None
            
            if not validate_phone(phone):
                st.error("❌ Please enter a valid phone number")
                return None
            
            st.success("✅ Application submitted successfully! Good luck!")
            st.balloons()
            
            return {
                "name": name,
                "email": email,
                "phone": phone,
                "current_role": current_role,
                "experience": experience,
                "location": location,
                "linkedin": linkedin,
                "portfolio": portfolio,
                "cover_letter": cover_letter,
                "availability": availability,
                "salary_expectation": salary_expectation,
                "timestamp": datetime.now()
            }
    
    return None

def mentor_application_form(form_key="mentor_app"):
    """Display a mentor application form"""
    st.markdown("### 🌟 Become a Mentor")
    
    with st.form(key=f"{form_key}_form"):
        col1, col2 = st.columns(2)
        
        with col1:
            name = st.text_input("Full Name *", placeholder="Your full name")
            email = st.text_input("Email Address *", placeholder="your.email@example.com")
            phone = st.text_input("Phone Number", placeholder="+91-XXXXX-XXXXX")
        
        with col2:
            current_role = st.text_input("Current Role *", placeholder="e.g., Senior Engineer")
            company = st.text_input("Current Company", placeholder="Company name")
            experience = st.number_input("Years of Experience *", min_value=1, max_value=50, value=5)
        
        expertise = st.multiselect(
            "Areas of Expertise *",
            ["Technology", "Marketing", "Design", "Finance", "Healthcare", "Education", 
             "Entrepreneurship", "Leadership", "Data Science", "Product Management", "Other"]
        )
        
        specific_skills = st.text_input(
            "Specific Skills *",
            placeholder="e.g., Python, Machine Learning, Product Strategy"
        )
        
        bio = st.text_area(
            "Professional Bio *",
            placeholder="Tell us about your professional journey, achievements, and why you want to mentor...",
            height=200
        )
        
        linkedin = st.text_input("LinkedIn Profile URL *", placeholder="https://linkedin.com/in/yourprofile")
        
        availability = st.multiselect(
            "Available for:",
            ["One-on-one mentoring", "Group sessions", "Career guidance", "Resume review", 
             "Mock interviews", "Technical guidance", "Workshops/Speaking"]
        )
        
        hours_per_month = st.slider("Hours you can commit per month", 1, 20, 5)
        
        why_mentor = st.text_area(
            "Why do you want to be a mentor? *",
            placeholder="What motivates you to help other women?",
            height=150
        )
        
        submitted = st.form_submit_button("🚀 Submit Application", use_container_width=True)
        
        if submitted:
            if not name or not email or not current_role or not expertise or not bio or not linkedin or not why_mentor:
                st.error("❌ Please fill in all required fields (*)")
                return None
            
            if not validate_email(email):
                st.error("❌ Please enter a valid email address")
                return None
            
            st.success("✅ Application submitted! We'll review and get back to you within 48 hours.")
            st.balloons()
            
            return {
                "name": name,
                "email": email,
                "phone": phone,
                "current_role": current_role,
                "company": company,
                "experience": experience,
                "expertise": expertise,
                "specific_skills": specific_skills,
                "bio": bio,
                "linkedin": linkedin,
                "availability": availability,
                "hours_per_month": hours_per_month,
                "why_mentor": why_mentor,
                "timestamp": datetime.now()
            }
    
    return None

def story_submission_form(form_key="story"):
    """Display a success story submission form"""
    st.markdown("### ⭐ Share Your Success Story")
    
    with st.form(key=f"{form_key}_form"):
        name = st.text_input("Your Name *", placeholder="You can use a pseudonym")
        anonymous = st.checkbox("Submit anonymously")
        
        col1, col2 = st.columns(2)
        
        with col1:
            age = st.number_input("Your Age (Optional)", min_value=18, max_value=100, value=30)
            location = st.text_input("Location (Optional)", placeholder="City, Country")
        
        with col2:
            occupation = st.text_input("Current Occupation *", placeholder="e.g., Software Engineer")
            category = st.selectbox(
                "Story Category *",
                ["Career", "Education", "Entrepreneurship", "Health", "Overcoming Abuse", 
                 "Personal Growth", "Leadership", "Other"]
            )
        
        title = st.text_input("Story Title *", placeholder="e.g., From Struggles to Success")
        
        story = st.text_area(
            "Your Story *",
            placeholder="Share your journey, challenges, how you overcame them, and your message for other women...",
            height=300
        )
        
        impact = st.text_area(
            "Your Impact (Optional)",
            placeholder="What impact has your journey made? e.g., Started a business, Mentored others, etc.",
            height=100
        )
        
        photo = st.file_uploader("Upload Photo (Optional)", type=["jpg", "jpeg", "png"])
        
        consent = st.checkbox("I agree my story can be published on this platform *")
        contact_consent = st.checkbox("I agree to be contacted by the team (optional)")
        
        submitted = st.form_submit_button("🚀 Submit Story", use_container_width=True)
        
        if submitted:
            if not name or not occupation or not title or not story or not consent:
                st.error("❌ Please fill in all required fields (*) and agree to terms")
                return None
            
            st.success("✅ Thank you for sharing your story! It will be reviewed and published soon. 💜")
            st.balloons()
            
            return {
                "name": "Anonymous" if anonymous else name,
                "age": age,
                "location": location,
                "occupation": occupation,
                "category": category,
                "title": title,
                "story": story,
                "impact": impact,
                "anonymous": anonymous,
                "contact_consent": contact_consent,
                "timestamp": datetime.now()
            }
    
    return None

def feedback_form(form_key="feedback"):
    """Display a feedback form"""
    st.markdown("### 💬 Send Us Feedback")
    
    with st.form(key=f"{form_key}_form"):
        name = st.text_input("Your Name (Optional)", placeholder="Enter your name")
        email = st.text_input("Your Email (Optional)", placeholder="your.email@example.com")
        
        feedback_type = st.selectbox(
            "Feedback Type *",
            ["Suggestion", "Bug Report", "Feature Request", "General Feedback", "Compliment"]
        )
        
        message = st.text_area(
            "Your Feedback *",
            placeholder="Tell us what you think...",
            height=200
        )
        
        rating = st.slider("Rate your experience (1-5)", 1, 5, 5)
        
        submitted = st.form_submit_button("📤 Send Feedback", use_container_width=True)
        
        if submitted:
            if not message:
                st.error("❌ Please write your feedback")
                return None
            
            if email and not validate_email(email):
                st.error("❌ Please enter a valid email address")
                return None
            
            st.success("✅ Thank you for your feedback! We appreciate it.")
            st.balloons()
            
            return {
                "name": name,
                "email": email,
                "feedback_type": feedback_type,
                "message": message,
                "rating": rating,
                "timestamp": datetime.now()
            }
    
    return None
