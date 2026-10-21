import csv
import tempfile
import unittest
from decimal import Decimal
from pathlib import Path

from openpyxl import Workbook

from python.report_reader import ReportReadError, read_latest_reports, read_report

PROJECT_ROOT = Path(__file__).resolve().parents[2]

class ReportReaderTests(unittest.TestCase):
    def test_reads_latest_report_files(self):
        reports = read_latest_reports(PROJECT_ROOT)

        self.assertEqual(reports["pix"].kind, "pix")
        self.assertEqual(reports["pix"].value_column, "Quantidade de Transacoes")
        self.assertEqual(sum((row.value for row in reports["pix"].rows), Decimal("0")), Decimal("2907"))
        self.assertEqual(reports["recarga"].kind, "recarga")
        self.assertEqual(reports["recarga"].value_column, "Valor Total")
        self.assertEqual(sum((row.value for row in reports["recarga"].rows), Decimal("0")), Decimal("2400"))
        self.assertTrue(all(isinstance(row.operator, str) for report in reports.values() for row in report.rows))

    def test_reads_xlsx_with_numeric_cells(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            path = Path(temporary_directory) / "recarga.xlsx"
            workbook = Workbook()
            worksheet = workbook.active
            worksheet.append(["Operador", "Valor Total"])
            worksheet.append([1251, 8259.69])
            workbook.save(path)

            report = read_report(path, "recarga")

        self.assertEqual(report.rows[0].operator, "1251")
        self.assertEqual(report.rows[0].value, Decimal("8259.69"))

    def test_reads_brazilian_decimal_text_in_xlsx(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            path = Path(temporary_directory) / "recarga.xlsx"
            workbook = Workbook()
            worksheet = workbook.active
            worksheet.append(["Operador", "Valor Total"])
            worksheet.append(["0012", "8.259,69"])
            workbook.save(path)

            report = read_report(path, "recarga")

        self.assertEqual(report.rows[0].operator, "0012")
        self.assertEqual(report.rows[0].value, Decimal("8259.69"))

    def test_reads_pix_excel_quantity_report_with_metadata_rows(self):
        path = next(PROJECT_ROOT.glob("PESQUISA_TRANSACOES_DETALHES_*.xlsx"))
        report = read_report(path, "pix")

        self.assertEqual(report.value_column, "Quantidade de Transacoes")
        self.assertEqual(len(report.rows), 46)
        self.assertEqual(sum((row.value for row in report.rows), Decimal("0")), Decimal("2907"))

    def test_rejects_fractional_transaction_count(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            path = Path(temporary_directory) / "recarga.csv"
            with path.open("w", encoding="utf-8", newline="") as target:
                writer = csv.writer(target, delimiter=";")
                writer.writerow(["Operador", "Quantidade de Transações"])
                writer.writerow(["1251", "1,5"])

            with self.assertRaises(ReportReadError):
                read_report(path, "recarga")

    def test_rejects_unexpected_headers(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            path = Path(temporary_directory) / "pix.csv"
            path.write_text("Operador;Total\n1251;10\n", encoding="utf-8")

            with self.assertRaises(ReportReadError):
                read_report(path, "pix")

    def test_rejects_money_report_for_pix(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            path = Path(temporary_directory) / "pix.csv"
            path.write_text("Operador;Valor Total\n1251;10,50\n", encoding="utf-8")

            with self.assertRaises(ReportReadError):
                read_report(path, "pix")

if __name__ == "__main__":
    unittest.main()
