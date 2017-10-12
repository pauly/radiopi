<template>
  <div>
    <h1>{{ playing }}</h1>
    <h2>{{ status }}</h2>
    <!-- <h3>{{ toggles }}</h3> -->
    <input v-model="artist" placeholder="artist" @change="search()"/>
    <input v-model="title" placeholder="title" @change="search()"/>
    <input v-model="album" placeholder="album" @change="search()"/>
    <button>Search 🔎</button> <!-- does not really do anything -->
    <p><a @click="next()">Next track ⏩</a></p>
    <pre v-if="error">{{ error }}</pre>
    <ul v-if="tracks && tracks.length">
      <li v-for="track of tracks">
        {{track}}
        <a @click="play(track)">▶️</a>
        <a @click="addToList(track)">➕</a>
      </li>
    </ul>
    <ul v-if="playlists && playlists.length">
      <li v-for="(list, listID) of playlists" @click="changeList(listID)">
        <h2>
          <!-- <a @click="changeList(listID)">{{ list.name }}</a> -->
          {{ list.name }}
          <a @click="playList(listID)">▶️</a>
          <a @click="shuffle(listID)">🔀</a>
          <a @click="removeList(listID)">🚮</a>
        </h2>
        <ol>
          <li v-for="(track, trackID) of list.tracks">
            {{track}}
            <a @click="play(track, listID)">▶️</a>
            <a @click="removeFromList(trackID, listID)">🚮</a>
          </li>
        </ol>
      </li>
    </ul>
    <p><a @click="addList()">New playlist ➕</a></p>
    <div v-if="tags && tags.length">
      <ul class="tags">
        <li v-for="tag of tags">{{ tag }}</li>
      </ul>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'MPC',
  data () {
    return {
      term: '',
      playing: '',
      track: '',
      status: '',
      toggles: '',
      playlist: null,
      playlists: [],
      tracks: [],
      error: ''
    }
  },
  created () {
    axios.get(`/playlists`)
    .then(response => {
      this.playlists = response.data.tracks.map(name => {
        return { name, tracks: [] }
      })
      this._getStatus()
    })
    .catch(this._error)
    axios.get(`/tags`)
    .then(response => {
      console.log('tags got', response.data)
      this.tags = response.data.tracks // @yeah everything is tracks at the moment
    })
    .catch(this._error)
  },
  methods: {
    _error (e) {
      this.error = JSON.stringify(e)
    },
    _getStatus () {
      axios.get(`/mpc`)
      .then(response => {
        this.playing = response.data.playing
        this.status = response.data.status
        this.toggles = response.data.toggles
      })
      .catch(this._error)
    },
    next (track) {
      axios.get(`/next`)
      .then(response => {
        console.log('⏩ got', track)
        this._getStatus()
      })
      .catch(this._error)
    },
    play (track, id) {
      console.log('▶️', track, id)
      if (/\//.test(track)) console.warn('in a suitable format???')
      this.changeList(id)
      axios.get(`/play?v=${track}`)
      .then(response => {
        console.log('▶️ got response', response)
        this.playing = track
        this._getStatus()
      })
      .catch(this._error)
    },
    addList () {
      const name = ('' + new Date()).substr(0, 21).replace(/\W/g, '')
      const playlist = { name, tracks: [] }
      this.saveList(playlist)
    },
    saveList (playlist) {
      this.playlists.push(playlist)
      axios.post('/saveList', playlist)
      .then(() => {
        console.log('also change to this list locally')
        // this.changeList(this.playlists.length - 1)
      })
      .catch(this._error)
    },
    removeList (id) {
      if (this.playlists.length < 2) return
      const playlist = this.playlists[id]
      // @todo fix this, may appear to have 0 tracks locally
      // if (!confirm(`remove ${playlist.name} with ${playlist.tracks.length} tracks?`)) return
      if (!confirm(`remove "${playlist.name}"?`)) return
      axios.get(`/removeList?v=${this.playlists[id].name}`)
      .catch(this._error)
      this.playlists.splice(id, 1)
    },
    addToList (track) {
      console.log('add', track, 'to playlist', this.playlist)
      const playlist = (this.playlists[this.playlist])
      playlist.tracks.push(track)
      this.saveList(playlist)
    },
    changeList (id) {
      if (id === undefined) return
      if (id === this.playlist) return
      this.playlist = id
      console.log('change to', this.playlists[id].name)
      axios.get(`/changeList?v=${this.playlists[id].name}`)
      .then(response => {
        // console.log('local playlist tracks were', this.playlists[id].tracks, 'remote were', response.data.tracks)
        // if (this.playlists[id].tracks) return
        // if (this.playlists[id].tracks.length) return
        this.playlists[id].tracks = response.data.tracks
      })
      .catch(this._error)
    },
    shuffle (id) {
      console.log('@todo, shuffle 🔀')
      this.playList(id)
    },
    playList (id) {
      this.changeList(id)
      this.play()
    },
    removeFromList (trackID, listID) {
      this.playlists[listID].tracks.splice(trackID, 1)
      this.saveList(this.playlists[listID])
    },
    search () {
      const query = ['artist', 'title', 'album']
        .filter(term => this[term])
        .map(term => `${term}=${this[term]}`)
        .join('&')
      // axios.get('/search', { foo: 'bar' }) not working on this version
      axios.get(`/search?${query}`)
      .then(response => {
        this.tracks = response.data.tracks
      })
      .catch(this._error)
    }
  }
}
</script>

<style scoped>
h1, h2, li {
  font-weight: normal;
}
input, button {
  border-radius: 5px;
  font-size: 1.5em;
}
a {
  color: #42b983;
}
ul.tags {
  list-style: none;
}
ul.tags li {
  display: inline;
}
</style>
