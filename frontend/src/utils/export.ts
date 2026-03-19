export function exportToCSV(rows: Record<string, any>[], filename: string) {
    if (rows.length === 0) return;

    const headers = Object.keys(rows[0]);
    const csvRows = [
        headers.join(','),
        ...rows.map(row =>
            headers.map(h => {
                const val = row[h] ?? '';
                const str = String(val).replace(/"/g, '""');
                return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
            }).join(',')
        ),
    ];

    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
