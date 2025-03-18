import json


def parse_odata2_text(odata_text):
    """OData 2.0 응답 텍스트 파싱"""
    try:
        odata_data = json.loads(odata_text)

        # OData v2 응답 구조 확인
        if not isinstance(odata_data, dict):
            return None, "OData 응답은 객체 형태여야 합니다."

        # 데이터 항목 추출 - OData v2는 보통 d 또는 d.results 속성에 데이터가 있음
        if "d" in odata_data:
            if "results" in odata_data["d"]:
                # 컬렉션인 경우
                return odata_data["d"]["results"], None
            else:
                # 단일 엔터티인 경우
                return [odata_data["d"]], None

        return None, "OData v2 응답에서 데이터를 찾을 수 없습니다. ('d' 속성이 없음)"
    except json.JSONDecodeError:
        return None, "유효한 JSON 형식이 아닙니다."
    except Exception as e:
        return None, f"오류: {str(e)}"


def extract_headers_from_odata2(odata_data):
    """OData 2.0 데이터에서 헤더(속성) 추출"""
    if not odata_data or len(odata_data) == 0:
        return None, "유효한 OData 데이터가 없습니다."

    # 첫 번째 객체에서 키 추출
    headers = list(odata_data[0].keys())

    # __metadata 및 __deferred 필드 제외
    headers = [h for h in headers if not h.startswith("__")]

    if not headers:
        return None, "OData 객체에서 속성을 찾을 수 없습니다."

    return headers, None


def process_odata2_data(odata_data):
    """OData 2.0 데이터를 엑셀용 데이터 행으로 변환"""
    if not odata_data:
        return []

    # 메타데이터 및 중첩 객체 처리
    processed_data = []
    for item in odata_data:
        row_data = {}
        for key, value in item.items():
            # 메타데이터 및 deferred 필드 제외
            if key.startswith("__"):
                continue

            # 중첩된 객체 처리
            if isinstance(value, dict):
                # deferred 객체 건너뛰기
                if "__deferred" in value:
                    continue
                # 메타데이터만 있는 경우 건너뛰기
                if "__metadata" in value and len(value) == 1:
                    continue
                # 나머지 중첩 객체는 JSON 문자열로 변환
                row_data[key] = json.dumps(value, ensure_ascii=False)
            elif isinstance(value, list):
                row_data[key] = json.dumps(value, ensure_ascii=False)
            else:
                row_data[key] = value
        processed_data.append(row_data)

    return processed_data