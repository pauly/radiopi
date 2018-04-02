<template>
  <div>
    <h1>{{ artist }} - {{ title }}
      <a @click="rate(id)">👍</a>
      <a @click="hate(id)">👎</a>
    </h1>
    <h2 v-if="album">💿 {{ album }}
      <span v-if="track">#️⃣ {{ track }}</span>
    </h2>
    <!-- <h3>{{ toggles }}</h3> -->
    <search-form @search=search @artist=artist @title=title @playlist=playlist />
    <h3><a @click="next()">Next track ⏩</a></h3>
    <pre v-if="error">{{ error }}</pre>
    <ol v-if="tracks && tracks.length">
      <li v-for="track of tracks">
        {{track}}
        <a @click="play(track)">▶️</a>
        <a @click="addToList(track)">➕</a>
      </li>
    </ol>
    <mpc-playlists @play=play @addToList=addToList @changeList=changeList @error=error />
    <mpc-genres @searchByGenre=searchByGenre />
  </div>
</template>

<script>
import axios from 'axios'

import SearchForm from './SearchForm'
import Genres from './Genres'
import Playlists from './Playlists'

/* global io */
const socket = io()

export default {
  name: 'MPC',
  components: {
    'search-form': SearchForm,
    'mpc-genres': Genres,
    'mpc-playlists': Playlists
  },
  data () {
    return {
      id: '',
      artist: '',
      title: '',
      album: '',
      track: '',
      status: '',
      // toggles: '',
      playlist: null,
      tracks: [],
      error: ''
    }
  },
  created () {
    socket.on('artist', artist => {
      this.artist = artist
    })
    socket.on('title', title => {
      this.title = title
    })
    socket.on('id', id => {
      this.id = id
    })
    socket.on('album', album => {
      this.album = album
    })
    socket.on('track', track => {
      this.track = track
    })
    socket.on('console', log => {
      console.log(log)
    })
    socket.on('system', system => {
      console.log('system', system)
    })
  },
  methods: {
    error (e) {
      this.error = JSON.stringify(e, null, 2)
    },
    rate (id) {
      socket.emit('rate', id)
    },
    hate (id) {
      socket.emit('hate', id)
    },
    next () {
      socket.emit('next')
    },
    play (track, id) {
      console.log('▶️', track, id)
      // socket.emit('play', track)
      // this.changeList(id)
      axios.get(`/play`, { params: { track } })
        .catch(this.error)
    },
    addToList (track) {
      console.log('add', track, 'to', this.playlist)
      axios.get(`/add`, { params: { track, playlist: this.playlist } })
        .catch(this.error)
      // const playlist = this.playlists[this.playlist]
      // playlist.tracks.push(track)
      // this.saveList(playlist)
    },
    changeList (name, tracks) {
      this.playlist = name
      this.tracks = tracks
    },
    searchByGenre (genre) {
      axios.get(`/search`, { params: { genre } })
        .then(response => {
          this.tracks = response.data.tracks
        })
        .catch(this.error)
    },
    search (artist, title, album) {
      axios.get(`/search`, { params: { artist, title, album } })
        .then(response => {
          this.tracks = response.data.tracks
        })
        .catch(this.error)
    }
  }
}
</script>

<style>
h1, h2, li {
  font-size: 1em;
  font-weight: normal;
}
input, button {
  border-radius: 5px;
  font-size: 1.5em;
}
a {
  margin-left: 1em;
  color: #42b983;
}
</style>
