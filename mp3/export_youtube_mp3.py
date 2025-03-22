import os
import re
import threading
import subprocess
import sys
import time
import urllib.request
import shutil
import customtkinter as ctk
from tkinter import filedialog, messagebox


class YoutubeMP3Tab:
    def __init__(self, parent):
        self.parent = parent
        self.output_path = os.path.expanduser("~/Downloads")  # 기본 다운로드 경로
        self.download_queue = []
        self.is_downloading = False

        # FFmpeg 경로 설정
        self.ffmpeg_path = self.get_ffmpeg_path()

        # yt-dlp 경로 설정
        self.ytdlp_path = self.get_ytdlp_path()
        if not self.ytdlp_path:
            self.download_ytdlp()
            self.ytdlp_path = self.get_ytdlp_path()

        self.setup_ui()

    def get_ffmpeg_path(self):
        """FFmpeg 바이너리 경로 가져오기"""
        # 먼저 여러 가능한 위치 확인
        possible_paths = [
            # 1. PyInstaller 번들된 경로
            os.path.join(sys._MEIPASS, 'bin', 'ffmpeg.exe') if getattr(sys, 'frozen', False) else None,
            # 2. 현재 스크립트 디렉토리 기준 상대 경로
            os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'bin', 'ffmpeg.exe'),
            # 3. 프로젝트 루트 디렉토리의 ffmpeg.exe
            os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'ffmpeg.exe'),
            # 4. 현재 작업 디렉토리의 ffmpeg.exe
            os.path.join(os.getcwd(), 'ffmpeg.exe'),
            # 5. 시스템 PATH의 ffmpeg
            'ffmpeg.exe' if sys.platform.startswith('win') else 'ffmpeg'
        ]

        # 가능한 경로들에서 존재하는 첫 번째 경로 반환
        for path in possible_paths:
            if path and os.path.exists(path):
                print(f"FFmpeg 찾음: {path}")  # 디버깅용
                return path

        # 찾지 못한 경우 기본값 반환 (시스템에 설치된 ffmpeg 사용 시도)
        print("ffmpeg.exe를 찾을 수 없어 시스템 PATH에서 찾습니다.")  # 디버깅용
        return 'ffmpeg.exe' if sys.platform.startswith('win') else 'ffmpeg'

    def get_ytdlp_path(self):
        """yt-dlp 바이너리 경로 가져오기"""
        # 먼저 여러 가능한 위치 확인
        possible_paths = [
            # 1. PyInstaller 번들된 경로
            os.path.join(sys._MEIPASS, 'bin', 'yt-dlp.exe') if getattr(sys, 'frozen', False) else None,
            # 2. 현재 스크립트 디렉토리 기준 상대 경로
            os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'bin', 'yt-dlp.exe'),
            # 3. 프로젝트 루트 디렉토리의 yt-dlp.exe
            os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'yt-dlp.exe'),
            # 4. 현재 작업 디렉토리의 yt-dlp.exe
            os.path.join(os.getcwd(), 'yt-dlp.exe'),
        ]

        # 가능한 경로들에서 존재하는 첫 번째 경로 반환
        for path in possible_paths:
            if path and os.path.exists(path):
                print(f"yt-dlp 찾음: {path}")  # 디버깅용
                return path

        # 찾지 못한 경우 None 반환
        print("yt-dlp.exe를 찾을 수 없습니다.")
        return None

    def download_ytdlp(self):
        """yt-dlp 바이너리 다운로드"""
        try:
            self.update_progress("yt-dlp 바이너리 다운로드 중...")
            print("yt-dlp 바이너리 다운로드 중...")

            # 다운로드 URL (최신 Windows 버전)
            url = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"

            # 다운로드할 위치
            download_path = os.path.join(os.getcwd(), "yt-dlp.exe")

            # 다운로드
            urllib.request.urlretrieve(url, download_path)

            # 파일이 존재하는지 확인
            if os.path.exists(download_path):
                print(f"yt-dlp 다운로드 성공: {download_path}")
                self.update_progress("yt-dlp 다운로드 완료")
                return download_path
            else:
                print("yt-dlp 다운로드 실패")
                self.update_progress("yt-dlp 다운로드 실패")
                return None

        except Exception as e:
            print(f"yt-dlp 다운로드 오류: {e}")
            self.update_progress(f"yt-dlp 다운로드 오류: {e}")
            return None

    def setup_ui(self):
        # 메인 프레임
        self.main_frame = ctk.CTkFrame(self.parent)
        self.main_frame.pack(fill="both", expand=True, padx=10, pady=10)

        # 상단 프레임 (URL 입력 및 추가 버튼)
        self.top_frame = ctk.CTkFrame(self.main_frame)
        self.top_frame.pack(fill="x", padx=10, pady=10)

        # URL 입력 필드
        self.url_label = ctk.CTkLabel(self.top_frame, text="YouTube URL:")
        self.url_label.pack(side="left", padx=5, pady=5)

        self.url_entry = ctk.CTkEntry(self.top_frame, width=400)
        self.url_entry.pack(side="left", padx=5, pady=5, fill="x", expand=True)

        # URL 추가 버튼
        self.add_button = ctk.CTkButton(self.top_frame, text="추가", command=self.add_url)
        self.add_button.pack(side="left", padx=5, pady=5)

        # 중간 프레임 (URL 리스트)
        self.middle_frame = ctk.CTkFrame(self.main_frame)
        self.middle_frame.pack(fill="both", expand=True, padx=10, pady=10)

        # URL 리스트 레이블
        self.list_label = ctk.CTkLabel(self.middle_frame, text="다운로드 대기열")
        self.list_label.pack(anchor="w", padx=5, pady=5)

        # URL 리스트박스
        self.list_frame = ctk.CTkFrame(self.middle_frame)
        self.list_frame.pack(fill="both", expand=True, padx=5, pady=5)

        self.url_listbox = ctk.CTkTextbox(self.list_frame)
        self.url_listbox.pack(fill="both", expand=True, padx=5, pady=5)

        # 하단 프레임 (출력 경로 및 다운로드 버튼)
        self.bottom_frame = ctk.CTkFrame(self.main_frame)
        self.bottom_frame.pack(fill="x", padx=10, pady=10)

        # 출력 경로 설정
        self.path_label = ctk.CTkLabel(self.bottom_frame, text="저장 경로:")
        self.path_label.pack(side="left", padx=5, pady=5)

        self.path_entry = ctk.CTkEntry(self.bottom_frame, width=300)
        self.path_entry.pack(side="left", padx=5, pady=5, fill="x", expand=True)
        self.path_entry.insert(0, self.output_path)

        self.browse_button = ctk.CTkButton(self.bottom_frame, text="찾아보기", command=self.browse_output)
        self.browse_button.pack(side="left", padx=5, pady=5)

        self.download_button = ctk.CTkButton(self.bottom_frame, text="다운로드 시작", command=self.start_download)
        self.download_button.pack(side="left", padx=5, pady=5)

        # 진행 상황
        self.progress_label = ctk.CTkLabel(self.main_frame, text="")
        self.progress_label.pack(anchor="w", padx=10, pady=5)

        self.progress_bar = ctk.CTkProgressBar(self.main_frame)
        self.progress_bar.pack(fill="x", padx=10, pady=5)
        self.progress_bar.set(0)

    def browse_output(self):
        """출력 폴더 선택 다이얼로그"""
        folder = filedialog.askdirectory()
        if folder:
            self.output_path = folder
            self.path_entry.delete(0, "end")
            self.path_entry.insert(0, folder)

    def add_url(self):
        """URL을 대기열에 추가"""
        url = self.url_entry.get().strip()
        if url:
            # YouTube 또는 YouTube Music URL 검사
            if "youtube.com" in url or "youtu.be" in url or "music.youtube.com" in url:
                self.download_queue.append(url)
                self.url_listbox.insert("end", f"{url}\n")
                self.url_entry.delete(0, "end")
                self.update_progress(f"{len(self.download_queue)}개의 URL이 대기열에 있습니다.")
            else:
                messagebox.showerror("오류", "유효한 YouTube URL이 아닙니다.")

    def sanitize_filename(self, filename):
        """파일 이름에서 유효하지 않은 문자를 제거"""
        return re.sub(r'[\\/*?:"<>|]', "", filename)

    def download_with_ytdlp(self, url, output_path):
        """yt-dlp를 사용하여 YouTube URL에서 MP3 다운로드"""
        try:
            if not self.ytdlp_path:
                self.update_progress("yt-dlp를 찾을 수 없습니다.")
                return False

            self.update_progress(f"다운로드 준비 중: {url}")

            # 출력 폴더가 없으면 생성
            if not os.path.exists(output_path):
                os.makedirs(output_path)

            # 출력 템플릿
            output_template = os.path.join(output_path, "%(title)s.%(ext)s")

            # yt-dlp 명령어 구성
            cmd = [
                self.ytdlp_path,
                "--extract-audio",
                "--audio-format", "mp3",
                "--audio-quality", "0",  # 최상 품질
                "--ffmpeg-location", os.path.dirname(self.ffmpeg_path) if os.path.dirname(self.ffmpeg_path) else ".",
                "--progress",
                "--newline",  # 각 진행 상황을 새 줄에 출력
                "--no-playlist",  # 단일 동영상만 다운로드
                "-o", output_template,
                url
            ]

            self.update_progress(f"다운로드 시작: {url}")
            print(f"실행 명령어: {' '.join(cmd)}")

            # 프로세스 실행 (Windows에서 콘솔 창 숨기기)
            startupinfo = None
            if sys.platform.startswith('win'):
                startupinfo = subprocess.STARTUPINFO()
                startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
                startupinfo.wShowWindow = 0  # SW_HIDE

            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                universal_newlines=True,
                bufsize=1,  # 라인 버퍼링
                startupinfo=startupinfo  # Windows에서 콘솔 창 숨기기
            )

            # 출력 실시간 처리
            for line in process.stdout:
                line = line.strip()
                print(f"yt-dlp 출력: {line}")

                # 진행 상황 추출 및 표시
                if "[download]" in line and "%" in line:
                    try:
                        percent_str = line.split("%")[0].split()[-1]
                        percent = float(percent_str) / 100
                        self.progress_bar.set(percent)
                        self.update_progress(f"다운로드 중: {percent_str}%")
                    except Exception as e:
                        print(f"진행률 파싱 오류: {e}")

                # 다운로드 완료 메시지 표시
                elif "[ExtractAudio]" in line:
                    self.update_progress("오디오 변환 중...")

                # 파일명 추출
                elif "Destination:" in line:
                    filename = line.split("Destination:", 1)[1].strip()
                    self.update_progress(f"파일 저장 중: {os.path.basename(filename)}")

            # 프로세스 종료 대기
            process.wait()

            # 오류 확인
            if process.returncode != 0:
                error = process.stderr.read()
                raise Exception(f"yt-dlp 오류 (코드 {process.returncode}): {error}")

            self.update_progress("다운로드 완료")
            return True

        except Exception as e:
            self.update_progress(f"다운로드 오류: {str(e)}")
            print(f"yt-dlp 오류: {str(e)}")
            return False

    def process_download_queue(self):
        """다운로드 대기열 처리"""
        self.is_downloading = True
        total_urls = len(self.download_queue)
        successful = 0

        try:
            # FFmpeg 확인
            try:
                # FFmpeg 경로 재확인
                print(f"FFmpeg 경로: {self.ffmpeg_path}")

                if not os.path.exists(self.ffmpeg_path):
                    ffmpeg_cmd = "ffmpeg"  # 시스템 PATH 사용 시도
                else:
                    ffmpeg_cmd = self.ffmpeg_path

                self.update_progress("FFmpeg 확인 중...")
                # Windows에서 콘솔 창 숨기기
                startupinfo = None
                if sys.platform.startswith('win'):
                    startupinfo = subprocess.STARTUPINFO()
                    startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
                    startupinfo.wShowWindow = 0  # SW_HIDE

                subprocess_result = subprocess.run([ffmpeg_cmd, '-version'],
                                                   check=True,
                                                   capture_output=True,
                                                   text=True,
                                                   startupinfo=startupinfo)
                print(f"FFmpeg 버전: {subprocess_result.stdout.split('\\n')[0]}")

                # yt-dlp 경로 확인
                if not self.ytdlp_path or not os.path.exists(self.ytdlp_path):
                    self.update_progress("yt-dlp를 찾을 수 없습니다. 다운로드를 시도합니다...")
                    self.ytdlp_path = self.download_ytdlp()
                    if not self.ytdlp_path:
                        raise Exception("yt-dlp를 다운로드할 수 없습니다.")

                # yt-dlp 버전 확인
                try:
                    self.update_progress("yt-dlp 버전 확인 중...")
                    # Windows에서 콘솔 창 숨기기
                    startupinfo = None
                    if sys.platform.startswith('win'):
                        startupinfo = subprocess.STARTUPINFO()
                        startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
                        startupinfo.wShowWindow = 0  # SW_HIDE

                    ytdlp_version = subprocess.run([self.ytdlp_path, '--version'],
                                                   check=True,
                                                   capture_output=True,
                                                   text=True,
                                                   startupinfo=startupinfo)
                    print(f"yt-dlp 버전: {ytdlp_version.stdout.strip()}")
                except Exception as e:
                    raise Exception(f"yt-dlp 버전 확인 실패: {str(e)}")

            except Exception as e:
                error_msg = f"FFmpeg 또는 yt-dlp 확인 중 오류 발생: {str(e)}"
                self.update_progress(error_msg)
                messagebox.showerror("오류", error_msg)
                self.is_downloading = False
                return

            self.progress_bar.set(0)
            self.update_progress("다운로드 시작...")
            print("다운로드 시작...")

            # 복사본을 만들어 순회 (원본이 변경되는 문제 방지)
            queue_copy = self.download_queue.copy()
            for idx, url in enumerate(queue_copy):
                # 진행률 표시
                progress = (idx / total_urls) if total_urls > 0 else 0
                self.progress_bar.set(progress)

                # URL 다운로드
                print(f"다운로드 중: {url}")

                # yt-dlp로 다운로드
                result = self.download_with_ytdlp(url, self.output_path)

                if result:
                    successful += 1
                    # 처리된 URL 제거
                    if url in self.download_queue:
                        self.download_queue.remove(url)

            # 다운로드 완료
            self.progress_bar.set(1)
            self.update_progress(f"다운로드 완료: {successful}/{total_urls} 성공")
            self.url_listbox.delete("1.0", "end")

            # 다운로드 폴더 열기 옵션 제공
            if successful > 0 and messagebox.askyesno("다운로드 완료", f"다운로드가 완료되었습니다. 다운로드 폴더를 열겠습니까?"):
                self.open_output_folder()

        except Exception as e:
            error_msg = f"다운로드 중 오류 발생: {str(e)}"
            print(error_msg)
            messagebox.showerror("오류", error_msg)
        finally:
            self.is_downloading = False

    def open_output_folder(self):
        """출력 폴더 열기"""
        try:
            if sys.platform.startswith('win'):
                os.startfile(self.output_path)
            elif sys.platform.startswith('darwin'):  # macOS
                subprocess.call(['open', self.output_path],
                                startupinfo=subprocess.STARTUPINFO() if hasattr(subprocess, 'STARTUPINFO') else None)
            else:  # Linux
                subprocess.call(['xdg-open', self.output_path],
                                startupinfo=subprocess.STARTUPINFO() if hasattr(subprocess, 'STARTUPINFO') else None)
        except Exception as e:
            print(f"폴더 열기 오류: {e}")

    def start_download(self):
        """다운로드 시작"""
        if self.is_downloading:
            messagebox.showinfo("정보", "이미 다운로드가 진행 중입니다.")
            return

        if not self.download_queue:
            messagebox.showinfo("정보", "다운로드할 URL이 없습니다.")
            return

        # 다운로드 버튼 비활성화
        self.download_button.configure(state="disabled", text="다운로드 중...")

        # 출력 경로 확인
        self.output_path = self.path_entry.get().strip()
        if not os.path.exists(self.output_path):
            try:
                os.makedirs(self.output_path)
                self.update_progress(f"폴더 생성됨: {self.output_path}")
            except Exception as e:
                messagebox.showerror("오류", f"출력 경로를 생성할 수 없습니다: {str(e)}")
                self.download_button.configure(state="normal", text="다운로드 시작")
                return

        # 별도 스레드에서 다운로드 시작
        try:
            self.download_thread = threading.Thread(target=self.process_download_queue)
            self.download_thread.daemon = True
            self.download_thread.start()

            # 다운로드 버튼 상태를 주기적으로 업데이트하기 위한 체크
            self.parent.after(100, self.check_download_status)

            # 디버깅 로그
            print(f"다운로드 쓰레드 시작됨: {self.download_thread.is_alive()}")
        except Exception as e:
            messagebox.showerror("오류", f"다운로드 쓰레드를 시작할 수 없습니다: {str(e)}")
            self.download_button.configure(state="normal", text="다운로드 시작")

    def check_download_status(self):
        """다운로드 상태 확인 및 UI 업데이트"""
        if hasattr(self, 'download_thread') and self.download_thread.is_alive():
            # 다운로드가 아직 진행 중
            self.parent.after(100, self.check_download_status)
        else:
            # 다운로드가 완료됨 (또는 시작되지 않음)
            self.download_button.configure(state="normal", text="다운로드 시작")

    def update_progress(self, message):
        """진행 상황 업데이트 (쓰레드 안전)"""
        try:
            # UI 요소 업데이트를 메인 스레드에서 수행 (쓰레드 안전)
            self.parent.after(0, lambda: self.progress_label.configure(text=message))
            print(message)  # 콘솔에도 출력하여 디버깅 용이하게

            # 앱의 상태 바 업데이트 (있는 경우)
            if hasattr(self.parent.master.master, 'update_status'):
                self.parent.after(0, lambda m=message: self.parent.master.master.update_status(m))
        except Exception as e:
            print(f"상태 업데이트 중 오류: {e}")  # 오류 발생 시 콘솔에 출력