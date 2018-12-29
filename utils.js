
/**
 * @param {Number} value
 * @return {String}
 */
function hexPad(value) {
    return (value > 0xf ? "" : "0") + value.toString(16);
}

export {
    hexPad,
}
