import re


def patch_pytube():
    """pytube 라이브러리의 일부 이슈를 패치합니다."""
    try:
        from pytube import cipher
        from pytube.cipher import get_initial_function_name

        # 패치 1: cipher.py의 get_initial_function_name 함수 수정
        original_get_initial_function_name = get_initial_function_name

        def patched_get_initial_function_name(js):
            try:
                # 첫 번째 방법 시도 (기존 방법)
                return original_get_initial_function_name(js)
            except Exception:
                # 문제가 발생하면 대체 패턴 시도
                try:
                    pattern = r'\.get\("signature",(?P<sig_function>[^(]+)\('
                    regex = re.compile(pattern)
                    match = regex.search(js)
                    if match:
                        return match.group('sig_function')

                    # 또 다른 대체 패턴
                    pattern = r'\.signatureTimestamp=(.*?);'
                    regex = re.compile(pattern)
                    match = regex.search(js)
                    if match:
                        # 다른 방법으로 처리 (이 경우 타임스탬프만 추출)
                        return None  # 여기서는 None 반환하고 나중에 처리
                except:
                    pass

                # 기본값 - 이 부분은 실제 환경에 맞게 수정하세요
                return "NO_FUNCTION_FOUND"

        # 원래 함수를 패치된 함수로 교체
        if hasattr(cipher, 'get_initial_function_name'):
            cipher.get_initial_function_name = patched_get_initial_function_name

        print("pytube 패치 적용 완료")

    except ImportError:
        print("pytube가 설치되지 않았습니다.")
    except Exception as e:
        print(f"pytube 패치 중 오류 발생: {str(e)}")


if __name__ == "__main__":
    patch_pytube()