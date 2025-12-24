export function toRelativeTime(dateInput: string | number): string {
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = (now.getTime() - date.getTime()) / 1000;

  if (diffInSeconds < 60) {
    return "たった今";
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}分前`;
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}時間前`;
  } else {
    return `${Math.floor(diffInSeconds / 86400)}日前`;
  }
}