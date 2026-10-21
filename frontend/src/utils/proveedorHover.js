/*
  ============================================================================
  proveedorHover.js — VISTA PREVIA DE UN PROVEEDOR AL PASAR EL CURSOR
  ============================================================================
  RESPONSABILIDAD: guardar el proveedor bajo el cursor y el rectángulo del
  elemento que lo disparó, para que <ProviderPreview/> se coloque al lado.

  Se comparte entre los DOS lugares donde aparece la vista previa:
    - el selector de proveedor del formulario de producto (Inventario)
    - las filas de la tabla de proveedores

  Así la lógica de hover vive en un solo sitio y las vistas sólo pasan
  proveedor + ancla al componente de previsualización.

  USO:
    const { proveedorEnHover, anclaEnHover, mostrarPreview, ocultarPreview }
      = useProveedorHover()

    <q-item @mouseenter="mostrarPreview($event, scope.opt)"
            @mouseleave="ocultarPreview">
    <ProveedorPreview :proveedor="proveedorEnHover"
                      :ancla="anclaEnHover"
                      @hide="ocultarPreview" />

  Nota: se usa `mouseenter` y NO `mouseover`. `mouseover` burbujea desde los
  hijos y el cartel se re-dibujaría continuamente al mover el ratón por
  dentro de la fila; `mouseenter` sólo se dispara al entrar al elemento.
  ============================================================================
*/

import { ref, shallowRef } from 'vue'

/**
 * Estado del hover sobre un proveedor.
 *
 * `anclaEnHover` guarda una copia PLANA del rectángulo (top/left/width/
 * height) y no el DOMRect original, porque un DOMRect sigue apuntando al
 * elemento y Vue intentaría hacerlo reactivo sin necesidad.
 *
 * @returns {{
 *   proveedorEnHover: import('vue').Ref<object|null>,
 *   anclaEnHover: import('vue').Ref<object|null>,
 *   mostrarPreview: (evento: MouseEvent, proveedor: object) => void,
 *   ocultarPreview: () => void
 * }}
 */
export function useProveedorHover() {
  const proveedorEnHover = shallowRef(null)
  const anclaEnHover = shallowRef(null)

  /**
   * Registra el proveedor bajo el cursor y guarda su posición.
   * @param {MouseEvent} evento mouseenter del elemento ancla
   * @param {object} proveedor proveedor que se va a previsualizar
   * @param {Element} [elemento] elemento cuyo rectángulo se usa como ancla;
   *        por defecto, el propio emisor del evento
   */
  function mostrarPreview(evento, proveedor, elemento) {
    const destino = elemento || evento?.currentTarget

    // Se ignoran valores que no puedan ser un proveedor: el slot #option del
    // q-select puede llegar a entregar un valor simple si cambian las opciones.
    if (
      !proveedor ||
      typeof proveedor !== 'object' ||
      !destino?.getBoundingClientRect
    ) {
      return
    }

    const rect = destino.getBoundingClientRect()

    proveedorEnHover.value = proveedor
    anclaEnHover.value = {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    }
  }

  function ocultarPreview() {
    proveedorEnHover.value = null
    anclaEnHover.value = null
  }

  return {
    proveedorEnHover,
    anclaEnHover,
    mostrarPreview,
    ocultarPreview
  }
}
