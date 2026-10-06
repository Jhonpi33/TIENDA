<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: 'info'
  }
})
</script>

<template>
  <q-card class="summary-card">
    <q-card-section>
      <div class="summary-top">
        <div class="summary-title">
          {{ title }}
        </div>

        <q-icon
          :name="icon"
          size="28px"
        />
      </div>

      <div class="summary-value">
        {{ value }}
      </div>

      <div
        v-if="description"
        class="summary-description"
      >
        {{ description }}
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>
.summary-card {
  width: 100%;
  border-radius: 12px;
}

.summary-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.summary-title {
  font-size: 14px;
  font-weight: 600;
}

.summary-value {
  margin-top: 12px;
  font-size: 32px;
  line-height: 1.1;
  font-weight: 700;
}

.summary-description {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.4;
}
</style>