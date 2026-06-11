export default function DataTable({ columns, rows, emptyText, onRowClick }) {
  if (!rows || rows.length === 0) {
    return <div className="empty">{emptyText}</div>;
  }

  return (
    <table>
      <thead>
        <tr>
          {columns.map((column) => <th key={column.label}>{column.label}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr
            key={row.uuid || row.result_uuid || row.id || rowIndex}
            className={onRowClick ? "clickable-row" : ""}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            {columns.map((column) => (
              <td key={column.label}>
                {column.render ? column.render(row) : row[column.key] ?? ""}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
