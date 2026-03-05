export const getApiErrorMessage = (error, fallback = "Đã xảy ra lỗi.") => {
  return error?.response?.data?.message || fallback;
};

