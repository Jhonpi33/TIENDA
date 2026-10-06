<template>
    <q-page class="dashboard-page">
        <PageHeader
        title="Dashboard"
        description="Resumen general del inventario"
        />

        <section class="summary-grid">
        <SummaryCard
            v-for="card in summaryCards"
            :key="card.id"
            :title="card.title"
            :value="card.value"
            :description="card.description"
            :icon="card.icon"
        />
        </section>

        <section class="dashboard-grid">
        <StockAlertList :products="stockAlerts" />

        <QuickActions :actions="quickActions" />
        </section>
    </q-page>
</template>

<script setup>
    import { computed } from 'vue'
    import PageHeader from '../components/ui/PageHeader.vue'
    import SummaryCard from '../components/ui/SummaryCard.vue'
    import StockAlertList from '../components/dashboard/StockAlertList.vue'
    import QuickActions from '../components/dashboard/QuickActions.vue'
    import { useProductosStore } from '../stores/productos'
    import { useMovimientosStore } from '../stores/movimientos'
    const productosStore = useProductosStore()
    const movimientosStore = useMovimientosStore()

    // "computed" mantiene el array reactivo: cada tarjeta se recalcula sola
    // cuando cambian los datos de los stores (crear/editar/eliminar productos,
    // registrar movimientos, etc.)
    const summaryCards = computed(() => [
        {
            id:1,
            title: 'Productos',
            value: productosStore.totalProductos,
            description: 'Productos registrados',
            icon: 'inventory_2',
        },

        {
            id:2,
            title: 'Stock Bajo',
            value: productosStore.productosStockBajo.length,
            description: 'Productos necesitan atencion',
            icon: 'warning',
        },

        {
            id:3,
            title:'Movimientos',
            value: movimientosStore.totalMovimientos,
            description: 'Movimientos registrados',
            icon: 'swap_horiz',
        }
    ])

    // Mismo criterio: la lista de alertas se repinta al cambiar el stock
    const  stockAlerts = computed(() => productosStore.productosStockBajo)
        

    const quickActions = [
          {
    id: 1,
    label: 'Ver inventario',
    icon: 'inventory_2',
    to: '/inventario'
  },

  {
    id: 2,
    label: 'Ver movimientos',
    icon: 'swap_horiz',
    to: '/movimientos'
  },

  {
    id: 3,
    label: 'Ver categorías',
    icon: 'category',
    to: '/categorias'
  },

  {
    id: 4,
    label: 'Ver reportes',
    icon: 'assessment',
    to: '/reportes'
  }
    ]
</script>

<style scoped>
.dashboard-page {
  padding: 24px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 1fr);
  gap: 24px;
}

@media (max-width: 900px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .dashboard-page {
    padding: 16px;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>