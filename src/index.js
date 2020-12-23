'use strict';

/*
 * Trigonometry & geo constants
 */
const DEGREES_TO_RADIANS = Math.PI / 180;
const EARTH_RADIUS = 6371000;
const EARTH_PERIMETER = 2 * Math.PI * EARTH_RADIUS;

/**
 * Max accepted width on EarthPixel creation
 *
 * @type {number}
 * @private
 */
const MAX_WIDTH = 45;

/**
 * Used to avoid 0.2 + 0.4 = 0.6000000000000001
 *
 * @type {number}
 * @private
 */
const FLOAT_PRECISION = 1e10;

// Test FLOAT_PRECISION against max int value
// $lab:coverage:off$
if (360 * FLOAT_PRECISION > Number.MAX_SAFE_INTEGER) {
	throw new Error('Cannot handle such precision');
}
// $lab:coverage:on$

/**
 * This convert a float to a big int
 *
 * @param {number} value
 * @return {number}
 * @private
 */
const I = (value) => {
	return Math.floor(value * FLOAT_PRECISION);
};
/**
 * This convert a big int to a float
 *
 * @param {number} value
 * @return {number}
 * @private
 */
const F = (value) => {
	return value / FLOAT_PRECISION;
};
/**
 * Round a value
 *
 * @param {number} value
 * @return {number}
 * @private
 */
const R = (value) => F(I(value));

/**
 * Location type definition
 * @typedef {object} Location
 * @property {number} latitude
 * @property {number} longitude
 */
/**
 * Pixel's bounds type definition
 * @typedef {object} Bounds
 * @property {number} north
 * @property {number} east
 * @property {number} south
 * @property {number} west
 */
/**
 * Widths type definition
 * @typedef {object} Widths
 * @property {number} latitude
 * @property {number} longitude
 */
/**
 * Pixel info type definition
 * @typedef {object} PixelInfo
 * @property {Location} center
 * @property {Bounds} bounds
 * @property {Widths} widths
 * @property {string} key
 */
/**
 * Debug output
 * @typedef {object} Debug
 * @property {number} width
 * @property {number} divisions
 */

