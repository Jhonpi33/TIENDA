/*
 ============================================================================
 alertas.js
 ============================================================================
 RESPONSABILIDAD: un único punto de mensajes para todo el sistema.

 Centraliza aquí todas las notificaciones para que Productos, Categorías,
 Proveedores, Movimientos y Reportes respondan con el mismo patrón:
 validar -> confirmar -> ejecutar -> informar resultado.

 CÓMO SE VEN (requisito de diseño):
   - Siempre salen CENTRADAS en pantalla, nunca en una esquina.
   - Son COMPACTAS: un cartel chico que ocupa lo justo, sin tapar la app.
   - El color indica el resultado de un vistazo:
       verde  -> la operación salió bien
       rojo   -> hubo un error
       ámbar  -> advertencia o aviso (algo que conviene saber)
   - Los éxitos y avisos se cierran solos tras unos segundos; los errores y
     las confirmaciones esperan a que el usuario los lea y decida.

 Funciones disponibles:
   confirmarOperacion(...) -> confirmación con dos botones (Confirmar /
                              Cancelar). Devuelve true sólo si se confirma.
   mostrarExito(texto)     -> cartel verde centrado, se cierra solo.
   mostrarAviso(texto)     -> cartel ámbar centrado, se cierra solo.
   mostrarAdvertencia(...) -> cartel ámbar centrado, espera a "Aceptar".
   mostrarError(...)       -> cartel rojo centrado, espera a "Aceptar".

 Todas usan SweetAlert2; nunca alert() nativo.
 ============================================================================
 */

import Swal from 'sweetalert2'

// Los q-dialog de Quasar alcanzan z-index 6000 y SweetAlert2 usa 1060 por
// defecto: sin subirlo, la alerta aparecería DETRÁS del diálogo del
// formulario y el usuario no la vería.
//
// OJO: SweetAlert2 NO tiene opción "zIndex" (no está en sus parámetros), así
// que hay que subirlo por CSS en el contenedor. Es la causa de que al guardar
// un producto la alerta "no saliera": quedaba oculta detrás del formulario.
const Z_INDEX = 11000

// Ancho del cartel centrado. Es un valor fijo (NO porcentaje) para que
// ocupe lo justo y nunca se convierta en una ventana a pantalla completa.
const ANCHO = 380

// ---------------------------------------------------------------------------
// ESTILOS
// Se inyectan UNA sola vez en <head>. El cartel es un cuadro redondeado con
// un FRANJO de color arriba: es la pista visual que dice de un vistazo si la
// operación salió bien (verde) o mal (rojo).
// ---------------------------------------------------------------------------
let estilosInyectados = false

// Colores por tipo de resultado. El mismo tono se usa en el franjo, en el
// icono y en el borde, para que la lectura sea inmediata.
// `boton` es el fondo del botón de acción: se deriva del franjo pero
// oscurecido, porque con el tono claro el texto blanco no se leería.
const COLORES = {
    success: { franjo: '#21BA45', fondo: '#F1FBF4', boton: '#16803C' },
    error: { franjo: '#C10015', fondo: '#FDF3F4', boton: '#C10015' },
    warning: { franjo: '#F2C037', fondo: '#FEFAEC', boton: '#B07D0A' }
}

function inyectarEstilos() {
    if (estilosInyectados) {
        return
    }

    estilosInyectados = true

    const estilos = document.createElement('style')
    estilos.id = 'swal2-centrado'

    const reglasPorTipo = Object.entries(COLORES)
        .map(([tipo, color]) => `
    .swal-centrado.swal-${tipo} {
      border-top: 5px solid ${color.franjo};
      background: ${color.fondo};
    }

    .swal-centrado.swal-${tipo} .swal2-icon {
      border-color: ${color.franjo};
      color: ${color.franjo};
    }
  `)
        .join('')

    estilos.textContent = `
    /* El contenedor de SweetAlert2 nace con z-index 1060, por debajo de los
       q-dialog de Quasar (6000): hay que subirlo por encima del formulario
       para que la alerta se vea. Es el arreglo del bug "no me sale la
       alerta al guardar". */
    .swal2-container {
      z-index: ${Z_INDEX} !important;
    }

    /* El cartel: angosto y centrado. max-width con !important evita que
       Quasar u otro estilo lo estire hasta ocupar la pantalla. */
    .swal2-popup.swal-centrado {
      width: ${ANCHO}px !important;
      max-width: calc(100vw - 32px) !important;
      border-radius: 14px !important;
      padding: 22px 20px 16px !important;
      box-shadow: 0 12px 34px rgba(15, 41, 77, 0.22) !important;
      text-align: center;
    }

    .swal-centrado .swal2-title {
      font-size: 17px !important;
      font-weight: 700 !important;
      line-height: 1.3 !important;
      margin: 6px 0 4px !important;
      color: #17293F;
      white-space: normal !important;
    }

    /* El detalle (p. ej. el mensaje del backend) se puede partir en varias
       líneas: a diferencia de antes, el texto NO se corta con puntos. */
    .swal-centrado .swal2-html-container {
      font-size: 14px !important;
      line-height: 1.45 !important;
      margin: 0 !important;
      padding: 0 !important;
      color: #46586E;
      white-space: normal !important;
      overflow-wrap: anywhere;
    }

    /* Tamaño del icono: se usa la variable OFICIAL --swal2-icon-zoom (que
       SweetAlert2 aplica como propiedad zoom). Así se reduce todo el icono de forma
       proporcional, incluida la "X" del error. Antes se forzaba
       width/height a 46px sin tocar el font-size, y como la "X" mide en em,
       se salía del círculo. */
    .swal-centrado {
      --swal2-icon-zoom: 0.78;
    }

    .swal-centrado .swal2-icon {
      margin: 8px auto 6px !important;
    }

    /* Barra que marca el tiempo antes de cerrarse solo (sólo se ve si hay
       temporizador, es decir, en éxitos y avisos). */
    .swal-centrado .swal2-timer-progress-bar {
      height: 4px !important;
      border-radius: 0 0 14px 14px;
    }

    .swal-centrado .swal2-confirm,
    .swal-centrado .swal2-cancel {
      border-radius: 8px !important;
      font-weight: 600 !important;
      padding: 8px 18px !important;
      box-shadow: none !important;
    }
  ${reglasPorTipo}`

    document.head.appendChild(estilos)
}

