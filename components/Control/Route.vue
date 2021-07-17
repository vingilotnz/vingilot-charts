<template>
  <div
    class="absolute z-10 inline-block text-left ml-3 mt-32 select-none h-fill"
    v-show="routes"
    @focusout="onFocusOut"
    @mouseleave="onFocusOut"
  >
    <!-- Symbols -->
    <svg xmlns="http://www.w3.org/2000/svg" class="hidden">
      <symbol id="icon_routes" viewBox="0 0 24 24" fill="none">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
        />

        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        ></svg>
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
          <use xlink:href="#icon_routes" visible />
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
        top-0
        left-0
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
      style="overflow-y: auto; max-height: calc(100vh - 200px)"
    >
      <ul class="pl-2 pr-2 py-1" role="none">
        <li
          v-for="route in routes"
          :key="route.name"
          class="flex px-4 py-2 text-sm justify hover:font-bold"
          role="menuitem"
          @click="selectRoute(route)"
          draggable
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="mr-3 my-auto -ml-2 h-4 w-4"
            stroke="currentColor"
          >
            <use v-if="route.visible" xlink:href="#icon_check" />
            <use v-else xlink:href="#icon_cross" />
          </svg>
          {{ route.name }}
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
    routes() {
      return this.$store.state.routes.routes
    },
  },
  methods: {
    selectRoute(route) {
      this.$store.commit('routes/toggle', route)
    },
    onFocusOut(event) {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        this.show = false
      }
    },
  },
}
</script>
