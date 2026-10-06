<template>
  <q-card class="product-table">
    <q-table flat :rows="products" row-key="id" :columns="columns" no-data-label="No hay productos para mostrar"
      rows-per-page-label="Registros por página:"
      :pagination-label="(firstRowIndex, endRowIndex, totalRowsNumber) => `${firstRowIndex}-${endRowIndex} de ${totalRowsNumber}`">
      <template #body-cell-status="props">
        <q-td :props="props">
          <StatusBadge :label="getStatus(props.row).label" :color="getStatus(props.row).color" />
        </q-td>
      </template>

      <template #body-cell-actions="props">
        <q-td :props="props">
          <q-btn flat round dense icon="visibility" aria-label="Ver producto" @click="emit('view', props.row)" />

          <q-btn flat round dense icon="edit" aria-label="Editar producto" @click="emit('edit', props.row)" />

          <q-btn flat round dense icon="delete" aria-label="Eliminar producto" @click="emit('delete', props.row)" />
        </q-td>
      </template>
    </q-table>
  </q-card>
</template>

<script setup>
import StatusBadge from '../ui/StatusBadge.vue'

defineProps({
  products: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['view', 'edit', 'delete'])

const columns = [
  {
    name: 'codigo',
    label: 'Código',
    field: 'codigo',
    align: 'left'
  },
  {
    name: 'nombre',
    label: 'Producto',
    field: 'nombre',
    align: 'left'
  },
  {
    name: 'categoria',
    label: 'Categoría',
    field: 'categoriaNombre',
    align: 'left'
  },
  {
    name: 'cantidad',
    label: 'Stock',
    field: 'cantidad',
    align: 'center'
  },
  {
    name: 'status',
    label: 'Estado',
    field: 'cantidad',
    align: 'center'
  },
  {
    name: 'actions',
    label: 'Acciones',
    field: 'actions',
    align: 'right'
  }
]

function getStatus(product) {
  if (product.cantidad === 0) {
    return {
      label: 'Agotado',
      color: 'negative'
    }
  }

  if (product.cantidad <= product.stockMinimo) {
    return {
      label: 'Stock bajo',
      color: 'warning'
    }
  }

  return {
    label: 'Disponible',
    color: 'positive'
  }
}
</script>

<style scoped>
.product-table {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
}

@media (max-width: 700px) {
  .product-table {
    border-radius: 8px;
  }
}
</style>