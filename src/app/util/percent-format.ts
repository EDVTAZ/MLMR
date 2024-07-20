export function percentFormat(percentage: number) {
  return Intl.NumberFormat(navigator.language, {
    style: 'percent',
  }).format(percentage);
}
