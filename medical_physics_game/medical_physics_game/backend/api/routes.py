# Import the blueprint from the package
from . import api_bp

@api_bp.route('/health')
def health_check():
    return {"status": "ok"}
