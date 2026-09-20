const { test } = require('node:test');
const assert = require('node:assert/strict');
const core = require('../core.js');
test('new and full moons peak; both quarters reach minimum', () => {
  for (const phase of [0, .5, 1]) assert.equal(core.tideStrength(phase), 1);
  for (const phase of [.25, .75]) assert.equal(core.tideStrength(phase), 0);
});
test('syzygies count crossings, not days near a peak', () => {
  assert.equal(core.countSyzygies([.4,.45,.49,.5,.51,.55,.9,.99,.01,.02]), 2);
});
test('Utrecht civil noon respects winter and summer time', () => {
  assert.equal(core.fromCivil(2026,0,15,12,0,'Europe/Amsterdam').toISOString(), '2026-01-15T11:00:00.000Z');
  assert.equal(core.fromCivil(2026,6,15,12,0,'Europe/Amsterdam').toISOString(), '2026-07-15T10:00:00.000Z');
});
test('DST gaps advance and repeated hours choose earlier occurrence', () => {
  assert.equal(core.fromCivil(2026,2,29,2,30,'Europe/Amsterdam').toISOString(), '2026-03-29T01:30:00.000Z');
  assert.equal(core.fromCivil(2026,9,25,2,30,'Europe/Amsterdam').toISOString(), '2026-10-25T00:30:00.000Z');
});
test('selected timezone controls the calendar date, including year rollover', () => {
  const p = core.parts(new Date('2026-01-01T01:00:00Z'), 'America/Sao_Paulo');
  assert.equal(p.year, 2025); assert.equal(p.day,31); assert.equal(p.hour,22);
  assert.equal(core.dayOfYear(2026,2,30),88);
  assert.equal(core.daysInYear(2024),366); assert.equal(core.daysInYear(2100),365);
});
test('invalid dates and locations are rejected', () => {
  assert.equal(core.validDate(new Date(NaN)),false);
  assert.equal(core.validLocation({name:'X',lat:91,lng:0,tz:'UTC'}),false);
  assert.equal(core.validZone('<invalid>'),false);
});
