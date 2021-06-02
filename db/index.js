module.exports = {
  ...require('./client'),
  ...require('./adapters/users'),
  ...require('./adapters/storage_locations'),
  ...require('./adapters/boxes'),
  ...require('./adapters/items'),
  ...require('./adapters/box_items'),
}