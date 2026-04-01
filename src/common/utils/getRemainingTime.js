export const getRemainingTime = (date) => {
  const remainingSeconds = (new Date(date) - Date.now()) / 1000;

  if (remainingSeconds > 3600) {
    const remainingHours = Math.floor(remainingSeconds / 3600);
    return remainingHours + " hours";
  }
  if (remainingSeconds > 60) {
    const remainingMinutes = Math.floor(remainingSeconds / 60);
    return remainingMinutes + " minutes";
  }

  return remainingSeconds + " seconds";
};
