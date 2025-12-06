"""
백엔드 API 엔드포인트 테스트 스크립트

모든 API 엔드포인트를 순차적으로 테스트합니다.
"""
import requests
import json
import sys

# UTF-8 출력 설정
sys.stdout.reconfigure(encoding='utf-8')

# 백엔드 URL (포트 범위 자동 감지)
BASE_URLS = [f"http://localhost:{port}" for port in range(8000, 8011)]

def find_backend():
    """백엔드 서버 찾기"""
    for url in BASE_URLS:
        try:
            response = requests.get(f"{url}/health", timeout=1)
            if response.status_code == 200:
                print(f"✅ 백엔드 서버 발견: {url}")
                return url
        except:
            continue
    print("❌ 백엔드 서버를 찾을 수 없습니다.")
    return None

def test_endpoint(method, endpoint, data=None, expected_status=200, description=""):
    """API 엔드포인트 테스트"""
    url = f"{BASE_URL}{endpoint}"
    
    print(f"\n{'='*80}")
    print(f"📌 테스트: {description or endpoint}")
    print(f"   {method} {url}")
    
    try:
        if method == "GET":
            response = requests.get(url)
        elif method == "POST":
            response = requests.post(url, json=data, headers={"Content-Type": "application/json"})
        elif method == "PUT":
            response = requests.put(url, json=data, headers={"Content-Type": "application/json"})
        elif method == "DELETE":
            response = requests.delete(url)
        else:
            print(f"❌ 지원하지 않는 메서드: {method}")
            return None
        
        print(f"   상태 코드: {response.status_code}")
        
        if response.status_code == expected_status:
            print(f"   ✅ 성공")
        else:
            print(f"   ⚠️  예상 상태 코드: {expected_status}, 실제: {response.status_code}")
        
        # 응답 내용 출력
        if response.text:
            try:
                response_json = response.json()
                print(f"   응답: {json.dumps(response_json, ensure_ascii=False, indent=2)[:500]}")
            except:
                print(f"   응답: {response.text[:500]}")
        
        return response
    
    except Exception as e:
        print(f"   ❌ 오류: {e}")
        return None

# 백엔드 서버 찾기
BASE_URL = find_backend()
if not BASE_URL:
    sys.exit(1)

print(f"\n{'='*80}")
print("🧪 백엔드 API 테스트 시작")
print(f"{'='*80}")

# 1. Health Check
test_endpoint("GET", "/health", description="Health Check")

# 2. 폴더 목록 조회
test_endpoint("GET", "/api/folders", description="폴더 목록 조회")

# 3. 폴더 생성
folder_response = test_endpoint(
    "POST", 
    "/api/folders", 
    data={"name": "테스트 폴더"},
    expected_status=201,
    description="폴더 생성"
)

folder_id = None
if folder_response and folder_response.status_code == 201:
    folder_id = folder_response.json().get("id")
    print(f"   📁 생성된 폴더 ID: {folder_id}")

# 4. 프롬프트 목록 조회
test_endpoint("GET", "/api/prompts", description="프롬프트 목록 조회")

# 5. 프롬프트 생성 (폴더 없이)
prompt1_response = test_endpoint(
    "POST",
    "/api/prompts",
    data={
        "title": "테스트 프롬프트 1",
        "text": "이것은 테스트 프롬프트입니다.",
    },
    expected_status=201,
    description="프롬프트 생성 (폴더 없이)"
)

prompt1_id = None
if prompt1_response and prompt1_response.status_code == 201:
    prompt1_id = prompt1_response.json().get("id")
    print(f"   📝 생성된 프롬프트 ID: {prompt1_id}")

# 6. 프롬프트 생성 (폴더 포함)
prompt2_response = test_endpoint(
    "POST",
    "/api/prompts",
    data={
        "title": "테스트 프롬프트 2",
        "text": "폴더가 있는 프롬프트입니다.",
        "folder_id": folder_id
    },
    expected_status=201,
    description="프롬프트 생성 (폴더 포함)"
)

prompt2_id = None
if prompt2_response and prompt2_response.status_code == 201:
    prompt2_id = prompt2_response.json().get("id")
    print(f"   📝 생성된 프롬프트 ID: {prompt2_id}")

# 7. 프롬프트 생성 (autotext 포함)
prompt3_response = test_endpoint(
    "POST",
    "/api/prompts",
    data={
        "title": "테스트 프롬프트 3",
        "text": "자동변환 텍스트가 있는 프롬프트입니다.",
        "autotext": "@testapi"
    },
    expected_status=201,
    description="프롬프트 생성 (autotext 포함)"
)

prompt3_id = None
if prompt3_response and prompt3_response.status_code == 201:
    prompt3_id = prompt3_response.json().get("id")
    print(f"   📝 생성된 프롬프트 ID: {prompt3_id}")

# 8. 특정 프롬프트 조회
if prompt1_id:
    test_endpoint("GET", f"/api/prompts/{prompt1_id}", description="특정 프롬프트 조회")

# 9. 프롬프트 수정
if prompt1_id:
    test_endpoint(
        "PUT",
        f"/api/prompts/{prompt1_id}",
        data={
            "title": "수정된 프롬프트 1",
            "text": "내용이 수정되었습니다."
        },
        description="프롬프트 수정"
    )

# 10. 자동변환 텍스트 딕셔너리 조회
test_endpoint("GET", "/api/autotexts/dict", description="자동변환 텍스트 딕셔너리 조회")

# 11. 폴더별 프롬프트 조회
if folder_id:
    test_endpoint("GET", f"/api/prompts?folder_id={folder_id}", description="폴더별 프롬프트 조회")

# 12. 폴더 수정
if folder_id:
    test_endpoint(
        "PUT",
        f"/api/folders/{folder_id}",
        data={"name": "수정된 폴더"},
        description="폴더 수정"
    )

# 13. 프롬프트 삭제
if prompt1_id:
    test_endpoint("DELETE", f"/api/prompts/{prompt1_id}", expected_status=204, description="프롬프트 삭제")

if prompt2_id:
    test_endpoint("DELETE", f"/api/prompts/{prompt2_id}", expected_status=204, description="프롬프트 삭제")

if prompt3_id:
    test_endpoint("DELETE", f"/api/prompts/{prompt3_id}", expected_status=204, description="프롬프트 삭제")

# 14. 폴더 삭제
if folder_id:
    test_endpoint("DELETE", f"/api/folders/{folder_id}", expected_status=204, description="폴더 삭제")

print(f"\n{'='*80}")
print("✅ 모든 테스트 완료")
print(f"{'='*80}")

