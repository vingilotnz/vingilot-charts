<template>
  <div
    class="absolute z-10 text-right m-6 right-0 top-60 select-none"
    v-if="activeOverlay"
  >
    <input
      type="range"
      min="0"
      max="1"
      :value="(activeOverlay && activeOverlay.opacity) || 0"
      @input="updateOpacity"
      step="0.01"
      class="opacity_slider"
      orient="vertical"
    />
  </div>
</template>

<script>
export default {
  computed: {
    activeOverlay() {
      return this.$store.getters['charts/getActiveOverlays'][0] || false
    },
  },
  methods: {
    updateOpacity(e) {
      this.$store.commit('charts/setOverlayOpacity', {
        overlay: this.$store.getters['charts/getActiveOverlays'][0],
        opacity: Number(e.target.value),
      })
    },
  },
}
</script>

<style>
input[type='range'][orient='vertical'] {
  writing-mode: bt-lr; /* IE */
  -webkit-appearance: slider-vertical; /* WebKit */
  width: 8px;
  height: 175px;
  padding: 0 5px;
}
</style>
