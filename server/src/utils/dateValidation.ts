export interface DateRangeValidationResult {
  isValid: boolean;
  error?: string;
  startDate?: Date;
  endDate?: Date;
}

export const validateDateRange = (
  from?: any,
  to?: any
): DateRangeValidationResult => {
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (from) {
    startDate = new Date(from as string);
    if (isNaN(startDate.getTime())) {
      return { isValid: false, error: 'Invalid "from" date format. Expected YYYY-MM-DD.' };
    }
  }

  if (to) {
    endDate = new Date(to as string);
    if (isNaN(endDate.getTime())) {
      return { isValid: false, error: 'Invalid "to" date format. Expected YYYY-MM-DD.' };
    }
    // Set to end of day
    endDate.setHours(23, 59, 59, 999);
  }

  if (startDate && endDate && startDate > endDate) {
    return {
      isValid: false,
      error: 'Invalid date range: "from" date cannot be after "to" date.',
    };
  }

  return { isValid: true, startDate, endDate };
};
