<!--
  ============================================================================
  MovimientosView.vue
  ============================================================================
  RESPONSABILIDAD (Opción 2):
  - Conectar el formulario con la tabla.
  - LLAMAR a movimientosStore.registrarMovimiento(datos).
  - Confirmar con SweetAlert2 los AJUSTES (operación crítica que sobrescribe
    el stock) antes de ejecutarlos y mostrar el resultado de cada operación.
  - Si el store devuelve null, se explica el motivo con SweetAlert2 y el
    formulario queda abierto para corregir (sin usar $q.notify).
  - En éxito: cerrar el diálogo, limpiar y dejar la tabla actualizada.

  Esta vista NO modifica el stock a mano: el store lo hace internamente.
  ============================================================================
-->
<template>
  <q-page class="movements-page">
    <!--
      PageHeader reutiliza el componente ui/PageHeader.vue.
      El botón "Registrar movimiento" abre el diálogo (requisito 3).
    -->
    <PageHeader title="Movimientos" description="Registro de entradas, salidas y ajustes de inventario">
      <template #actions>
        <q-btn color="primary" icon="add" label="Registrar movimiento" no-caps @click="openForm" />
      </template>
    </PageHeader>

    <!--
      TABLA DE MOVIMIENTOS (requisito 1 y 9)
      Recibe la lista ordenada. Como movimientosStore.movimientos es estado
      reactivo de Pinia, la tabla se ACTUALIZA SOLA cada vez que el store
      registra un movimiento nuevo (requisito: "actualizar automáticamente").
    -->
    <MovimientoTable :movements="movimientosOrdenados" />

    <!--
      FORMULARIO
      - v-model="showForm"     -> controla abrir/cerrar el diálogo
      - :products              -> lista de productos para el selector
      - :error                 -> mensaje de error que vuelve desde el store
      - @save                  -> la vista ejecuta registrarMovimiento()
    -->
    <MovimientoForm v-model="showForm" :products="productosStore.productos"
      @save="guardarMovimiento" />
  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'

// Componentes reutilizados (no se modifican)
import PageHeader from '../components/ui/PageHeader.vue'

// Componentes de esta sección
import MovimientoForm from '../components/movements/MovimientoForm.vue'
import MovimientoTable from '../components/movements/MovimientoTable.vue'

// Alertas unificadas del sistema (SweetAlert2)
import { confirmarOperacion, mostrarError, mostrarExito } from '../utils/alertas'

// Stores involucrados
import { useMovimientosStore } from '../stores/movimientos'
import { useProductosStore } from '../stores/productos'

// Instancias de los stores de Pinia
const movimientosStore = useMovimientosStore()
const productosStore = useProductosStore()

// Estado de la vista
const showForm = ref(false)   // ¿está abierto el diálogo?

// ---------------------------------------------------------------------------
// LISTA ORDENADA
// El store acumula los movimientos del más antiguo al más nuevo.
// Aquí los mostramos del más NUEVO al más viejo.
// OJO: .reverse() modifica el arreglo en el lugar, por eso primero hacemos
// una copia con [...array]. Si no, estaríamos revirtiendo el estado del store.
// ---------------------------------------------------------------------------
const movimientosOrdenados = computed(() => {
  return [...movimientosStore.movimientos].reverse()
})

function openForm() {
  showForm.value = true
}

// ---------------------------------------------------------------------------
// GUARDAR (aquí es donde se usa registrarMovimiento - requisito 7)
// ---------------------------------------------------------------------------
async function guardarMovimiento(datos) {
  // El AJUSTE sobrescribe el stock completo del producto, por eso antes de
  // ejecutarlo se confirma con SweetAlert2 mostrando el stock actual y el
  // nuevo valor que quedará. Si el usuario cancela, no se modifica nada.
  if (datos.tipo === 'ajuste') {
    const producto = productosStore.obtenerProductos(datos.productoId)

    const confirmado = await confirmarOperacion({
      titulo: '¿Confirmar ajuste de inventario?',
      texto: `Stock actual: ${producto ? producto.cantidad : 0}. Nuevo stock: ${Number(datos.cantidad)}. Esta operación modificará el inventario.`,
      confirmar: 'Confirmar'
    })

    if (!confirmado) {
      // El diálogo queda ABIERTO con los datos que ya había escrito.
      return
    }
  }

  // El store hace 3 cosas a la vez:
  // 1. valida (producto existe, cantidad válida según el tipo, stock suficiente en salidas)
  // 2. ACTUALIZA EL STOCK del producto (requisito 8) -> nosotros no lo tocamos
  // 3. agrega el movimiento a la lista (que además persiste por persist: true)
  // Devuelve el movimiento creado, o null si algo falló.
  const movimientoCreado = movimientosStore.registrarMovimiento(datos)

  if (!movimientoCreado) {
    // FALLO: se explica el motivo y el formulario sigue abierto para corregir.
    // La tabla no cambió porque el store no hizo nada cuando devolvió null.
    mostrarError({
      titulo:
        datos.tipo === 'ajuste'
          ? 'No fue posible realizar el ajuste'
          : 'No se pudo registrar el movimiento',
      texto: describirError(datos)
    })

    return
  }

  // ÉXITO:
  // - cerrar el diálogo
  // - limpiar el formulario (lo hace MovimientoForm al detectar que cerró)
  // - la tabla ya se actualizó sola por la reactividad de Pinia
  showForm.value = false

  mostrarExito(mensajeDeExito(datos.tipo))
}

// Texto de éxito según el tipo de movimiento (toast, no bloquea la pantalla)
function mensajeDeExito(tipo) {
  if (tipo === 'entrada') {
    return 'Entrada registrada correctamente.'
  }

  if (tipo === 'salida') {
    return 'Salida registrada correctamente.'
  }

  return 'Ajuste realizado correctamente.'
}

// ---------------------------------------------------------------------------
// Traduce un null del store a un mensaje entendible para el usuario.
// El store devuelve null en 3 casos, así que revisamos en el mismo orden.
// ---------------------------------------------------------------------------
function describirError(datos) {
  const producto = productosStore.obtenerProductos(datos.productoId)

  if (!producto) {
    return 'El producto seleccionado ya no existe en el inventario.'
  }

  // Un AJUSTE solo puede fallar si intenta dejar el stock en negativo
  // (el formulario lo previene, pero mantenemos el mensaje correcto aquí)
  if (datos.tipo === 'ajuste' && datos.cantidad < 0) {
    return 'El stock resultante no puede ser negativo.'
  }

  if (datos.cantidad <= 0) {
    return 'La cantidad debe ser un número mayor a 0.'
  }

  if (datos.tipo === 'salida') {
    // Caso más común: intentó retirar más de lo que hay en stock
    return `Stock insuficiente: ${producto.nombre} solo tiene ${producto.cantidad} unidades disponibles.`
  }

  return 'No se pudo registrar el movimiento. Revisa los datos e inténtalo de nuevo.'
}
</script>

<style scoped>
.movements-page {
  padding: 24px;
}

@media (max-width: 600px) {
  .movements-page {
    padding: 16px;
  }
}
</style>
