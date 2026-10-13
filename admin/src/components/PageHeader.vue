<script setup lang="ts">
defineOptions({ name: 'PageHeader' });

defineProps<{
  title: string;
  description?: string;
}>();
</script>

<template>
  <header class="page-header">
    <div class="page-header__text">
      <h2 class="page-header__title">{{ title }}</h2>
      <p v-if="description" class="page-header__desc">{{ description }}</p>
    </div>
    <div class="page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped lang="scss">
.page-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;

  &__title {
    color: var(--app-ink);
    font-size: 18px;
    font-weight: 600;
    line-height: 1.4;
  }

  &__desc {
    margin-top: 4px;
    color: var(--app-ink-3);
    font-size: 13px;
  }

  &__actions {
    display: flex;
    flex-shrink: 0;
    gap: 8px;
    align-items: center;
  }

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>

