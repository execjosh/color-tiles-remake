BLOCK_SIZE = 25 # px

class @Sprite
  constructor: (@_x, @_y, @_dx, @_dy, @_color) ->

  render: (c) ->
    c.fillStyle = @_color
    c.fillRect @_x + 1, @_y + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2

  update: (dt) ->
    @_dy += 3600 * dt
    @_x += @_dx * dt
    @_y += @_dy * dt
