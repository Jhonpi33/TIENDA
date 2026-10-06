<template>
    <q-card class="stock-alert-list">
    <q-card-section>
      <div class="section-header">
        <div>
          <h2 class="section-title">Alertas de stock</h2>
          <p class="section-description">
            Productos que requieren atención
          </p>
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <q-list v-if="products.length">
      <q-item
        v-for="product in products" :key="product.id" class="stock-alert-item">
        <q-item-section>
          <q-item-label class="product-name">
            {{ product.nombre }}
          </q-item-label>

          <q-item-label caption>
            Stock actual: {{ product.cantidad }}
          </q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-badge
            color="negative"
            label="Stock bajo"
          />
        </q-item-section>
      </q-item>
    </q-list>

    <EmptyState
      v-else title="Sin alertas" description="No hay productos con stock bajo."/>
  </q-card>

</template>

<script setup>
  import EmptyState from '../ui/EmptyState.vue';

defineProps({
    products:{type: Array, default: ()=> []}
})
</script>

<style scoped>
.stock-alert-list {
  width: 100%;
  border-radius: 12px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  margin: 0;
  font-size: 20px;
  line-height: 1.3;
  font-weight: 600;
}

.section-description {
  margin: 6px 0 0;
  font-size: 14px;
  line-height: 1.4;
}

.stock-alert-item {
  min-height: 64px;
}

.product-name {
  font-weight: 600;
}
</style>