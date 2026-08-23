import os
import subprocess

def run(cmd):
    return subprocess.run(cmd, shell=True)

commits = [
    (["\.gitignore", "DEPLOYMENT.md"], "chore: initialize repository with gitignore and deployment guidelines"),
    (["frontend/package.json", "frontend/package-lock.json"], "chore(frontend): initialize vite project and install dependencies"),
    (["frontend/vite.config.js", "frontend/tailwind.config.js", "frontend/postcss.config.js", "frontend/eslint.config.js"], "chore(frontend): configure tailwind, postcss, and eslint"),
    (["frontend/index.html", "frontend/src/main.jsx", "frontend/src/index.css"], "feat(frontend): setup react entry point and global css styles"),
    (["frontend/src/App.jsx", "frontend/src/components/Sidebar.jsx"], "feat(frontend): implement routing and main sidebar navigation layout"),
    (["frontend/src/pages/Dashboard.jsx", "frontend/src/pages/LandingPage.jsx"], "feat(frontend): build main dashboard and marketing landing page"),
    (["frontend/src/pages/ProcessingHub.jsx", "frontend/src/components/ProgressBar.jsx", "frontend/src/components/UploadZone.jsx", "frontend/src/components/PipelineSteps.jsx"], "feat(frontend): implement enrichment studio and batch processing pipeline UI"),
    (["frontend/src/pages/ProcessingJobs.jsx"], "feat(frontend): add job history tab with global pause/resume controls"),
    (["frontend/src/pages/Catalog.jsx", "frontend/src/pages/IntelligentSearch.jsx", "frontend/src/pages/Sources.jsx"], "feat(frontend): implement catalog browsing, intelligent search, and sources tabs"),
    (["frontend/src/pages/ValidationCenter.jsx", "frontend/src/pages/ProductIntelligence.jsx", "frontend/src/pages/Analytics.jsx"], "feat(frontend): build validation center, intelligence deep-dives, and analytics dashboard"),
    (["backend/requirements.txt"], "chore(backend): add python dependencies for fastapi and sqlalchemy"),
    (["backend/database.py"], "feat(backend): establish postgres database connection and schema models"),
    (["backend/pipeline/data_loaders.py", "backend/pipeline/entity_resolution.py", "backend/pipeline/attribute_extraction.py", "backend/pipeline/validation_engine.py"], "feat(backend): build core AI pipelines for resolution, extraction, and validation"),
    (["backend/pipeline/groq_client.py", "backend/ai_pipeline.py", "backend/enrichment_pipeline.py"], "feat(backend): setup robust AI orchestration with groq client fallback system"),
    (["backend/main.py", "backend/test.py", "backend/test_models.py"], "feat(backend): implement REST APIs, batch processing background tasks, and tests"),
    (["."], "chore: finalize project initialization and untracked assets")
]

for files, message in commits:
    for f in files:
        run(f"git add {f}")
    
    run(f'git commit -m "{message}"')

print("Pushing to origin...")
run("git push origin main")
