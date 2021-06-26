<template>
  <div
    class="absolute z-10 inline-block text-left ml-3 mt-16 select-none"
    v-show="overlays"
    @focusout="onFocusOut"
    @mouseleave="onFocusOut"
  >
    <!-- Symbols -->
    <svg xmlns="http://www.w3.org/2000/svg" class="hidden">
      <symbol id="icon_overlays" viewBox="0 0 24 24" fill="none">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </symbol>
      <symbol id="icon_check" viewBox="0 0 24 24" fill="none">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M5 13l4 4L19 7"
        />
      </symbol>
      <symbol id="icon_cross" viewBox="0 0 24 24" fill="none">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </symbol>
    </svg>

    <div class="w-min absolute">
      <button
        type="button"
        class="
          inline-flex
          justify-center
          w-full
          border border-gray-300
          shadow-sm
          py-2
          text-sm
          font-medium
          text-gray-700
          focus:outline-none
        "
        :class="
          show
            ? 'rounded-l-full pl-4 pr-10 bg-blue-100'
            : 'rounded-full px-4 bg-white'
        "
        aria-expanded="true"
        aria-haspopup="true"
        @click="show = !show"
      >
        <svg class="-mx-2 h-6 w-6" stroke="currentColor">
          <use xlink:href="#icon_overlays" visible />
        </svg>
      </button>
    </div>

    <div
      v-show="show"
      class="
        menu-drop-down
        is-shown
        origin-top-left
        fixed
        left-0
        mt-0
        ml-14
        w-max
        rounded-b-md rounded-r-md
        shadow-lg
        bg-white
        ring-1 ring-black ring-opacity-5
        divide-y divide-gray-100
        focus:outline-none
        z-20
      "
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="menu-button"
      tabindex="-1"
    >
      <ul class="pl-2 pr-2 py-1" role="none">
        <li
          v-for="layer in overlays"
          :key="layer.name"
          class="flex px-4 py-2 text-sm justify hover:font-bold"
          role="menuitem"
          @click="toggleOverlay(layer)"
          draggable
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="mr-3 my-auto -ml-2 h-4 w-4"
            stroke="currentColor"
          >
            <use v-if="layer.visible" xlink:href="#icon_check" />
            <use v-else xlink:href="#icon_cross" />
          </svg>
          {{ layer.name }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      show: false,
    }
  },
  computed: {
    overlays() {
      return this.$store.state.charts.overlays
    },
  },
  methods: {
    toggleOverlay(overlay) {
      this.$store.commit('charts/toggleOverlay', overlay)
    },
    onFocusOut(event) {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        this.show = false
      }
    },
  },
}
</script>
