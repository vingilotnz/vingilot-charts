<template>
  <div class="absolute z-10 text-right m-3 right-0">
    <!-- Symbols -->
    <svg xmlns="http://www.w3.org/2000/svg" class="hidden">
      <symbol id="icon_plus" viewBox="0 0 24 24" fill="none">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
        />
      </symbol>
      <symbol id="icon_minus" viewBox="0 0 24 24" fill="none">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M20 12H4"
        />
      </symbol>
      <symbol id="icon_needle" viewBox="0 0 24 24" fill="none">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M8 7l4-4m0 0l4 4m-4-4v18"
        />
      </symbol>
      <symbol id="icon_fullscreen" viewBox="0 0 24 24" fill="none">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
        />
      </symbol>
      <symbol id="icon_fullscreen_exit" viewBox="0 0 24 24" fill="none">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 4 L9 9 M5 9 H9 V5 M20 4 L15 9 M19 9 H15 V5 M20 20 L15 15 M19 15 H15 V19 M4 20 L9 15 M5 15 H9 V19"
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
        <button class="p-2" role="none" @click="zoomIn()">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="m-auto h-5 w-5"
            stroke="currentColor"
          >
            <use xlink:href="#icon_plus" />
          </svg>
        </button>
      </div>
      <div>
        <button class="p-2" role="none" @click="zoomOut()">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="m-auto h-5 w-5"
            stroke="currentColor"
          >
            <use xlink:href="#icon_minus" />
          </svg>
        </button>
      </div>
      <div>
        <button
          id="zoom_needle"
          class="p-2"
          role="none"
          @click="resetOrientation()"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="m-auto h-5 w-5"
            stroke="currentColor"
          >
            <use xlink:href="#icon_needle" />
          </svg>
        </button>
      </div>
    </div>

    <div
      v-if="canFullscreen"
      class="
        relative
        mt-4
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
        <button class="p-2" role="none" @click="toggleFullscreen()">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="m-auto h-5 w-5"
            stroke="currentColor"
          >
            <use v-if="!isFullscreen" xlink:href="#icon_fullscreen" />
            <use v-else xlink:href="#icon_fullscreen_exit" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    fullScreenId: {
      type: String,
      default: () => 'main',
    },
  },
  data() {
    return {
      isFullscreen: false,
      canFullscreen: false,
    }
  },
  computed: {
    orientation() {
      return this.$store.chartTable.orientation
    },
  },
  mounted() {
    if (document.fullscreenEnabled) {
      this.canFullscreen = true
      const e = document.getElementById(this.fullScreenId)
      e.onfullscreenchange = (event) => {
        const elem = event.target
        this.isFullscreen = document.fullscreenElement === elem
      }
    }
  },
  methods: {
    toggleFullscreen() {
      const main = document.getElementById(this.fullScreenId)
      if (this.isFullscreen) {
        document.exitFullscreen()
      } else {
        main.requestFullscreen({
          navigationUI: 'hide',
        })
      }
    },
    zoomIn() {
      this.$store.commit('chartTable/zoomIn')
    },
    zoomOut() {
      this.$store.commit('chartTable/zoomOut')
    },
    resetOrientation() {
      this.$store.commit('chartTable/resetOrientation')
    },
  },
  watch: {
    '$store.state.chartTable.orientation'(orientation) {
      document.getElementById(
        'zoom_needle'
      ).style.transform = `rotate(${-orientation}deg)`
    },
  },
}
</script>
