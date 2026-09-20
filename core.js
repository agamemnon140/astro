/* Pure calendar and illustrative tide calculations; shared by app and tests. */
(function (root) {
  const formatters = new Map(), offsets = new Map();
  const validDate = date => date instanceof Date && Number.isFinite(date.getTime());
  function validZone(zone) {
    if(typeof zone !== 'string' || !zone) return false;
    try { new Intl.DateTimeFormat('en', { timeZone: zone }); return true; } catch { return false; }
  }
  function parts(date, zone) {
    if (!validDate(date)) return null;
    if (!formatters.has(zone)) formatters.set(zone, new Intl.DateTimeFormat('en-GB', {
      timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    }));
    return Object.fromEntries(formatters.get(zone).formatToParts(date)
      .filter(p => p.type !== 'literal').map(p => [p.type, Number(p.value)]));
  }
  function stamp(p) { return Date.UTC(p.year, p.month - 1, p.day, p.hour || 0, p.minute || 0, p.second || 0); }
  function offsetAt(ms, zone) { return stamp(parts(new Date(ms), zone)) - ms; }
  function fromCivil(year, month, day, hour, minute, zone) {
    const wall = Date.UTC(year, month, day, hour, minute);
    const key = zone + ':' + Math.floor(wall / 86400000);
    if (!offsets.has(key)) {
      const noon = Math.floor(wall / 86400000) * 86400000 + 43200000;
      if (offsets.size > 1500) offsets.clear();
      offsets.set(key, [...new Set([-36, 0, 36].map(h => offsetAt(noon + h * 3600000, zone)))]);
    }
    const choices = offsets.get(key);
    if (choices.length === 1) return new Date(wall - choices[0]);
    const candidates = choices.map(o => wall - o).sort((a, b) => a - b);
    // Repeated time: earlier occurrence. Missing time: move forward across the gap.
    const exact = candidates.find(ms => stamp(parts(new Date(ms), zone)) === wall);
    return new Date(exact ?? candidates[candidates.length - 1]);
  }
  function daysInYear(year) { return new Date(Date.UTC(year, 1, 29)).getUTCMonth() === 1 ? 366 : 365; }
  function dayOfYear(year, month, day) { return Math.floor((Date.UTC(year, month, day) - Date.UTC(year, 0, 1)) / 86400000); }
  function tideStrength(phase) { return (1 + Math.cos(4 * Math.PI * phase)) / 2; }
  function countSyzygies(phases) {
    // Each crossing of a half-cycle is one new/full moon, even at phase wrap.
    let count = 0;
    for (let i = 1; i < phases.length; i++) {
      const a = phases[i - 1], b = phases[i] < a ? phases[i] + 1 : phases[i];
      count += Math.floor(b * 2) - Math.floor(a * 2);
    }
    return count;
  }
  function validLocation(loc) {
    return loc && Number.isFinite(loc.lat) && Math.abs(loc.lat) <= 90 &&
      Number.isFinite(loc.lng) && Math.abs(loc.lng) <= 180 && typeof loc.name === 'string' && validZone(loc.tz);
  }
  const api = { parts, fromCivil, validDate, validZone, daysInYear, dayOfYear, tideStrength, countSyzygies, validLocation };
  if (typeof module !== 'undefined') module.exports = api;
  root.AstroCore = api;
})(globalThis);
