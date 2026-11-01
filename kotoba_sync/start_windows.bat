@echo off
rem ことば帳 동기화 서버 (창 없이 실행하려면 python 대신 pythonw 사용)
cd /d "%~dp0"
start "" pythonw sync_server.py serve
