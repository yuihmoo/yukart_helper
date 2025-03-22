import customtkinter as ctk
import platform
from excel.excel_helper import ExcelHelper
from organize_folder import FolderOrganizerTab
from mp3.export_youtube_mp3 import YoutubeMP3Tab
import os

# CustomTkinter 테마 설정
ctk.set_appearance_mode("dark")  # "dark" 또는 "light"
ctk.set_default_color_theme("blue")  # "blue", "green", "dark-blue"


# 전체 앱 클래스
class App(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("yukart-helper")

        # 창 크기를 화면 크기로 설정
        self.geometry("{0}x{1}+0+0".format(self.winfo_screenwidth(), self.winfo_screenheight()))

        # 운영체제별 창 최대화 설정
        self.after(100, self.maximize_window)

        # 아이콘 설정
        icon_path = "walrus.ico"
        if os.path.exists(icon_path):
            self.iconbitmap(icon_path)

        # 상태 바
        self.status_var = ctk.StringVar()
        self.status_var.set("준비됨")
        self.status_bar = ctk.CTkLabel(self, textvariable=self.status_var, anchor="w")
        self.status_bar.pack(side="bottom", fill="x", padx=10, pady=5)

        # 탭 컨트롤
        self.tabview = ctk.CTkTabview(self)
        self.tabview.pack(fill="both", expand=True, padx=10, pady=10)

        # 폴더 정리 탭 추가
        self.tabview.add("폴더 정리")
        self.folder_organizer = FolderOrganizerTab(self.tabview.tab("폴더 정리"))

        # YouTube MP3 다운로드 탭 추가
        self.tabview.add("YouTube MP3 다운로드")
        self.youtube_mp3 = YoutubeMP3Tab(self.tabview.tab("YouTube MP3 다운로드"))

        # 엑셀 도우미 탭 추가
        self.tabview.add("엑셀 도우미")
        self.excel_helper = ExcelHelper(self.tabview.tab("엑셀 도우미"))

    def update_status(self, message):
        """상태 표시줄 메시지 업데이트"""
        self.status_var.set(message)

    def maximize_window(self):
        """운영체제에 따라 창 최대화"""
        current_os = platform.system()

        if current_os == "Windows":
            # Windows에서는 'zoomed' 상태 사용
            self.state('zoomed')
        elif current_os == "Linux":
            # Linux에서는 '-zoomed' 속성 사용
            try:
                self.attributes('-zoomed', True)
            except:
                # 일부 윈도우 매니저에서는 작동하지 않을 수 있음
                pass
        elif current_os == "Darwin":  # macOS
            # macOS에서는 별도의 명령 필요 없음 (geometry로 충분)
            pass
        else:
            # 알 수 없는 OS, 가능한 방법 시도
            try:
                self.state('zoomed')
            except:
                pass


# 단독 실행 테스트용 코드
if __name__ == "__main__":
    app = App()
    app.mainloop()