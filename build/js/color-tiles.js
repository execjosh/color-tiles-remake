/*!
 * color-tiles-remake - Remake of GameSaien's Color Tiles
 * @version v0.1.1
 * @date Sat, 29 Mar 2014 01:44:23 GMT
 * @link https://execjosh.github.io/color-tiles-remake/build/
 * @license ISC
 */
(function() {
  var BLOCKS_HIGH, BLOCKS_WIDE, BLOCK_SIZE, COLOR_TABLE, COUNTDOWN_PENALTY, DT, FPS, LEVEL_TIME, MARGIN_BOTTOM, MARGIN_LEFT, MARGIN_RIGHT, MARGIN_TOP, STATE_END, STATE_GAME, STATE_INIT, STATE_NULL, STATE_READY, log,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  STATE_NULL = 'null';

  STATE_INIT = 'init';

  STATE_READY = 'ready';

  STATE_GAME = 'game';

  STATE_END = 'end';

  COLOR_TABLE = ['#06F', '#F8F', '#C6C', '#6CC', '#BBB', '#CC6', '#F90', '#0C0', '#C60', '#F66'];

  FPS = 60;

  DT = 0.001;

  LEVEL_TIME = 120;

  COUNTDOWN_PENALTY = 10;

  MARGIN_TOP = 20;

  MARGIN_LEFT = 20;

  MARGIN_RIGHT = 20;

  MARGIN_BOTTOM = 35;

  BLOCK_SIZE = 25;

  BLOCKS_WIDE = 23;

  BLOCKS_HIGH = 15;

  log = function() {
    return console.log.apply(console, arguments);
  };

  this.Application = (function() {
    function Application() {
      this.onTick = __bind(this.onTick, this);
      this._version = '0.1.1';
      this._state = STATE_NULL;
      this._ctx = null;
      this._w = 1;
      this._h = 1;
      this._screens = {};
      this._clicked = false;
      this._lastTime = 0;
      this._timeAccumulator = 0;
      this._mouseX = 0;
      this._mouseY = 0;
      this._clickX = 0;
      this._clickY = 0;
      this._board = [];
      this._countDown = 0;
      this._score = 0;
      this._gameEnd = 0;
      this._spriteList = [];
    }

    Application.prototype.init = function(id) {
      var canvas, el;
      if (this._state !== STATE_NULL) {
        return false;
      }
      this.setState(STATE_INIT);
      canvas = $("#" + id);
      if (canvas == null) {
        return false;
      }
      canvas.mousedown((function(_this) {
        return function(e) {
          var x, y;
          x = e.offsetX, y = e.offsetY;
          return _this.onClick(x, y);
        };
      })(this)).mousemove((function(_this) {
        return function(e) {
          var x, y;
          x = e.offsetX, y = e.offsetY;
          return _this.onMouseMove(x, y);
        };
      })(this));
      el = canvas.get(0);
      this._ctx = el.getContext('2d');
      this._w = parseInt(el.width, 10);
      this._h = parseInt(el.height, 10);
      this.setState(STATE_READY);
      return true;
    };

    Application.prototype.getSprite = function(ix, iy, color) {
      var dx, dy, x, y;
      x = MARGIN_LEFT + BLOCK_SIZE + (ix * BLOCK_SIZE);
      y = MARGIN_TOP + BLOCK_SIZE + (iy * BLOCK_SIZE);
      dx = Math.random() * 600 - 300;
      dy = -500;
      return new Sprite(x, y, dx, dy, color);
    };

    Application.prototype.generateBoard = function() {
      var color, ix, iy, j, row, _i, _j, _k, _len;
      for (iy = _i = 0; 0 <= BLOCKS_HIGH ? _i < BLOCKS_HIGH : _i > BLOCKS_HIGH; iy = 0 <= BLOCKS_HIGH ? ++_i : --_i) {
        row = (function() {
          var _j, _results;
          _results = [];
          for (ix = _j = 0; 0 <= BLOCKS_WIDE ? _j < BLOCKS_WIDE : _j > BLOCKS_WIDE; ix = 0 <= BLOCKS_WIDE ? ++_j : --_j) {
            _results.push(null);
          }
          return _results;
        })();
        this._board[iy] = row;
      }
      for (_j = 0, _len = COLOR_TABLE.length; _j < _len; _j++) {
        color = COLOR_TABLE[_j];
        for (j = _k = 0; _k < 20; j = ++_k) {
          while (true) {
            ix = Math.floor(Math.random() * BLOCKS_WIDE);
            iy = Math.floor(Math.random() * BLOCKS_HIGH);
            if (this._board[iy][ix] == null) {
              break;
            }
          }
          this._board[iy][ix] = this.getSprite(ix, iy, color);
        }
      }
    };

    Application.prototype.onClick = function(x, y) {
      this._clickX = x;
      this._clickY = y;
      this._clicked = true;
    };

    Application.prototype.onMouseMove = function(x, y) {
      this._mouseX = x;
      this._mouseY = y;
    };

    Application.prototype.onTick = function(now) {
      var deltaTime;
      deltaTime = (now - this._lastTime) * 0.001;
      if (0.25 < deltaTime) {
        deltaTime = 0.25;
      }
      this._lastTime = now;
      this.updateInput();
      this._timeAccumulator += deltaTime;
      while (this._timeAccumulator >= DT) {
        this.updateGame(DT);
        this._timeAccumulator -= DT;
      }
      this.updateGrafix();
      requestAnimationFrame(this.onTick);
    };

    Application.prototype.setState = function(s) {
      var trans;
      trans = "" + this._state + ":" + s;
      this._state = s;
      switch (trans) {
        case "" + STATE_INIT + ":" + STATE_READY:
          this.generateBoard();
          this._lastTime = performance.now();
          requestAnimationFrame(this.onTick);
          break;
        case "" + STATE_READY + ":" + STATE_GAME:
          this.generateBoard();
          this._countDown = LEVEL_TIME;
          this._score = 0;
          this._spriteList = [];
          break;
        case "" + STATE_GAME + ":" + STATE_END:
          this._gameEnd = performance.now();
          this._spriteList = [];
          break;
        case "" + STATE_END + ":" + STATE_READY:
          this.generateBoard();
      }
    };

    Application.prototype.x2index = function(x) {
      return Math.floor((x - MARGIN_LEFT) / BLOCK_SIZE) - 1;
    };

    Application.prototype.y2index = function(y) {
      return Math.floor((y - MARGIN_TOP) / BLOCK_SIZE) - 1;
    };

    Application.prototype.checkHit = function(s1, s2) {
      return (s1 != null) && (s2 != null) && s1._color === s2._color;
    };

    Application.prototype.updateInput = function() {
      var colors, deltaTime, e, hits, ix, iy, n, now, s, w, _ref, _ref1;
      if (!this._clicked) {
        return;
      }
      switch (this._state) {
        case STATE_READY:
          this.setState(STATE_GAME);
          break;
        case STATE_GAME:
          if ((MARGIN_LEFT + BLOCK_SIZE <= (_ref = this._clickX) && _ref < this._w - MARGIN_RIGHT - BLOCK_SIZE) && (MARGIN_TOP + BLOCK_SIZE <= (_ref1 = this._clickY) && _ref1 < this._h - MARGIN_BOTTOM - BLOCK_SIZE)) {
            ix = this.x2index(this._clickX);
            iy = this.y2index(this._clickY);
            if (this._board[iy][ix] == null) {
              colors = {
                west: null,
                east: null,
                north: null,
                south: null
              };
              w = ix - 1;
              e = ix + 1;
              n = iy - 1;
              s = iy + 1;
              while (w >= 0 || e < BLOCKS_WIDE || n >= 0 || s < BLOCKS_HIGH) {
                if ((colors.west == null) && w >= 0 && (this._board[iy][w] != null)) {
                  colors.west = {
                    sprite: this._board[iy][w],
                    ix: w,
                    iy: iy
                  };
                }
                if ((colors.east == null) && e < BLOCKS_WIDE && (this._board[iy][e] != null)) {
                  colors.east = {
                    sprite: this._board[iy][e],
                    ix: e,
                    iy: iy
                  };
                }
                if ((colors.north == null) && n >= 0 && (this._board[n][ix] != null)) {
                  colors.north = {
                    sprite: this._board[n][ix],
                    ix: ix,
                    iy: n
                  };
                }
                if ((colors.south == null) && s < BLOCKS_HIGH && (this._board[s][ix] != null)) {
                  colors.south = {
                    sprite: this._board[s][ix],
                    ix: ix,
                    iy: s
                  };
                }
                w--;
                e++;
                n--;
                s++;
              }
              hits = {
                west: null,
                east: null,
                north: null,
                south: null
              };
              if ((colors.west != null) && (colors.north != null) && this.checkHit(colors.west.sprite, colors.north.sprite)) {
                hits.west = colors.west;
                hits.north = colors.north;
              }
              if ((colors.west != null) && (colors.east != null) && this.checkHit(colors.west.sprite, colors.east.sprite)) {
                hits.west = colors.west;
                hits.east = colors.east;
              }
              if ((colors.west != null) && (colors.south != null) && this.checkHit(colors.west.sprite, colors.south.sprite)) {
                hits.west = colors.west;
                hits.south = colors.south;
              }
              if ((colors.north != null) && (colors.south != null) && this.checkHit(colors.north.sprite, colors.south.sprite)) {
                hits.north = colors.north;
                hits.south = colors.south;
              }
              if ((colors.north != null) && (colors.east != null) && this.checkHit(colors.north.sprite, colors.east.sprite)) {
                hits.north = colors.north;
                hits.east = colors.east;
              }
              if ((colors.south != null) && (colors.east != null) && this.checkHit(colors.south.sprite, colors.east.sprite)) {
                hits.south = colors.south;
                hits.east = colors.east;
              }
              if ((hits.west == null) && (hits.east == null) && (hits.north == null) && (hits.south == null)) {
                this._countDown -= COUNTDOWN_PENALTY;
              } else {
                if (hits.west != null) {
                  this._score++;
                  this._board[hits.west.iy][hits.west.ix] = null;
                  this._spriteList.push(hits.west.sprite);
                }
                if (hits.east != null) {
                  this._score++;
                  this._board[hits.east.iy][hits.east.ix] = null;
                  this._spriteList.push(hits.east.sprite);
                }
                if (hits.north != null) {
                  this._score++;
                  this._board[hits.north.iy][hits.north.ix] = null;
                  this._spriteList.push(hits.north.sprite);
                }
                if (hits.south != null) {
                  this._score++;
                  this._board[hits.south.iy][hits.south.ix] = null;
                  this._spriteList.push(hits.south.sprite);
                }
              }
            }
          }
          break;
        case STATE_END:
          now = performance.now();
          deltaTime = (now - this._gameEnd) * 0.001;
          if (1 < deltaTime) {
            this.setState(STATE_READY);
          }
      }
      this._clicked = false;
    };

    Application.prototype.updateGame = function(dt) {
      var i, sprite, _i, _len, _ref;
      if (this._state !== STATE_GAME) {
        return;
      }
      this._countDown -= dt;
      if (0 >= this._countDown) {
        this.setState(STATE_END);
      }
      _ref = this._spriteList;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        sprite = _ref[i];
        if (sprite == null) {
          continue;
        }
        sprite.update(dt);
        if (sprite._x < -BLOCK_SIZE || sprite._x >= this._w || sprite._y >= this._h) {
          this._spriteList.splice(i, 1);
        }
      }
    };

    Application.prototype.updateGrafix = function() {
      var buffSizeX, buffSizeY, c, radius, style, styles, x, y;
      if (this._state === STATE_NULL) {
        return;
      }
      c = this._ctx;
      c.clearRect(0, 0, this._w, this._h);
      c.lineWidth = 1;
      buffSizeX = 0;
      buffSizeY = 0;
      radius = 10;
      this.roundRect(buffSizeX, buffSizeY, this._w - (buffSizeX * 2), this._h - (buffSizeY * 2), radius);
      c.strokeStyle = "#888";
      c.stroke();
      c.beginPath();
      c.moveTo(MARGIN_LEFT, MARGIN_TOP);
      c.lineTo(this._w - MARGIN_RIGHT, MARGIN_TOP);
      c.lineTo(this._w - MARGIN_RIGHT, this._h - MARGIN_BOTTOM);
      c.lineTo(MARGIN_LEFT, this._h - MARGIN_BOTTOM);
      c.closePath();
      c.strokeStyle = '#333';
      c.stroke();
      c.font = '9px sans-serif';
      c.textAlign = 'left';
      c.fillStyle = '#AAA';
      c.fillText("v" + this._version, MARGIN_LEFT, this._h - MARGIN_BOTTOM + 17);
      styles = [["#F7F7F7", "#EDEDED"], ["#EDEDED", "#F7F7F7"]];
      y = MARGIN_TOP;
      while (y < this._h - MARGIN_TOP - MARGIN_BOTTOM) {
        style = styles[((y - MARGIN_TOP) / BLOCK_SIZE) % 2];
        x = MARGIN_LEFT;
        while (x < this._w - MARGIN_LEFT - MARGIN_RIGHT) {
          c.fillStyle = style[((x - MARGIN_LEFT) / BLOCK_SIZE) % 2];
          c.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
          x += BLOCK_SIZE;
        }
        y += BLOCK_SIZE;
      }
      switch (this._state) {
        case STATE_INIT:
          break;
        case STATE_READY:
          this.renderGame(c);
          c.font = 'bold 30px sans-serif';
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillStyle = '#000';
          c.fillText('Color Tile', this._w * 0.5, this._h * 0.5 - 30);
          c.fillText('Click to Start', this._w * 0.5, this._h * 0.5 + 30);
          break;
        case STATE_GAME:
          this.renderGame(c);
          break;
        case STATE_END:
          this.renderGame(c);
          c.font = 'bold 30px sans-serif';
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillStyle = '#000';
          c.fillText('SCORE: ' + this._score, this._w * 0.5, (this._h * 0.5) - 20);
          c.fillText('Click to Continue', this._w * 0.5, (this._h * 0.5) + 20);
      }
    };

    Application.prototype.renderGame = function(c) {
      var h, ix, iy, multiplier, sprite, w, x, y, _i, _j, _k, _len, _ref, _ref1, _ref2, _ref3;
      if (this._state === STATE_GAME) {
        if ((MARGIN_LEFT + BLOCK_SIZE <= (_ref = this._mouseX) && _ref < this._w - MARGIN_RIGHT - BLOCK_SIZE) && (MARGIN_TOP + BLOCK_SIZE <= (_ref1 = this._mouseY) && _ref1 < this._h - MARGIN_BOTTOM - BLOCK_SIZE)) {
          ix = this.x2index(this._mouseX);
          iy = this.y2index(this._mouseY);
          if (this._board[iy][ix] == null) {
            x = MARGIN_LEFT + BLOCK_SIZE + (ix * BLOCK_SIZE);
            y = MARGIN_TOP + BLOCK_SIZE + (iy * BLOCK_SIZE);
            c.fillStyle = '#CCC';
            c.fillRect(x + 1, y + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
          }
        }
        w = BLOCK_SIZE * 12;
        h = 10;
        multiplier = 1 - ((LEVEL_TIME - this._countDown) / LEVEL_TIME);
        x = MARGIN_LEFT + (BLOCK_SIZE * 0.5) - (h * 0.5);
        y = MARGIN_TOP + (BLOCK_SIZE * 0.5) - (h * 0.5);
        if (0.35 >= multiplier) {
          if (0.15 >= multiplier) {
            c.fillStyle = '#F33';
          } else {
            c.fillStyle = '#F80';
          }
        } else {
          c.fillStyle = '#8F8';
        }
        c.strokeStyle = '#777';
        c.lineWidth = 1;
        c.strokeRect(x, y, w, h);
        c.fillRect(x + 1, y + 1, (w - 2) * multiplier, h - 2);
      }
      c.shadowOffsetX = 1;
      c.shadowOffsetY = 1;
      c.shadowBlur = 2;
      c.shadowColor = 'rgba(0, 0, 0, 0.5)';
      for (iy = _i = 0; 0 <= BLOCKS_HIGH ? _i < BLOCKS_HIGH : _i > BLOCKS_HIGH; iy = 0 <= BLOCKS_HIGH ? ++_i : --_i) {
        for (ix = _j = 0; 0 <= BLOCKS_WIDE ? _j < BLOCKS_WIDE : _j > BLOCKS_WIDE; ix = 0 <= BLOCKS_WIDE ? ++_j : --_j) {
          if ((_ref2 = this._board[iy][ix]) != null) {
            _ref2.render(c);
          }
        }
      }
      c.shadowOffsetX = 3;
      c.shadowOffsetY = 3;
      c.shadowBlur = 5;
      _ref3 = this._spriteList;
      for (_k = 0, _len = _ref3.length; _k < _len; _k++) {
        sprite = _ref3[_k];
        sprite.render(c);
      }
      c.shadowOffsetX = 0;
      c.shadowOffsetY = 0;
      c.shadowBlur = 0;
    };

    Application.prototype.roundRect = function(x, y, width, height, radius) {
      var offX, offY;
      offX = x + radius;
      offY = y + radius;
      this._ctx.beginPath();
      this._ctx.arc(offX, offY, radius, Math.PI, Math.PI * 1.5, false);
      this._ctx.arc(x + width - radius, offY, radius, Math.PI * 1.5, 0, false);
      this._ctx.arc(x + width - radius, y + height - radius, radius, 0, Math.PI * 0.5, false);
      this._ctx.arc(offX, y + height - radius, radius, Math.PI * 0.5, Math.PI, false);
      this._ctx.closePath();
    };

    return Application;

  })();

}).call(this);

(function() {
  var BLOCK_SIZE;

  BLOCK_SIZE = 25;

  this.Sprite = (function() {
    function Sprite(_x, _y, _dx, _dy, _color) {
      this._x = _x;
      this._y = _y;
      this._dx = _dx;
      this._dy = _dy;
      this._color = _color;
    }

    Sprite.prototype.render = function(c) {
      c.fillStyle = this._color;
      return c.fillRect(this._x + 1, this._y + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
    };

    Sprite.prototype.update = function(dt) {
      this._dy += 3600 * dt;
      this._x += this._dx * dt;
      return this._y += this._dy * dt;
    };

    return Sprite;

  })();

}).call(this);
