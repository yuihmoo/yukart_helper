import xml.etree.ElementTree as ET


def parse_xml_text(xml_text):
    """XML 텍스트 파싱"""
    try:
        root = ET.fromstring(xml_text)
        return root, None
    except ET.ParseError:
        return None, "유효한 XML 형식이 아닙니다."
    except Exception as e:
        return None, f"오류: {str(e)}"


def find_repeating_elements(root):
    """XML에서 반복되는 요소 찾기"""
    # 첫 번째 수준의 자식 요소 가져오기
    child_elements = list(root)
    if not child_elements:
        return None, "XML에 자식 요소가 없습니다."

    # 가장 많이 반복되는 태그 이름 찾기
    tag_counts = {}
    for child in child_elements:
        tag = child.tag
        tag_counts[tag] = tag_counts.get(tag, 0) + 1

    # 가장 많이 반복되는 태그 찾기
    most_common_tag = max(tag_counts.items(), key=lambda x: x[1])[0]

    # 반복되는 요소들 찾기
    repeated_elements = [elem for elem in child_elements if elem.tag == most_common_tag]

    if not repeated_elements:
        return None, "XML에서 반복되는 요소를 찾을 수 없습니다."

    return repeated_elements, None


def extract_headers_from_xml(repeated_elements):
    """XML 반복 요소에서 헤더 추출"""
    if not repeated_elements or len(repeated_elements) == 0:
        return None, "반복 요소가 없습니다."

    # 첫 번째 반복 요소의 자식 태그들을 헤더로 사용
    first_element = repeated_elements[0]
    headers = [child.tag for child in first_element]

    if not headers:
        return None, "XML 요소에서 헤더를 찾을 수 없습니다."

    return headers, None


def process_xml_data(repeated_elements):
    """XML 반복 요소를 엑셀용 데이터 행으로 변환"""
    data_rows = []

    for element in repeated_elements:
        row_data = {}
        for child in element:
            row_data[child.tag] = child.text
        data_rows.append(row_data)

    return data_rows
