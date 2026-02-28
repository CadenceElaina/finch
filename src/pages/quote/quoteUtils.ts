export const isHoliday = (date: Date) => {
  const holidays = [
    new Date(2024, 0, 1), // New Year’s Day
    new Date(2024, 0, 15), // Martin Luther King, Jr. Day
    new Date(2024, 1, 19), // Washington's Birthday
    new Date(2024, 2, 29), // Good Friday
    new Date(2024, 4, 25), // Memorial Day
    new Date(2024, 5, 19), // Juneteenth National Independence Day
    new Date(2024, 6, 4), // Independence Day
    new Date(2024, 8, 2), // Labor Day
    new Date(2024, 10, 28), // Thanksgiving Day
    new Date(2024, 11, 25), // Christmas Day
  ];
  const currentDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  return holidays.some(
    (holiday) => currentDate.getTime() === holiday.getTime()
  );
};
