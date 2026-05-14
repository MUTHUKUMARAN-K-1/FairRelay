import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()

print("=" * 60)
print("🔍 Testing Database Connection")
print("=" * 60)

database_url = os.getenv("DATABASE_URL")

if not database_url:
    print("❌ DATABASE_URL not found in .env file!")
    exit(1)

print(f"\n📍 Connecting to: {database_url[:30]}...{database_url[-20:]}")

try:
    print("\n⏳ Attempting connection...")
    conn = psycopg2.connect(database_url)
    print("✅ Connection successful!")
    
    # Test a simple query
    cursor = conn.cursor()
    cursor.execute("SELECT version();")
    version = cursor.fetchone()
    print(f"\n✅ PostgreSQL version: {version[0][:50]}...")
    
    cursor.close()
    conn.close()
    
    print("\n🎉 Database is ready! You can now run: python init_database.py")
    
except Exception as e:
    print(f"\n❌ Connection failed!")
    print(f"Error: {e}")
    print("\n💡 Troubleshooting tips:")
    print("   1. Check if your Neon database is active (not paused)")
    print("   2. Verify the DATABASE_URL in .env file")
    print("   3. Make sure there are no quotes around the URL in .env")
    print("   4. Try removing ?channel_binding=require from the URL")

print("=" * 60)
