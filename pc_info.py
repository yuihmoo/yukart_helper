import os
import psutil
import customtkinter as ctk
from tkinter import ttk


class PcInfo(ctk.CTkFrame):
    def __init__(self, parent):
        super().__init__(parent)
        self.parent = parent

        # 페이지 레이아웃 구성
        self.pack(fill="both", expand=True)

        # 타이틀 라벨
        title_label = ctk.CTkLabel(
            self,
            text="컴퓨터 드라이브 및 폴더 용량 확인",
            font=ctk.CTkFont(size=20, weight="bold")
        )
        title_label.pack(pady=20)

        # 옵션 프레임
        option_frame = ctk.CTkFrame(self)
        option_frame.pack(fill="x", padx=20, pady=10)

        ctk.CTkLabel(option_frame, text="최소 용량 (MB):").pack(side="left", padx=10)

        self.min_size_var = ctk.StringVar(value="1")
        min_size_entry = ctk.CTkEntry(
            option_frame,
            textvariable=self.min_size_var,
            width=100
        )
        min_size_entry.pack(side="left", padx=10)

        # 새로고침 버튼
        refresh_button = ctk.CTkButton(
            option_frame,
            text="새로고침",
            command=self.update_drive_info,
            fg_color="#2196F3"
        )
        refresh_button.pack(side="right", padx=10)

        # 트리뷰 스크롤 프레임
        tree_scroll = ctk.CTkScrollableFrame(self)
        tree_scroll.pack(fill="both", expand=True, padx=20, pady=10)

        # 트리뷰 컬럼 설정
        columns = ("type", "path", "size", "used", "free", "percent")
        self.tree = ttk.Treeview(tree_scroll, columns=columns, show="tree headings")

        # 트리뷰 헤더 설정
        self.tree.heading("#0", text="항목")
        self.tree.heading("type", text="유형")
        self.tree.heading("path", text="경로")
        self.tree.heading("size", text="전체 용량")
        self.tree.heading("used", text="사용 용량")
        self.tree.heading("free", text="남은 용량")
        self.tree.heading("percent", text="사용 비율")

        # 컬럼 너비 설정
        self.tree.column("#0", width=200)
        self.tree.column("type", width=100, anchor="center")
        self.tree.column("path", width=300)
        self.tree.column("size", width=150, anchor="center")
        self.tree.column("used", width=150, anchor="center")
        self.tree.column("free", width=150, anchor="center")
        self.tree.column("percent", width=100, anchor="center")

        self.tree.pack(fill="both", expand=True)

        # 이벤트 바인딩
        self.tree.bind('<Double-1>', self.show_folder_details)

        # 초기 드라이브 정보 로드
        self.update_drive_info()

    def get_size_format(self, b):
        """바이트를 읽기 쉬운 형식으로 변환"""
        factor = 1024
        for unit in ["", "K", "M", "G", "T", "P"]:
            if b < factor:
                return f"{b:.2f} {unit}B"
            b /= factor

    def update_drive_info(self):
        """드라이브 정보 업데이트"""
        # 기존 아이템 제거
        for i in self.tree.get_children():
            self.tree.delete(i)

        # 현재 시스템의 드라이브 정보 가져오기
        partitions = psutil.disk_partitions()

        for partition in partitions:
            try:
                # 파티션 사용 정보 조회
                usage = psutil.disk_usage(partition.mountpoint)

                # 파티션 루트 노드 추가
                partition_node = self.tree.insert("", "end", text=partition.mountpoint,
                                                  open=False,  # 기본적으로 닫힌 상태
                                                  values=("파티션", partition.mountpoint,
                                                          self.get_size_format(usage.total),
                                                          self.get_size_format(usage.used),
                                                          self.get_size_format(usage.free),
                                                          f"{usage.percent}%"))

                # 각 파티션에 더미 자식 노드 추가 (하위 항목 표시용)
                self.tree.insert(partition_node, "end", text="폴더 로드 중...")

            except Exception as e:
                print(f"Error accessing {partition.mountpoint}: {e}")

    def get_folder_size(self, path):
        """폴더 크기 계산 (깊이 1)"""
        total_size = 0
        try:
            for entry in os.scandir(path):
                if entry.is_file():
                    total_size += entry.stat().st_size
                elif entry.is_dir():
                    # 최상위 폴더만 계산
                    total_size += entry.stat().st_size
        except PermissionError:
            pass
        return total_size

    def show_folder_details(self, event):
        """선택된 노드의 상세 폴더 정보 표시"""
        # 선택된 아이템 가져오기
        selected_item = self.tree.selection()
        if not selected_item:
            return

        # 선택된 노드의 경로 가져오기
        selected_node_info = self.tree.item(selected_item[0])
        node_path = selected_node_info['values'][1] if selected_node_info['values'] else None

        # 노드 경로가 없거나 유효하지 않은 경우 리턴
        if not node_path or not os.path.exists(node_path):
            return

        # 기존 하위 노드 제거
        for child in self.tree.get_children(selected_item[0]):
            self.tree.delete(child)

        # 최소 용량 설정
        min_size_mb = float(self.min_size_var.get())

        # 폴더 스캔
        self.scan_folders(node_path, selected_item[0], min_size_mb)

    def scan_folders(self, path, parent_node, min_size_mb):
        """폴더 내용 스캔 (깊이 1)"""
        try:
            for entry in os.scandir(path):
                if entry.is_dir():
                    try:
                        # 폴더 크기 계산
                        folder_size = self.get_folder_size(entry.path)

                        # 최소 크기 필터링 (MB 단위)
                        if folder_size > min_size_mb * 1024 * 1024:
                            # 트리에 추가
                            folder_node = self.tree.insert(parent_node, "end",
                                                           text=entry.name,
                                                           values=("폴더", entry.path,
                                                                   self.get_size_format(folder_size),
                                                                   "", "", ""))

                            # 하위 폴더가 있는지 확인을 위한 더미 노드 추가
                            self.tree.insert(folder_node, "end", text="폴더 로드 중...")

                    except PermissionError:
                        pass

        except Exception as e:
            print(f"Error scanning {path}: {e}")


# 단독 실행 테스트용 코드
if __name__ == "__main__":
    import customtkinter as ctk

    ctk.set_appearance_mode("dark")
    ctk.set_default_color_theme("blue")

    root = ctk.CTk()
    root.title("컴퓨터 드라이브 및 폴더 정보")
    root.geometry("1600x800")

    pc_info_frame = PcInfo(root)

    root.mainloop()