"""
Database Initialization Script
Run this once to create all tables and populate with sample data
"""

import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent))

from utils.database import init_database

def main():
    print("🚀 Initializing Women Empowerment Hub Database...")
    print("=" * 60)
    
    success = init_database()
    
    if success:
        print("\n✅ Database initialized successfully!")
        print("\n📊 All tables created:")
        print("   - users")
        print("   - jobs")
        print("   - courses")
        print("   - success_stories")
        print("   - resources")
        print("   - mentors")
        print("   - community_posts")
        print("   - emergency_contacts")
        print("   - health_records")
        print("   - legal_rights")
        print("\n🎉 You're all set! Run 'streamlit run streamlit_app.py' to start the app.")
    else:
        print("\n❌ Database initialization failed. Please check your DATABASE_URL in .env file.")

if __name__ == "__main__":
    main()
