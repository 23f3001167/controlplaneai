import sys
import os
import asyncio

# Dynamic path resolution to support absolute backend imports
root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if root_path not in sys.path:
    sys.path.insert(0, root_path)

# Set loop policy for local scripts (Alembic, seed, etc.)
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    print("Windows asyncio loop policy set to SelectorEventLoop.")

import uvicorn
import uvicorn.config

# Monkeypatch Uvicorn Config loop factory on Windows to bypass ProactorEventLoop override
if sys.platform == "win32":
    original_get_loop_factory = uvicorn.config.Config.get_loop_factory
    
    def patched_get_loop_factory(self):
        # Force the loop factory to create a SelectorEventLoop
        return asyncio.SelectorEventLoop
        
    uvicorn.config.Config.get_loop_factory = patched_get_loop_factory
    print("Uvicorn Windows loop factory successfully patched to SelectorEventLoop.")

if __name__ == "__main__":
    print("Starting ControlPlane.ai Backend Server on http://127.0.0.1:8000 ...")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=False)
