export const paiseToRupees = (paise) => {
  return paise / 100;
};

export const formatRupees = (rupees) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(rupees);
};

export const formatPaise = (paise) => {
  return formatRupees(paiseToRupees(paise));
};
