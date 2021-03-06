<template>
  <div
    class="absolute z-10 inline-block text-left ml-3 mt-3 select-none h-fill"
    v-show="layers && layers.length"
    @focusout="onFocusOut"
    @mouseleave="onFocusOut"
  >
    <!-- Symbols -->
    <svg xmlns="http://www.w3.org/2000/svg" class="hidden">
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
      <symbol id="icon_layers" viewBox="0 0 24 24" fill="none">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
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
          <use xlink:href="#icon_layers" visible />
        </svg>
      </button>
    </div>

    <div
      v-show="show"
      class="
        menu-drop-down
        is-shown
        origin-top-left
        absolute
        left-0
        mt-0
        ml-14
        mb-auto
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
      style="overflow-y: auto; max-height: calc(100vh - 86px)"
    >
      <ul class="pl-2 pr-2 py-1" role="none">
        <li
          v-for="layer in layers"
          :key="layer.name"
          class="flex px-4 py-2 text-sm justify hover:font-bold"
          role="menuitem"
          @click="toggleLayer(layer)"
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
      // layers: [],
    }
  },
  computed: {
    layers() {
      return this.$store.state.charts.layers
    },
  },
  methods: {
    toggleLayer(layer) {
      this.$store.commit('charts/select', layer)
    },
    onFocusOut(event) {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        this.show = false
      }
    },
  },
}
</script>
