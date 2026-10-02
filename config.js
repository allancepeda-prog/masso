// URL de la aplicación web (Apps Script). Cambiar solo si se crea otra implementación.
self.MASSO_EXEC = 'https://script.google.com/macros/s/AKfycbx-4rlsARuyjnEH_S1FA4AfJ77aeEc718ly9QB6qZNOM7lBhh3KG83lZXjZjtfW4-COtQ/exec';
self.MASSO_VERSION = '8.0.1';
// Con varias cuentas de Google abiertas en el navegador, la dirección normal falla:
// si la plataforma no responde en 12 s se usa la dirección del dominio y se recuerda en este equipo.
(function () {
  if (typeof window === 'undefined') return; // service worker
  var DOM = self.MASSO_EXEC.replace('/macros/s/', '/a/huequecura.cl/macros/s/'), ok = false, k = 'masso_exec';
  try { if (localStorage.getItem(k) === 'dom') { self.MASSO_EXEC = DOM; return; } } catch (e) {}
  window.addEventListener('message', function (e) { if (e.data && e.data.masso === 'hola') ok = true; });
  setTimeout(function () {
    if (ok) return;
    try { localStorage.setItem(k, 'dom'); } catch (e) {}
    var f = document.getElementById('app');
    if (f && f.src) f.src = f.src.replace('/macros/s/', '/a/huequecura.cl/macros/s/');
  }, 12000);
})();
