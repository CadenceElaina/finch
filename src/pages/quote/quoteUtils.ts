export const isHoliday = (date: Date) => {
  const holidays = [
    // 2024
    new Date(2024, 0, 1), // New Year's Day
    new Date(2024, 0, 15), // MLK Day
    new Date(2024, 1, 19), // Presidents' Day
    new Date(2024, 2, 29), // Good Friday
    new Date(2024, 4, 27), // Memorial Day
    new Date(2024, 5, 19), // Juneteenth
    new Date(2024, 6, 4), // Independence Day
    new Date(2024, 8, 2), // Labor Day
    new Date(2024, 10, 28), // Thanksgiving
    new Date(2024, 11, 25), // Christmas
    // 2025
    new Date(2025, 0, 1), // New Year's Day
    new Date(2025, 0, 20), // MLK Day
    new Date(2025, 1, 17), // Presidents' Day
    new Date(2025, 3, 18), // Good Friday
    new Date(2025, 4, 26), // Memorial Day
    new Date(2025, 5, 19), // Juneteenth
    new Date(2025, 6, 4), // Independence Day
    new Date(2025, 8, 1), // Labor Day
    new Date(2025, 10, 27), // Thanksgiving
    new Date(2025, 11, 25), // Christmas
    // 2026
    new Date(2026, 0, 1), // New Year's Day
    new Date(2026, 0, 19), // MLK Day
    new Date(2026, 1, 16), // Presidents' Day
    new Date(2026, 3, 3), // Good Friday
    new Date(2026, 4, 25), // Memorial Day
    new Date(2026, 5, 19), // Juneteenth
    new Date(2026, 6, 3), // Independence Day (observed)
    new Date(2026, 8, 7), // Labor Day
    new Date(2026, 10, 26), // Thanksgiving
    new Date(2026, 11, 25), // Christmas
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
