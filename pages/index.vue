<template>
  <div class="main">
    <Mapbox
      access-token="pk.eyJ1IjoidmluZ2lsb3RueiIsImEiOiJja3Bhcnk0NXMwczdtMndta2JwbjQ1dG4zIn0.Gr6pVbDcfTpe8TsPVpbl8Q"
      :map-options="{
        style: style,
        center: [0, 0],
        zoom: 1,
        logoPosition: 'bottom-right',
        logoEnabled: false,
      }"
      :geolocate-control="{
        show: true,
        position: 'top-right',
        options: {
          positionOptions: {
            enableHighAccuracy: true,
            timeout: 3000,
            maximumAge: 500,
          },
          trackUserLocation: true,
          fitBoundsOptions: {
            maxZoom: 15,
          },
        },
      }"
      @map-load="loaded"
    />
    <Layers :layers="layers" :toggleLayer="toggleLayer" />
  </div>
</template>

<script>
import Mapbox from 'mapbox-gl-vue'
/* global mapboxgl */

export default {
  components: { Mapbox },
  asyncData: async ({ $http, req }) => {
    const host = process.server ? req.headers.host : window.location.host
    const sources = await $http.$get('https://' + host + '/tiles')

    const layersMapbox = []
    const layersMenu = []
    let first = true
    for (const tilesetId in sources) {
      const tileset = sources[tilesetId]
      layersMapbox.push({
        id: tileset.name,
        type: tileset.type,
        source: tilesetId,
        layout: {
          visibility: first ? 'visible' : 'none',
        },
      })
      layersMenu.push({
        id: tileset.name,
        name: tileset.name,
        description: tileset.description,
        type: tileset.type,
        source: tilesetId,
        visibility: first ? 'visible' : 'none',
      })
      first = false
    }

    return {
      sources,
      layers: layersMenu,
      style: {
        version: 8,
        sources,
        layers: layersMapbox,
      },
    }
  },
  mounted: () => {
    document.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault()
      },
      { passive: false }
    )

    document.addEventListener(
      'dblclick',
      (e) => {
        e.preventDefault()
      },
      { passive: false }
    )

    document.addEventListener(
      'touchmove',
      (e) => {
        e.preventDefault()
      },
      { passive: false }
    )
  },
  methods: {
    loaded(map) {
      this.map = map
      map.addControl(
        new mapboxgl.ScaleControl({
          maxWidth: 200,
          unit: 'nautical',
        }),
        'bottom-left'
      )
      map.addControl(
        new mapboxgl.ScaleControl({
          maxWidth: 200,
          unit: 'metric',
        }),
        'bottom-left'
      )
    },
    toggleLayer(layerId) {
      let visibility = this.map.getLayoutProperty(layerId, 'visibility')
      if (visibility === 'visible') {
        visibility = 'none'
      } else {
        visibility = 'visible'
      }
      this.map.setLayoutProperty(layerId, 'visibility', visibility)
      for (const layer of this.layers) {
        console.log(layer.id)
        if (layer.id !== layerId) continue
        layer.visibility = visibility
      }
      return visibility
    },
  },
}
</script>

<style>
.main {
  @apply m-0 h-screen;
  box-sizing: border-box;
}

.title {
  font-family: 'Quicksand', 'Source Sans Pro', -apple-system, BlinkMacSystemFont,
    'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  display: block;
  font-weight: 300;
  font-size: 100px;
  color: #35495e;
  letter-spacing: 1px;
}

.subtitle {
  font-weight: 300;
  font-size: 42px;
  color: #526488;
  word-spacing: 5px;
  padding-bottom: 15px;
}

.links {
  padding-top: 15px;
}

#map {
  @apply h-full w-full mx-0 absolute;
}
</style>
