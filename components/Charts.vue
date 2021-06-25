<template>
  <div class="hidden">
    <!-- Chart Info -->
  </div>
</template>
<script>
// import { mapMutations } from 'vuex'

export default {
  async mounted() {
    const host = window.location.host
    const sources = await this.$http.$get('https://' + host + '/tiles')

    let count = 0
    for (const tilesetId in sources) {
      const tileset = sources[tilesetId]
      const tilejson = await this.$http.$get(
        'https://' + host + '/' + tileset.url
      )

      const layer = {
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
        visible: count === 0,
        opacity: 1,
        contrast: 0,
        order: count++,
      }

      this.$store.commit('charts/add', layer)
    }
  },
}
</script>
