<template>
  <!--
    Se tele-transporta a <body> a propósito: dentro del q-dialog y del menú
    del q-select habría que competir con su z-index (6000) y con el contexto
    de apilamiento de cada contenedor. Saliendo al body, con position: fixed
    y z-index 7000, el cartel queda SIEMPRE por encima de ambos.
  -->
  <teleport to="body">
    <transition name="preview-fade">
      <div
        v-if="proveedor"
        ref="panel"
        class="proveedor-preview"
        :style="estilo"
        role="tooltip"
        aria-hidden="true"
      >
        <!-- Cabecera: nombre del proveedor y su estado -->
        <header class="preview-cabecera">
          <q-icon name="local_shipping" class="preview-icono" />

          <div class="preview-identidad">
            <p class="preview-nombre">{{ proveedor.nombre }}</p>

            <span class="preview-estado">{{ proveedor.activo !== false ? 'Activo' : 'Inactivo' }}</span>
          </div>
        </header>

        <q-separator spaced />

        <!--
          ESPECIALIDAD
          No es un campo del modelo Proveedor: se DERIVA de las categorías de
          los productos que suministra (sin repetir el nombre de categoría).
        -->
        <section class="preview-seccion">
          <p class="preview-etiqueta">Especialidad</p>

          <div v-if="especialidad.length" class="preview-categorias">
            <span
              v-for="nombre in especialidad"
              :key="nombre"
              class="preview-chip"
            >
              {{ nombre }}
            </span>
          </div>

          <p v-else class="preview-vacio">
            Aún no tiene productos para derivar una especialidad.
          </p>
        </section>

        <!-- MUESTRA DE PRODUCTOS (los primeros N; no toda la lista) -->
        <section class="preview-seccion">
          <p class="preview-etiqueta">
            Productos ({{ productosDelProveedor.length }})
          </p>

          <ul v-if="muestra.length" class="preview-productos">
            <li v-for="producto in muestra" :key="producto.id" class="preview-producto">
              <span class="preview-producto-nombre">{{ producto.nombre }}</span>

              <span class="preview-producto-categoria">{{ categoriaDe(producto) }}</span>
            </li>
          </ul>

          <p v-else class="preview-vacio">
            Este proveedor aún no tiene productos registrados.
          </p>

          <!-- Aviso de que la lista sigue, para no dar a entender que es todo -->
          <p v-if="restantes > 0" class="preview-resto">
            +{{ restantes }} producto{{ restantes === 1 ? '' : 's' }} más
          </p>
        </section>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useProductosStore } from '../../stores/productos'
import { useCategoriasStore } from '../../stores/categorias'

// ---------------------------------------------------------------------------
// VISTA PREVIA DE UN PROVEEDOR AL PASAR EL CURSOR
//
// Muestra la ESPECIALIDAD (derivada de las categorías de sus productos, ya
// que el modelo Proveedor no tiene ese campo) y una MUESTRA de esos productos.
//
// Se usa en dos sitios: en el selector de proveedor del formulario de
// producto y sobre las filas de la tabla de proveedores. Ambos le pasan el
// proveedor y el rectángulo del elemento ancla; el cartel se coloca SOLO.
//
// El cartel es de sólo lectura y no intercepta el ratón (pointer-events:
// none): si cubriera la fila sobre la que se está pasando el cursor, el
// mouseleave la ocultaría y volvería a aparecer en bucle.
// ---------------------------------------------------------------------------
const props = defineProps({
  // Proveedor a describir; null (o undefined) lo oculta
  proveedor: {
    type: Object,
    default: null
  },

  // Rectángulo del elemento que originó el hover: { top, left, width, height }
  // Tal cual lo devuelve getBoundingClientRect(), ya copiado a un objeto
  // plano para no guardar un DOMRect reactivo.
  ancla: {
    type: Object,
    default: null
  }
})

// Se emite al perder la referencia al ancla (scroll o cambio de tamaño de
// la ventana), para ocultar el cartel desde el componente padre.
const emit = defineEmits(['hide'])

const productosStore = useProductosStore()
const categoriasStore = useCategoriasStore()

// Cantidad de productos que se muestran antes de resumir el resto
const LIMITE_MUESTRA = 4

// Geometría del cartel: ancho fijo (nunca porcentaje, para que no crezca
// hasta tapar la pantalla) y alto máximo con scroll propio.
const ANCHO = 300
const ALTO_MAXIMO = 320
const SEPARACION = 12
const MARGEN = 12

// ---------------------------------------------------------------------------
// ESPECIALIDAD Y MUESTRA DE PRODUCTOS
// Los ids llegan como texto (ObjectId de Mongo en el producto, UUID en el
// proveedor), por eso SIEMPRE se comparan con String(): Number() volvería
// NaN a un UUID y el filtro devolvería siempre vacío.
// ---------------------------------------------------------------------------
const productosDelProveedor = computed(() => {
  if (!props.proveedor) {
    return []
  }

  return productosStore.productos.filter(
    (producto) => String(producto.proveedorId) === String(props.proveedor.id)
  )
})

function categoriaDe(producto) {
  const categoria = categoriasStore.obtenerCategoriaPorId(producto.categoriaId)

  return categoria ? categoria.nombre : 'Sin categoría'
}

