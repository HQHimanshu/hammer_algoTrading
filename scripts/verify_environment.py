import asyncio
import os
from pathlib import Path
import sys

# Ensure repository root is on sys.path
repo_root = Path(__file__).resolve().parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

def check_python_version() -> bool:
    print(f"[*] Python Version: {sys.version.split()[0]}", end=" ")
    if sys.version_info >= (3, 10):
        print("-> [OK]")
        return True
    print("-> [FAIL: Requires Python 3.10+]")
    return False

def check_dependencies() -> bool:
    required = ["fastapi", "pydantic", "httpx", "aiosqlite"]
    missing = []
    for pkg in required:
        try:
            __import__(pkg)
        except ImportError:
            missing.append(pkg)

    if missing:
        print(f"[-] Missing dependencies: {', '.join(missing)} -> [FAIL]")
        return False
    print(f"[*] Core dependencies installed ({', '.join(required)}) -> [OK]")
    return True

async def check_app_configuration() -> bool:
    try:
        from app.config import get_settings
        settings = get_settings()
        print(f"[*] Configuration Loaded: {settings.PROJECT_NAME} ({settings.APP_ENV}) -> [OK]")
        print(f"    - Delta Base URL: {settings.DELTA_BASE_URL}")
        print(f"    - Trading Enabled: {settings.TRADING_ENABLED} (Safety Default)")
        print(f"    - Database Backend: {settings.DATABASE_BACKEND}")
        print(f"    - AI Provider: {settings.AI_PROVIDER} (Enabled: {settings.AI_ENABLED})")

        # Test database connectivity
        if settings.DATABASE_BACKEND == "sqlite":
            from app.database import Database
            db = Database(db_path=settings.DATABASE_PATH)
            await db.init_db()
            healthy = await db.ping_health()
            print(f"[*] SQLite Database Ping: {settings.DATABASE_PATH} -> {'[OK]' if healthy else '[FAIL]'}")
        return True
    except Exception as exc:
        print(f"[-] Configuration error: {exc} -> [FAIL]")
        return False

async def main():
    print("=" * 60)
    print(" Project Hammer - Environment Verification")
    print("=" * 60)

    py_ok = check_python_version()
    deps_ok = check_dependencies()
    cfg_ok = await check_app_configuration()

    print("=" * 60)
    if py_ok and deps_ok and cfg_ok:
        print(" System is ready for local execution and automated testing.")
    else:
        print(" Issues detected. Please resolve errors before running.")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
