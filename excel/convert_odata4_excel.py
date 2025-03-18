import json


def parse_odata4_text(odata_text):
    """OData 4.0 응답 텍스트 파싱"""
    try:
        odata_data = json.loads(odata_text)

        # OData v4 응답 구조 확인
        if not isinstance(odata_data, dict):
            return None, "OData 응답은 객체 형태여야 합니다."

        # 데이터 항목 추출 - OData v4는 보통 value 속성에 데이터 배열이 있음
        if "value" in odata_data and isinstance(odata_data["value"], list):
            return odata_data["value"], None

        # value 속성이 없는 경우 (단일 엔터티 응답일 수 있음)
        if "value" not in odata_data:
            # 단일 엔터티는 배열로 변환
            return [odata_data], None

        return None, "OData 응답에서 데이터를 찾을 수 없습니다."
    except json.JSONDecodeError:
        return None, "유효한 JSON 형식이 아닙니다."
    except Exception as e:
        return None, f"오류: {str(e)}"


def extract_headers_from_odata(odata_data):
    """OData 데이터에서 헤더(속성) 추출"""
    if not odata_data or len(odata_data) == 0:
        return None, "유효한 OData 데이터가 없습니다."

    # 첫 번째 객체에서 키 추출
    headers = list(odata_data[0].keys())

    # @odata 접두사가 있는 메타데이터 필드 제외
    headers = [h for h in headers if not h.startswith("@odata.")]

    if not headers:
        return None, "OData 객체에서 속성을 찾을 수 없습니다."

    return headers, None


def process_odata_data(odata_data):
    """OData 데이터를 엑셀용 데이터 행으로 변환"""
    if not odata_data:
        return []

    # 중첩된 객체나 배열을 문자열로 변환, @odata 메타데이터 제외
    processed_data = []
    for item in odata_data:
        row_data = {}
        for key, value in item.items():
            # OData 메타데이터 필드 제외
            if key.startswith("@odata."):
                continue

            if isinstance(value, (dict, list)):
                row_data[key] = json.dumps(value, ensure_ascii=False)
            else:
                row_data[key] = value
        processed_data.append(row_data)

    return processed_data