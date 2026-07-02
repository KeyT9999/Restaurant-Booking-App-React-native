export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) {
    return 'Chào buổi sáng ☀️';
  } else if (hour < 18) {
    return 'Chào buổi chiều ☀️';
  } else {
    return 'Chào buổi tối 🌙';
  }
};
