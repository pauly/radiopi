<template>
  <form>
    <input v-model="artist" placeholder="artist" @change="search()"/>
    <input v-model="title" placeholder="title" @change="search()"/>
    <!-- <input v-model="album" placeholder="album" @change="search()"/> -->
    <button @click="search()" >Search 🔎</button>
  </form>
</template>

<script>

// global io
// const socket = io()

export default {
  name: 'search-form',
  methods: {
    search (event) {
      // console.log('emitting search', this.artist, this.title, this.album)
      // socket.emit('search', this.artist, this.title, this.album)
      this.$emit('search', this.artist, this.title, this.album)
      if (event) event.preventDefault()
    }
  },
  props: {
    artist: String,
    title: String,
    album: String
  }
}
</script>
