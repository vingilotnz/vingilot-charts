<template>
  <div class="hidden">
    <!-- Chart Info -->
  </div>
</template>
<script>
// import { mapMutations } from 'vuex'

export default {
  mounted() {
    const host = window.location.host
    const protocol = window.location.protocol
    this.$http.$get(protocol + '//' + host + '/tiles').then(async (sources) => {
      let count = 0
      for (const tilesetId in sources) {
        const tileset = sources[tilesetId]
        const tilejson = await this.$http.$get(
          protocol + '//' + host + '/' + tileset.url
        )
        const layer = {
          // From tilejson
          id: tilesetId,
          name: tileset.name,
          type: tileset.type,
          tileJsonUrl: tileset.url,
          tileSize: tileset.tileSize,
          url: tilejson.tiles[0],
          description: tilejson.description,
          attribution: tilejson.attribution,
          minzoom: tilejson.minzoom,
          maxzoom: tilejson.maxzoom,
          version: tilejson.version,
          bounds: tilejson.bounds,
          // Application specific
          visible: count === 0,
          opacity: 1,
          contrast: 0,
          order: count++,
        }

        // Add as chart
        const existingLayers =
          this.$store.getters['charts/getLayerById'](tilesetId)
        if (existingLayers.length) {
          existingLayers.forEach((l) => {
            // Todo : Update the properties with the latest data
            this.$store.commit('charts/remove', l)
          })
        }
        this.$store.commit('charts/add', layer)

        // Add as overlay
        const overlay = { ...layer, opacity: 0.3, visible: false }
        const existingOverlays =
          this.$store.getters['charts/getOverlayById'](tilesetId)
        if (existingOverlays.length) {
          existingOverlays.forEach((o) => {
            // Todo : Update the properties with the latest data
            this.$store.commit('charts/removeOverlay', o)
          })
        }
        this.$store.commit('charts/addOverlay', overlay)
      }
    })
  },
}
</script>
