"""
Excel conversion service for PDF Tool.
Handles PDF → Excel (.xlsx) conversion with table detection.
"""
import io
import logging
from typing import Optional

import pymupdf as fitz
import pdfplumber
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

logger = logging.getLogger("pdf-tool.excel-service")


def _extract_tables_from_page(pdf_bytes: bytes, page_idx: int) -> list[list[list[str]]]:
    """
    Extract tables from a specific PDF page using pdfplumber.
    Returns list of tables, where each table is a list of rows,
    and each row is a list of cell strings.
    page_idx is 0-indexed.
    """
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            if page_idx >= len(pdf.pages):
                return []
            page = pdf.pages[page_idx]
            tables = page.extract_tables()
            if not tables:
                return []

            # Clean up cell values
            cleaned_tables = []
            for table in tables:
                cleaned_table = []
                for row in table:
                    cleaned_row = [
                        (cell.strip() if cell else "") for cell in row
                    ]
                    # Skip completely empty rows
                    if any(c for c in cleaned_row):
                        cleaned_table.append(cleaned_row)
                if cleaned_table:
                    cleaned_tables.append(cleaned_table)

            return cleaned_tables
    except Exception as e:
        logger.warning(f"Table extraction failed for page {page_idx + 1}: {e}")
        return []


def _extract_text_lines(pdf_bytes: bytes, page_idx: int) -> list[str]:
    """
    Extract text lines from a page (non-table content).
    page_idx is 0-indexed.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    try:
        page = doc[page_idx]
        text = page.get_text("text")
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        return lines
    finally:
        doc.close()


def _style_header_row(ws, row_num: int, max_col: int):
    """Apply header styling to the first row."""
    header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    thin_border = Border(
        left=Side(style="thin"),
        right=Side(style="thin"),
        top=Side(style="thin"),
        bottom=Side(style="thin"),
    )

    for col in range(1, max_col + 1):
        cell = ws.cell(row=row_num, column=col)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = thin_border


def _auto_fit_columns(ws):
    """Auto-fit column widths based on content."""
    for col in ws.columns:
        max_length = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            if cell.value:
                max_length = max(max_length, len(str(cell.value)))
        adjusted_width = min(max(max_length + 2, 8), 50)
        ws.column_dimensions[col_letter].width = adjusted_width


def _try_convert_number(value: str) -> any:
    """Try to convert a string value to a number for Excel."""
    if not value:
        return value
    # Remove common thousand separators
    cleaned = value.replace(".", "").replace(",", ".")
    try:
        if "." in cleaned:
            return float(cleaned)
        return int(cleaned)
    except ValueError:
        pass
    # Try original value
    try:
        return float(value)
    except ValueError:
        pass
    return value


def pdf_to_excel(
    pdf_bytes: bytes,
    mode: str = "automatic",
    pages: list[int] = None,
) -> bytes:
    """
    Convert PDF to Excel (.xlsx).

    Args:
        pdf_bytes: PDF file content
        mode: "automatic", "detect_tables", "one_page_one_sheet", "all_pages_one_sheet"
        pages: optional list of page numbers (1-indexed). None = all pages

    Returns:
        XLSX file content as bytes
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    total = len(doc)
    doc.close()

    target_pages = pages if pages else list(range(1, total + 1))
    target_pages = [p for p in target_pages if 1 <= p <= total]

    wb = Workbook()
    # Remove the default sheet
    wb.remove(wb.active)

    thin_border = Border(
        left=Side(style="thin"),
        right=Side(style="thin"),
        top=Side(style="thin"),
        bottom=Side(style="thin"),
    )

    if mode == "detect_tables":
        # Only extract detected tables
        table_num = 0
        for p in target_pages:
            tables = _extract_tables_from_page(pdf_bytes, p - 1)
            for table in tables:
                table_num += 1
                ws = wb.create_sheet(title=f"Table {table_num}")

                for row_idx, row in enumerate(table, 1):
                    for col_idx, cell_value in enumerate(row, 1):
                        cell = ws.cell(row=row_idx, column=col_idx)
                        cell.value = _try_convert_number(cell_value) if cell_value else ""
                        cell.border = thin_border
                        cell.font = Font(name="Calibri", size=11)

                if table:
                    _style_header_row(ws, 1, len(table[0]))
                _auto_fit_columns(ws)

        if table_num == 0:
            # No tables found, add info sheet
            ws = wb.create_sheet(title="Info")
            ws.cell(row=1, column=1, value="No tables detected in the PDF")
            ws.cell(row=2, column=1, value="Try 'One Page = One Sheet' mode instead")

    elif mode == "one_page_one_sheet":
        # Each page becomes a separate sheet
        for p in target_pages:
            ws = wb.create_sheet(title=f"Page {p}")
            row_offset = 1

            # First try tables
            tables = _extract_tables_from_page(pdf_bytes, p - 1)
            if tables:
                for table in tables:
                    for row_idx, row in enumerate(table):
                        for col_idx, cell_value in enumerate(row, 1):
                            cell = ws.cell(row=row_offset + row_idx, column=col_idx)
                            cell.value = _try_convert_number(cell_value) if cell_value else ""
                            cell.border = thin_border
                            cell.font = Font(name="Calibri", size=11)

                    if table:
                        _style_header_row(ws, row_offset, len(table[0]))
                    row_offset += len(table) + 2  # Gap between tables
            else:
                # No tables, extract text lines
                lines = _extract_text_lines(pdf_bytes, p - 1)
                for i, line in enumerate(lines, 1):
                    ws.cell(row=i, column=1, value=line)
                    ws.cell(row=i, column=1).font = Font(name="Calibri", size=11)

            _auto_fit_columns(ws)

    elif mode == "all_pages_one_sheet":
        # All pages in one sheet
        ws = wb.create_sheet(title="All Pages")
        row_offset = 1

        for p in target_pages:
            # Add page header
            ws.cell(row=row_offset, column=1, value=f"--- Page {p} ---")
            ws.cell(row=row_offset, column=1).font = Font(
                name="Calibri", size=12, bold=True, color="4472C4"
            )
            row_offset += 1

            tables = _extract_tables_from_page(pdf_bytes, p - 1)
            if tables:
                for table in tables:
                    for row_idx, row in enumerate(table):
                        for col_idx, cell_value in enumerate(row, 1):
                            cell = ws.cell(row=row_offset + row_idx, column=col_idx)
                            cell.value = _try_convert_number(cell_value) if cell_value else ""
                            cell.border = thin_border
                            cell.font = Font(name="Calibri", size=11)

                    if table:
                        _style_header_row(ws, row_offset, len(table[0]))
                    row_offset += len(table) + 1
            else:
                lines = _extract_text_lines(pdf_bytes, p - 1)
                for line in lines:
                    ws.cell(row=row_offset, column=1, value=line)
                    ws.cell(row=row_offset, column=1).font = Font(name="Calibri", size=11)
                    row_offset += 1

            row_offset += 2  # Gap between pages

        _auto_fit_columns(ws)

    else:
        # Automatic mode: try detect_tables first, fallback to one_page_one_sheet
        has_tables = False
        for p in target_pages:
            tables = _extract_tables_from_page(pdf_bytes, p - 1)
            if tables:
                has_tables = True
                break

        if has_tables:
            # Use detect_tables mode
            table_num = 0
            for p in target_pages:
                tables = _extract_tables_from_page(pdf_bytes, p - 1)
                for table in tables:
                    table_num += 1
                    ws = wb.create_sheet(title=f"Table {table_num}")

                    for row_idx, row in enumerate(table, 1):
                        for col_idx, cell_value in enumerate(row, 1):
                            cell = ws.cell(row=row_idx, column=col_idx)
                            cell.value = _try_convert_number(cell_value) if cell_value else ""
                            cell.border = thin_border
                            cell.font = Font(name="Calibri", size=11)

                    if table:
                        _style_header_row(ws, 1, len(table[0]))
                    _auto_fit_columns(ws)
        else:
            # Fallback to one page one sheet
            for p in target_pages:
                ws = wb.create_sheet(title=f"Page {p}")
                lines = _extract_text_lines(pdf_bytes, p - 1)
                for i, line in enumerate(lines, 1):
                    ws.cell(row=i, column=1, value=line)
                    ws.cell(row=i, column=1).font = Font(name="Calibri", size=11)
                _auto_fit_columns(ws)

    # Ensure at least one sheet
    if len(wb.sheetnames) == 0:
        ws = wb.create_sheet(title="Sheet1")
        ws.cell(row=1, column=1, value="No content extracted from PDF")

    # Save to bytes
    output = io.BytesIO()
    wb.save(output)
    result = output.getvalue()

    logger.info(f"PDF → Excel: {len(target_pages)} pages, mode={mode}, {len(result)} bytes")
    return result
