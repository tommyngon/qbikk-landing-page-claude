/* Shared QBIKK colours.
 * BRAND_* are the landing-page "Supernova" tokens (index.html :root).
 * PALETTE is the PROPOSED 7-colour cycle for the bounce demo (the original site's 7 logo colours
 * were not obtainable, so this is a proposal that still needs approval). Every entry is already
 * inside the CRT-safe range (each channel 16..235) and none is pure white or saturated red. */
(function (g) {
  g.QCRT = g.QCRT || {};
  g.QCRT.BRAND = { blue: '#2A6BFF', teal: '#1FC7DB', green: '#4CDB85', orange: '#FF8F38' };
  g.QCRT.PALETTE = [
    { name: 'off-white', hex: '#E6E6E6', note: 'replaces pure white (blooms on CRT)' },
    { name: 'blue',      hex: '#3C7AEB', note: 'brand #2A6BFF lifted: CRT blue phosphor is dim' },
    { name: 'teal',      hex: '#1FC7DB', note: 'brand, unchanged' },
    { name: 'green',     hex: '#4CDB85', note: 'brand, unchanged' },
    { name: 'orange',    hex: '#EB8A35', note: 'brand #FF8F38 capped at channel 235' },
    { name: 'yellow',    hex: '#E6C84A', note: 'new, keeps hue cycle readable' },
    { name: 'pink',      hex: '#E0589F', note: 'new; stands in for red (saturated red bleeds)' }
  ];
})(typeof self !== 'undefined' ? self : this);
