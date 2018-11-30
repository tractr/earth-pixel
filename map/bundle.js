'use strict';

/*
 * Trigonometry & geo constants
 */

var _typeof =
	typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol'
		? function(obj) {
				return typeof obj;
		  }
		: function(obj) {
				return obj && typeof Symbol === 'function' && obj.constructor === Symbol && obj !== Symbol.prototype ? 'symbol' : typeof obj;
		  };

var _createClass = (function() {
	function defineProperties(target, props) {
		for (var i = 0; i < props.length; i++) {
			var descriptor = props[i];
			descriptor.enumerable = descriptor.enumerable || false;
			descriptor.configurable = true;
			if ('value' in descriptor) descriptor.writable = true;
			Object.defineProperty(target, descriptor.key, descriptor);
		}
	}
	return function(Constructor, protoProps, staticProps) {
		if (protoProps) defineProperties(Constructor.prototype, protoProps);
		if (staticProps) defineProperties(Constructor, staticProps);
		return Constructor;
	};
})();

function _classCallCheck(instance, Constructor) {
	if (!(instance instanceof Constructor)) {
		throw new TypeError('Cannot call a class as a function');
	}
}

var DEGREES_TO_RADIANS = Math.PI / 180;
var EARTH_RADIUS = 6371000;
var EARTH_PERIMETER = 2 * Math.PI * EARTH_RADIUS;

/**
 * Max accepted width on EarthPixel creation
 *
 * @type {number}
 * @private
 */
var MAX_WIDTH = 45;

/**
 * Used to avoid 0.2 + 0.4 = 0.6000000000000001
 *
 * @type {number}
 * @private
 */
var FLOAT_PRECISION = 1e10;

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
var I = function I(value) {
	return Math.floor(value * FLOAT_PRECISION);
};
/**
 * This convert a big int to a float
 *
 * @param {number} value
 * @return {number}
 * @private
 */
var F = function F(value) {
	return value / FLOAT_PRECISION;
};
/**
 * Round a value
 *
 * @param {number} value
 * @return {number}
 * @private
 */
var R = function R(value) {
	return F(I(value));
};

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

var EarthPixel = (function() {
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
	function EarthPixel(width) {
		var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'meters';

		_classCallCheck(this, EarthPixel);

		// Format width
		var _width = Number(width);

		// Check width value
		if (isNaN(_width)) {
			throw new Error('Width must be a number.');
		}
		if (_width <= 0) {
			throw new Error('Width must be positive.');
		}

		// Check type value
		if (type !== 'meters' && type !== 'degrees') {
			throw new Error('Unknown type ' + type + '.');
		}

		// Convert the width, if given in meters
		if (type === 'meters') {
			_width = 360 * (_width / EARTH_PERIMETER);
		}

		if (_width > MAX_WIDTH) {
			throw new Error('Width must be less than ' + MAX_WIDTH + ' degrees.');
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

	_createClass(
		EarthPixel,
		[
			{
				key: 'get',
				value: function get(location) {
					// Get formatted location
					var _EarthPixel$_formatLo = EarthPixel._formatLocation(location),
						latitude = _EarthPixel$_formatLo.latitude,
						longitude = _EarthPixel$_formatLo.longitude;

					// Convert to big integers

					latitude = I(latitude);
					longitude = I(longitude);
					var _latWidth = I(this._width);

					// Compute latitude pixel number
					var _intLatitude = Math.floor((latitude + I(90)) / _latWidth);

					// Compute centered latitude
					latitude = _intLatitude * _latWidth + _latWidth / 2 - I(90);

					// Get adjusted width for this latitude
					var _longWidth = I(EarthPixel._adjustWidthForLongitude(F(latitude), this._width));

					// Compute longitude pixel number
					var _intLongitude = Math.floor((longitude + I(180)) / _longWidth);

					// Compute centered longitude
					longitude = _intLongitude * _longWidth + _longWidth / 2 - I(180);

					// Get pixel name
					var key = this._divisions.toString(16) + '-' + _intLatitude.toString(16) + '-' + _intLongitude.toString(16);

					return {
						center: {
							latitude: F(latitude),
							longitude: F(longitude)
						},
						bounds: EarthPixel._getBoundsFromCenter(latitude, longitude, _latWidth, _longWidth),
						widths: {
							latitude: this._width,
							longitude: F(_longWidth)
						},
						key: key
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
			},
			{
				key: 'debug',

				/**
				 * For debugging and testing purpose
				 * Get info about current object
				 *
				 * @return {Debug}
				 * @method EarthPixel.prototype.debug
				 */
				value: function debug() {
					return {
						width: this._width,
						divisions: this._divisions
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
			}
		],
		[
			{
				key: 'extract',
				value: function extract(key) {
					// Test key
					var regex = /^([0-9a-f]+)-([0-9a-f]+)-([0-9a-f]+)$/gi;
					var m = regex.exec(key);
					if (m === null) {
						throw new Error('Key is malformed: ' + key);
					}

					var _divisions = parseInt(m[1], 16);
					var _intLatitude = parseInt(m[2], 16);
					var _intLongitude = parseInt(m[3], 16);

					// Guess width
					var width = R(180 / _divisions);
					var _latWidth = I(width);

					// Guess latitude
					var latitude = _intLatitude * _latWidth + _latWidth / 2 - I(90);

					// Guess longitude
					var _longWidth = I(EarthPixel._adjustWidthForLongitude(F(latitude), width));
					var longitude = _intLongitude * _longWidth + _longWidth / 2 - I(180);

					return {
						center: {
							latitude: F(latitude),
							longitude: F(longitude)
						},
						bounds: EarthPixel._getBoundsFromCenter(latitude, longitude, _latWidth, _longWidth),
						widths: {
							latitude: width,
							longitude: F(_longWidth)
						},
						key: key
					};
				}
			},
			{
				key: '_formatLocation',
				value: function _formatLocation(location) {
					// Check object and values
					if ((typeof location === 'undefined' ? 'undefined' : _typeof(location)) !== 'object') {
						throw new Error('Object location must be an object');
					}

					// Convert values to number. If undefined => NaN
					var _latitude = Number(location.latitude);
					var _longitude = Number(location.longitude);

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
				 * @param {Number} width
				 * @return {Number}
				 * @method EarthPixel._adjustWidthForLongitude
				 * @private
				 */
			},
			{
				key: '_adjustWidthForLongitude',
				value: function _adjustWidthForLongitude(latitude, width) {
					// Get conversion factor (http://mathforum.org/library/drmath/view/54158.html)
					var _cos = Math.cos(latitude * DEGREES_TO_RADIANS);

					// Avoid division by 0. Returns the maximum possible width
					// As x/cos(1-x) -> 1 when x -> 0 we can use 1 radian as fallback value, but this case should never happen
					// const _width = _cos <= 0 ? RADIANS_TO_DEGREES : this._width / _cos;
					var _width = width / _cos;

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
			},
			{
				key: '_getBoundsFromCenter',
				value: function _getBoundsFromCenter(latitude, longitude, latWidth, lonWidth) {
					return {
						north: F(latitude + latWidth / 2),
						east: F(longitude + lonWidth / 2),
						south: F(latitude - latWidth / 2),
						west: F(longitude - lonWidth / 2)
					};
				}

				/**
				 * Expose the float precision used by the algorithm
				 *
				 * @return {number}
				 * @method EarthPixel.prototype.precision
				 */
			},
			{
				key: 'precision',
				value: function precision() {
					return FLOAT_PRECISION;
				}
			}
		]
	);

	return EarthPixel;
})();

window.EarthPixel = EarthPixel;
