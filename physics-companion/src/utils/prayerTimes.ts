import { CalculationMethod, LocationConfig, PrayerName, PrayerTimeEntry } from '../types';
import { minutesToTime, timeToMinutes } from './dateUtils';

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const dsin = (d: number) => Math.sin(d * DEG2RAD);
const dcos = (d: number) => Math.cos(d * DEG2RAD);
const dtan = (d: number) => Math.tan(d * DEG2RAD);
const darcsin = (x: number) => Math.asin(Math.max(-1, Math.min(1, x))) * RAD2DEG;
const darccos = (x: number) => Math.acos(Math.max(-1, Math.min(1, x))) * RAD2DEG;
const darctan2 = (y: number, x: number) => Math.atan2(y, x) * RAD2DEG;
const darccot = (x: number) => Math.atan(1 / x) * RAD2DEG;
const fixAngle = (a: number) => ((a % 360) + 360) % 360;
const fixHour = (h: number) => ((h % 24) + 24) % 24;

const METHOD_PARAMS: Record<CalculationMethod, { fajr: number; ishaAngle?: number; ishaMinutesAfterMaghrib?: number }> = {
  Egypt: { fajr: 19.5, ishaAngle: 17.5 },
  MWL: { fajr: 18, ishaAngle: 17 },
  UmmAlQura: { fajr: 18.5, ishaMinutesAfterMaghrib: 90 },
  ISNA: { fajr: 15, ishaAngle: 15 },
};

export const PRESET_CITIES: Array<{ name: string; lat: number; lng: number; method: CalculationMethod }> = [
  { name: 'Cairo', lat: 30.0444, lng: 31.2357, method: 'Egypt' },
  { name: 'Alexandria', lat: 31.2001, lng: 29.9187, method: 'Egypt' },
  { name: 'Riyadh', lat: 24.7136, lng: 46.6753, method: 'UmmAlQura' },
  { name: 'Makkah', lat: 21.3891, lng: 39.8579, method: 'UmmAlQura' },
  { name: 'Dubai', lat: 25.2048, lng: 55.2708, method: 'MWL' },
  { name: 'Istanbul', lat: 41.0082, lng: 28.9784, method: 'MWL' },
  { name: 'London', lat: 51.5072, lng: -0.1276, method: 'MWL' },
  { name: 'New York', lat: 40.7128, lng: -74.006, method: 'ISNA' },
];

function julianDate(year: number, month: number, day: number): number {
  let y = year, m = month;
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5;
}

function sunPosition(jd: number) {
  const d = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * d);
  const q = fixAngle(280.459 + 0.98564736 * d);
  const L = fixAngle(q + 1.915 * dsin(g) + 0.02 * dsin(2 * g));
  const e = 23.439 - 0.00000036 * d;
  const RA = darctan2(dcos(e) * dsin(L), dcos(L)) / 15;
  return { D: darcsin(dsin(e) * dsin(L)), EqT: q / 15 - fixHour(RA) };
}

function sunHourAngle(lat: number, decl: number, altitudeDeg: number): number {
  const cosHA = (dsin(altitudeDeg) - dsin(lat) * dsin(decl)) / (dcos(lat) * dcos(decl));
  if (cosHA < -1) return 12;
  if (cosHA > 1) return 0;
  return darccos(cosHA) / 15;
}

function hoursToHHMM(hours: number): string {
  const n = fixHour(hours + 0.5 / 60);
  const h = Math.floor(n);
  return `${String(h).padStart(2, '0')}:${String(Math.floor((n - h) * 60)).padStart(2, '0')}`;
}

export function calculatePrayerTimes(location: LocationConfig, date: Date = new Date()): PrayerTimeEntry[] {
  const year = date.getFullYear(), month = date.getMonth() + 1, day = date.getDate();
  const tz = -date.getTimezoneOffset() / 60;
  const jd = julianDate(year, month, day) - location.longitude / (15 * 24);
  const { D, EqT } = sunPosition(jd + 0.5);
  const params = METHOD_PARAMS[location.method] || METHOD_PARAMS.Egypt;

  const dhuhr = 12 + tz - location.longitude / 15 - EqT;
  const fajr = dhuhr - sunHourAngle(location.latitude, D, -params.fajr);
  const asr = dhuhr + sunHourAngle(location.latitude, D, darccot(1 + dtan(Math.abs(location.latitude - D))));
  const maghrib = dhuhr + sunHourAngle(location.latitude, D, -0.8333);
  const isha = params.ishaMinutesAfterMaghrib
    ? maghrib + params.ishaMinutesAfterMaghrib / 60
    : dhuhr + sunHourAngle(location.latitude, D, -(params.ishaAngle || 17.5));

  const pairs: Array<[PrayerName, number]> = [
    ['Fajr', fajr], ['Dhuhr', dhuhr], ['Asr', asr], ['Maghrib', maghrib], ['Isha', isha],
  ];
  return pairs.map(([name, hourVal]) => {
    const time24 = hoursToHHMM(hourVal);
    const [hh, mm] = time24.split(':').map(Number);
    return { name, time24, timestamp: new Date(year, month - 1, day, hh, mm, 0, 0).getTime() };
  });
}

export function getNextPrayer(prayers: PrayerTimeEntry[], nowMs: number = Date.now()) {
  const upcoming = prayers.find((p) => p.timestamp > nowMs);
  if (upcoming) return { prayer: upcoming, remainingMs: upcoming.timestamp - nowMs };
  const tomorrowFajrMs = prayers[0].timestamp + 86400000;
  return { prayer: { ...prayers[0], timestamp: tomorrowFajrMs }, remainingMs: tomorrowFajrMs - nowMs };
}

export function avoidPrayerConflict(startHHMM: string, durationMin: number, prayers: PrayerTimeEntry[], bufferMin = 15) {
  let start = timeToMinutes(startHHMM), end = start + durationMin, shifted = false;
  for (const prayer of prayers) {
    const pMin = timeToMinutes(prayer.time24);
    if (start < pMin + bufferMin && end > pMin - bufferMin) {
      start = pMin + bufferMin;
      end = start + durationMin;
      shifted = true;
    }
  }
  return { adjustedTime: minutesToTime(start), shifted };
}