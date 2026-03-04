import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);

export const APP_TIMEZONE = 'Asia/Ho_Chi_Minh';
export const DATE_ONLY_FORMAT = 'YYYY-MM-DD';

export type DateInput = string | number | Date;

export function now() {
  return dayjs();
}

export function nowInTz(tz: string = APP_TIMEZONE) {
  return dayjs().tz(tz);
}

export function parseInTz(input: DateInput, tz: string = APP_TIMEZONE) {
  return dayjs(input).tz(tz);
}

export function parseDateOnlyInTz(
  value: string,
  tz: string = APP_TIMEZONE,
) {
  return dayjs.tz(value, DATE_ONLY_FORMAT, tz);
}

export function parseDateTimeInTz(
  value: string,
  format: string,
  tz: string = APP_TIMEZONE,
) {
  return dayjs.tz(value, format, tz);
}

export function toIso(input?: DateInput) {
  return (input === undefined ? dayjs() : dayjs(input)).toISOString();
}

export function formatDateOnlyInTz(input: DateInput, tz: string = APP_TIMEZONE) {
  return parseInTz(input, tz).format(DATE_ONLY_FORMAT);
}

export function addHoursInTz(
  input: DateInput,
  hours: number,
  tz: string = APP_TIMEZONE,
) {
  return parseInTz(input, tz).add(hours, 'hour');
}

export function addDaysInTz(
  input: DateInput,
  days: number,
  tz: string = APP_TIMEZONE,
) {
  return parseInTz(input, tz).add(days, 'day');
}

export function diffDaysFromDateOnly(
  fromDateOnly: string,
  toDateOnly: string,
  tz: string = APP_TIMEZONE,
) {
  const from = parseDateOnlyInTz(fromDateOnly, tz);
  const to = parseDateOnlyInTz(toDateOnly, tz);
  return to.startOf('day').diff(from.startOf('day'), 'day');
}

export function formatLocaleDateTime(
  input: DateInput,
  locale = 'vi-VN',
  options?: Intl.DateTimeFormatOptions,
  tz: string = APP_TIMEZONE,
) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: tz,
    ...options,
  }).format(parseInTz(input, tz).toDate());
}

export function formatLocaleDate(
  input: DateInput,
  locale = 'vi-VN',
  options?: Intl.DateTimeFormatOptions,
  tz: string = APP_TIMEZONE,
) {
  return formatLocaleDateTime(input, locale, options, tz);
}

export function formatLocaleTime(
  input: DateInput,
  locale = 'vi-VN',
  options?: Intl.DateTimeFormatOptions,
  tz: string = APP_TIMEZONE,
) {
  return formatLocaleDateTime(input, locale, options, tz);
}

export function formatDateTimeVi(input: DateInput) {
  return formatLocaleDateTime(input, 'vi-VN');
}

export function currentYearInTz(tz: string = APP_TIMEZONE) {
  return nowInTz(tz).year();
}
