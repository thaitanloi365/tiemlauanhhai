import {
  APP_TIMEZONE,
  DATE_ONLY_FORMAT,
  type DateInput,
  diffDaysFromDateOnly,
  parseDateOnlyInTz,
  parseInTz,
} from '@/lib/date';
import {
  SCHEDULED_SLOTS,
  type ScheduledSlotValue,
} from '@/lib/constants/order';

export type ScheduledSlotRuleFailureReason =
  | 'invalid_date'
  | 'invalid_slot'
  | 'past_date'
  | 'too_far_date'
  | 'after_daily_cutoff'
  | 'slot_exceeds_daily_cutoff'
  | 'slot_started';

type SlotRuleSuccess = {
  ok: true;
  slot: (typeof SCHEDULED_SLOTS)[ScheduledSlotValue];
};

type SlotRuleFailure = {
  ok: false;
  reason: ScheduledSlotRuleFailureReason;
  cutoffHour?: number;
};

type SlotRuleResult = SlotRuleSuccess | SlotRuleFailure;

export function getScheduledDateCutoffHour(scheduledDate: string) {
  const dayOfWeek = parseDateOnlyInTz(scheduledDate).day();
  return dayOfWeek === 0 || dayOfWeek === 6 ? 16 : 14;
}

export function validateScheduledSlotByRules(
  scheduledDate: string,
  scheduledSlot: ScheduledSlotValue,
  now: DateInput,
): SlotRuleResult {
  const parsedDate = parseDateOnlyInTz(scheduledDate);
  if (!parsedDate.isValid()) {
    return { ok: false, reason: 'invalid_date' };
  }

  const slot = SCHEDULED_SLOTS[scheduledSlot];
  if (!slot) {
    return { ok: false, reason: 'invalid_slot' };
  }

  const vnNow = parseInTz(now, APP_TIMEZONE);
  const diffDays = diffDaysFromDateOnly(
    vnNow.format(DATE_ONLY_FORMAT),
    scheduledDate,
    APP_TIMEZONE,
  );
  const cutoffHour = getScheduledDateCutoffHour(scheduledDate);

  if (diffDays < 0) {
    return { ok: false, reason: 'past_date' };
  }
  if (diffDays > 7) {
    return { ok: false, reason: 'too_far_date' };
  }
  if (diffDays === 0) {
    const currentHour = vnNow.hour();
    const currentMinuteOfDay = currentHour * 60 + vnNow.minute();
    const slotStartMinute = slot.startHour * 60;
    if (currentHour >= cutoffHour) {
      return { ok: false, reason: 'after_daily_cutoff', cutoffHour };
    }
    if (slot.endHour > cutoffHour) {
      return { ok: false, reason: 'slot_exceeds_daily_cutoff', cutoffHour };
    }
    if (slotStartMinute < currentMinuteOfDay) {
      return { ok: false, reason: 'slot_started' };
    }
  }

  return { ok: true, slot };
}

export function getAvailableScheduledSlotsForDate(
  scheduledDate: string,
  now: DateInput,
) {
  return (Object.keys(SCHEDULED_SLOTS) as ScheduledSlotValue[]).filter((slotValue) =>
    validateScheduledSlotByRules(scheduledDate, slotValue, now).ok,
  );
}
