export const getLocalDate = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const addMonthsToLocalDate = (months: number, date = new Date()): string => {
  const targetMonth = date.getMonth() + months;
  const lastDayOfTargetMonth = new Date(date.getFullYear(), targetMonth + 1, 0).getDate();
  const result = new Date(
    date.getFullYear(),
    targetMonth,
    Math.min(date.getDate(), lastDayOfTargetMonth)
  );
  return getLocalDate(result);
};

const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const addMonthsToDateString = (dateString: string, months: number): string =>
  addMonthsToLocalDate(months, parseLocalDate(dateString));

export const isValidDateRange = (startDate: string, endDate: string): boolean =>
  Boolean(startDate && endDate && endDate >= startDate);

export const calculateDurationMonths = (startDate: string, endDate: string): number => {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86_400_000));
  return Math.max(1, Math.ceil(days / 30.4375));
};

export const formatLocalDateLong = (date = new Date()): string =>
  new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);

export const formatLocalDateShort = (date = new Date()): string =>
  new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
