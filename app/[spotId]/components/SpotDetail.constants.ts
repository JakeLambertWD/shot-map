export function formatPhotoNumber(index: number) {
  return String(index + 1).padStart(2, "0");
}

export function getDirectionsUrl(latitude: number, longitude: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}
