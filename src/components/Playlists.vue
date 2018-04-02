<template>
  <div v-if="playlists">
    <h3>Playlists (click to expand)</h3>
    <ul>
      <li v-for="(list, name) of playlists" @click="changeList(name)" :class="name === playlist ? 'on' : 'off'">
        <h2>
          {{ name }}
          <a @click="playList(name)">▶️</a>
          <!-- <a @click="shuffle(name)">🔀</a> -->
          <a @click="removeList(name)">🚮</a>
        </h2>
        <ol v-if="list.length">
          <li v-for="track of list">
            {{track}}
            <a @click="play(track)">▶️</a>
            <a @click="remove(track)">🚮</a>
          </li>
        </ol>
      </li>
    </ul>
    <h3><a @click="addList()">New playlist ➕</a></h3>
    <h3>Excuses (coming soon):</h3>
    <ul>
      <li>you can't edit one playlist while listening to another</li>
      <li>you can't reorder a playlist yet</li>
      <li>might be slow</li>
      <li>still a bit crap</li>
    </ul>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'mpc-playists',
  data () {
    return {
      playlist: null,
      playlists: {}
    }
  },
  created () {
    axios.get(`/playlists`)
      .then(response => {
        this.playlists = response.data.tracks.reduce((lists, name) => {
          lists[name] = []
          return lists
        }, {})
      })
      .catch(this.error)
  },
  methods: {
    addList () {
      const name = ('' + new Date()).substr(0, 21).replace(/\W/g, '')
      // this.playlists[name] = []
      this.changeList(name)
      // don't need to save it until we add a track to it
    },
    /* shuffle (id) {
      console.log('@todo, shuffle 🔀')
      this.playList(id)
    }, */
    error (error) {
      this.$emit('error', error)
    },
    play (track) {
      this.$emit('play', track)
    },
    changeList (name) {
      if (name === undefined) return
      if (name === this.playlist) return
      axios.get(`/changeList?v=${name}`)
        .then(response => {
          this.$emit('changeList', name, response.data.tracks)
        })
        .catch(this.error)
    },
    remove (track) { // @todo not working
      console.log('remove', track, this.playlist)
      axios.delete(`/track?track=${track}&playlist=${this.playlist}`)
        .then(response => {
          console.log('deleted response was', response)
          this.error = response.data.error
          /* console.log(this.playlist, 'had', this.playlists[this.playlist].length, 'tracks')
          this.playlists[this.playlist] = this.playlists[this.playlist].filter(item => {
            return item !== track
          })
          console.log(this.playlist, 'now has', this.playlists[this.playlist].length, 'tracks') */
        })
      // @todo filter here for quick response
    },
    playList (name) {
      console.log('this should be "load playlist", @todo split it out from just "view playlist"')
      this.changeList(name)
      this.play()
    },
    removeList (name) {
      if (this.playlists.length < 2) return
      // const playlist = this.playlists[name]
      // @todo fix this, may appear to have 0 tracks locally
      // if (!confirm(`remove ${playlist.name} with ${playlist.tracks.length} tracks?`)) return
      if (!confirm(`remove "${name}"?`)) return
      axios.get(`/removeList?v=${name}`)
        .catch(this.error)
      // delete this.playlists[name]
    }
  }
}
</script>

<style scoped>
  ul {
    list-style: none;
    padding-left: 0;
  }
  ol {
    display: none;
  }
  .on ol {
    display: block;
  }
</style>
