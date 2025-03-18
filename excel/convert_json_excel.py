import json


def parse_json_text(json_text):
    """JSON 텍스트 파싱"""
    try:
        json_data = json.loads(json_text)

        # 배열이 아닌 경우 배열로 변환
        if not isinstance(json_data, list):
            json_data = [json_data]

        return json_data, None
    except json.JSONDecodeError:
        return None, "유효한 JSON 형식이 아닙니다."
    except Exception as e:
        return None, f"오류: {str(e)}"


def extract_headers_from_json(json_data):
    """JSON 데이터에서 헤더(키) 추출"""
    if not json_data or len(json_data) == 0:
        return None, "유효한 JSON 데이터가 없습니다."

    # 첫 번째 객체에서 키 추출
    headers = list(json_data[0].keys())

    if not headers:
        return None, "JSON 객체에서 키를 찾을 수 없습니다."

    return headers, None


def process_json_data(json_data):
    """JSON 데이터를 엑셀용 데이터 행으로 변환"""
    if not json_data:
        return []

    # 중첩된 객체나 배열을 문자열로 변환
    processed_data = []
    for item in json_data:
        row_data = {}
        for key, value in item.items():
            if isinstance(value, (dict, list)):
                row_data[key] = json.dumps(value, ensure_ascii=False)
            else:
                row_data[key] = value
        processed_data.append(row_data)

    return processed_data
