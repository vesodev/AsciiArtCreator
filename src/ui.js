"use strict";

var controls = Object.create(null);
var terminal;
var frames = [];

var config = Object.create(null);
config.selectedColor = "#ffffff";
config.selectedBackground = "#000000";
config.drawingChar = "#";

var frame1, frame2;

function createUI(parentID, width, height) {
    var main = document.getElementById(parentID);
    var editor = document.getElementById('editor');
    terminal = new Viewport(editor, width, height);
    config.frameWidth = width;
    config.frameHeight = height;
    var toolbar = elt("div", {class: "toolbar"});
    for (var control in controls) {
        toolbar.appendChild(controls[control]());
    }
    main.appendChild(toolbar);
}

var tools = Object.create(null);

controls.tool = function () {
    var select = elt("select");
    for (var tool in tools) {
        select.appendChild(elt("option", null, tool));
    }
    terminal.registerEventHandler("mousedown", function (event) {
        if (event.which === 1) {
            tools[select.value](event);
            event.preventDefault();
        }
    });

    return elt("span", null, "Tool: ", select);
};

tools.draw = function (event) {
    var rgbColor = hexToRGB(config.selectedColor);
    var rgbBackground = hexToRGB(config.selectedBackground);
    var tile = new Tile(config.drawingChar, rgbColor.r, rgbColor.g, rgbColor.b,
                        rgbBackground.r, rgbBackground.g, rgbBackground.b);

    terminal.putFromScreenCoords(tile, event);
    terminal.render();
    // NOTE: tile is shared so if I change the character of tile var all other tiles drawn onmousemove will change aswell!
    trackDrag(function (event) {
        terminal.putFromScreenCoords(tile, event);
        terminal.render();
    });
};

tools.move = function (event) {
    var tilePos = terminal.toTileCoords(event);
    var tile = terminal.get(tilePos.x, tilePos.y);
    terminal.put(new Tile(), tilePos.x, tilePos.y);

    trackDrag(function (event) {
        if (config.oldTilePos) {
            terminal.put(config.oldTile, config.oldTilePos.x, config.oldTilePos.y);
        }
        var currentTilePos = terminal.toTileCoords(event);
        var currentTile = terminal.get(currentTilePos.x, currentTilePos.y);
        config.oldTilePos = currentTilePos;
        config.oldTile = currentTile;
        terminal.putFromScreenCoords(tile, event);
        terminal.render();
    }, function (event) {
        config.oldTilePos = undefined;
        config.oldTile = undefined;
    });
};

tools.erase = function (event) {
    terminal.putFromScreenCoords(new Tile(), event);
    terminal.render();
    trackDrag(function (event) {
        terminal.putFromScreenCoords(new Tile(), event);
        terminal.render();
    });
};

tools.floodFill = function (event) {
    var pos = terminal.toTileCoords(event);
    var startingTile = terminal.get(pos.x, pos.y);
    function matchToStartTile(tile) {
        if(startingTile.ch === tile.ch &&
            startingTile.r === tile.r &&
            startingTile.g === tile.g &&
            startingTile.b === tile.b &&
            startingTile.br === tile.br &&
            startingTile.bg === tile.bg &&
            startingTile.bb === tile.bb){
                return true;
            }
        return false;
    }
    var tileStack = [pos];
    while (tileStack.length) {
        var newPos, x, y, tilePos, reachLeft, reachRight;
        newPos = tileStack.pop();
        x = newPos.x;
        y = newPos.y;

        while (--y >= 0) {
            var current = terminal.get(x, y);
            if (!matchToStartTile(current)) {
                break;
            }
        }
        y++;
        current = terminal.get(x, y);
        reachLeft = false;
        reachRight = false;
        while (y < terminal.height && matchToStartTile(current)) {
            var rgbColor = hexToRGB(config.selectedColor);
            var rgbBackground = hexToRGB(config.selectedBackground);
            var newTile = new Tile(config.drawingChar, rgbColor.r, rgbColor.g, rgbColor.b,
                                rgbBackground.r, rgbBackground.g, rgbBackground.b);

            terminal.put(newTile, x, y);

            if (x > 0) {
                var left = terminal.get(--x, y);
                if (matchToStartTile(left)) {
                    if (!reachLeft) {
                        tileStack.push({x: x, y: y});
                        reachLeft = true;
                    }
                }
                else if (reachLeft) {
                    reachLeft = false;
                }
                ++x;
            }

            if (x < terminal.width - 1) {
                var right = terminal.get(++x, y);
                if (matchToStartTile(right)) {
                    if (!reachRight) {
                        tileStack.push({x: x, y: y});
                        reachRight = true;
                    }
                }
                else if (reachRight) {
                    reachRight = false;
                }
                --x;
            }

            current = terminal.get(x, ++y);
        }
    }
    terminal.render();
};

tools.text = function (event) {
    var text = prompt("Text:", "");
    if (text) {
        var rgbColor = hexToRGB(config.selectedColor);
        var rgbBackground = hexToRGB(config.selectedBackground);
        terminal.putStringFromScreenCoords(text, event, rgbColor.r, rgbColor.g, rgbColor.b,
                                            rgbBackground.r, rgbBackground.g, rgbBackground.b);
        terminal.render();
    }
};

controls.color = function () {
    var colorPicker = elt("input", {type: "color", value: "#ffffff"});
    colorPicker.addEventListener("change", function () {
        config.selectedColor = colorPicker.value;
    });

    return elt("span", null, "Color: ", colorPicker);
};

controls.backgroundColor = function () {
    var colorPicker = elt("input", {type: "color"});
    colorPicker.addEventListener("change", function () {
        config.selectedBackground = colorPicker.value;
    });

    return elt("span", null, "Background: ", colorPicker);
};

controls.character = function () {
    var charPicker = elt("input", {type: "text", size: "1", maxlength: "1", value: "#"});
    charPicker.addEventListener("input", function () {
        config.drawingChar = charPicker.value;
    });

    return elt("span", null, "Drawing character: ",charPicker);
};

controls.nextFrame = function () {
    var btn = elt("button");
    btn.textContent = "Next Frame";
    btn.addEventListener("click", function (event) {
        var frame = terminal.canvas.toDataURL();
        frames.push(frame);
        terminal.clear();
        terminal.render();
    });

    return elt("span", null, btn);
};

controls.play = function () {
    var btn = elt("button");
    btn.textContent = "Play";
    function renderFrame() {
        terminal.ctx.fillStyle = terminal.defaultBackground;
        terminal.ctx.fillRect(0, 0, terminal.canvas.width, terminal.canvas.height);
        terminal.ctx.drawImage(frame1, 0, 0);
        frame1 = new Image();
        frame1.src = frames.shift();
    }
    btn.addEventListener("click", function (event) {
        // var frame = terminal.canvas.toDataURL();
        // frames.push(frame);
        // terminal.clear();
        // terminal.render();
        frame1 = new Image();
        frame1.src = frames.shift();
        setInterval(renderFrame, 1000);
    });

    return elt("span", null, btn);
};
