import React from "react";

const Table = ({
    columns = [],
    data = [],
    keyField = "id",
    emptyMessage = "No data found.",
    onRowClick,
    className = "",
}) => {
    return (
        <div
            className={`w-full overflow-hidden rounded-xl border border-gray-200 bg-white ${className}`}
        >
            <div className="w-full overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    scope="col"
                                    className={`px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 ${column.headerClassName || ""
                                        }`}
                                >
                                    {column.label}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100 bg-white">
                        {data.length > 0 ? (
                            data.map((row, rowIndex) => (
                                <tr
                                    key={row[keyField] ?? rowIndex}
                                    onClick={() => onRowClick?.(row)}
                                    className={`transition-colors hover:bg-gray-50 ${onRowClick ? "cursor-pointer" : ""
                                        }`}
                                >
                                    {columns.map((column) => (
                                        <td
                                            key={column.key}
                                            className={`whitespace-nowrap px-5 py-4 text-sm text-gray-700 ${column.cellClassName || ""
                                                }`}
                                        >
                                            {column.render
                                                ? column.render(row, rowIndex)
                                                : row[column.key] ?? "-"}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={columns.length || 1}
                                    className="px-5 py-10 text-center text-sm text-gray-500"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Table;