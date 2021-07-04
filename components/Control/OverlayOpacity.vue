<template>
  <div
    class="absolute z-10 text-right m-3 right-0 top-60 select-none"
    v-if="activeOverlay"
  >
    <!-- Symbols -->
    <svg xmlns="http://www.w3.org/2000/svg" class="hidden">
      <symbol id="icon_plus_opacity" viewBox="0 0 24 24" fill="none">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z"
        />
      </symbol>
      <symbol id="icon_minus_opacity" viewBox="0 0 24 24" fill="none">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z"
        />
      </symbol>
    </svg>
    <div
      class="
        relative
        right-0
        w-max
        rounded-md
        shadow-lg
        bg-white
        ring-1 ring-black ring-opacity-5
        divide-y divide-gray-100
        focus:outline-none
      "
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="menu-button"
      tabindex="-1"
    >
      <div>
        <button
          class="p-2"
          role="none"
          @mousedown="startChangeOpacity(0.1)"
          @click="stopChangeOpacity()"
          @mouseout="stopChangeOpacity()"
          @mouseleave="stopChangeOpacity()"
          @mouseup="stopChangeOpacity()"
          @touchend="stopChangeOpacity()"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="m-auto h-5 w-5"
            stroke="currentColor"
          >
            <use xlink:href="#icon_plus_opacity" />
          </svg>
        </button>
      </div>
      <div class="p-2 align-middle">
        <div class="text-center w-5 text-sm">
          {{ (activeOverlay.opacity * 100).toFixed(0) }}
        </div>
      </div>
      <div>
        <button
          class="p-2"
          role="none"
          @mousedown="startChangeOpacity(-0.1)"
          @click="stopChangeOpacity()"
          @mouseout="stopChangeOpacity()"
          @mouseleave="stopChangeOpacity()"
          @mouseup="stopChangeOpacity()"
          @touchend="stopChangeOpacity()"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="m-auto h-5 w-5"
            stroke="currentColor"
          >
            <use xlink:href="#icon_minus_opacity" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      changeIntervalId: false,
    }
  },
  computed: {
    activeOverlay() {
      return this.$store.getters['charts/getActiveOverlays'][0] || false
    },
  },
  methods: {
    stopChangeOpacity() {
      if (this.changeIntervalId) {
        clearInterval(this.changeIntervalId)
        this.changeIntervalId = false
      }
    },
    startChangeOpacity(delta) {
      this.stopChangeOpacity()
      this.changeOpacity(delta)
      this.changeIntervalId = setInterval(() => this.changeOpacity(delta), 250)
    },
    changeOpacity(delta) {
      const overlay = this.$store.getters['charts/getActiveOverlays'][0]
      this.$store.commit('charts/setOverlayOpacity', {
        overlay,
        opacity: overlay.opacity + delta,
      })
    },
    updateOpacity(e) {
      this.$store.commit('charts/setOverlayOpacity', {
        overlay: this.$store.getters['charts/getActiveOverlays'][0],
        opacity: Number(e.target.value),
      })
    },
  },
}
</script>

<style></style>
