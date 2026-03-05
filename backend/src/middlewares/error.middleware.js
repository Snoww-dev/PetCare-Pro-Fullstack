export const notFoundHandler = (req, res) => {
  return res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err?.statusCode || 500;
  const message = err?.message || "Internal server error.";

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  return res.status(statusCode).json({
    message,
  });
};