class EarthPixel {
	/**
	 * Constructor
	 *
	 * @param {number|string} width
	 *  The width of a pixel, in degrees
	 * @param {string} [type]
	 *  'meters' or 'degrees'
	 *  Denotes if the width is given in degrees or meters
	 *  If given in meter, it will be converted in degrees at latitude 0.
	 *  Default: 'meters'
	 *  @class EarthPixel
	 */
	constructor(width, type = 'meters') {
		// Format width
		let _width = Number(width);

		// Check width value
		if (isNaN(_width)) {
			throw new Error('Width must be a number.');
		}
		if (_width <= 0) {
			throw new Error('Width must be positive.');
		}

		// Check type value
		if (type !== 'meters' && type !== 'degrees') {
			throw new Error(`Unknown type ${type}.`);
		}

		// Convert the width, if given in meters
		if (type === 'meters') {
			_width = 360 * (_width / EARTH_PERIMETER);
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
		this._divisions = Math.ceil(180 / _width);

		/**
		 * @type {number}
		 * @private
		 */
		// Force pixels count along latitude to be an integer
		this._width = R(180 / this._divisions);
	}

	/**
	 * Get all info from a pixel corresponding to a location
	 *
	 * @param {Location} location
	 * @return {PixelInfo}
	 * @throws {Error} If the location object is malformed or has invalid coordinates
	 * @method EarthPixel.prototype.get
	 */
	get(location) {
		// Get formatted location
		let { latitude, longitude } = EarthPixel._formatLocation(location);

		// Convert to big integers
		latitude = I(latitude);
		longitude = I(longitude);
		const _latWidth = I(this._width);

		// Compute latitude pixel number
		const _intLatitude = Math.floor((latitude + I(90)) / _latWidth);

		// Compute centered latitude
		latitude = _intLatitude * _latWidth + _latWidth / 2 - I(90);

		// Get adjusted width for this latitude
		const _longWidth = I(EarthPixel._adjustWidthForLongitude(F(latitude), this._width));

		// Compute longitude pixel number
		const _intLongitude = Math.floor((longitude + I(180)) / _longWidth);

		// Compute centered longitude
		longitude = _intLongitude * _longWidth + _longWidth / 2 - I(180);

		// Get pixel name
		const key = `${this._divisions.toString(16)}-${_intLatitude.toString(16)}-${_intLongitude.toString(16)}`;

		return {
			center: {
				latitude: F(latitude),
				longitude: F(longitude),
			},
			bounds: EarthPixel._getBoundsFromCenter(latitude, longitude, _latWidth, _longWidth),
			widths: {
				latitude: this._width,
				longitude: F(_longWidth),
			},
			key,
		};
	}

	/**
	 * Extract pixel info from key: center, bounds and pixel widths (in degrees)
	 *
	 * @param {string} key
	 * @return {PixelInfo}
	 * @throws {Error} If the key is malformed
	 * @method EarthPixel.extract
	 */
	static extract(key) {
		// Test key
		const regex = /^([0-9a-f]+)-([0-9a-f]+)-([0-9a-f]+)$/gi;
		const m = regex.exec(key);
		if (m === null) {
			throw new Error(`Key is malformed: ${key}`);
		}

		const _divisions = parseInt(m[1], 16);
		const _intLatitude = parseInt(m[2], 16);
		const _intLongitude = parseInt(m[3], 16);

		// Guess width
		const width = R(180 / _divisions);
		const _latWidth = I(width);

		// Guess latitude
		const latitude = _intLatitude * _latWidth + _latWidth / 2 - I(90);

		// Guess longitude
		const _longWidth = I(EarthPixel._adjustWidthForLongitude(F(latitude), width));
		const longitude = _intLongitude * _longWidth + _longWidth / 2 - I(180);

		return {
			center: {
				latitude: F(latitude),
				longitude: F(longitude),
			},
			bounds: EarthPixel._getBoundsFromCenter(latitude, longitude, _latWidth, _longWidth),
			widths: {
				latitude: width,
				longitude: F(_longWidth),
			},
			key,
		};
	}

	/**
	 * For debugging and testing purpose
	 * Get info about current object
	 *
	 * @return {Debug}
	 * @method EarthPixel.prototype.debug
	 */
	debug() {
		return {
			width: this._width,
			divisions: this._divisions,
		};
	}

	/**
	 * Check the location object values and returns a formatted object
	 *
	 * @param {Location} location
	 * @return {Location}
	 * @throws {Error} If the location object is malformed or has invalid coordinates
	 * @method EarthPixel._formatLocation
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
			longitude: _longitude,
		};
	}

	/**
	 * Adjust self width for longitude calculation to minimize square's distortion along latitude
	 *
	 * @param {Number} latitude
	 * @param {Number} width
	 * @return {Number}
	 * @method EarthPixel._adjustWidthForLongitude
	 * @private
	 */
	static _adjustWidthForLongitude(latitude, width) {
		// Get conversion factor (http://mathforum.org/library/drmath/view/54158.html)
		const _cos = Math.cos(latitude * DEGREES_TO_RADIANS);

		// Avoid division by 0. Returns the maximum possible width
		// As x/cos(1-x) -> 1 when x -> 0 we can use 1 radian as fallback value, but this case should never happen
		// const _width = _cos <= 0 ? RADIANS_TO_DEGREES : this._width / _cos;
		const _width = width / _cos;

		// Force pixels count along longitude to be an integer
		return 360 / Math.ceil(360 / _width);
	}

	/**
	 * Get bounds of a pixel from its center.
	 * All values must be passed as integers and are returned as float
	 *
	 * @param {number} latitude
	 * @param {number} longitude
	 * @param {number} latWidth
	 * @param {number} lonWidth
	 * @return {Bounds}
	 * @method EarthPixel._getBoundsFromCenter
	 * @private
	 */
	static _getBoundsFromCenter(latitude, longitude, latWidth, lonWidth) {
		return {
			north: F(latitude + latWidth / 2),
			east: F(longitude + lonWidth / 2),
			south: F(latitude - latWidth / 2),
			west: F(longitude - lonWidth / 2),
		};
	}

	/**
	 * Expose the float precision used by the algorithm
	 *
	 * @return {number}
	 * @method EarthPixel.prototype.precision
	 */
	static precision() {
		return FLOAT_PRECISION;
	}
}

module.exports = EarthPixel;