// Categorías distintas de los productos del proveedor, en orden de aparición
const especialidad = computed(() => {
  const nombres = []

  for (const producto of productosDelProveedor.value) {
    const nombre = categoriaDe(producto)

    if (!nombres.includes(nombre)) {
      nombres.push(nombre)
    }
  }

  return nombres
})

const muestra = computed(() => {
  return productosDelProveedor.value.slice(0, LIMITE_MUESTRA)
})

const restantes = computed(() => {
  return Math.max(0, productosDelProveedor.value.length - LIMITE_MUESTRA)
})

// ---------------------------------------------------------------------------
// POSICIÓN: AL LADO DEL ELEMENTO ANCLA
// Se intenta primero a la DERECHA; si no cabe en la ventana, a la IZQUIERDA;
// y si tampoco, se pega al borde que sí tenga sitio. En vertical se sube
// cuando el cartel se saldría por abajo.
//
// El ALTO se mide en el propio elemento (offsetHeight) tras renderizar: con
// un valor estimado el cartel se separaba de la fila porque su altura real
// es bastante menor que el máximo permitido.
// ---------------------------------------------------------------------------
const panel = ref(null)
const posicion = ref(null)

function calcularPosicion() {
  const ancla = props.ancla

  if (!ancla) {
    posicion.value = null
    return
  }

  const alto = panel.value ? panel.value.offsetHeight : ALTO_MAXIMO
  const anchoVentana = window.innerWidth
  const altoVentana = window.innerHeight

  let left = ancla.left + ancla.width + SEPARACION

  if (left + ANCHO > anchoVentana - MARGEN) {
    left = ancla.left - ANCHO - SEPARACION
  }

  // Ni derecha ni izquierda caben (pantalla estrecha): se pega al borde
  if (left < MARGEN) {
    left = Math.max(MARGEN, anchoVentana - ANCHO - MARGEN)
  }

  let top = ancla.top

  if (top + alto > altoVentana - MARGEN) {
    top = altoVentana - alto - MARGEN
  }

  if (top < MARGEN) {
    top = MARGEN
  }

  posicion.value = {
    left: `${Math.round(left)}px`,
    top: `${Math.round(top)}px`
  }
}

// El cartel entra oculto (sin coordenadas) y se posiciona al tick siguiente,
// cuando el navegador ya lo tiene en el DOM y puede medirlo.
const estilo = computed(() => {
  if (props.proveedor && posicion.value) {
    return posicion.value
  }

  return { visibility: 'hidden' }
})

watch(
  () => [props.proveedor, props.ancla],
  async () => {
    if (!props.proveedor || !props.ancla) {
      posicion.value = null
      return
    }

    await nextTick()
    calcularPosicion()
  },
  { immediate: true }
)

// El ancla deja de existir cuando la página se desplaza o cambia de tamaño
function alCambiarViewport() {
  emit('hide')
}

onMounted(() => {
  window.addEventListener('scroll', alCambiarViewport, { passive: true, capture: true })
  window.addEventListener('resize', alCambiarViewport)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', alCambiarViewport, { capture: true })
  window.removeEventListener('resize', alCambiarViewport)
})
</script>

<style scoped>
.proveedor-preview {
  position: fixed;
  z-index: 7000;
  width: 300px;
  max-width: calc(100vw - 24px);
  max-height: 320px;
  overflow-y: auto;
  padding: 14px 16px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #D7E3F0;
  box-shadow:
    0 10px 28px rgba(15, 41, 77, 0.20),
    0 2px 8px rgba(15, 41, 77, 0.10);
  /* No intercepta el puntero: evita que el hover entre en bucle */
  pointer-events: none;
  font-size: 13px;
  color: #17293F;
}

.preview-cabecera {
  display: flex;
  align-items: center;
  gap: 10px;
}

.preview-icono {
  font-size: 26px;
  color: #1E9EFF;
}

.preview-identidad {
  min-width: 0;
}

.preview-nombre {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.preview-estado {
  display: inline-block;
  margin-top: 2px;
  font-size: 11px;
  font-weight: 600;
  color: #46586E;
}

.preview-seccion {
  margin-top: 4px;
}

.preview-etiqueta {
  margin: 0 0 6px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #7A8A9B;
}

.preview-categorias {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.preview-chip {
  padding: 3px 9px;
  border-radius: 999px;
  background: #E8F4FF;
  color: #1268B3;
  font-size: 11px;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.preview-productos {
  margin: 0;
  padding: 0;
  list-style: none;
}

.preview-producto {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 4px 0;
  border-bottom: 1px solid #EFF4F9;
}

.preview-producto:last-child {
  border-bottom: none;
}

.preview-producto-nombre {
  min-width: 0;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.preview-producto-categoria {
  flex-shrink: 0;
  max-width: 45%;
  color: #7A8A9B;
  font-size: 11px;
  text-align: right;
  overflow-wrap: anywhere;
}

.preview-resto {
  margin: 8px 0 0;
  font-size: 11px;
  font-weight: 600;
  color: #1E9EFF;
}

.preview-vacio {
  margin: 0;
  color: #7A8A9B;
  font-style: italic;
  line-height: 1.4;
}

/* Entrada suave: aparece casi de inmediato para que no se sienta lenta */
.preview-fade-enter-active {
  transition: opacity 0.12s ease-out;
}

.preview-fade-leave-active {
  transition: opacity 0.1s ease-in;
}

.preview-fade-enter-from,
.preview-fade-leave-to {
  opacity: 0;
}
</style>
