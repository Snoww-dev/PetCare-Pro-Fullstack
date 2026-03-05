const CardSection = ({ className = "", children }) => {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 ${className}`}
    >
      {children}
    </div>
  );
};

export default CardSection;
