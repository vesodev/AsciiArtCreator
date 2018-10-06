"use strict";

function hexToRGB(hexColor) {
    return {r: parseInt(hexColor.slice(1,3), 16),
            g: parseInt(hexColor.slice(3,5), 16),
            b: parseInt(hexColor.slice(5), 16)};
}

function relativePosition(event, elem) {
    var rect = elem.getBoundingClientRect();
    return {x: Math.floor(event.clientX - rect.left),
            y: Math.floor(event.clientY - rect.top)};
}

function trackDrag(onMove, onEnd) {
    function end(event) {
        removeEventListener("mousemove", onMove);
        removeEventListener("mouseup", end);
        if(onEnd)
            onEnd(event);
    }
    addEventListener("mousemove", onMove);
    addEventListener("mouseup", end);
}

function elt(name, attributes) {
    var node = document.createElement(name);
    if (attributes) {
        for (var attribute in attributes) {
            if (attributes.hasOwnProperty(attribute)) {
                node.setAttribute(attribute, attributes[attribute]);
            }
        }
    }
    for (var i = 2; i < arguments.length; i++) {
        var child = arguments[i];
        if (typeof child == "string") {
            child = document.createTextNode(child);
        }
        node.appendChild(child);
    }

    return node;
}

function extractFrame() {
    // var frame = Object.create(null);
    // frame.config = config;
    // frame.tileData = [];
    // for (var j = 0; j < config.frameHeight; j++) {
    //     for (var i = 0; i < config.frameWidth; i++) {
    //         JSON.stringify(terminal.buffer[j][i]);
    //     }
    // }
}
