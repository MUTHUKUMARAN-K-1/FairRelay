import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
import streamlit as st
import os
from dotenv import load_dotenv
from contextlib import contextmanager

load_dotenv()

# Simple connection function (no pooling for now)
def get_db_connection_simple():
    """Get a simple database connection"""
    try:
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            print("❌ DATABASE_URL not found in environment variables!")
            return None
        
        conn = psycopg2.connect(database_url)
        return conn
    except Exception as e:
        print(f"❌ Error connecting to database: {e}")
        return None

# Database initialization
def init_database():
    """Create all necessary tables"""
    
    create_tables_queries = [
        # Users table
        """
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(20),
            location VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        
        # Jobs table
        """
        CREATE TABLE IF NOT EXISTS jobs (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            company VARCHAR(255) NOT NULL,
            location VARCHAR(255),
            job_type VARCHAR(50),
            salary_range VARCHAR(100),
            description TEXT,
            requirements TEXT,
            posted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT TRUE,
            apply_link VARCHAR(500)
        )
        """,
        
        # Courses table
        """
        CREATE TABLE IF NOT EXISTS courses (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            category VARCHAR(100),
            level VARCHAR(50),
            duration VARCHAR(100),
            description TEXT,
            instructor VARCHAR(255),
            price DECIMAL(10, 2) DEFAULT 0.00,
            is_free BOOLEAN DEFAULT TRUE,
            enrollment_count INTEGER DEFAULT 0,
            rating DECIMAL(3, 2) DEFAULT 0.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        
        # Success Stories table
        """
        CREATE TABLE IF NOT EXISTS success_stories (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            title VARCHAR(255),
            story TEXT NOT NULL,
            image_url VARCHAR(500),
            category VARCHAR(100),
            date_posted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_approved BOOLEAN DEFAULT TRUE
        )
        """,
        
        # Resources table
        """
        CREATE TABLE IF NOT EXISTS resources (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            category VARCHAR(100),
            resource_type VARCHAR(50),
            description TEXT,
            url VARCHAR(500),
            file_path VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        
        # Mentors table
        """
        CREATE TABLE IF NOT EXISTS mentors (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            expertise VARCHAR(255),
            bio TEXT,
            linkedin_url VARCHAR(500),
            available_slots INTEGER DEFAULT 5,
            rating DECIMAL(3, 2) DEFAULT 0.00,
            total_mentees INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        
        # Community Posts table
        """
        CREATE TABLE IF NOT EXISTS community_posts (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            category VARCHAR(100),
            likes INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        
        # Emergency Contacts table
        """
        CREATE TABLE IF NOT EXISTS emergency_contacts (
            id SERIAL PRIMARY KEY,
            country VARCHAR(100),
            service_name VARCHAR(255) NOT NULL,
            phone_number VARCHAR(20) NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT TRUE
        )
        """,
        
        # Health Records table
        """
        CREATE TABLE IF NOT EXISTS health_records (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            record_type VARCHAR(100),
            record_date DATE,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        
        # Legal Rights Info table
        """
        CREATE TABLE IF NOT EXISTS legal_rights (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            category VARCHAR(100),
            description TEXT NOT NULL,
            country VARCHAR(100),
            law_reference VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    ]
    
    conn = None
    try:
        conn = get_db_connection_simple()
        
        if conn is None:
            print("❌ Failed to connect to database")
            return False
        
        cursor = conn.cursor()
        
        print("🔧 Creating tables...")
        for idx, query in enumerate(create_tables_queries, 1):
            try:
                cursor.execute(query)
                print(f"   ✅ Table {idx}/{len(create_tables_queries)} created")
            except Exception as e:
                print(f"   ⚠️ Table {idx} error (may already exist): {e}")
        
        conn.commit()
        cursor.close()
        
        print("✅ All tables created successfully")
        return True
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        if conn:
            conn.rollback()
        return False
        
    finally:
        if conn:
            conn.close()

# CRUD Operations

def insert_user(email, name, phone=None, location=None):
    """Insert a new user"""
    conn = None
    try:
        conn = get_db_connection_simple()
        if not conn:
            return None
        
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO users (email, name, phone, location)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (email) DO NOTHING
            RETURNING id
            """,
            (email, name, phone, location)
        )
        result = cursor.fetchone()
        conn.commit()
        cursor.close()
        return result[0] if result else None
    except Exception as e:
        print(f"Error inserting user: {e}")
        if conn:
            conn.rollback()
        return None
    finally:
        if conn:
            conn.close()

def get_all_jobs(limit=50):
    """Get all active jobs"""
    conn = None
    try:
        conn = get_db_connection_simple()
        if not conn:
            return []
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute(
            """
            SELECT * FROM jobs 
            WHERE is_active = TRUE 
            ORDER BY posted_date DESC 
            LIMIT %s
            """,
            (limit,)
        )
        results = cursor.fetchall()
        cursor.close()
        return results
    except Exception as e:
        print(f"Error fetching jobs: {e}")
        return []
    finally:
        if conn:
            conn.close()

def insert_job(title, company, location, job_type, salary_range, description, requirements, apply_link):
    """Insert a new job posting"""
    conn = None
    try:
        conn = get_db_connection_simple()
        if not conn:
            return None
        
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO jobs (title, company, location, job_type, salary_range, description, requirements, apply_link)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (title, company, location, job_type, salary_range, description, requirements, apply_link)
        )
        result = cursor.fetchone()
        conn.commit()
        cursor.close()
        return result[0] if result else None
    except Exception as e:
        print(f"Error inserting job: {e}")
        if conn:
            conn.rollback()
        return None
    finally:
        if conn:
            conn.close()

def get_all_courses(category=None):
    """Get all courses, optionally filtered by category"""
    conn = None
    try:
        conn = get_db_connection_simple()
        if not conn:
            return []
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        if category:
            cursor.execute(
                "SELECT * FROM courses WHERE category = %s ORDER BY created_at DESC",
                (category,)
            )
        else:
            cursor.execute("SELECT * FROM courses ORDER BY created_at DESC")
        
        results = cursor.fetchall()
        cursor.close()
        return results
    except Exception as e:
        print(f"Error fetching courses: {e}")
        return []
    finally:
        if conn:
            conn.close()

def insert_course(title, category, level, duration, description, instructor, price=0.00, is_free=True):
    """Insert a new course"""
    conn = None
    try:
        conn = get_db_connection_simple()
        if not conn:
            return None
        
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO courses (title, category, level, duration, description, instructor, price, is_free)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (title, category, level, duration, description, instructor, price, is_free)
        )
        result = cursor.fetchone()
        conn.commit()
        cursor.close()
        return result[0] if result else None
    except Exception as e:
        print(f"Error inserting course: {e}")
        if conn:
            conn.rollback()
        return None
    finally:
        if conn:
            conn.close()

def get_success_stories(limit=20):
    """Get approved success stories"""
    conn = None
    try:
        conn = get_db_connection_simple()
        if not conn:
            return []
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute(
            """
            SELECT * FROM success_stories 
            WHERE is_approved = TRUE 
            ORDER BY date_posted DESC 
            LIMIT %s
            """,
            (limit,)
        )
        results = cursor.fetchall()
        cursor.close()
        return results
    except Exception as e:
        print(f"Error fetching success stories: {e}")
        return []
    finally:
        if conn:
            conn.close()

def insert_success_story(name, title, story, category, image_url=None):
    """Insert a new success story"""
    conn = None
    try:
        conn = get_db_connection_simple()
        if not conn:
            return None
        
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO success_stories (name, title, story, category, image_url)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
            """,
            (name, title, story, category, image_url)
        )
        result = cursor.fetchone()
        conn.commit()
        cursor.close()
        return result[0] if result else None
    except Exception as e:
        print(f"Error inserting success story: {e}")
        if conn:
            conn.rollback()
        return None
    finally:
        if conn:
            conn.close()

def get_mentors(expertise=None):
    """Get all mentors, optionally filtered by expertise"""
    conn = None
    try:
        conn = get_db_connection_simple()
        if not conn:
            return []
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        if expertise:
            cursor.execute(
                "SELECT * FROM mentors WHERE expertise ILIKE %s ORDER BY rating DESC",
                (f"%{expertise}%",)
            )
        else:
            cursor.execute("SELECT * FROM mentors ORDER BY rating DESC")
        
        results = cursor.fetchall()
        cursor.close()
        return results
    except Exception as e:
        print(f"Error fetching mentors: {e}")
        return []
    finally:
        if conn:
            conn.close()

def get_community_posts(category=None, limit=50):
    """Get community posts"""
    conn = None
    try:
        conn = get_db_connection_simple()
        if not conn:
            return []
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        if category:
            cursor.execute(
                """
                SELECT cp.*, 'Anonymous' as author_name 
                FROM community_posts cp
                WHERE cp.category = %s
                ORDER BY cp.created_at DESC 
                LIMIT %s
                """,
                (category, limit)
            )
        else:
            cursor.execute(
                """
                SELECT cp.*, 'Anonymous' as author_name 
                FROM community_posts cp
                ORDER BY cp.created_at DESC 
                LIMIT %s
                """,
                (limit,)
            )
        
        results = cursor.fetchall()
        cursor.close()
        return results
    except Exception as e:
        print(f"Error fetching community posts: {e}")
        return []
    finally:
        if conn:
            conn.close()

def get_legal_rights(category=None):
    """Get legal rights information"""
    conn = None
    try:
        conn = get_db_connection_simple()
        if not conn:
            return []
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        if category:
            cursor.execute(
                "SELECT * FROM legal_rights WHERE category = %s ORDER BY created_at DESC",
                (category,)
            )
        else:
            cursor.execute("SELECT * FROM legal_rights ORDER BY created_at DESC")
        
        results = cursor.fetchall()
        cursor.close()
        return results
    except Exception as e:
        print(f"Error fetching legal rights: {e}")
        return []
    finally:
        if conn:
            conn.close()

# Cache database queries for better performance
@st.cache_data(ttl=300)  # Cache for 5 minutes
def get_jobs_cached():
    return get_all_jobs()

@st.cache_data(ttl=300)
def get_courses_cached():
    return get_all_courses()

@st.cache_data(ttl=300)
def get_stories_cached():
    return get_success_stories()

@st.cache_data(ttl=300)
def get_mentors_cached():
    return get_mentors()
