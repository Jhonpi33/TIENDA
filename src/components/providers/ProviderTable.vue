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
      <template #body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            flat
            round
            dense
            icon="edit"
            aria-label="Editar proveedor"
            @click="emit('edit', props.row)"
          />
          <q-btn
            flat
            round
            dense
            icon="delete"
            aria-label="Eliminar proveedor"
            @click="emit('delete', props.row)"
          />
        </q-td>
      </template>
    </q-table>
  </q-card>
</template>

<script setup>
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

const emit = defineEmits(['edit', 'delete'])

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
}

@media (max-width: 700px) {
  .provider-table :deep(.q-table__middle) {
    overflow-x: auto;
  }
}
</style>