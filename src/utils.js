// Require Third-party Dependencies
const is = require("@slimio/is");

function* traverseProjectJSON(elem, str = "") {
    const prefix = str === "" ? "" : `${str}/`;
    if (is.plainObject(elem)) {
        for (const [key, value] of Object.entries(elem)) {
            yield* traverseProjectJSON(value, `${prefix}${key === "default" ? "" : key}`);
        }
    }
    else if (is.array(elem)) {
        for (const depName of elem) {
            yield [depName, `${prefix}${depName}`];
        }
    }
}

module.exports = { traverseProjectJSON };
