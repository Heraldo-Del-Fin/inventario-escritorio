import type { JSX, ReactNode } from 'react'

interface Column<T> {
  header: string
  render: (row: T) => ReactNode
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  getRowKey: (row: T) => string
}

export function Table<T>({ columns, data, getRowKey }: TableProps<T>): JSX.Element {
  return (
    <table className="table">
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.header}>{column.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={getRowKey(row)}>
            {columns.map((column) => (
              <td key={column.header}>{column.render(row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
