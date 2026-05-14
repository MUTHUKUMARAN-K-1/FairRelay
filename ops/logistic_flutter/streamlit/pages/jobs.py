import streamlit as st
import sys
from pathlib import Path

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent))

from components.cards import job_card
from utils.database import get_jobs_cached, insert_job
from utils.helpers import search_filter, generate_job_recommendation, chatbot_response
from utils.css_loader import load_css

# Load CSS
load_css()

# ==================== HERO SECTION ====================
st.markdown("""
    <div class="hero-section">
        <h1 class="hero-title">💼 Career Opportunities</h1>
        <p class="hero-subtitle">
            Discover jobs from companies committed to diversity and women empowerment
        </p>
    </div>
""", unsafe_allow_html=True)

# ==================== SEARCH AND FILTER ====================
col1, col2, col3 = st.columns([3, 1, 1])

with col1:
    search_query = st.text_input("🔍 Search jobs", placeholder="e.g., Software Engineer, Marketing Manager")

with col2:
    job_type_filter = st.selectbox("Job Type", ["All", "Full-time", "Part-time", "Remote", "Internship"])

with col3:
    location_filter = st.selectbox("Location", ["All", "Bangalore", "Mumbai", "Delhi", "Hyderabad", "Remote"])

st.markdown("<br>", unsafe_allow_html=True)

# ==================== DATA LOADING ====================
jobs = get_jobs_cached()

if not jobs:
    st.info("📊 Initializing job database with sample data...")
    
    sample_jobs = [
        {
            "title": "Senior Software Engineer",
            "company": "TechWomen Inc.",
            "location": "Bangalore",
            "job_type": "Full-time",
            "salary_range": "₹15-25 LPA",
            "description": "Join our all-women tech team building next-gen applications. We offer flexible hours, remote options, and maternity benefits.",
            "requirements": "5+ years in Python/Java, Strong problem-solving skills",
            "apply_link": "https://example.com/apply"
        },
        {
            "title": "Digital Marketing Manager",
            "company": "EmpowerHer Marketing",
            "location": "Remote",
            "job_type": "Remote",
            "salary_range": "₹8-15 LPA",
            "description": "Lead marketing campaigns for women-focused brands. Creative environment with work-life balance.",
            "requirements": "3+ years in digital marketing, SEO/SEM expertise",
            "apply_link": "https://example.com/apply"
        },
        {
            "title": "Product Designer",
            "company": "DesignHer Studio",
            "location": "Mumbai",
            "job_type": "Full-time",
            "salary_range": "₹10-18 LPA",
            "description": "Create beautiful user experiences. Women-led design studio with mentorship programs.",
            "requirements": "Figma/Sketch proficiency, UI/UX portfolio",
            "apply_link": "https://example.com/apply"
        },
        {
            "title": "Data Analyst",
            "company": "Analytics Women",
            "location": "Hyderabad",
            "job_type": "Full-time",
            "salary_range": "₹6-12 LPA",
            "description": "Analyze data and drive business decisions. Supportive environment with learning opportunities.",
            "requirements": "SQL, Python, Data visualization tools",
            "apply_link": "https://example.com/apply"
        },
        {
            "title": "Content Writer",
            "company": "WriteHer Content",
            "location": "Remote",
            "job_type": "Part-time",
            "salary_range": "₹3-6 LPA",
            "description": "Write engaging content for women empowerment platforms. Flexible schedule.",
            "requirements": "Excellent writing skills, SEO knowledge",
            "apply_link": "https://example.com/apply"
        },
        {
            "title": "HR Manager",
            "company": "WomenFirst HR",
            "location": "Delhi",
            "job_type": "Full-time",
            "salary_range": "₹8-14 LPA",
            "description": "Build diverse teams and create inclusive workplaces. Focus on women's career development.",
            "requirements": "5+ years HR experience, Recruitment expertise",
            "apply_link": "https://example.com/apply"
        }
    ]
    
    for job in sample_jobs:
        insert_job(**job)
    
    st.cache_data.clear()
    jobs = get_jobs_cached()

# ==================== FILTERING LOGIC ====================
filtered_jobs = jobs

if search_query:
    filtered_jobs = search_filter(filtered_jobs, search_query, ['title', 'company', 'description'])

if job_type_filter != "All":
    filtered_jobs = [j for j in filtered_jobs if j['job_type'] == job_type_filter]

if location_filter != "All":
    filtered_jobs = [j for j in filtered_jobs if j['location'] == location_filter]

# ==================== JOB LISTING ====================
st.markdown(f"## 📋 {len(filtered_jobs)} Jobs Found")

if filtered_jobs:
    cols = st.columns(2)
    for idx, job in enumerate(filtered_jobs):
        with cols[idx % 2]:
            job_card(job)
            if st.button(f"Apply Now →", key=f"apply_{job['id']}", use_container_width=True):
                st.success(f"✅ Redirecting to application page for {job['title']}...")
                st.markdown(f"[Click here to apply]({job.get('apply_link', '#')})")
else:
    st.warning("No jobs found matching your criteria. Try adjusting your filters!")

st.markdown("<br><br>", unsafe_allow_html=True)

# ==================== FEATURE 1: AI RESUME SCANNER (NEW) ====================
st.markdown("## 📄 AI Resume Scanner")

