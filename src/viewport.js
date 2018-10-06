"use strict"

function Tile(ch, r, g, b, br, bg, bb) {
    this.ch = ch || "";
    this.r = r;
    this.g = g;
    this.b = b;
    this.br = br;
    this.bg = bg;
    this.bb = bb;
}

Tile.prototype.getChar = function () {
    return this.ch;
};

Tile.prototype.setChar = function (ch) {
    this.ch = ch;
};

Tile.prototype.getColorRGB = function () {
    if(this.r !== undefined && this.g !== undefined && this.b !== undefined)
        return "rgb(" + this.r + "," + this.g + "," + this.b + ")";

    return "";
};

Tile.prototype.getBackgroundRGB = function () {
    if(this.br !== undefined && this.bg !== undefined && this.bb !== undefined)
        return "rgb(" + this.br + "," + this.bg + "," + this.bb + ")";

    return "";
};

Tile.prototype.setColor = function (r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
};

Tile.prototype.setBackground = function (r, g, b) {
    this.br = r;
    this.bg = g;
    this.bb = b;
};

Tile.prototype.resetColor = function () {
    this.r = this.g = this.b = undefined;
};

Tile.prototype.resetBackground = function () {
    this.br = this.bg = this.bb = undefined;
};

Tile.prototype.clone = function () {
    return new Tile(this.ch, this.r, this.g, this.b, this.br, this.bg, this.bb);
};

var CSSCLASS = "viewportConfig";

function Viewport(container, width, height) {
    this.container = container;
    this.container.innerHTML = "";
    if (this.container.className.indexOf(CSSCLASS) === -1) {
        if (this.container.className.length === 0) {
            this.container.className = CSSCLASS;
        } else {
            this.container.className += " " + CSSCLASS;
        }
    }

    this.width = width;
    this.height = height;

    this.buffer = new Array(this.height);
    for (var j = 0; j < this.height; j++) {
        this.buffer[j] = new Array(this.width);
        for (var i = 0; i < this.width; i++) {
            this.buffer[j][i] = new Tile();
        }
    }

    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.container.appendChild(this.canvas);
    this.updateStyle();
    this.canvas.width = this.textWidth * this.width;
    this.canvas.height = this.textHeight * this.height;
    // Changing canvas width and height resets some of it's context's attributes
    this.updateStyle();
}

Viewport.prototype.updateStyle = function () {
    var cs = window.getComputedStyle(this.container, null);
    this.defaultColor = cs.getPropertyValue("color");
    this.defaultBackground = cs.getPropertyValue("background-color");

    this.ctx.font = cs.getPropertyValue("font-size") + "/" + cs.getPropertyValue("line-height") + " " + cs.getPropertyValue("font-family");
    this.ctx.textBaseline = "middle";
    this.textWidth = this.ctx.measureText("M").width;
    this.textHeight = parseInt(cs.getPropertyValue("font-size"), 10);
};

Viewport.prototype.getContext = function () {
    return this.ctx;
};

Viewport.prototype.put = function (tile, x, y) {
    if(x < 0 || y < 0 || x >= this.width || y >= this.height)
        return;

    this.buffer[y][x] = tile;
};

Viewport.prototype.unsafePut = function (tile, x, y) {
    this.buffer[y][x] = tile;
};

Viewport.prototype.putString = function (str, x, y, r, g, b, br, bg, bb) {
    var currentTile;
    if(x < 0 || y < 0)
        return;

    for (var i = 0; i < str.length; i++) {
        if (x >= this.width) {
            x = 0;
            y++;
        }
        if (y >= this.height) {
            return;
        }
        currentTile = new Tile(str[i], r, g, b, br, bg, bb);
        this.unsafePut(currentTile, x, y);
        x++;
    }
};

Viewport.prototype.putStringFromScreenCoords = function (str, event, r, g, b, br, bg, bb) {
    var tileCoords = this.toTileCoords(event);
    this.putString(str, tileCoords.x, tileCoords.y, r, g, b, br, bg, bb);
};

Viewport.prototype.get = function (x, y) {
    if(x < 0 || y < 0 || x >= this.width || y >= this.height)
        return null;

    return this.buffer[y][x];
};

Viewport.prototype.clear = function () {
    for(var j = 0; j < this.height; j++)
        for(var i = 0; i < this.width; i++)
            this.buffer[j][i] = new Tile();
};

Viewport.prototype.render = function () {
    var currentTile, ch, foregroundColor, backgroundColor, x, y;
    var halfTextHeight = this.textHeight / 2;

    this.ctx.fillStyle = this.defaultBackground;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    y = halfTextHeight;
    for(var j = 0; j < this.height; j++){
        x = 0;
        for(var i = 0; i < this.width; i++){
            currentTile = this.buffer[j][i];
            ch = currentTile.getChar();
            foregroundColor = currentTile.getColorRGB();
            backgroundColor = currentTile.getBackgroundRGB();
            if (backgroundColor.length && backgroundColor !== this.defaultBackground) {
                this.ctx.fillStyle = backgroundColor;
                this.ctx.fillRect(x, y - halfTextHeight, this.textWidth, this.textHeight);
            }
            if(ch.length){
                if(!foregroundColor.length)
                    foregroundColor = this.defaultColor;

                this.ctx.fillStyle = foregroundColor;
                this.ctx.fillText(ch, x, y);
            }
            x += this.textWidth;
        }
        y += this.textHeight;
    }
};

Viewport.prototype.toTileCoords = function (event) {
    var pos = relativePosition(event, this.canvas);
    return {x: Math.floor(pos.x/this.textWidth),
            y: Math.floor(pos.y/this.textHeight)};
};

Viewport.prototype.getFromScreenCoords = function (event) {
    var tileCoords = this.toTileCoords(event);
    return this.get(tileCoords.x, tileCoords.y);
};

Viewport.prototype.putFromScreenCoords = function (tile, event) {
    var tileCoords = this.toTileCoords(event);
    this.put(tile, tileCoords.x, tileCoords.y);
};

Viewport.prototype.registerEventHandler = function (event, handler) {
    this.canvas.addEventListener(event, handler, false);
};

Viewport.prototype.fromJSON = function (theFrame) {
    // this.buffer = new Array(this)
};
