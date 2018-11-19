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
 */
const MAX_WIDTH = 45;

/**
 * Used to avoid 0.2 + 0.4 = 0.6000000000000001
 *
 * @type {number}
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
 * @returns {number}
 */
const I = (value) => {
    return Math.floor(value * FLOAT_PRECISION);
};
/**
 * This convert a big int to a float
 *
 * @param {number} value
 * @returns {number}
 */
const F = (value) => {
    return value / FLOAT_PRECISION;
};
/**
 * Round a value
 *
 * @param {number} value
 * @returns {number}
 */
const R = (value) => F(I(value));

module.exports = class EarthPixel {
	/**
	 * Constructor
	 *
	 * @param {number|string} width
	 *  The width of a pixel, in degrees
	 * @param {string} type
	 *  'meters' or 'degrees'
	 *  Denotes if the width is given in degrees or meters
	 *  If given in meter, it will be converted in degrees at latitude 0.
	 *  Default: 'meters'
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
     * Extract pixel info from key: center latitude, center longitude and pixel width (in degrees)
     *
     * @param {string} key
     * @returns {{latitude: number, longitude: number, width: number}}
     * @throws {Error} If the key is malformed
     */
    static extract(key) {
        // Test key
    	const regex = /^([0-9a-f]+)-([0-9a-f]+)-([0-9a-f]+)$/gmi;
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
		const latitude = (_intLatitude * _latWidth) + (_latWidth / 2) - I(90);
		
		// Guess longitude
		const _longWidth = I(EarthPixel._adjustWidthForLongitude(F(latitude), width));
        const longitude = (_intLongitude * _longWidth) + (_longWidth / 2) - I(180);

        return {
            latitude: F(latitude),
            longitude: F(longitude),
            width
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
		
		// Convert to big integers
        latitude = I(latitude);
        longitude = I(longitude);
        const _latWidth = I(this._width);
        
        // Compute latitude pixel number
        const _intLatitude = Math.floor((latitude + I(90)) / _latWidth);
        
		// Compute centered latitude
		latitude = (_intLatitude * _latWidth) + (_latWidth / 2) - I(90);

		// Get adjusted width for this latitude
		const _longWidth = I(EarthPixel._adjustWidthForLongitude(F(latitude), this._width));
		
        // Compute longitude pixel number
        const _intLongitude = Math.floor((longitude + I(180)) / _longWidth);

        // Compute centered longitude
        longitude = (_intLongitude * _longWidth) + (_longWidth / 2) - I(180);
        
		// Get pixel name
		const key = `${this._divisions.toString(16)}-${_intLatitude.toString(16)}-${_intLongitude.toString(16)}`;
		
		return {
            latitude: F(latitude),
			longitude: F(longitude),
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
     * @param {Number} width
     * @returns {Number}
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
     * Expose the float precision used
     *
     * @returns {Number}
     */
    static precision() {
        return FLOAT_PRECISION;
    }
};
