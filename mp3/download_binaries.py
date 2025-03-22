import os
import sys
import urllib.request
import zipfile
import shutil
import subprocess


def download_file(url, filepath):
    """파일 다운로드"""
    print(f"다운로드 중: {url} -> {filepath}")
    try:
        urllib.request.urlretrieve(url, filepath)
        print(f"다운로드 완료: {filepath}")
        return True
    except Exception as e:
        print(f"다운로드 실패: {e}")
        return False


def download_ffmpeg():
    """FFmpeg 다운로드 및 압축 해제"""
    print("FFmpeg 다운로드 시작...")

    # 임시 zip 파일 경로
    temp_zip = "ffmpeg_temp.zip"

    # FFmpeg 다운로드 URL (최신 버전)
    ffmpeg_url = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"

    # 다운로드
    success = download_file(ffmpeg_url, temp_zip)
    if not success:
        print("FFmpeg 다운로드 실패")
        return False

    # 압축 해제
    try:
        print("FFmpeg 압축 해제 중...")
        with zipfile.ZipFile(temp_zip, 'r') as zip_ref:
            zip_ref.extractall("ffmpeg_temp")

        # ffmpeg.exe 파일 찾기
        ffmpeg_exe = None
        for root, dirs, files in os.walk("ffmpeg_temp"):
            if "ffmpeg.exe" in files:
                ffmpeg_exe = os.path.join(root, "ffmpeg.exe")
                break

        if not ffmpeg_exe:
            print("압축 파일에서 ffmpeg.exe를 찾을 수 없습니다.")
            return False

        # 현재 디렉토리로 복사
        print(f"FFmpeg 복사 중: {ffmpeg_exe} -> ffmpeg.exe")
        shutil.copy2(ffmpeg_exe, "ffmpeg.exe")

        # 임시 파일 정리
        print("임시 파일 정리 중...")
        if os.path.exists(temp_zip):
            os.remove(temp_zip)
        if os.path.exists("ffmpeg_temp"):
            shutil.rmtree("ffmpeg_temp")

        print("FFmpeg 다운로드 및 설치 완료")
        return True

    except Exception as e:
        print(f"FFmpeg 압축 해제 중 오류 발생: {e}")
        return False


def download_ytdlp():
    """yt-dlp 다운로드"""
    print("yt-dlp 다운로드 시작...")

    # yt-dlp 다운로드 URL (최신 버전)
    ytdlp_url = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"

    # 다운로드
    success = download_file(ytdlp_url, "yt-dlp.exe")
    if success:
        print("yt-dlp 다운로드 및 설치 완료")
        return True
    else:
        print("yt-dlp 다운로드 실패")
        return False


def check_and_download_binaries():
    """필요한 바이너리가 없는 경우 다운로드"""
    # FFmpeg 확인
    ffmpeg_path = "ffmpeg.exe"
    if not os.path.exists(ffmpeg_path):
        print("FFmpeg를 찾을 수 없습니다. 다운로드를 시작합니다...")
        download_ffmpeg()
    else:
        print(f"FFmpeg를 찾았습니다: {ffmpeg_path}")

    # yt-dlp 확인
    ytdlp_path = "yt-dlp.exe"
    if not os.path.exists(ytdlp_path):
        print("yt-dlp를 찾을 수 없습니다. 다운로드를 시작합니다...")
        download_ytdlp()
    else:
        print(f"yt-dlp를 찾았습니다: {ytdlp_path}")


if __name__ == "__main__":
    print("필요한 바이너리 확인 및 다운로드 중...")
    check_and_download_binaries()
    print("완료! 엔터 키를 눌러 종료하세요.")
    input()