with st.expander("🔍 **Check your Resume Match Score**"):
    st.info("Paste your resume content to see how well it matches a job description.")
    
    r_col1, r_col2 = st.columns(2)
    with r_col1:
        resume_text = st.text_area("Paste Resume Text", height=200, placeholder="Experience: Software Engineer at...")
    with r_col2:
        job_desc = st.text_area("Paste Job Description", height=200, placeholder="We are looking for a Python developer...")
        
    if st.button("📊 Scan Resume", use_container_width=True):
        if resume_text and job_desc:
            with st.spinner("AI is analyzing your profile..."):
                prompt = f"""
                Analyze the match between this Resume and Job Description.
                Resume: {resume_text[:500]}...
                Job Desc: {job_desc[:500]}...
                
                Provide:
                1. Match Score (0-100%)
                2. Missing Keywords
                3. One specific improvement tip.
                Keep it concise.
                """
                analysis = chatbot_response(prompt, context="Career Coach")
                
                st.markdown(f"""
                    <div style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); padding: 25px; border-radius: 15px; margin-top: 20px;">
                        <h3 style="color: #333; margin-top: 0;">Resume Analysis Report</h3>
                        <div style="background: rgba(255,255,255,0.8); padding: 15px; border-radius: 10px; color: #333;">
                            {analysis}
                        </div>
                    </div>
                """, unsafe_allow_html=True)
        else:
            st.warning("Please paste both resume text and job description.")

st.markdown("<br>", unsafe_allow_html=True)

# ==================== FEATURE 2: MOCK INTERVIEW (NEW) ====================
st.markdown("## 🎙️ Mock Interview Simulator")

with st.expander("💬 **Practice Interview Questions**"):
    role_select = st.selectbox("Select Role to Practice", ["Software Engineer", "HR Manager", "Data Analyst", "Product Manager", "Marketing Specialist"])
    
    if st.button("🎲 Generate Interview Questions"):
        with st.spinner(f"Generating questions for {role_select}..."):
            prompt = f"Generate 3 tough interview questions for a {role_select} role. Focus on behavioral and technical aspects."
            questions = chatbot_response(prompt, context="Interviewer")
            
            st.markdown(f"""
                <div style="background: #f0f7ff; border-left: 5px solid #007bff; padding: 20px; border-radius: 5px; margin-top: 20px;">
                    <h4 style="margin-top:0; color: #007bff;">Mock Interview: {role_select}</h4>
                    <div style="white-space: pre-line; line-height: 1.6;">{questions}</div>
                </div>
            """, unsafe_allow_html=True)
            st.info("💡 Tip: Try answering these out loud or writing them down!")

st.markdown("<br>", unsafe_allow_html=True)

# ==================== AI JOB RECOMMENDATIONS ====================
st.markdown("## 🤖 Personalized Job Recommendations")

with st.expander("✨ Click to get AI-powered job suggestions"):
    col1, col2 = st.columns(2)
    
    with col1:
        user_skills = st.text_input("Your Skills", placeholder="e.g., Python, Marketing, Design")
    
    with col2:
        user_experience = st.text_input("Years of Experience", placeholder="e.g., 3 years")
    
    if st.button("🎯 Get Recommendations", use_container_width=True):
        if user_skills and user_experience:
            with st.spinner("Analyzing your profile..."):
                recommendations = generate_job_recommendation(user_skills, user_experience)
                st.markdown(f"""
                    <div class="success-box">
                        <h4>💡 Personalized Recommendations:</h4>
                        <p style="white-space: pre-line;">{recommendations}</p>
                    </div>
                """, unsafe_allow_html=True)
        else:
            st.error("Please fill in both fields")

st.markdown("<br>", unsafe_allow_html=True)

# ==================== JOB APPLICATION TIPS ====================
st.markdown("## 📝 Job Application Tips")

col1, col2 = st.columns(2)

with col1:
    st.markdown("""
        <div class="feature-card">
            <h3>✍️ Resume Tips</h3>
            <ul style="line-height: 2.0; color: #666;">
                <li>Keep it to 1-2 pages maximum</li>
                <li>Use action verbs and quantify achievements</li>
                <li>Tailor your resume for each job</li>
                <li>Include relevant certifications</li>
                <li>Proofread multiple times</li>
            </ul>
        </div>
    """, unsafe_allow_html=True)

with col2:
    st.markdown("""
        <div class="feature-card">
            <h3>💬 Interview Tips</h3>
            <ul style="line-height: 2.0; color: #666;">
                <li>Research the company thoroughly</li>
                <li>Prepare STAR method examples</li>
                <li>Ask insightful questions</li>
                <li>Practice common interview questions</li>
                <li>Follow up with a thank-you email</li>
            </ul>
        </div>
    """, unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)

# ==================== SALARY CALCULATOR ====================
st.markdown("## 💰 Know Your Worth - Salary Calculator")

with st.expander("💵 Calculate expected salary based on your experience"):
    role = st.selectbox("Select Role", ["Software Engineer", "Data Analyst", "Product Manager", "Designer", "Marketing Manager", "HR Manager"])
    years_exp = st.slider("Years of Experience", 0, 20, 3)
    location = st.selectbox("Location", ["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Pune", "Remote"])
    
    # Simple salary calculation (mock)
    base_salary = {
        "Software Engineer": 500000,
        "Data Analyst": 400000,
        "Product Manager": 800000,
        "Designer": 450000,
        "Marketing Manager": 600000,
        "HR Manager": 500000
    }
    
    location_multiplier = {
        "Bangalore": 1.2,
        "Mumbai": 1.15,
        "Delhi": 1.1,
        "Hyderabad": 1.0,
        "Pune": 1.05,
        "Remote": 0.95
    }
    
    estimated_salary = base_salary[role] * (1 + years_exp * 0.1) * location_multiplier[location]
    
    st.markdown(f"""
        <div class="info-box" style="text-align: center;">
            <h3>Your Estimated Salary Range</h3>
            <h2 style="font-size: 36px; margin: 20px 0;">₹{estimated_salary/100000:.1f} - ₹{estimated_salary*1.3/100000:.1f} LPA</h2>
            <p>Based on {role} with {years_exp} years experience in {location}</p>
        </div>
    """, unsafe_allow_html=True)
