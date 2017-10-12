<template>
  <div>
    <h1>{{ playing }}</h1>
    <h2>{{ status }}</h2>
    <!-- <h3>{{ toggles }}</h3> -->
    <input v-model="artist" placeholder="artist" @change="search()"/>
    <input v-model="title" placeholder="title" @change="search()"/>
    <input v-model="album" placeholder="album" @change="search()"/>
    <button>Search 🔎</button> <!-- does not really do anything -->
    <h3><a @click="next()">Next track ⏩</a></h3>
    <pre v-if="error">{{ error }}</pre>
    <ol v-if="tracks && tracks.length">
      <li v-for="track of tracks">
        {{track}}
        <a @click="play(track)">▶️</a>
        <!-- still a problem with inconsistent results, sometimes a path, sometimes artist - title -->
        <a @click="addToList(track)">➕</a>
        <a @click="remove(track)">🚮</a>
      </li>
    </ol>
    <h3 v-if="playlists && playlists.length">Playlists (click to expand)</h3>
    <ul v-if="playlists && playlists.length">
      <li v-for="(list, listID) of playlists" @click="changeList(listID)">
        <h2>
          {{ list.name }}
          <a @click="playList(listID)">▶️</a>
          <a @click="shuffle(listID)">🔀</a>
          <a @click="removeList(listID)">🚮</a>
        </h2>
      </li>
    </ul>
    <h3><a @click="addList()">New playlist ➕</a></h3>
    <h3>Excuses:</h3>
    <ol>
      <li>you can't edit one playlist while listening to another</li>
      <li>you can't reorder a playlist yet, coming soon</li>
      <li>might be slow</li>
      <li>still a bit crap</li>
    </ol>
    <h3 v-if="genres.length">Genres:</h3>
    <p v-if="genres.length" class="genres">
      <button v-for="genre of genres" @click="searchByGenre(genre)">{{ genre }}</button>
    </p>
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
      genres: [],
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
    axios.get(`/genres`)
    .then(response => {
      this.genres = response.data.tracks // @yeah everything is tracks at the moment
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
        // console.log('▶️ got response', response)
        this.playing = track
        this._getStatus()
      })
      .catch(this._error)
    },
    addList () {
      const name = ('' + new Date()).substr(0, 21).replace(/\W/g, '')
      this.playlists.push({ name, tracks: [] })
      this.changeList(this.playlists.length - 1)
      // don't need to save it until we add a track to it
    },
    saveList (playlist) {
      axios.post('/saveList', playlist)
      .then(() => {
        console.log('also change to this list locally')
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
        // good idea? show the tracks in the main bit instead
        this.tracks = response.data.tracks
      })
      .catch(this._error)
    },
    shuffle (id) {
      console.log('@todo, shuffle 🔀')
      this.playList(id)
    },
    playList (id) {
      console.log('this should be "load playlist", @todo split it out from just "view playlist"')
      this.changeList(id)
      this.play()
    },
    remove (track) {
      const playlist = this.playlists[this.playlist].name
      console.log('remove', track, playlist)
      axios.delete(`/track?track=${track}&playlist=${playlist}`)
      .then(response => {
        this.error = response.data.error
        this.playlists[this.playlist].tracks = this.playlists[this.playlist].tracks.filter(item => {
          console.log(item, '==', track, '?')
          return item !== track
        })
      })
      // @todo filter here for quick response
    },
    searchByGenre (genre) {
      console.log('genre', genre, 'was', this.genres[genre])
      this.genres[genre] = !this.genres[genre]
      /* const query = Object.keys(this.genres)
        .filter(genre => this.genres[genre])
        .map(genre => `genres[]=${genre}`)
        .join('&') */
      axios.get(`/search?genre=${genre}`)
      .then(response => {
        this.tracks = response.data.tracks
      })
      .catch(this._error)
    },
    search () {
      /* const query = ['artist', 'title', 'album']
        .filter(term => this[term])
        .map(term => `${term}=${this[term]}`)
        .join('&')
      axios.get(`/search?${query}`) */
      // axios.get('/search', { foo: 'bar' }) not working on this version?
      const artist = this.artist
      const title = this.title
      const album = this.album
      axios.get(`/search`, { params: { artist, title, album } })
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
  margin-right: 1.5em;
  color: #42b983;
}
.genres button {
  font-size: 0.9em;
  margin: 0.5em;
}
</style>
