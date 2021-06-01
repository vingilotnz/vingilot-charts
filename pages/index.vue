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
            maxZoom: 17,
          },
        },
      }"
      @map-load="loaded"
    />
  </div>
</template>

<script>
import Mapbox from 'mapbox-gl-vue'
/* global mapboxgl */

export default {
  components: { Mapbox },
  data() {
    return {
      style: {
        version: 8,
        sources: {
          satellite: {
            type: 'raster',
            tiles: ['tiles/' + '{z}/{x}/{y}.jpg'],
            minzoom: 0,
            maxzoom: 18,
            tileSize: 256,
          },
        },
        layers: [
          {
            id: 'satellite',
            source: 'satellite',
            sourcelayer: 'satellite',
            type: 'raster',
          },
        ],
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
  @apply h-full w-full mx-0;
}
</style>
