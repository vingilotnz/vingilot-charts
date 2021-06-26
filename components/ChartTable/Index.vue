<template>
  <div class="m-0 h-full box-border w-full absolute">
    <div :id="map_id" class="m-0 h-full box-border">
      <!-- chart here -->
    </div>
    <ChartTableBoat :map="map" />
  </div>
</template>

<script>
import { v4 as uuidv4 } from 'uuid'

import maplibregl from 'maplibre-gl'

const preventDefaultTouchBehaviour = () => {
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
}

export default {
  data() {
    return {
      map_id: uuidv4(),
      map: {},
    }
  },
  watch: {
    '$store.state.charts.layers': {
      deep: true,
      handler(val, oldVal) {
        val.forEach(this.updateChartLayer)
        console.log('changed')
      },
    },
    '$store.state.chartTable.targetZoom'(zoom) {
      if (!this.mapReady()) return
      if (this.$store.state.chartTable.zoom === zoom) return
      this.map.zoomTo(zoom)
    },
    '$store.state.chartTable.targetOrientation'(orientation) {
      if (!this.mapReady()) return
      if (this.$store.state.chartTable.orientation === orientation) return
      this.map.rotateTo(orientation)
    },
  },
  mounted() {
    preventDefaultTouchBehaviour()
    const map = new maplibregl.Map({
      container: this.map_id,
      style: {
        version: 8,
        sources: {},
        layers: [
          {
            id: '_charts',
            type: 'background',
            layout: { visibility: 'none' },
          },
          {
            id: '_boat',
            type: 'background',
            layout: { visibility: 'none' },
          },
        ],
      },
      center: [0, 0],
      zoom: 1,
      maxPitch: 0,
      pitchWithRotate: false,
      touchPitch: false,
      logoPosition: 'bottom-right',
      logoEnabled: false,
    })
    map.on('load', () => {
      this.initaliseMap(map)
    })
  },
  methods: {
    initaliseMap(map) {
      this.map = map
      this.$store.state.charts.layers.forEach(this.updateChartLayer)
      map.on('rotate', ({ target }) => {
        this.$store.commit('chartTable/setOrientation', target.getBearing())
      })
      map.on('rotateend', ({ target }) => {
        this.$store.commit('chartTable/setOrientation', target.getBearing())
        this.$store.commit('chartTable/orientTo', target.getBearing())
      })
      map.on('zoom', ({ target }) => {
        this.$store.commit('chartTable/setZoom', map.getZoom())
      })
      map.on('zoomend', ({ target }) => {
        this.$store.commit('chartTable/setZoom', map.getZoom())
        this.$store.commit('chartTable/zoomTo', map.getZoom())
      })
    },
    mapReady() {
      return this.map && this.map.loaded
    },
    updateChartLayer(layer) {
      if (!this.mapReady()) return false
      if (this.addChartLayer(layer)) return true

      const id = 'tile_' + layer.id

      if (this.map.getLayer(id) === undefined) return false

      // const mbLayer = this.map.getLayer(id)

      this.map.setLayoutProperty(
        id,
        'visibility',
        layer.visible ? 'visible' : 'none'
      )
      this.map.setPaintProperty(id, 'raster-opacity', layer.opacity || 1)
      this.map.setPaintProperty(id, 'raster-contrast', layer.contrast || 0)

      return true
    },
    addChartLayer(layer) {
      if (!this.map) return false
      const id = 'tile_' + layer.id
      if (this.map.getSource(id) === undefined) {
        const source = {
          name: layer.name,
          type: layer.type,
          url: layer.tileJsonUrl,
          tileSize: layer.tileSize,
        }
        this.map.addSource(id, source)
      }
      if (this.map.getLayer(id) === undefined) {
        const mbLayer = {
          id,
          type: layer.type,
          source: id,
          layout: {
            visibility: layer.visible ? 'visible' : 'none',
          },
        }
        this.map.addLayer(mbLayer, '_charts')
        return true
      }
      return false
    },
  },
}
</script>
