import { bookingHelpers } from "@/components/reserve/helpers";

type ServiceState = "enabled" | "disabled";

type Scenario = {
  label: string;
  date: string;
  time: string;
};

const scenarios: Scenario[] = [
  { label: "Weekday lunch start", date: "2025-03-04", time: "12:00" },
  { label: "Weekday lunch mid", date: "2025-03-04", time: "14:30" },
  { label: "Weekday happy hour start", date: "2025-03-04", time: "15:00" },
  { label: "Weekday happy hour mid", date: "2025-03-04", time: "16:30" },
  { label: "Weekday dinner", date: "2025-03-04", time: "19:00" },
  { label: "Weekend lunch", date: "2025-03-08", time: "13:00" },
  { label: "Weekend late lunch", date: "2025-03-08", time: "16:30" },
  { label: "Weekend dinner", date: "2025-03-08", time: "19:30" },
];

function availability(date: string, time: string): Record<string, ServiceState> {
  const minutes = bookingHelpers.timeToMinutes(time);
  const windows = bookingHelpers.serviceWindows(date);
  const open = bookingHelpers.timeToMinutes("12:00");
  const close = bookingHelpers.timeToMinutes("23:00");
  const isOpen = minutes >= open && minutes < close;

  const within = (window: { start: string; end: string } | null | undefined) => {
    if (!window) return false;
    const start = bookingHelpers.timeToMinutes(window.start);
    const end = bookingHelpers.timeToMinutes(window.end);
    return minutes >= start && minutes < end;
  };

  const inHappyHour = isOpen && within(windows.happyHour);
  const lunchEnabled = isOpen && within(windows.lunch) && !inHappyHour;
  const dinnerEnabled = isOpen && within(windows.dinner) && !inHappyHour;
  const drinksEnabled = isOpen;

  return {
    lunch: lunchEnabled ? "enabled" : "disabled",
    dinner: dinnerEnabled ? "enabled" : "disabled",
    drinks: drinksEnabled ? "enabled" : "disabled",
    happyHour: inHappyHour ? "enabled" : "disabled",
  };
}

const table = scenarios.map((scenario) => {
  const avail = availability(scenario.date, scenario.time);
  const inferredDefault = bookingHelpers.bookingTypeFromTime(scenario.time, scenario.date);
  return {
    scenario: scenario.label,
    date: scenario.date,
    time: scenario.time,
    lunch: avail.lunch,
    dinner: avail.dinner,
    drinks: avail.drinks,
    happyHour: avail.happyHour,
    defaultService: inferredDefault,
  };
});

console.table(table);
