import { FileSpreadsheet } from 'lucide-react';

export default function ExcelExportButton({ onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 rounded-md bg-[#FFC107] px-4 py-2 font-bold text-black transition hover:bg-[#FFCA28] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <FileSpreadsheet aria-hidden="true" size={18} />
      Export Excel
    </button>
  );
}