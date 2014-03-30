STATE_NULL = 'null'
STATE_INIT = 'init'
STATE_READY = 'ready'
STATE_GAME = 'game'
STATE_END = 'end'

COLOR_TABLE = [
  '#06F'  # Blue
  '#F8F'  # Pink
  '#C6C'  # Purple
  '#6CC'  # Cyan
  '#BBB'  # Grey
  '#CC6'  # Yellow
  '#F90'  # Orange
  '#0C0'  # Green
  '#C60'  # Brown
  '#F66'  # Red
]

FPS = 60
DT = 0.001
LEVEL_TIME = 120  # sec
COUNTDOWN_PENALTY = 10  # sec

MARGIN_TOP = 20
MARGIN_LEFT = 20
MARGIN_RIGHT = 20
MARGIN_BOTTOM = 35

BLOCK_SIZE = 25 # px
BLOCKS_WIDE = 23
BLOCKS_HIGH = 15

MOUSE_ALPHA_VELOCITY = 3

log = ->
  console.log.apply console, arguments

class @Application
  constructor: ->
    @_version = '{{VERSION}}'

    @_state = STATE_NULL
    @_ctx = null

    @_w = 1
    @_h = 1

    @_screens = {}

    @_clicked = false
    @_lastTime = 0
    @_timeAccumulator = 0

    @_mouseX = 0
    @_mouseY = 0
    @_clickX = 0
    @_clickY = 0
    @_mouseAlpha = 1.0
    @_lastIX = 0
    @_lastIY = 0

    @_board = []

    @_countDown = 0
    @_score = 0

    @_gameEnd = 0

    @_spriteList = []

  init: (id) ->
    return false unless @_state is STATE_NULL

    @setState STATE_INIT

    canvas = $("##{id}")
    return false unless canvas?

    # Set-up mouse handlers
    canvas
      .mousedown((e) =>
        {offsetX: x, offsetY: y} = e
        @onClick x, y
      )
      .mousemove((e) =>
        {offsetX: x, offsetY: y} = e
        @onMouseMove x, y
      )

    el = canvas.get 0
    @_ctx = el.getContext('2d')
    @_w = parseInt el.width, 10
    @_h = parseInt el.height, 10

    @setState STATE_READY

    return true

  getSprite: (ix, iy, color) ->
    x = MARGIN_LEFT + BLOCK_SIZE + (ix * BLOCK_SIZE)
    y = MARGIN_TOP + BLOCK_SIZE + (iy * BLOCK_SIZE)
    dx = Math.random() * 600 - 300
    dy = -500

    return new Sprite x, y, dx, dy, color

  generateBoard: ->
    # Initialize all to "empty"
    for iy in [0...BLOCKS_HIGH]
      row = (null for ix in [0...BLOCKS_WIDE])
      @_board[iy] = row

    # Place 20 blocks of each color
    for color in COLOR_TABLE
      for j in [0...20]
        # Find a random spot that is empty
        loop
          ix = Math.floor Math.random() * BLOCKS_WIDE
          iy = Math.floor Math.random() * BLOCKS_HIGH
          break unless @_board[iy][ix]?
        @_board[iy][ix] = @getSprite ix, iy, color

    return  # void

  onClick: (x, y) ->
    @_clickX = x
    @_clickY = y
    @_clicked = true

    return  # void

  onMouseMove: (x, y) ->
    @_mouseX = x
    @_mouseY = y

    ix = @x2index @_mouseX
    iy = @y2index @_mouseY

    unless @_lastIX is ix and @_lastIY is iy
      @_mouseAlpha = 1.0

    @_lastIX = ix
    @_lastIY = iy

    return  # void

  onTick: (now) =>
    deltaTime = (now - @_lastTime) * 0.001

    if 0.25 < deltaTime
      deltaTime = 0.25

    # Update last time
    @_lastTime = now

    @updateInput()

    @_timeAccumulator += deltaTime
    while @_timeAccumulator >= DT
      @updateGame DT
      @_timeAccumulator -= DT

    @updateGrafix()

    requestAnimationFrame @onTick

    return  # void

  setState: (s) ->
    trans = "#{@_state}:#{s}"

    # Before transition
    # nothing...

    # Update state
    @_state = s

    # After transition
    switch trans
      when "#{STATE_INIT}:#{STATE_READY}"
        @generateBoard()
        @_lastTime = performance.now()
        requestAnimationFrame @onTick
      when "#{STATE_READY}:#{STATE_GAME}"
        @generateBoard()
        @_countDown = LEVEL_TIME
        @_score = 0
        @_spriteList = []
      when "#{STATE_GAME}:#{STATE_END}"
        @_gameEnd = performance.now()
        @_spriteList = []
      when "#{STATE_END}:#{STATE_READY}"
        @generateBoard()

    return  # void

  x2index: (x) ->
    Math.floor((x - MARGIN_LEFT) / BLOCK_SIZE) - 1

  y2index: (y) ->
    Math.floor((y - MARGIN_TOP) / BLOCK_SIZE) - 1

  checkHit: (s1, s2) ->
    s1? and s2? and s1._color is s2._color

  updateInput: ->
    return unless @_clicked

    switch @_state
      when STATE_READY
        @setState STATE_GAME
      when STATE_GAME
        if MARGIN_LEFT + BLOCK_SIZE <= @_clickX < @_w - MARGIN_RIGHT - BLOCK_SIZE and MARGIN_TOP + BLOCK_SIZE <= @_clickY < @_h - MARGIN_BOTTOM - BLOCK_SIZE
          ix = @x2index @_clickX
          iy = @y2index @_clickY

          # 1. Check whether empty cell
          unless @_board[iy][ix]?
            colors =
              west: null
              east: null
              north: null
              south: null

            # 2. Find N, S, E, W
            w = ix - 1
            e = ix + 1
            n = iy - 1
            s = iy + 1

            while w >= 0 or e < BLOCKS_WIDE or n >= 0 or s < BLOCKS_HIGH
              if not colors.west? and w >= 0 and @_board[iy][w]?
                colors.west =
                  sprite: @_board[iy][w]
                  ix: w
                  iy: iy

              if not colors.east? and e < BLOCKS_WIDE and @_board[iy][e]?
                colors.east =
                  sprite: @_board[iy][e]
                  ix: e
                  iy: iy

              if not colors.north? and n >= 0 and @_board[n][ix]?
                colors.north =
                  sprite: @_board[n][ix]
                  ix: ix
                  iy: n

              if not colors.south? and s < BLOCKS_HIGH and @_board[s][ix]?
                colors.south =
                  sprite: @_board[s][ix]
                  ix: ix
                  iy: s

              w--
              e++
              n--
              s++

            # 3. Check
            hits =
              west: null
              east: null
              north: null
              south: null

            if colors.west? and colors.north? and @checkHit(colors.west.sprite, colors.north.sprite)
              hits.west = colors.west
              hits.north = colors.north

            if colors.west? and colors.east? and @checkHit(colors.west.sprite, colors.east.sprite)
              hits.west = colors.west
              hits.east = colors.east

            if colors.west? and colors.south? and @checkHit(colors.west.sprite, colors.south.sprite)
              hits.west = colors.west
              hits.south = colors.south

            if colors.north? and colors.south? and @checkHit(colors.north.sprite, colors.south.sprite)
              hits.north = colors.north
              hits.south = colors.south

            if colors.north? and colors.east? and @checkHit(colors.north.sprite, colors.east.sprite)
              hits.north = colors.north
              hits.east = colors.east

            if colors.south? and colors.east? and @checkHit(colors.south.sprite, colors.east.sprite)
              hits.south = colors.south
              hits.east = colors.east

            # 4. Apply
            if not hits.west? and not hits.east? and not hits.north? and not hits.south?
              @_countDown -= COUNTDOWN_PENALTY
            else
              if hits.west?
                @_score++
                @_board[hits.west.iy][hits.west.ix] = null
                @_spriteList.push hits.west.sprite

              if hits.east?
                @_score++
                @_board[hits.east.iy][hits.east.ix] = null
                @_spriteList.push hits.east.sprite

              if hits.north?
                @_score++
                @_board[hits.north.iy][hits.north.ix] = null
                @_spriteList.push hits.north.sprite

              if hits.south?
                @_score++
                @_board[hits.south.iy][hits.south.ix] = null
                @_spriteList.push hits.south.sprite
      when STATE_END
        now = performance.now()
        deltaTime = (now - @_gameEnd) * 0.001
        if 1 < deltaTime
          @setState STATE_READY

    @_clicked = false

    return  # void

  updateGame: (dt) ->
    return unless @_state is STATE_GAME

    @_countDown -= dt

    @_mouseAlpha = Math.max 0, @_mouseAlpha - (MOUSE_ALPHA_VELOCITY * dt)

    if 0 >= @_countDown
      @setState STATE_END

    for sprite, i in @_spriteList
      continue unless sprite?

      sprite.update dt

      # Remove sprites that are off-screen
      if sprite._x < -BLOCK_SIZE or sprite._x >= @_w or sprite._y >= @_h
        @_spriteList.splice i, 1

    return  # void

  updateGrafix: ->
    return if @_state is STATE_NULL

    c = @_ctx
    c.clearRect 0, 0, @_w, @_h

    c.lineWidth = 1

    # Draw outer frame
    buffSizeX = 0
    buffSizeY = 0
    radius = 10
    @roundRect buffSizeX, buffSizeY, @_w - (buffSizeX * 2), @_h - (buffSizeY * 2), radius
    c.strokeStyle="#888"
    c.stroke()

    # Draw frame
    c.beginPath()
    c.moveTo MARGIN_LEFT, MARGIN_TOP
    c.lineTo @_w - MARGIN_RIGHT, MARGIN_TOP
    c.lineTo @_w - MARGIN_RIGHT, @_h - MARGIN_BOTTOM
    c.lineTo MARGIN_LEFT, @_h - MARGIN_BOTTOM
    c.closePath()
    c.strokeStyle = '#333'
    c.stroke()

    # Draw version
    c.font = '9px sans-serif'
    c.textAlign = 'left'
    c.fillStyle = '#AAA'
    c.fillText "v#{@_version}", MARGIN_LEFT, @_h - MARGIN_BOTTOM + 17

    # Draw board
    styles = [["#F7F7F7", "#EDEDED"], ["#EDEDED", "#F7F7F7"]]
    y = MARGIN_TOP
    while y < @_h - MARGIN_TOP - MARGIN_BOTTOM
      style = styles[((y - MARGIN_TOP) / BLOCK_SIZE) % 2]

      x = MARGIN_LEFT
      while x < @_w - MARGIN_LEFT - MARGIN_RIGHT
        c.fillStyle = style[((x - MARGIN_LEFT) / BLOCK_SIZE) % 2]
        c.fillRect x, y, BLOCK_SIZE, BLOCK_SIZE
        x += BLOCK_SIZE

      y += BLOCK_SIZE

    switch @_state
      when STATE_INIT
        break
      when STATE_READY
        @renderGame c
        c.font = 'bold 30px sans-serif'
        c.textAlign = 'center'
        c.textBaseline = 'middle'
        c.fillStyle = '#000'
        c.fillText 'Color Tile', @_w * 0.5, @_h * 0.5 - 30
        c.fillText 'Click to Start', @_w * 0.5, @_h * 0.5 + 30
      when STATE_GAME
        @renderGame c
      when STATE_END
        @renderGame c
        c.font = 'bold 30px sans-serif'
        c.textAlign = 'center'
        c.textBaseline = 'middle'
        c.fillStyle = '#000'
        c.fillText 'SCORE: ' + @_score, @_w * 0.5, (@_h * 0.5) - 20
        c.fillText 'Click to Continue', @_w * 0.5, (@_h * 0.5) + 20

    return  # void

  renderGame: (c) ->
    # Draw highlight under mouse
    if @_state is STATE_GAME
      if MARGIN_LEFT + BLOCK_SIZE <= @_mouseX < @_w - MARGIN_RIGHT - BLOCK_SIZE and MARGIN_TOP + BLOCK_SIZE <= @_mouseY < @_h - MARGIN_BOTTOM - BLOCK_SIZE
        ix = @x2index @_mouseX
        iy = @y2index @_mouseY

        if not @_board[iy][ix]? and @_mouseAlpha > 0
          x = MARGIN_LEFT + BLOCK_SIZE + (ix * BLOCK_SIZE)
          y = MARGIN_TOP + BLOCK_SIZE + (iy * BLOCK_SIZE)
          c.fillStyle = "rgba(204,204,204,#{@_mouseAlpha})"
          c.fillRect x + 1, y + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2

      # Draw count-down
      w = BLOCK_SIZE * 12
      h = 10
      multiplier = 1 - ((LEVEL_TIME - @_countDown) / LEVEL_TIME)

      x = MARGIN_LEFT + (BLOCK_SIZE * 0.5) - (h * 0.5)
      y = MARGIN_TOP + (BLOCK_SIZE * 0.5) - (h * 0.5)

      if 0.35 >= multiplier
        if 0.15 >= multiplier
          c.fillStyle = '#F33'
        else
          c.fillStyle = '#F80'
      else
        c.fillStyle = '#8F8'
      c.strokeStyle = '#777'
      c.lineWidth = 1
      c.strokeRect x, y, w, h
      c.fillRect x + 1, y + 1, (w - 2) * multiplier, h - 2

    c.shadowOffsetX = 1
    c.shadowOffsetY = 1
    c.shadowBlur = 2
    c.shadowColor = 'rgba(0, 0, 0, 0.5)'

    # Draw blocks
    for iy in [0...BLOCKS_HIGH]
      for ix in [0...BLOCKS_WIDE]
        @_board[iy][ix]?.render c

    c.shadowOffsetX = 3
    c.shadowOffsetY = 3
    c.shadowBlur = 5

    # Draw flying blocks
    for sprite in @_spriteList
      sprite.render c

    c.shadowOffsetX = 0
    c.shadowOffsetY = 0
    c.shadowBlur = 0

    return  # void

  roundRect: (x, y, width, height, radius) ->
    offX = x + radius
    offY = y + radius

    @_ctx.beginPath()
    @_ctx.arc offX, offY, radius, Math.PI, Math.PI * 1.5, false
    @_ctx.arc x + width - radius, offY, radius, Math.PI * 1.5, 0, false
    @_ctx.arc x + width - radius, y + height - radius, radius, 0, Math.PI * 0.5, false
    @_ctx.arc offX, y + height - radius, radius, Math.PI * 0.5, Math.PI, false
    @_ctx.closePath()

    return  # void
