import os
import shutil
import threading
import sqlite3
import datetime
import customtkinter as ctk
from tkinter import messagebox, filedialog

from delete_duplicate_items import delete_duplicate_items


class FolderOrganizerTab(ctk.CTkFrame):
    def __init__(self, parent):
        super().__init__(parent)
        self.parent = parent
        self.target_folder = None
        self.keywords = []
        self.keyword_frames = {}  # 키워드별 프레임 저장

        # 데이터베이스 초기화
        self.db_path = os.path.join(os.path.expanduser("~"), ".yukart_helper.db")
        self.init_database()

        # 키워드 이력 로드
        self.keyword_history = self.load_keyword_history()

        # 자주 사용되는 확장자 목록
        self.important_extensions = [
            '.exe', '.dll', '.msi',  # 실행 파일
            '.mp3', '.wav', '.mp4', '.avi',  # 미디어 파일
            '.jpg', '.png', '.gif', '.bmp',  # 이미지 파일
            '.pdf', '.docx', '.xlsx', '.pptx'  # 문서 파일
        ]

        # 메인 프레임 구성
        self.pack(fill="both", expand=True)

        # 고정된 하단 버튼 영역 (스크롤 영역 밖에 위치)
        self.button_frame = ctk.CTkFrame(self)
        self.button_frame.pack(side="bottom", fill="x", padx=20, pady=10)

        # 실행 버튼 - 하단에 고정
        self.run_button = ctk.CTkButton(
            self.button_frame,
            text="파일 정리 시작",
            command=self.start_organizing,
            font=ctk.CTkFont(size=16, weight="bold"),
            height=50,
            fg_color="#FF5722",
            hover_color="#E64A19",
            width=200
        )
        self.run_button.pack(side="right", padx=20, pady=10)

        # 스크롤 가능한 콘텐츠 영역
        self.content_frame = ctk.CTkScrollableFrame(self)
        self.content_frame.pack(fill="both", expand=True, padx=10, pady=10)

        # 1. 폴더 선택 프레임
        folder_frame = ctk.CTkFrame(self.content_frame)
        folder_frame.pack(fill="x", padx=10, pady=10)

        ctk.CTkLabel(folder_frame, text="대상 폴더 선택", font=ctk.CTkFont(size=16, weight="bold")).pack(anchor="w", padx=10,
                                                                                                   pady=(10, 5))

        folder_select_frame = ctk.CTkFrame(folder_frame)
        folder_select_frame.pack(fill="x", padx=10, pady=5)

        # 폴더 경로 표시
        self.folder_path_var = ctk.StringVar()
        self.folder_path_var.set("폴더를 선택하세요")

        folder_entry = ctk.CTkEntry(folder_select_frame, textvariable=self.folder_path_var, width=400, state="readonly")
        folder_entry.pack(side="left", fill="x", expand=True, padx=(0, 10))

        # 폴더 선택 버튼
        folder_button = ctk.CTkButton(
            folder_select_frame,
            text="폴더 선택",
            command=self.select_folder,
            width=120
        )
        folder_button.pack(side="left", padx=5)

        # 중복 파일 삭제 체크박스
        self.remove_duplicates_var = ctk.BooleanVar()
        self.remove_duplicates_var.set(False)
        duplicate_check = ctk.CTkCheckBox(
            folder_select_frame,
            text="중복 아이템 삭제",
            variable=self.remove_duplicates_var,
            command=self.toggle_duplicate_removal
        )
        duplicate_check.pack(side="left", padx=15)

        # 2. 확장자별 파일 삭제 프레임
        extensions_frame = ctk.CTkFrame(self.content_frame)
        extensions_frame.pack(fill="x", padx=10, pady=10)

        ctk.CTkLabel(extensions_frame, text="확장자별 파일 삭제", font=ctk.CTkFont(size=16, weight="bold")).pack(anchor="w",
                                                                                                         padx=10,
                                                                                                         pady=(10, 5))

        # 임시/시스템 파일 그룹
        self.temp_group_var = ctk.BooleanVar()
        self.temp_group_var.set(False)

        ctk.CTkCheckBox(
            extensions_frame,
            text="임시/시스템 파일(.tmp, .bak, .log, .cache, .DS_Store, Thumbs.db)",
            variable=self.temp_group_var
        ).pack(anchor="w", padx=20, pady=5)

        # 압축 파일 그룹
        self.archive_group_var = ctk.BooleanVar()
        self.archive_group_var.set(False)

        ctk.CTkCheckBox(
            extensions_frame,
            text="압축 파일(.zip, .rar, .7z)",
            variable=self.archive_group_var
        ).pack(anchor="w", padx=20, pady=5)

        # 개별 확장자 체크박스 (그리드 레이아웃)
        extensions_grid = ctk.CTkFrame(extensions_frame)
        extensions_grid.pack(fill="x", padx=20, pady=5)

        self.extension_vars = {}
        columns = 4
        for i, ext in enumerate(self.important_extensions):
            var = ctk.BooleanVar()
            var.set(False)
            self.extension_vars[ext] = var

            row = i // columns
            col = i % columns

            # 각 확장자 체크박스를 프레임에 배치
            ext_checkbox = ctk.CTkCheckBox(
                extensions_grid,
                text=ext,
                variable=var
            )
            ext_checkbox.grid(row=row, column=col, sticky="w", padx=10, pady=2)

        # 사용자 정의 확장자 입력
        custom_ext_frame = ctk.CTkFrame(extensions_frame)
        custom_ext_frame.pack(fill="x", padx=20, pady=10)

        ctk.CTkLabel(custom_ext_frame, text="사용자 정의 확장자:").pack(side="left", padx=(0, 5))

        self.custom_extension_var = ctk.StringVar()
        ctk.CTkEntry(custom_ext_frame, textvariable=self.custom_extension_var, width=150).pack(side="left", padx=5)

        ctk.CTkLabel(custom_ext_frame, text="(여러 확장자는 쉼표로 구분, 예: .temp,.old)").pack(side="left", padx=5)

        # 3. 키워드 관리 프레임
        keyword_main_frame = ctk.CTkFrame(self.content_frame)
        keyword_main_frame.pack(fill="x", padx=10, pady=10)

        keyword_title_frame = ctk.CTkFrame(keyword_main_frame)
        keyword_title_frame.pack(fill="x", padx=10, pady=(10, 5))

        ctk.CTkLabel(
            keyword_title_frame,
            text="키워드 관리",
            font=ctk.CTkFont(size=16, weight="bold")
        ).pack(side="left", anchor="w", padx=10)

        # 키워드 설명
        info_frame = ctk.CTkFrame(keyword_main_frame)
        info_frame.pack(fill="x", padx=10, pady=5)

        help_text = ("파일 이름에 키워드가 포함된 경우, 해당 키워드와 동일한 이름의 폴더로 자동 이동됩니다.\n"
                     "예: 키워드 'PDF'를 추가하면 'sample_PDF_file.pdf'와 같은 파일은 'PDF' 폴더로 이동됩니다.")
        ctk.CTkLabel(info_frame, text=help_text, anchor="w", justify="left").pack(fill="x", padx=10, pady=10)

        # 키워드 관리 (리스트와 버튼)
        list_frame = ctk.CTkFrame(keyword_main_frame)
        list_frame.pack(fill="x", padx=10, pady=10)

        # 왼쪽: 키워드 목록
        self.keyword_list_frame = ctk.CTkFrame(list_frame)
        self.keyword_list_frame.pack(side="left", fill="both", expand=True, padx=(0, 10))

        # 키워드 목록 타이틀
        header_frame = ctk.CTkFrame(self.keyword_list_frame)
        header_frame.pack(fill="x", padx=10, pady=5)

        ctk.CTkLabel(
            header_frame,
            text="키워드 목록",
            font=ctk.CTkFont(weight="bold")
        ).pack(side="left", anchor="w")

        ctk.CTkLabel(
            header_frame,
            text="(클릭하여 삭제)",
            text_color="gray"
        ).pack(side="left", padx=10)

        # 키워드 목록을 표시할 스크롤 프레임
        self.keywords_scroll = ctk.CTkScrollableFrame(self.keyword_list_frame, height=150)
        self.keywords_scroll.pack(fill="both", expand=True, padx=10, pady=5)

        # 오른쪽: 버튼 프레임 & 키워드 추천
        right_frame = ctk.CTkFrame(list_frame)
        right_frame.pack(side="right", fill="y", padx=(10, 0))

        # 키워드 작업 프레임
        button_frame = ctk.CTkFrame(right_frame)
        button_frame.pack(fill="x", padx=0, pady=0)

        ctk.CTkLabel(button_frame, text="키워드 작업", font=ctk.CTkFont(weight="bold")).pack(anchor="w", padx=10, pady=5)

        # 키워드 추가 버튼
        self.add_button = ctk.CTkButton(
            button_frame,
            text="키워드 추가",
            command=self.add_keyword,
            fg_color="#2196F3",
            width=150
        )
        self.add_button.pack(padx=10, pady=10)

        # 자주 사용하는 키워드 프레임
        frequent_frame = ctk.CTkFrame(right_frame)
        frequent_frame.pack(fill="x", padx=0, pady=(20, 0))

        ctk.CTkLabel(
            frequent_frame,
            text="자주 사용하는 키워드",
            font=ctk.CTkFont(weight="bold")
        ).pack(anchor="w", padx=10, pady=5)

        # 자주 사용하는 키워드 표시 (상위 5개)
        self.freq_keywords_frame = ctk.CTkFrame(frequent_frame)
        self.freq_keywords_frame.pack(fill="x", padx=10, pady=5)

        # 자주 사용하는 키워드 버튼 추가
        self.update_frequent_keywords()

        # 4. 로그 프레임
        log_frame = ctk.CTkFrame(self.content_frame)
        log_frame.pack(fill="both", expand=True, padx=10, pady=10)

        ctk.CTkLabel(log_frame, text="작업 로그", font=ctk.CTkFont(size=16, weight="bold")).pack(anchor="w", padx=10,
                                                                                             pady=(10, 5))

        # 로그 텍스트 영역
        self.log_text = ctk.CTkTextbox(log_frame, height=200, wrap="word")
        self.log_text.pack(fill="both", expand=True, padx=10, pady=10)

        # 초기 로그 메시지
        self.add_log("폴더 정리 기능이 시작되었습니다.")
        self.add_log("대상 폴더를 선택하고, 키워드를 추가한 후 '파일 정리 시작' 버튼을 눌러주세요.")

        # 이전 키워드 로드
        self.load_recent_keywords()

    def init_database(self):
        """데이터베이스 초기화"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # 키워드 이력 테이블 생성
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS keyword_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    keyword TEXT NOT NULL,
                    used_count INTEGER DEFAULT 1,
                    last_used TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # 폴더 정리 작업 이력 테이블 생성
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS organize_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    folder_path TEXT NOT NULL,
                    keywords TEXT,
                    deleted_extensions TEXT,
                    removed_duplicates BOOLEAN,
                    moved_files INTEGER,
                    deleted_files INTEGER,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            conn.commit()
        except sqlite3.Error as e:
            print(f"데이터베이스 초기화 오류: {e}")
        finally:
            if conn:
                conn.close()

    def load_keyword_history(self):
        """데이터베이스에서 키워드 이력 로드"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            cursor.execute("SELECT keyword, used_count, last_used FROM keyword_history ORDER BY used_count DESC")
            rows = cursor.fetchall()

            history = {}
            for row in rows:
                keyword, count, last_used = row
                history[keyword] = {"count": count, "last_used": last_used}

            return history

        except sqlite3.Error as e:
            print(f"키워드 이력 로드 오류: {e}")
            return {}
        finally:
            if conn:
                conn.close()

    def load_recent_keywords(self):
        """최근에 사용한 키워드 로드"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # 가장 많이 사용된 키워드 10개 가져오기
            cursor.execute("SELECT keyword FROM keyword_history ORDER BY used_count DESC LIMIT 10")
            rows = cursor.fetchall()

            # 키워드 목록에 추가
            for row in rows:
                keyword = row[0]
                if keyword not in self.keywords:
                    self.keywords.append(keyword)

            self.update_keyword_list()

        except sqlite3.Error as e:
            print(f"최근 키워드 로드 오류: {e}")
        finally:
            if conn:
                conn.close()

    def update_frequent_keywords(self):
        """자주 사용하는 키워드 UI 업데이트"""
        # 기존 위젯 제거
        for widget in self.freq_keywords_frame.winfo_children():
            widget.destroy()

        # 사용 빈도 순으로 상위 5개 키워드 가져오기
        frequent_keywords = sorted(
            self.keyword_history.items(),
            key=lambda x: x[1]["count"],
            reverse=True
        )[:5]

        if not frequent_keywords:
            ctk.CTkLabel(
                self.freq_keywords_frame,
                text="아직 사용한 키워드가 없습니다",
                text_color="gray"
            ).pack(padx=5, pady=5)
            return

        # 자주 사용하는 키워드 버튼 추가
        for keyword, data in frequent_keywords:
            count = data["count"]
            btn = ctk.CTkButton(
                self.freq_keywords_frame,
                text=f"{keyword} ({count}회)",
                command=lambda k=keyword: self.add_frequent_keyword(k),
                fg_color="#4CAF50",
                hover_color="#388E3C",
                height=30
            )
            btn.pack(fill="x", padx=5, pady=3)

    def add_frequent_keyword(self, keyword):
        """자주 사용하는 키워드를 현재 목록에 추가"""
        if keyword not in self.keywords:
            self.keywords.append(keyword)
            self.update_keyword_list()
            self.add_log(f"자주 사용하는 키워드 추가됨: {keyword}")
        else:
            messagebox.showinfo("알림", f"'{keyword}'는 이미 목록에 있습니다.")

    def toggle_duplicate_removal(self):
        """중복 파일 삭제 옵션 변경 시 호출"""
        state = "활성화" if self.remove_duplicates_var.get() else "비활성화"
        self.add_log(f"중복 파일 삭제 기능 {state}")

    def select_folder(self):
        """대상 폴더 선택"""
        folder_path = filedialog.askdirectory(title="정리할 폴더 선택")
        if folder_path:
            self.target_folder = folder_path
            self.folder_path_var.set(folder_path)
            self.add_log(f"대상 폴더 선택됨: {folder_path}")

    def add_keyword(self):
        """새 키워드 추가"""
        dialog = ctk.CTkInputDialog(title="키워드 추가", text="새 키워드를 입력하세요:")
        keyword = dialog.get_input()

        if keyword and keyword.strip():
            keyword = keyword.strip()
            if keyword not in self.keywords:
                self.keywords.append(keyword)
                self.update_keyword_list()
                self.add_log(f"키워드 추가됨: {keyword}")
            else:
                messagebox.showwarning("중복 키워드", f"'{keyword}'는 이미 목록에 있습니다.")

    def remove_keyword(self, keyword):
        """특정 키워드 삭제"""
        if keyword in self.keywords:
            self.keywords.remove(keyword)
            self.update_keyword_list()
            self.add_log(f"키워드 삭제됨: {keyword}")

    def update_keyword_list(self):
        """키워드 목록 UI 업데이트"""
        # 기존 키워드 프레임 제거
        for widget in self.keywords_scroll.winfo_children():
            widget.destroy()

        self.keyword_frames = {}  # 키워드 프레임 초기화

        if not self.keywords:
            ctk.CTkLabel(
                self.keywords_scroll,
                text="키워드가 없습니다.\n키워드 추가 버튼을 눌러 추가하세요.",
                text_color="gray",
                justify="center"
            ).pack(pady=20)
            return

        # 각 키워드에 대한 항목 추가
        for keyword in self.keywords:
            # 키워드 항목 프레임
            keyword_frame = ctk.CTkFrame(self.keywords_scroll)
            keyword_frame.pack(fill="x", padx=5, pady=2)

            # 키워드 라벨 (클릭 가능)
            keyword_label = ctk.CTkButton(
                keyword_frame,
                text=keyword,
                fg_color="transparent",
                text_color=("gray10", "gray90"),
                hover_color=("gray70", "gray30"),
                anchor="w",
                command=lambda k=keyword: self.remove_keyword(k)
            )
            keyword_label.pack(side="left", fill="x", expand=True, padx=5, pady=2)

            # 삭제 버튼 (X)
            delete_btn = ctk.CTkButton(
                keyword_frame,
                text="X",
                width=30,
                height=24,
                fg_color="#f44336",
                hover_color="#d32f2f",
                command=lambda k=keyword: self.remove_keyword(k)
            )
            delete_btn.pack(side="right", padx=5, pady=2)

            # 프레임 저장
            self.keyword_frames[keyword] = keyword_frame

    def add_log(self, message):
        """로그 메시지 추가"""
        self.log_text.configure(state="normal")
        self.log_text.insert("end", message + "\n")
        self.log_text.see("end")
        self.log_text.configure(state="disabled")

    def record_keyword_usage(self, keywords):
        """키워드 사용 이력 DB에 기록"""
        if not keywords:
            return

        now = datetime.datetime.now().isoformat()

        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            for keyword in keywords:
                # 이미 있는 키워드인지 확인
                cursor.execute("SELECT id, used_count FROM keyword_history WHERE keyword = ?", (keyword,))
                row = cursor.fetchone()

                if row:
                    # 기존 키워드 업데이트
                    keyword_id, count = row
                    cursor.execute(
                        "UPDATE keyword_history SET used_count = ?, last_used = ? WHERE id = ?",
                        (count + 1, now, keyword_id)
                    )
                else:
                    # 새 키워드 추가
                    cursor.execute(
                        "INSERT INTO keyword_history (keyword, used_count, last_used) VALUES (?, ?, ?)",
                        (keyword, 1, now)
                    )

            conn.commit()

            # 메모리 내 이력 업데이트
            self.keyword_history = self.load_keyword_history()
            self.update_frequent_keywords()

        except sqlite3.Error as e:
            print(f"키워드 사용 기록 오류: {e}")
        finally:
            if conn:
                conn.close()

    def record_organize_task(self, task_data):
        """폴더 정리 작업 이력 기록"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            cursor.execute(
                """
                INSERT INTO organize_history 
                (folder_path, keywords, deleted_extensions, removed_duplicates, moved_files, deleted_files)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    task_data["folder_path"],
                    ",".join(task_data["keywords"]),
                    ",".join(task_data["deleted_extensions"]),
                    1 if task_data["removed_duplicates"] else 0,
                    task_data["moved_files"],
                    task_data["deleted_files"]
                )
            )

            conn.commit()
        except sqlite3.Error as e:
            print(f"작업 기록 오류: {e}")
        finally:
            if conn:
                conn.close()

    def start_organizing(self):
        """파일 정리 작업 시작"""
        if not self.target_folder:
            messagebox.showwarning("경고", "대상 폴더를 선택해주세요.")
            return

        # 확장자 삭제 옵션 확인
        selected_extensions = []

        # 개별 확장자 추가
        for ext, var in self.extension_vars.items():
            if var.get():
                selected_extensions.append(ext)

        # 임시/시스템 파일 그룹 추가
        if self.temp_group_var.get():
            selected_extensions.extend(['.tmp', '.bak', '.log', '.cache', '.DS_Store', 'Thumbs.db'])

        # 압축 파일 그룹 추가
        if self.archive_group_var.get():
            selected_extensions.extend(['.zip', '.rar', '.7z'])

        # 사용자 정의 확장자 처리
        custom_extensions = self.custom_extension_var.get().strip()
        if custom_extensions:
            custom_exts = [ext.strip() for ext in custom_extensions.split(',')]
            selected_extensions.extend(custom_exts)

        if not self.keywords and not self.remove_duplicates_var.get() and not selected_extensions:
            messagebox.showwarning("경고", "수행할 작업이 없습니다. 키워드 추가, 중복 파일 삭제, 또는 확장자별 파일 삭제 중 하나 이상을 선택해주세요.")
            return

        # 작업 요약 메시지 생성
        tasks = []
        if self.keywords:
            tasks.append(f"{len(self.keywords)}개 키워드로 파일 정리")
        if self.remove_duplicates_var.get():
            tasks.append("중복 아이템 삭제")
        if selected_extensions:
            tasks.append(f"{len(selected_extensions)}개 확장자 파일 삭제")

        task_summary = ", ".join(tasks)

        # 실행 확인
        if not messagebox.askyesno("실행 확인", f"선택한 폴더({self.target_folder})에서 다음 작업을 수행하시겠습니까?\n\n{task_summary}"):
            return

        # 키워드 사용 기록
        if self.keywords:
            self.record_keyword_usage(self.keywords)

        # 실행 쓰레드 시작
        threading.Thread(target=lambda: self.organize_files(selected_extensions), daemon=True).start()

    def delete_files_by_extension(self, folder_path, extensions):
        """지정된 확장자의 파일 삭제"""
        if not extensions:
            return 0

        deleted_count = 0

        for root, _, files in os.walk(folder_path):
            for file in files:
                file_path = os.path.join(root, file)

                # 파일 확장자 확인 (대소문자 구분 없이)
                _, ext = os.path.splitext(file.lower())

                if ext in [e.lower() for e in extensions]:
                    try:
                        os.remove(file_path)
                        self.add_log(f"삭제됨 (확장자: {ext}): {file}")
                        deleted_count += 1
                    except Exception as e:
                        self.add_log(f"삭제 실패 (확장자: {ext}): {file} - {str(e)}")

        return deleted_count

    def organize_files(self, selected_extensions):
        """파일을 키워드에 따라 정리하는 메인 함수"""
        self.status_update("파일 정리 중...")
        self.run_button.configure(state="disabled")
        self.add_log("==== 파일 정리 시작 ====")

        # 작업 데이터 초기화 (DB 기록용)
        task_data = {
            "folder_path": self.target_folder,
            "keywords": self.keywords.copy(),
            "deleted_extensions": selected_extensions.copy(),
            "removed_duplicates": self.remove_duplicates_var.get(),
            "moved_files": 0,
            "deleted_files": 0
        }

        try:
            # 확장자별 파일 삭제
            if selected_extensions:
                self.add_log(f"확장자별 파일 삭제 시작... (대상 확장자: {', '.join(selected_extensions)})")
                deleted_count = self.delete_files_by_extension(self.target_folder, selected_extensions)
                self.add_log(f"확장자별 파일 삭제 완료: {deleted_count}개 파일 삭제됨")
                task_data["deleted_files"] += deleted_count

            # 중복 파일 제거 옵션이 켜져 있으면 실행
            if self.remove_duplicates_var.get():
                self.add_log("중복 항목 검사 및 삭제 시작...")
                deleted_files, deleted_folders = delete_duplicate_items(self.target_folder, self.add_log)
                self.add_log(f"중복 항목 삭제 완료: {deleted_files}개 파일, {deleted_folders}개 폴더 삭제됨")
                task_data["deleted_files"] += deleted_files

            # 키워드가 있는 경우에만 파일 정리 실행
            if self.keywords:
                # 대상 폴더의 모든 파일 목록 가져오기
                files = [f for f in os.listdir(self.target_folder)
                         if os.path.isfile(os.path.join(self.target_folder, f))]

                self.add_log(f"총 {len(files)}개 파일 발견")

                # 키워드별 폴더 생성 및 파일 이동
                moved_files = 0
                for keyword in self.keywords:
                    # 키워드에 해당하는 폴더 경로
                    folder_path = os.path.join(self.target_folder, keyword)

                    # 폴더가 없으면 생성
                    if not os.path.exists(folder_path):
                        os.makedirs(folder_path)
                        self.add_log(f"폴더 생성됨: {keyword}")

                    # 키워드가 포함된 파일 찾아 이동
                    keyword_files = [f for f in files if keyword.lower() in f.lower()]

                    if keyword_files:
                        self.add_log(f"키워드 '{keyword}'에 해당하는 파일 {len(keyword_files)}개 발견")

                        for file in keyword_files:
                            src_path = os.path.join(self.target_folder, file)
                            dst_path = os.path.join(folder_path, file)

                            try:
                                # 이미 이동된 파일은 건너뛰기
                                if not os.path.exists(src_path):
                                    continue

                                shutil.move(src_path, dst_path)
                                self.add_log(f"파일 이동됨: {file} -> {keyword} 폴더")
                                moved_files += 1

                                # 이동된 파일은 목록에서 제거 (중복 처리 방지)
                                if file in files:
                                    files.remove(file)
                            except Exception as e:
                                self.add_log(f"오류: {file} 이동 실패 - {str(e)}")
                    else:
                        self.add_log(f"키워드 '{keyword}'에 해당하는 파일이 없습니다.")

                self.add_log(f"총 {moved_files}개 파일이 정리되었습니다.")
                task_data["moved_files"] = moved_files

            self.add_log("==== 파일 정리 완료 ====")

            # 작업 기록 DB에 저장
            self.record_organize_task(task_data)

            # 작업 완료 메시지
            messagebox.showinfo("작업 완료", "파일 정리 작업이 완료되었습니다.")

        except Exception as e:
            self.add_log(f"작업 중 오류 발생: {str(e)}")
            messagebox.showerror("오류 발생", f"작업 중 오류가 발생했습니다: {str(e)}")
        finally:
            self.status_update("준비됨")
            self.run_button.configure(state="normal")

    def status_update(self, message):
        """상태 메시지 업데이트 (메인 앱에서 구현)"""
        if hasattr(self.parent, 'update_status'):
            self.parent.update_status(message)


# 단독 실행 테스트용 코드
if __name__ == "__main__":
    ctk.set_appearance_mode("dark")
    ctk.set_default_color_theme("blue")

    root = ctk.CTk()
    root.title("폴더 정리 기능 테스트")
    root.geometry("1000x800")
    app = FolderOrganizerTab(root)
    root.mainloop()