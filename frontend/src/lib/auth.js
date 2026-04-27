export const getMerchantContext = () => {
  const m = localStorage.getItem("merchantContext");
  if (!m) return null;
  try {
    return JSON.parse(m);
  } catch (e) {
    return null;
  }
};

export const setMerchantContext = (merchantContext) => {
  localStorage.setItem("merchantContext", JSON.stringify(merchantContext));
};

export const clearMerchantContext = () => {
  localStorage.removeItem("merchantContext");
};
