<template>
  <div class="hidden">
    <!-- Wakelock -->
  </div>
</template>
<script>
import NoSleep from 'nosleep.js'

export default {
  mounted() {
    this.nosleep = new NoSleep()
    this.nosleep.enable()
  },
  destroyed() {
    this.nosleep.disable()
  },
}
</script>
