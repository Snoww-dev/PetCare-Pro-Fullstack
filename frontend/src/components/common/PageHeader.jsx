import { RefreshCw } from "lucide-react";

const PageHeader = ({
  icon: Icon,
  title,
  description,
  onRefresh,
  refreshing = false,
  refreshLabel = "Làm mới",
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          {Icon && <Icon className="size-6" />}
          {title}
        </h1>
        {description && (
          <p className="text-gray-600 dark:text-gray-400 mt-1">{description}</p>
        )}
      </div>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm dark:bg-gray-900 dark:border-gray-700 disabled:opacity-60"
        >
          <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshLabel}
        </button>
      )}
    </div>
  );
};

export default PageHeader;
