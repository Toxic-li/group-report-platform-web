<template>
  <div class="designer-provider" style="display: flex; flex-direction: column; height: 100%;">
    <slot />
  </div>
</template>

<script setup>
import { useDesignerProvider } from './composables/useDesigner.js'

useDesignerProvider()
</script>
