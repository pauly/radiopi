<template>
  <div>
    <h3>Genres:</h3>
    <p class="genres">
      <button v-for="(value, genre) of genres" @click="click(genre)" :class="value && 'on'">{{ genre }}</button>
    </p>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'mpc-genres',
  data () {
    return {
      genres: null
    }
  },
  created () {
    axios.get(`/genres`)
    .then(response => {
      // @todo yeah everything is tracks at the moment
      this.genres = response.data.tracks.reduce((genres, genre) => {
        genres[genre] = null
        return genres
      }, {})
    })
    .catch(this._error)
  },
  methods: {
    click (genre) {
      this.$emit('searchByGenre', genre)
      this.genres[genre] = !this.genres[genre]
      console.log(Object.keys(this.genres)
        .filter(genre => this.genres[genre] !== null)
        .reduce((genres, genre) => {
          genres[genre] = this.genres[genre]
          return genres
        }, {}))
    }
  }
}
</script>

<style scoped>
  button {
    font-size: 1em;
    margin: 0.5em;
  }
  button.on {
    font-weight: bold;
  }
</style>
