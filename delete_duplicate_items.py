import os
import re
import shutil
import datetime


def is_duplicate_by_number(name):
    """파일 또는 폴더명에 끝에 공백(숫자) 형태가 있는지 확인"""
    # 확장자를 제외한 이름만 검사 (파일과 폴더 모두 처리 가능)
    basename = os.path.splitext(name)[0] if '.' in name else name

    # 파일명 끝에 공백(숫자) 형태가 있는지 확인
    pattern = r".*\s\([0-9]+\)$"
    return re.match(pattern, basename) is not None


def is_duplicate_by_date(filename):
    """파일명에 날짜 표시가 있는지 확인"""
    # 날짜 패턴: _YYYYMMDD 또는 _YYYY-MM-DD 등
    patterns = [
        r".*_(\d{8})$",  # _YYYYMMDD
        r".*_(\d{4}-\d{2}-\d{2})$",  # _YYYY-MM-DD
        r".*_(\d{2}-\d{2}-\d{4})$",  # _DD-MM-YYYY
        r".*_(\d{2}\.\d{2}\.\d{4})$",  # _DD.MM.YYYY
        r".*_(\d{4}\.\d{2}\.\d{2})$",  # _YYYY.MM.DD
        r".*_(\d{4}-\d{2}-\d{2}_\d{2}-\d{2})$"  # _YYYY-MM-DD_HH-MM
    ]

    # 확장자가 있는 경우 처리
    basename, ext = os.path.splitext(filename)

    for pattern in patterns:
        match = re.match(pattern, basename)
        if match:
            return match.group(1)  # 날짜 문자열 반환

    return None


def parse_date(date_str):
    """다양한 형식의 날짜 문자열을 datetime 객체로 변환"""
    formats = [
        "%Y%m%d",  # YYYYMMDD
        "%Y-%m-%d",  # YYYY-MM-DD
        "%d-%m-%Y",  # DD-MM-YYYY
        "%d.%m.%Y",  # DD.MM.YYYY
        "%Y.%m.%d",  # YYYY.MM.DD
        "%Y-%m-%d_%H-%M"  # YYYY-MM-DD_HH-MM
    ]

    for fmt in formats:
        try:
            return datetime.datetime.strptime(date_str, fmt)
        except ValueError:
            continue

    return None


def get_file_base_name(filename):
    """날짜 및 번호 패턴을 제외한 기본 파일명 추출"""
    basename, ext = os.path.splitext(filename)

    # 숫자 패턴 제거
    base_without_number = re.sub(r"\(\d+\)$", "", basename)

    # 날짜 패턴 제거
    date_patterns = [
        r"_\d{8}$",
        r"_\d{4}-\d{2}-\d{2}$",
        r"_\d{2}-\d{2}-\d{4}$",
        r"_\d{2}\.\d{2}\.\d{4}$",
        r"_\d{4}\.\d{2}\.\d{2}$",
        r"_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}$"
    ]

    base_without_date = base_without_number
    for pattern in date_patterns:
        base_without_date = re.sub(pattern, "", base_without_date)

    return base_without_date


def group_files_by_base_name(folder_path):
    """파일을 기본 이름으로 그룹화"""
    files = []
    for f in os.listdir(folder_path):
        file_path = os.path.join(folder_path, f)
        if os.path.isfile(file_path):
            files.append(f)

    groups = {}

    for file in files:
        base_name = get_file_base_name(file)
        ext = os.path.splitext(file)[1]

        # 확장자까지 포함한 그룹화 키 생성
        key = base_name + ext

        if key not in groups:
            groups[key] = []

        groups[key].append(file)

    return groups


def find_duplicate_items(folder_path):
    """주어진 폴더에서 중복 파일 찾기"""
    if not os.path.exists(folder_path):
        return [], []

    # 일반 폴더 검사: 이름 끝에 (숫자)가 있는 폴더
    all_items = os.listdir(folder_path)
    folders = [d for d in all_items if os.path.isdir(os.path.join(folder_path, d))]
    duplicate_folders = [d for d in folders if is_duplicate_by_number(d)]

    # 파일 그룹화 및 중복 검사
    file_groups = group_files_by_base_name(folder_path)

    duplicate_files = []

    for base_name, group in file_groups.items():
        if len(group) < 1:
            continue  # 중복 없음

        # 날짜 패턴을 가진 파일 처리
        files_with_dates = []
        for file in group:
            date_str = is_duplicate_by_date(file)
            if date_str:
                date = parse_date(date_str)
                if date:
                    files_with_dates.append((file, date))

        # 날짜 패턴이 있는 파일들 중 최신 것을 제외하고 모두 삭제 목록에 추가
        if files_with_dates:
            # 날짜순으로 정렬
            sorted_files = sorted(files_with_dates, key=lambda x: x[1], reverse=True)

            # 최신 파일을 제외한 나머지는 중복으로 처리
            for file, _ in sorted_files[1:]:
                duplicate_files.append(file)

            # 해당 파일들은 중복 검사에서 제외
            for file, _ in files_with_dates:
                if file in group:
                    group.remove(file)

        # 남은 파일 중 (숫자) 패턴이 있는 파일 처리
        for file in group:
            if is_duplicate_by_number(file):
                duplicate_files.append(file)

    return duplicate_files, duplicate_folders


def delete_duplicate_items(folder_path, log_callback=None):
    """중복 파일 및 폴더 삭제"""
    if not os.path.exists(folder_path):
        if log_callback:
            log_callback("폴더가 존재하지 않습니다.")
        return 0, 0

    duplicate_files, duplicate_folders = find_duplicate_items(folder_path)

    total_duplicates = len(duplicate_files) + len(duplicate_folders)
    if log_callback:
        log_callback(f"중복 항목 총 {total_duplicates}개 발견 (파일: {len(duplicate_files)}개, 폴더: {len(duplicate_folders)}개)")

    # 파일 삭제
    deleted_files = 0
    for file in duplicate_files:
        file_path = os.path.join(folder_path, file)
        try:
            os.remove(file_path)
            deleted_files += 1
            if log_callback:
                log_callback(f"삭제됨 (파일): {file}")
        except Exception as e:
            if log_callback:
                log_callback(f"삭제 실패 (파일): {file} - {str(e)}")

    # 폴더 삭제
    deleted_folders = 0
    for folder in duplicate_folders:
        folder_path_full = os.path.join(folder_path, folder)
        try:
            shutil.rmtree(folder_path_full)
            deleted_folders += 1
            if log_callback:
                log_callback(f"삭제됨 (폴더): {folder}")
        except Exception as e:
            if log_callback:
                log_callback(f"삭제 실패 (폴더): {folder} - {str(e)}")

    return deleted_files, deleted_folders


# 테스트용 코드
if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        test_path = sys.argv[1]
        print(f"테스트 폴더: {test_path}")
        deleted_files, deleted_folders = delete_duplicate_items(test_path, print)
        print(f"삭제된 파일: {deleted_files}개, 삭제된 폴더: {deleted_folders}개")
    else:
        print("사용법: python delete_duplicate_items.py <폴더경로>")
