const PaginationControls = ({ pagination, page, setPage }) => {
  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-sm dark:border-gray-700">
      <span>Tổng: {pagination.total || 0}</span>
      <div className="flex gap-2 items-center">
        <button
          type="button"
          disabled={!pagination.hasPrev}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:opacity-50"
        >
          Trước
        </button>
        <span>
          Trang {pagination.page || page} / {pagination.totalPages || 1}
        </span>
        <button
          type="button"
          disabled={!pagination.hasNext}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:opacity-50"
        >
          Sau
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;
