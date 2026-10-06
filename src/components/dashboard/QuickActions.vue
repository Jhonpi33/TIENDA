<template>
     <q-card class="quick-actions">
    <q-card-section>
      <h2 class="section-title">Acciones rápidas</h2>
      <p class="section-description">
        Accede rápidamente a las funciones principales
      </p>
    </q-card-section>

    <q-separator />

    <q-card-section class="actions-grid">
      <q-btn
        v-for="action in actions"
        :key="action.id"
        :to="action.to"
        :icon="action.icon"
        :label="action.label"
        outline
        no-caps
        class="action-button"
      />
    </q-card-section>
  </q-card>
</template>

<script setup>
    defineProps({
        actions:{type: Array, default: () => []}
    })
</script>

<style scoped>
.quick-actions {
  width: 100%;
  border-radius: 12px;
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

.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.action-button {
  min-height: 48px;
}

@media (max-width: 600px) {
  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>