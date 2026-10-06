<script setup>
defineProps({
  label: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: 'grey'
  }
})
</script>

<template>
  <q-badge
    :color="color"
    :label="label"
    class="status-badge"
  />
</template>

<style scoped>
.status-badge {
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}
</style>