// Configuración compartida: cartel centrado, compacto y del color que
// corresponda al tipo de resultado.
function opcionesBase({ tipo = 'success', temporizador = null } = {}) {
    inyectarEstilos()

    const opciones = {
        // NOTA: SweetAlert2 NO acepta "zIndex" como opción (no está en sus
        // parámetros); el z-index se sube por CSS en inyectarEstilos().
        buttonsStyling: true,
        // "Confirmar" queda a la derecha y "Cancelar" a la izquierda
        reverseButtons: true,
        position: 'center',
        // Clases propias: el ancho compacto + el color del resultado
        customClass: {
            popup: `swal-centrado swal-${tipo}`
        },
        // SweetAlert2 pone los botones VIOLETA por defecto; aquí toman el
        // color del cartel para que el botón confirme el resultado de un
        // vistazo (verde en éxito, rojo en error, ámbar en advertencia).
        confirmButtonColor: COLORES[tipo].boton,
        // El botón secundario (Cancelar) queda neutro, sin competir con la
        // acción principal.
        cancelButtonColor: '#7A8A9B'
    }

    if (temporizador) {
        opciones.timer = temporizador
        opciones.timerProgressBar = true
        // Sin botón: el cartel se va solo. Con temporizador no tiene sentido
        // pedirle al usuario que haga clic para descartar un aviso.
        opciones.showConfirmButton = false
        // Un clic fuera también lo cierra, sin riesgo de perder información
        // (el mensaje es un resultado, no una decisión).
        opciones.allowOutsideClick = true
    }

    return opciones
}

/**
 * Confirmación centrada para operaciones destructivas o críticas.
 * @returns {Promise<boolean>} true si el usuario confirmó.
 */
export function confirmarOperacion({
    titulo,
    texto = '',
    icono = 'warning',
    confirmar = 'Confirmar',
    cancelar = 'Cancelar'
}) {
    return Swal.fire({
        ...opcionesBase({ tipo: icono === 'error' ? 'error' : 'warning' }),
        icon: icono,
        title: titulo,
        text: texto,
        showCancelButton: true,
        confirmButtonText: confirmar,
        cancelButtonText: cancelar,
        allowOutsideClick: false
    }).then((resultado) => Boolean(resultado.isConfirmed))
}

/**
 * Resultado correcto de una operación. Cartel VERDE centrado que se cierra
 * solo, así el flujo de trabajo no se interrumpe.
 */
export function mostrarExito(texto) {
    return Swal.fire({
        ...opcionesBase({ tipo: 'success', temporizador: 3200 }),
        icon: 'success',
        title: texto
    })
}

/**
 * Aviso suave que no exige acción. Cartel ÁMBAR centrado, se cierra solo.
 */
export function mostrarAviso(texto) {
    return Swal.fire({
        ...opcionesBase({ tipo: 'warning', temporizador: 3200 }),
        icon: 'warning',
        title: texto
    })
}

/**
 * Advertencia informativa que sí espera a que se lea (una sola acción).
 * Cartel ÁMBAR centrado.
 */
export function mostrarAdvertencia({ titulo, texto = '' }) {
    return Swal.fire({
        ...opcionesBase({ tipo: 'warning' }),
        icon: 'warning',
        title: titulo,
        text: texto,
        confirmButtonText: 'Aceptar',
        allowOutsideClick: false
    })
}

/**
 * Error de una operación que el usuario debe conocer antes de continuar.
 * Cartel ROJO centrado; no se cierra solo para que dé tiempo a leerlo.
 */
export function mostrarError({ titulo, texto = '' }) {
    return Swal.fire({
        ...opcionesBase({ tipo: 'error' }),
        icon: 'error',
        title: titulo,
        text: texto,
        confirmButtonText: 'Aceptar',
        allowOutsideClick: false
    })
}
