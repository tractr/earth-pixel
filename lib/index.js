'use strict';

/*
 * Trigonometry constants
 */
const DEGREES_TO_RADIANS = Math.PI / 180;

/**
 * Max accepted width on EarthPixel creation
 *
 * @type {number}
 */
const MAX_WIDTH = 45;

/**
 * Used to avoid 0.2 + 0.4 = 0.6000000000000001
 *
 * @type {number}
 */
const FLOAT_PRECISION = 8;

module.exports = class EarthPixel {
	/**
	 * Constructor
	 *
	 * @param {number|string} width
	 *  The width of a pixel, in degrees
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
		 * Number of pixels along latitude
		 *
		 * @type {number}
		 * @private
		 */
		this._divisions = Math.ceil(EarthPixel._roundFloat(180 / _width));

		/**
		 * @type {number}
		 * @private
		 */
		// Force pixels count along latitude to be an integer
		this._width = EarthPixel._roundFloat(180 / this._divisions);
	}

	/**
	 * Returns the name of the earth pixel
	 * The key is computed from the pixel's location and the width.
	 *
	 * @param {{latitude: number, longitude: number}} location
	 * @returns {string}
	 * @throws {Error} If the location object is malformed or has invalid coordinates
	 */
	key(location) {
		const { key } = this._subroutine(location);

		return key;
	}

	/**
	 * Transform a position to it's containing pixel center
	 *
	 * @param {{latitude: number, longitude: number}} location
	 * @returns {{latitude: number, longitude: number}}
	 * @throws {Error} If the location object is malformed or has invalid coordinates
	 */
	center(location) {
		const { latitude, longitude } = this._subroutine(location);

		return {
			latitude,
			longitude
		};
	}

	/**
	 * Get info for a pixel corresponding to a location
	 *
	 * @param {{latitude: number, longitude: number}} location
	 * @returns {{latitude: number, longitude: number, key: string}}
	 * @throws {Error} If the location object is malformed or has invalid coordinates
	 */
	get(location) {
		const { latitude, longitude, key } = this._subroutine(location);

		return {
			latitude,
			longitude,
			key
		};
	}

	/**
	 * For debugging and testing purpose
	 * Get info about current object
	 *
	 * @returns {{width: number, divisions: number}}
	 */
	debug() {
		return {
			width: this._width,
			divisions: this._divisions
		};
	}

	/**
	 * Sub-routine for public methods
	 *
	 * @param {{latitude: number, longitude: number}} location
	 * @returns {{latitude: number, longitude: number, key: string}}
	 * @throws {Error} If the location object is malformed or has invalid coordinates
	 */
	_subroutine(location) {
		// Get formatted location
		let { latitude, longitude } = EarthPixel._formatLocation(location);

		// Compute centered latitude
		latitude = Math.floor(EarthPixel._roundFloat(latitude / this._width)) * this._width;
		latitude = EarthPixel._roundFloat(latitude + EarthPixel._roundFloat(this._width / 2));
		// Last possible value
		if (latitude >= 90.0) {
			latitude = EarthPixel._roundFloat(90.0 - EarthPixel._roundFloat(this._width / 2));
		}

		// Get adjusted width for this latitude
		const _longWidth = this._adjustWidthForLongitude(latitude);

		// Round the coordinates
		longitude = Math.floor(EarthPixel._roundFloat(longitude / _longWidth)) * _longWidth;
		longitude = EarthPixel._roundFloat(longitude + EarthPixel._roundFloat(_longWidth / 2));

		// Convert coordinates to integers for key
		const _intLatitude = Math.floor(EarthPixel._roundFloat((latitude + 90) / this._width));
		const _intLongitude = Math.floor(EarthPixel._roundFloat((longitude + 180) / _longWidth));

		// Get pixel name
		const key = `${this._divisions.toString(16)}-${_intLatitude.toString(16)}-${_intLongitude.toString(16)}`;

		return {
			latitude,
			longitude,
			key
		};
	}

	/**
	 * Check the location object values and returns a formatted object
	 *
	 * @param {{latitude: number|string, longitude: number|string}} location
	 * @returns {{latitude: number, longitude: number}}
	 * @throws {Error} If the location object is malformed or has invalid coordinates
	 * @private
	 */
	static _formatLocation(location) {
		// Check object and values
		if (typeof location !== 'object') {
			throw new Error('Object location must be an object');
		}

		// Convert values to number. If undefined => NaN
		const _latitude = Number(location.latitude);
		const _longitude = Number(location.longitude);

		// Check values
		if (isNaN(_latitude)) {
			throw new Error('Latitude must be a number');
		}
		if (isNaN(_longitude)) {
			throw new Error('Longitude must be a number');
		}

		// Check boundaries
		if (Math.abs(_latitude) > 90) {
			throw new Error('Latitude must be between -90 and 90');
		}
		if (Math.abs(_longitude) > 180) {
			throw new Error('Latitude must be between -180 and 180');
		}

		return {
			latitude: _latitude,
			longitude: _longitude
		};
	}

	/**
	 * Adjust self width for longitude calculation to minimize square's distortion along latitude
	 *
	 * @param {Number} latitude
	 * @returns {Number}
	 * @private
	 */
	_adjustWidthForLongitude(latitude) {
		// Get conversion factor (http://mathforum.org/library/drmath/view/54158.html)
		const _cos = Math.cos(latitude * DEGREES_TO_RADIANS);

		// Avoid division by 0. Returns the maximum possible width
		// As x/cos(1-x) -> 1 when x -> 0 we can use 1 radian as fallback value, but this case should never happen
		// const _width = _cos <= 0 ? RADIANS_TO_DEGREES : EarthPixel._roundFloat(this._width / _cos);
		const _width = EarthPixel._roundFloat(this._width / _cos);

		// Force pixels count along longitude to be an integer
		return 360 / Math.ceil(EarthPixel._roundFloat(360 / _width));
	}

	/**
	 * This methods apply the float precision to a value
	 *
	 * @param {number} value
	 * @returns {number}
	 * @private
	 */
	static _roundFloat(value) {
		return +value.toFixed(FLOAT_PRECISION);
	}
};
