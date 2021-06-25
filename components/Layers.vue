<template>
  <div class="absolute z-10 inline-block text-left m-3 select-none">
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
      <symbol id="icon_menu" viewBox="0 0 24 24" fill="none">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 6h16M4 12h16M4 18h16"
        />
      </symbol>
    </svg>

    <div class="w-min relative">
      <button
        type="button"
        class="
          inline-flex
          justify-center
          w-full
          rounded-md
          border border-gray-300
          shadow-sm
          px-4
          py-2
          bg-white
          text-sm
          font-medium
          text-gray-700
          hover:bg-gray-50
          focus:outline-none
          focus:ring-2
          focus:ring-offset-2
          focus:ring-offset-gray-100
          focus:ring-indigo-500
        "
        aria-expanded="true"
        aria-haspopup="true"
        @click="show = !show"
      >
        <svg class="mr-2 -ml-1 h-5 w-5" stroke="currentColor">
          <use xlink:href="#icon_menu" visible />
        </svg>
        Layers
      </button>
    </div>

    <div
      v-show="show"
      class="
        menu-drop-down
        is-shown
        origin-top-left
        relative
        left-0
        mt-2
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
      this.$store.commit('charts/toggle', layer)
    },
  },
}
</script>
