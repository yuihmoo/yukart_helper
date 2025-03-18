import customtkinter as ctk
from tkinter import messagebox

# 모듈 import
import excel.create_excel_ex as excel_creator
import excel.convert_json_excel as json_converter
import excel.convert_xml_excel as xml_converter
import excel.convert_odata4_excel as odata4_converter
import excel.convert_odata2_excel as odata2_converter


class ExcelHelper:
    def __init__(self, parent):
        self.parent = parent
        self.header_entries = []
        self.header_frame = None
        self.data_type = "json"  # 기본값은 json
        self.setup_ui()

    def setup_ui(self):
        # 메인 레이아웃: 좌우 분할
        self.main_frame = ctk.CTkFrame(self.parent)
        self.main_frame.pack(fill="both", expand=True, padx=10, pady=10)

        # 좌측 패널 (문서 정보 및 헤더 설정)
        self.left_panel = ctk.CTkFrame(self.main_frame)
        self.left_panel.pack(side="left", fill="both", expand=True, padx=(0, 5), pady=0)

        # 우측 패널 (데이터 입력 영역)
        self.right_panel = ctk.CTkFrame(self.main_frame)
        self.right_panel.pack(side="right", fill="both", expand=True, padx=(5, 0), pady=0)

        # 우측 패널 구성 (데이터 입력)
        self.setup_data_panel()

        # 좌측 패널 구성
        self.setup_left_panel()

        # 하단 버튼 영역 (통합 생성 버튼)
        bottom_frame = ctk.CTkFrame(self.parent)
        bottom_frame.pack(side="bottom", fill="x", padx=10, pady=10)

        # 생성 버튼
        create_btn = ctk.CTkButton(
            bottom_frame,
            text="엑셀 파일 생성",
            command=self.create_excel,
            height=50,
            font=ctk.CTkFont(size=16, weight="bold"),
            fg_color="#FF5722",
            hover_color="#E64A19",
            width=200
        )
        create_btn.pack(side="right", padx=10, pady=10)

    def setup_left_panel(self):
        # 제목 프레임
        title_frame = ctk.CTkFrame(self.left_panel)
        title_frame.pack(fill="x", padx=10, pady=10)

        # 제목 입력
        ctk.CTkLabel(
            title_frame,
            text="문서 제목:",
            font=ctk.CTkFont(size=14)
        ).grid(row=0, column=0, padx=5, pady=10, sticky="w")

        self.title_entry = ctk.CTkEntry(title_frame, width=300, height=35)
        self.title_entry.grid(row=0, column=1, padx=5, pady=10, sticky="we")
        title_frame.grid_columnconfigure(1, weight=1)

        # 헤더 프레임
        header_container = ctk.CTkFrame(self.left_panel)
        header_container.pack(fill="both", expand=True, padx=10, pady=10)

        # 헤더 제목
        header_title_frame = ctk.CTkFrame(header_container)
        header_title_frame.pack(fill="x", padx=10, pady=(10, 5))

        ctk.CTkLabel(
            header_title_frame,
            text="헤더 설정",
            font=ctk.CTkFont(size=16, weight="bold")
        ).pack(side="left", padx=10)

        # 헤더 지우기 버튼
        ctk.CTkButton(
            header_title_frame,
            text="헤더 초기화",
            command=self.clear_headers,
            height=30,
            fg_color="#9e9e9e",
            hover_color="#757575",
            width=100
        ).pack(side="right", padx=10)

        # 스크롤 가능한 프레임
        self.header_scroll = ctk.CTkScrollableFrame(header_container, height=250)
        self.header_scroll.pack(fill="both", expand=True, padx=10, pady=10)

        self.header_frame = self.header_scroll

        # 초기 헤더 추가
        self.add_header_entry()

        # 헤더 추가/제거 버튼 프레임
        btn_frame = ctk.CTkFrame(self.left_panel)
        btn_frame.pack(fill="x", padx=10, pady=10)

        # 헤더 추가 버튼
        add_btn = ctk.CTkButton(
            btn_frame,
            text="헤더 추가",
            command=self.add_header_entry,
            height=40,
            fg_color="#2196F3",
            hover_color="#1976D2"
        )
        add_btn.pack(side="left", padx=5, pady=5)

        # 헤더 제거 버튼
        remove_btn = ctk.CTkButton(
            btn_frame,
            text="헤더 제거",
            command=self.remove_header_entry,
            height=40,
            fg_color="#f44336",
            hover_color="#d32f2f"
        )
        remove_btn.pack(side="left", padx=5, pady=5)

    def setup_data_panel(self):
        """데이터 입력 패널 설정"""
        # 데이터 타입 선택 프레임
        type_frame = ctk.CTkFrame(self.right_panel)
        type_frame.pack(fill="x", padx=10, pady=10)

        ctk.CTkLabel(
            type_frame,
            text="데이터 형식:",
            font=ctk.CTkFont(size=14)
        ).pack(side="left", padx=10)

        # 데이터 타입 선택 상자
        self.data_type_var = ctk.StringVar(value="json")
        data_type_select = ctk.CTkOptionMenu(
            type_frame,
            values=["json", "xml", "odata4", "odata2"],
            variable=self.data_type_var,
            command=self.on_data_type_changed,
            width=120,
            height=35
        )
        data_type_select.pack(side="left", padx=10)

        # 데이터 입력 레이블
        ctk.CTkLabel(
            self.right_panel,
            text="데이터 입력",
            font=ctk.CTkFont(size=16, weight="bold")
        ).pack(anchor="w", padx=10, pady=(10, 5))

        # 데이터 설명 (데이터 타입에 따라 변경됨)
        self.data_desc_var = ctk.StringVar()
        self.update_data_description()

        ctk.CTkLabel(
            self.right_panel,
            textvariable=self.data_desc_var,
            justify="left",
            wraplength=350
        ).pack(fill="x", padx=10, pady=5)

        # 데이터 입력 영역
        self.data_text = ctk.CTkTextbox(self.right_panel, height=300)
        self.data_text.pack(fill="both", expand=True, padx=10, pady=10)

        # 예시 데이터 추가
        self.set_example_data()

        # 적용 버튼
        apply_btn = ctk.CTkButton(
            self.right_panel,
            text="데이터 적용하기",
            command=self.apply_data_headers,
            height=40,
            fg_color="#4CAF50",
            hover_color="#388E3C"
        )
        apply_btn.pack(padx=10, pady=10)

        # 상태 메시지
        self.data_status_var = ctk.StringVar()
        self.data_status_var.set("")
        self.data_status = ctk.CTkLabel(
            self.right_panel,
            textvariable=self.data_status_var,
            text_color="#FF9800"
        )
        self.data_status.pack(fill="x", padx=10, pady=5)

    def on_data_type_changed(self, data_type):
        """데이터 타입 변경 시 호출"""
        self.data_type = data_type
        self.update_data_description()
        self.set_example_data()
        self.data_status_var.set("")

    def update_data_description(self):
        """데이터 타입에 따라 설명 업데이트"""
        if self.data_type == "json":
            self.data_desc_var.set(
                "JSON 데이터를 붙여넣으면 자동으로 헤더가 설정됩니다.\n"
                "객체 배열 형식의 JSON이 권장됩니다. (예: [{\"키1\": \"값1\", \"키2\": \"값2\"}, ...])"
            )
        elif self.data_type == "xml":
            self.data_desc_var.set(
                "XML 데이터를 붙여넣으면 자동으로 헤더가 설정됩니다.\n"
                "반복되는 요소 구조의 XML이 권장됩니다."
            )
        elif self.data_type == "odata4":
            self.data_desc_var.set(
                "OData 4.0 응답 데이터를 붙여넣으면 자동으로 헤더가 설정됩니다.\n"
                "OData 서비스의 응답 JSON을 그대로 붙여넣으세요. (@odata 메타데이터는 자동으로 제외됩니다.)"
            )
        elif self.data_type == "odata2":
            self.data_desc_var.set(
                "OData 2.0 응답 데이터를 붙여넣으면 자동으로 헤더가 설정됩니다.\n"
                "OData v2 서비스의 응답 JSON을 그대로 붙여넣으세요. (__metadata는 자동으로 제외됩니다.)"
            )

    def set_example_data(self):
        """데이터 타입에 따라 예시 데이터 설정"""
        # 예제 데이터를 표시하지 않음
        self.data_text.delete("1.0", "end")

    def apply_data_headers(self):
        """입력 데이터에서 헤더 추출하여 적용"""
        data_text = self.data_text.get("1.0", "end-1c")
        if not data_text.strip():
            self.data_status_var.set("데이터를 입력해주세요.")
            return

        if self.data_type == "json":
            self.apply_json_headers(data_text)
        elif self.data_type == "xml":
            self.apply_xml_headers(data_text)
        elif self.data_type == "odata4":
            self.apply_odata4_headers(data_text)
        elif self.data_type == "odata2":
            self.apply_odata2_headers(data_text)

    def apply_json_headers(self, json_text):
        """JSON 텍스트에서 헤더 추출하여 적용"""
        # JSON 파싱
        json_data, error = json_converter.parse_json_text(json_text)
        if error:
            self.data_status_var.set(error)
            return

        # 헤더 추출
        headers, error = json_converter.extract_headers_from_json(json_data)
        if error:
            self.data_status_var.set(error)
            return

        # 헤더 적용
        self.clear_headers()
        for header in headers:
            self.add_header_entry(header)

        self.data_status_var.set(f"{len(headers)}개의 헤더가 적용되었습니다.")

        # 제목이 비어있으면 자동 설정
        if not self.title_entry.get().strip():
            self.title_entry.insert(0, "JSON_데이터")

    def apply_xml_headers(self, xml_text):
        """XML 텍스트에서 헤더 추출하여 적용"""
        # XML 파싱
        root, error = xml_converter.parse_xml_text(xml_text)
        if error:
            self.data_status_var.set(error)
            return

        # 반복 요소 찾기
        repeated_elements, error = xml_converter.find_repeating_elements(root)
        if error:
            self.data_status_var.set(error)
            return

        # 헤더 추출
        headers, error = xml_converter.extract_headers_from_xml(repeated_elements)
        if error:
            self.data_status_var.set(error)
            return

        # 헤더 적용
        self.clear_headers()
        for header in headers:
            self.add_header_entry(header)

        self.data_status_var.set(f"{len(headers)}개의 헤더가 적용되었습니다.")

        # 제목이 비어있으면 자동 설정
        if not self.title_entry.get().strip():
            self.title_entry.insert(0, "XML_데이터")

    def apply_odata4_headers(self, odata_text):
        """OData 4.0 텍스트에서 헤더 추출하여 적용"""
        # OData 파싱
        odata_data, error = odata4_converter.parse_odata4_text(odata_text)
        if error:
            self.data_status_var.set(error)
            return

        # 헤더 추출
        headers, error = odata4_converter.extract_headers_from_odata(odata_data)
        if error:
            self.data_status_var.set(error)
            return

        # 헤더 적용
        self.clear_headers()
        for header in headers:
            self.add_header_entry(header)

        self.data_status_var.set(f"{len(headers)}개의 헤더가 적용되었습니다.")

        # 제목이 비어있으면 자동 설정
        if not self.title_entry.get().strip():
            self.title_entry.insert(0, "OData4_데이터")

    def apply_odata2_headers(self, odata_text):
        """OData 2.0 텍스트에서 헤더 추출하여 적용"""
        # OData 파싱
        odata_data, error = odata2_converter.parse_odata2_text(odata_text)
        if error:
            self.data_status_var.set(error)
            return

        # 헤더 추출
        headers, error = odata2_converter.extract_headers_from_odata2(odata_data)
        if error:
            self.data_status_var.set(error)
            return

        # 헤더 적용
        self.clear_headers()
        for header in headers:
            self.add_header_entry(header)

        self.data_status_var.set(f"{len(headers)}개의 헤더가 적용되었습니다.")

        # 제목이 비어있으면 자동 설정
        if not self.title_entry.get().strip():
            self.title_entry.insert(0, "OData2_데이터")

    def clear_headers(self):
        """모든 헤더 항목 제거"""
        for entry in self.header_entries:
            entry.master.destroy()
        self.header_entries = []

    def add_header_entry(self, default_text=""):
        """헤더 입력 필드 추가"""
        idx = len(self.header_entries)
        frame = ctk.CTkFrame(self.header_frame)
        frame.pack(fill="x", pady=5)

        # 헤더 라벨
        label = ctk.CTkLabel(
            frame,
            text=f"헤더 {idx + 1}:",
            width=80,
            font=ctk.CTkFont(size=14)
        )
        label.pack(side="left", padx=5)

        # 헤더 입력 필드
        entry = ctk.CTkEntry(frame, width=200, height=35)
        if default_text:
            entry.insert(0, default_text)

        entry.pack(side="left", padx=5, fill="x", expand=True)

        # Enter 키 바인딩
        entry.bind("<Return>", lambda event: self.add_header_on_enter())

        self.header_entries.append(entry)

        # 포커스 설정 (기본 텍스트가 없을 때만)
        if not default_text:
            entry.focus_set()

    def add_header_on_enter(self):
        """Enter 키로 새 헤더 입력 필드 추가"""
        # 마지막 입력 필드가 비어있지 않은 경우에만 새 필드 추가
        if self.header_entries and self.header_entries[-1].get().strip():
            self.add_header_entry()

    def remove_header_entry(self):
        if len(self.header_entries) > 1:
            entry = self.header_entries.pop()
            entry.master.destroy()
        else:
            messagebox.showwarning("경고", "최소 하나의 헤더가 필요합니다.")

    def create_excel(self):
        """엑셀 파일 생성"""
        title = self.title_entry.get().strip()

        # 헤더 가져오기
        headers = [entry.get().strip() for entry in self.header_entries]

        # 입력 검증
        if not title:
            messagebox.showerror("오류", "문서 제목을 입력해주세요.")
            return

        if not headers or not all(headers):
            messagebox.showerror("오류", "모든 헤더를 입력해주세요.")
            return

        # 데이터 파싱
        data_rows = self.parse_input_data()

        # 엑셀 파일 생성
        excel_creator.create_excel_with_headers(title, headers, data_rows, self.parent)

    def parse_input_data(self):
        """입력 데이터 파싱하여 행 데이터 반환"""
        data_text = self.data_text.get("1.0", "end-1c").strip()
        if not data_text:
            return None

        try:
            if self.data_type == "json":
                json_data, error = json_converter.parse_json_text(data_text)
                if error:
                    return None
                return json_converter.process_json_data(json_data)

            elif self.data_type == "xml":
                root, error = xml_converter.parse_xml_text(data_text)
                if error:
                    return None

                repeated_elements, error = xml_converter.find_repeating_elements(root)
                if error:
                    return None

                return xml_converter.process_xml_data(repeated_elements)

            elif self.data_type == "odata4":
                odata_data, error = odata4_converter.parse_odata4_text(data_text)
                if error:
                    return None

                return odata4_converter.process_odata_data(odata_data)

            elif self.data_type == "odata2":
                odata_data, error = odata2_converter.parse_odata2_text(data_text)
                if error:
                    return None

                return odata2_converter.process_odata2_data(odata_data)

        except Exception:
            # 파싱 오류 시 데이터 없이 진행
            return None

        return None