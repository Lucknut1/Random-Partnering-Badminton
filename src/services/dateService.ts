export const getLocalDate = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const addMonthsToLocalDate = (months: number, date = new Date()): string => {
  const result = new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
  return getLocalDate(result);
};
