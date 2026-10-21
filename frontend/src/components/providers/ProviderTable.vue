<template>
  <q-card class="provider-table">
    <q-table
  flat
  :rows="providers"
  row-key="id"
  :columns="columns"
  :no-data-label="noDataLabel"
  rows-per-page-label="Registros por página:"
  :pagination-label="(firstRowIndex, endRowIndex, totalRowsNumber) => `${firstRowIndex}-${endRowIndex} de ${totalRowsNumber}`"
>
      <!--
        SLOT #body
        Se reimplementa la fila para poder colgar el hover en el <tr> entero
        (con esto aparece la vista previa del proveedor al lado). Las celdas
        se recorren por columns, y sólo "estado" y "acciones" llevan contenido
        propio; el resto pinta el valor de la columna.

        El ANCLA es la celda del nombre (primer td) y no la fila: la fila
        ocupa todo el ancho de la tabla, a su derecha no cabería el cartel y
        acabaría pegándose al borde de la ventana.
      -->
      <template #body="props">
        <q-tr :props="props"
          @mouseenter="mostrarPreview($event, props.row, $event.currentTarget.firstElementChild)"
          @mouseleave="ocultarPreview">
          <q-td v-for="col in props.cols" :key="col.name" :props="props">
            <!-- ESTADO (activo / inactivo) -->
            <template v-if="col.name === 'estado'">
              <q-badge :color="props.row.activo !== false ? 'positive' : 'grey-6'"
                :label="props.row.activo !== false ? 'Activo' : 'Inactivo'" />
            </template>

            <template v-else-if="col.name === 'actions'">
              <q-btn flat round dense icon="edit" aria-label="Editar proveedor" @click="emit('edit', props.row)" />
              <!-- Activar / desactivar: alterna el estado sin eliminar -->
              <q-btn flat round dense
                :icon="props.row.activo !== false ? 'toggle_on' : 'toggle_off'"
                :color="props.row.activo !== false ? 'positive' : 'grey-6'"
                :aria-label="props.row.activo !== false ? 'Desactivar proveedor' : 'Activar proveedor'"
                @click="emit('toggle', props.row)" />
              <q-btn flat round dense icon="delete" aria-label="Eliminar proveedor"
                @click="emit('delete', props.row)" />
            </template>

            <template v-else>
              {{ col.value }}
            </template>
          </q-td>
        </q-tr>
      </template>
    </q-table>

    <!--
      Vista previa del proveedor bajo el cursor: se tele-transporta a body,
      así que su ubicación aquí no importa.
    -->
    <ProviderPreview :proveedor="proveedorEnHover" :ancla="anclaEnHover" @hide="ocultarPreview" />
  </q-card>
</template>

<script setup>
// Vista previa del proveedor (especialidad + muestra de productos) al
// pasar el cursor sobre una fila
import ProviderPreview from './ProviderPreview.vue'
import { useProveedorHover } from '../../utils/proveedorHover'

defineProps({
  providers: {
    type: Array,
    default: () => []
  },
  // Texto del estado vacío: la vista lo cambia para distinguir
  // "no hay proveedores" de "la búsqueda no tuvo resultados"
  noDataLabel: {
    type: String,
    default: 'No hay proveedores para mostrar'
  }
})

const emit = defineEmits(['edit', 'delete', 'toggle'])

// Vista previa del proveedor bajo el cursor
const { proveedorEnHover, anclaEnHover, mostrarPreview, ocultarPreview } = useProveedorHover()

// Orden fijo de columnas (el slot #body las pinta en este orden)
const columns = [
  {
    name: 'nombre',
    label: 'Proveedor',
    field: 'nombre',
    align: 'left'
  },
  {
    name: 'telefono',
    label: 'Teléfono',
    field: 'telefono',
    align: 'left'
  },
  {
    name: 'email',
    label: 'Correo',
    field: 'email',
    align: 'left'
  },
  {
    name: 'direccion',
    label: 'Dirección',
    field: 'direccion',
    align: 'left'
  },
  {
    name: 'estado',
    label: 'Estado',
    field: 'activo',
    align: 'center'
  },
  {
    name: 'actions',
    label: 'Acciones',
    field: 'actions',
    align: 'right'
  }
]
</script>

<style scoped>
.provider-table {
  width: 100%;
  border-radius: 12px;
  /* Contorno AZUL NEÓN para diferenciar la tabla del fondo */
  border: 1.5px solid #1E9EFF;
  box-shadow:
    0 0 10px rgba(30, 158, 255, 0.45),
    0 4px 16px rgba(15, 41, 77, 0.08);
}

@media (max-width: 700px) {
  .provider-table :deep(.q-table__middle) {
    overflow-x: auto;
  }
}
</style>