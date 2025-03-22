@echo off
echo FFmpeg 다운로드 및 설치 스크립트
echo ==============================
echo.

REM 실행 경로 확인
set SCRIPT_DIR=%~dp0

REM curl 명령어를 사용할 수 있는지 확인
curl --version >nul 2>&1
if %errorlevel% neq 0 (
    echo curl이 설치되어 있지 않습니다. Windows 10 이상에서는 기본 설치되어 있어야 합니다.
    echo curl을 설치하거나 직접 FFmpeg를 다운로드해 주세요: https://ffmpeg.org/download.html
    pause
    exit /b 1
)

echo FFmpeg 다운로드 중... (약간 시간이 걸릴 수 있습니다)

REM 임시 폴더 생성
set TEMP_DIR=%TEMP%\ffmpeg_download
if not exist "%TEMP_DIR%" mkdir "%TEMP_DIR%"

REM FFmpeg 최신 릴리스 다운로드 (윈도우용 정적 빌드)
curl -L -o "%TEMP_DIR%\ffmpeg.zip" "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"

if %errorlevel% neq 0 (
    echo FFmpeg 다운로드에 실패했습니다.
    echo 직접 FFmpeg를 다운로드해 주세요: https://ffmpeg.org/download.html
    pause
    exit /b 1
)

echo FFmpeg 압축 해제 중...

REM 압축 해제
powershell -command "Expand-Archive -Path '%TEMP_DIR%\ffmpeg.zip' -DestinationPath '%TEMP_DIR%' -Force"

if %errorlevel% neq 0 (
    echo 압축 해제에 실패했습니다.
    pause
    exit /b 1
)

echo FFmpeg 설치 중...

REM bin 폴더에 있는 ffmpeg.exe 파일 복사
for /r "%TEMP_DIR%" %%f in (ffmpeg.exe) do (
    echo %%f 파일을 복사합니다.
    copy "%%f" "%SCRIPT_DIR%" /Y
)

echo 임시 파일 정리 중...
REM 임시 파일 삭제
rmdir /s /q "%TEMP_DIR%"

echo.
if exist "%SCRIPT_DIR%\ffmpeg.exe" (
    echo FFmpeg가 성공적으로 설치되었습니다!
    echo 위치: %SCRIPT_DIR%\ffmpeg.exe
) else (
    echo FFmpeg 설치에 실패했습니다.
    echo 직접 FFmpeg를 다운로드해 주세요: https://ffmpeg.org/download.html
)

pause