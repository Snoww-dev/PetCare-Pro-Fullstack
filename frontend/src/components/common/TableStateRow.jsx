const TableStateRow = ({
  loading,
  colSpan,
  loadingText = "Đang tải...",
  empty,
  emptyText = "Không có dữ liệu.",
}) => {
  if (loading) {
    return (
      <tr>
        <td colSpan={colSpan} className="px-4 py-10 text-center">
          {loadingText}
        </td>
      </tr>
    );
  }

  if (empty) {
    return (
      <tr>
        <td colSpan={colSpan} className="px-4 py-10 text-center">
          {emptyText}
        </td>
      </tr>
    );
  }

  return null;
};

export default TableStateRow;
