"""
Simple test script to verify the API is working
"""
import requests
import json

API_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("Testing /health endpoint...")
    try:
        response = requests.get(f"{API_URL}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_load_model(model_path):
    """Test loading a model"""
    print(f"\nTesting /load-model endpoint with {model_path}...")
    try:
        response = requests.post(
            f"{API_URL}/load-model",
            json={"model_file": model_path}
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_detection(image_path):
    """Test detection endpoint"""
    print(f"\nTesting /detect endpoint with {image_path}...")
    try:
        with open(image_path, 'rb') as f:
            files = {'image': f}
            response = requests.post(
                f"{API_URL}/detect?confidence=0.25",
                files=files
            )
        print(f"Status: {response.status_code}")
        result = response.json()
        print(f"Detections: {result.get('count', 0)}")
        if result.get('detections'):
            for det in result['detections'][:3]:  # Show first 3
                print(f"  - {det['class_name']}: {det['confidence']:.2%}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("API Test Script")
    print("=" * 50)
    
    # Test 1: Health check
    if not test_health():
        print("\nHealth check failed. Is the server running?")
        print("Start server with: python -m src.api.main")
        exit(1)
    
    # Test 2: Load model (optional)
    import sys
    if len(sys.argv) > 1:
        model_path = sys.argv[1]
        test_load_model(model_path)
    
    # Test 3: Detection (optional - requires image file)
    if len(sys.argv) > 2:
        image_path = sys.argv[2]
        test_detection(image_path)
    
    print("\nBasic API tests completed!")
    print("\nUsage:")
    print("  python src/api/test_api.py")
    print("  python src/api/test_api.py models/final/best.pt")
    print("  python src/api/test_api.py models/final/best.pt path/to/image.jpg")

