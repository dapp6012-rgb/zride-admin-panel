import * as XLSX from 'xlsx-js-style';

export const exportExcel = (data, fileName, headers) => {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  const keys = headers ? Object.keys(headers) : [...new Set(data.flatMap(row => Object.keys(row)))];
  const headerLabels = headers
    ? keys.map(key => headers[key])
    : keys.map(key => key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').trim());
  const rows = data.map(row => keys.map(key => row[key] ?? ''));
  const worksheet = XLSX.utils.aoa_to_sheet([headerLabels, ...rows]);
  keys.forEach((_, columnIndex) => {
    const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c: columnIndex })];
    cell.s = { font: { bold: true } };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  const date = new Date().toISOString().slice(0, 10);
  const baseName = (fileName || 'Export').replace(/\.xlsx$/i, '');
  XLSX.writeFile(workbook, `${baseName}_${date}.xlsx`);
};

export const exportToExcel = exportExcel;