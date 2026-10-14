/* VERBATIM excerpt of the compiled Elm app from https://bouncingdvdlogo.com (bundle supplied by the user):
 * the model init, the update function (ku) and everything it calls. Only the DOM/view/runtime parts were left
 * out. Identifiers are unchanged from the minified source so it can be diffed against the original.
 * This is the ORACLE the port in demos/01-bounce/sim.js is tested against (tools/test-sim.js). */
module.exports = (function () {
  function S(n) { throw new Error("elm hint " + n) }
  function r(n, r, t) { return t.a = n, t.f = r, t }
  function t(n) { return r(2, n, (function (r) { return function (t) { return n(r, t) } })) }
  function e(n) { return r(3, n, (function (r) { return function (t) { return function (e) { return n(r, t, e) } } })) }
  function u(n) { return r(4, n, (function (r) { return function (t) { return function (e) { return function (u) { return n(r, t, e, u) } } } })) }
  function v(n, r, t) { return 2 === n.a ? n.f(r, t) : n(r)(t) }
  function s(n, r, t, e) { return 3 === n.a ? n.f(r, t, e) : n(r)(t)(e) }
  function b(n, r, t, e, u) { return 4 === n.a ? n.f(r, t, e, u) : n(r)(t)(e)(u) }
  function d(n, r) { for (var t, e = [], u = g(n, r, 0, e); u && (t = e.pop()); u = g(t.a, t.b, 0, e)); return u }
  function g(n, r, t, e) {
    if (n === r) return !0;
    if ("object" != typeof n || null === n || null === r) return "function" == typeof n && S(5), !1;
    return S(0)
  }
  function $(n, r, t) {
    if ("object" != typeof n) return n === r ? 0 : n < r ? -1 : 1;
    S(1)
  }
  function y(n, r) { return { a: n, b: r } }
  function A(n, r) { var t = {}; for (var e in n) t[e] = n[e]; for (var e in r) t[e] = r[e]; return t }
  var k = { $: 0 };
  var x = t((function (n, r) { var t = r % n; return 0 === n ? S(11) : t > 0 && n < 0 || t < 0 && n > 0 ? t + n : t }));
  var Pr = function (n) { return { $: 0, a: n } }, Vr = { $: 1 };
  var Cn = function (n) { return { $: 2, m: n } };
  var vu = 3.8, su = 180 / 394, bu = 768, lu = 2.5, hu = 7.5, du = function (n) {
    var r = n / ($(n, bu) < 0 ? lu : vu);
    return { b: r * su, a: r }
  }, gu = function (n) { return v(Nt, n.a, n.b) / hu };
  var Nt = t((function (n, r) { return $(n, r) > 0 ? n : r }));
  var $u = t((function (n, r) { return $(n, r) < 0 ? n : r })), pu = Cn(k), mu = t((function (n, r) { return !d(n.B, r.B) || !d(n.C, r.C) }));
  var yu = u((function (n, r, t, e) {
    var u = $(n.k, e) < 1 || $(n.k, t.b - n.b - e) > -1,
      i = $(n.j, e) < 1 || $(n.j, t.a - n.a - e) > -1;
    return v(mu, n, r) && i && u
  })), wu = x, Au = e((function (n, r, t) {
    var e = n.C ? $(n.k + t, r.b - n.b) < 1 : n.k - t < 0,
      u = n.B ? $(n.j + t, r.a - n.a) < 1 : n.j - t < 0;
    return A(n, { B: u, C: e, j: n.j + (u ? t : -t), k: n.k + (e ? t : -t) })
  })), ju = t((function (n, r) {
    if (n.K) {
      var t = s(Au, n.h, n.E, r), e = v(mu, n.h, t);
      return A(n, {
        I: b(yu, n.h, t, n.E, r) ? n.I + 1 : n.I,
        h: t,
        v: e ? (u = n.v, A(u, { J: v(wu, (i = u.S, i.a), u.J + 1) })) : n.v
      })
    }
    return n;
    var u, i
  }));
  var Pu = Pr;
  var ku = t((function (n, r) {
    switch (n.$) {
      case 0: return y(A(r, { K: !r.K }), pu);
      case 1:
        var t = n.a, e = n.b, u = r.h, i = gu(c = { b: e, a: t }),
          o = A(u, { b: (f = du(c.a)).b, a: f.a, j: v($u, u.j, c.a - f.a), k: v($u, u.k, c.b - f.b) });
        return y(A(r, { h: o, E: c, N: i }), pu);
      case 2:
        var f, a = n.a, c = (u = r.h, { b: a.aA.aI, a: a.aA.aV });
        i = gu(c), o = A(u, { b: (f = du(c.a)).b, a: f.a, j: v($u, u.j, c.a - f.a), k: v($u, u.k, c.b - f.b) });
        return y(A(r, { h: o, E: c, N: i }), pu);
      case 3:
        var s2 = n.a, b2 = r.L;
        if (1 === b2.$) return y(A(r, { L: Pu(s2) }), pu);
        var l = b2.a, h = v($u, s2 - l, 100), dd = r.N * (h / 1e3);
        return y(A(v(ju, r, dd), { L: Pu(s2) }), pu);
      default: return y(r, pu)
    }
  }));
  // Initial model, verbatim from `aL` (logos array replaced by its length record {a:7}).
  var init = function () {
    return { I: 0, K: !0, L: Vr, h: { B: !0, C: !1, b: 180, a: 394, j: 0, k: 0 }, v: { T: "./logos", J: 0, S: { a: 7 } }, E: { b: 0, a: 0 }, N: 2 };
  };
  return { ku: ku, init: init, v: v };
})();
