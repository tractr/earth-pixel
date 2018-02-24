'use strict';

/**
 * Max accepted width on EarthPixel creation
 *
 * @type {number}
 */
const MAX_WIDTH = 45;

class EarthPixel {

    /**
     * Constructor
     *
     * @param {Number} width
     *  The width of a pixel, in radian
     */
    constructor(width) {

        // Format width
        const _width = Number(width);

        // Check width value
        if (isNaN(_width)) {
            throw new Error('Width must be a number.');
        }
        if (_width <= 0) {
            throw new Error('Width must be positive.');
        }
        if (_width > MAX_WIDTH) {
            throw new Error(`Width must be less than ${MAX_WIDTH} degrees.`);
        }

        /**
         * @type {number}
         * @private
         */
        this._width = _width;
    }

    /**
     * Returns the name of the earth pixel
     *
     * @param {{longitude: number, latitude: number}} location
     * @returns {string|null}
     */
    key(location) {

        // If width === 0 return null
        if (this._width === 0) return null;

        // Use the same centering function
        const centered = center(location);

        // Get translated coordinates
        let longitude = centered.longitude + 180;
        let latitude = centered.latitude + 90;

        // Just in case, bound the coordinates
        longitude = Math.max(Math.min(longitude, 360), 0);
        latitude = Math.max(Math.min(latitude, 180), 0);

        // Floor the coordinates
        longitude = Math.floor(longitude / this._width);
        latitude = Math.floor(latitude / this._width);

        // Get pixel name
        return `${longitude.toString(16)}-${latitude.toString(16)}`;
    }

    /**
     * Centers a position to it's container pixels
     * It returns the center position of the pixel
     *
     * @param {{longitude: number, latitude: number}} location
     * @return {{longitude: number, latitude: number}}
     */
    center(location) {

        // If width === 0 return the location
        if (this._width === 0) return location;

        // Just in case, bound the coordinates
        let longitude = Math.max(Math.min(location.longitude, 180), -180);
        let latitude = Math.max(Math.min(location.latitude, 90), -90);

        // Round the coordinates
        longitude = Math.floor(longitude / this._width) * this._width;
        latitude = Math.floor(latitude / this._width) * this._width;

        longitude = longitude + (this._width / 2);
        latitude = latitude + (this._width / 2);

        return {
            longitude,
            latitude
        };

    }

}


exports = module.exports = EarthPixel;