'use strict';

/*
 * Trigonometry constants
 */
const DEGREES_TO_RADIANS = Math.PI / 180;
const EARTH_RADIUS = 6371000;
const EARTH_PERIMETER = 2 * Math.PI * EARTH_RADIUS; // 40030173.592

// Load modules
const Code = require('code');
const Lab = require('lab');

const EarthPixel = require('../lib');

const FP = EarthPixel.precision();
const R = (value, precision = FP) => Math.round(value * precision) / precision;
const F = (value, precision = FP) => Math.floor(value * precision) / precision;

// Test shortcuts

const { describe, it } = (exports.lab = Lab.script());
const expect = Code.expect;

// Common methods and objects
const locations = {
	NaN: {
		latitude: {
			latitude: 'NaN',
			longitude: 2
		},
		longitude: {
			latitude: 34,
			longitude: 'NaN'
		}
	},
	missing: {
		latitude: {
			longitude: 2
		},
		longitude: {
			latitude: 34
		}
	},
	too_large: {
		latitude: {
			latitude: 91,
			longitude: 2
		},
		longitude: {
			latitude: 34,
			longitude: 181
		}
	},
	too_small: {
		latitude: {
			latitude: -91,
			longitude: 2
		},
		longitude: {
			latitude: 34,
			longitude: -181
		}
	},
	valid: {
		latitude: 34,
		longitude: 2
	}
};
const testLocationErrors = fn => {
	it('throws an error when calling key with wrong location (string)', () => {
		const ep = new EarthPixel(500);
		expect(() => ep[fn]('34.6,2.7')).to.throw(Error);
	});

	it('throws an error when calling key with wrong location (type)', () => {
		const ep = new EarthPixel(500);
		expect(() => ep[fn](locations.NaN.latitude)).to.throw(Error);
		expect(() => ep[fn](locations.NaN.longitude)).to.throw(Error);
	});

	it('throws an error when calling key with wrong location (missing)', () => {
		const ep = new EarthPixel(500);
		expect(() => ep[fn](locations.missing.latitude)).to.throw(Error);
		expect(() => ep[fn](locations.missing.longitude)).to.throw(Error);
	});

	it('throws an error when calling key with wrong location (too large)', () => {
		const ep = new EarthPixel(500);
		expect(() => ep[fn](locations.too_large.latitude)).to.throw(Error);
		expect(() => ep[fn](locations.too_large.longitude)).to.throw(Error);
	});

	it('throws an error when calling key with wrong location (too small)', () => {
		const ep = new EarthPixel(500);
		expect(() => ep[fn](locations.too_small.latitude)).to.throw(Error);
		expect(() => ep[fn](locations.too_small.longitude)).to.throw(Error);
	});
};

describe('Creation', () => {
	it('throws an error if not created with new', () => {
		const fn = () => EarthPixel();
		expect(fn).to.throw(Error);
	});

	it('throws an error if created without width', () => {
		const fn = () => new EarthPixel(undefined);
		expect(fn).to.throw(Error);
	});

	it('throws an error if created with invalid width (text)', () => {
		const fn = () => new EarthPixel('NaN');
		expect(fn).to.throw(Error);
	});

	it('throws an error if created with invalid width (zero)', () => {
		const fn = () => new EarthPixel(0);
		expect(fn).to.throw(Error);
	});

	it('throws an error if created with invalid width (negative)', () => {
		const fn = () => new EarthPixel(-1);
		expect(fn).to.throw(Error);
	});

	it('throws an error if created with invalid width (too large)', () => {
		const fn = () => new EarthPixel(EARTH_PERIMETER / 2);
		expect(fn).to.throw(Error);
	});

	it('throws an error if created with unknown type', () => {
		const fn = () => new EarthPixel(200, 'wrong');
		expect(fn).to.throw(Error);
	});

	it('should be crated with a valid width (number)', () => {
		const ep = new EarthPixel(500);
		expect(ep).to.be.an.instanceof(EarthPixel);
	});

	it('should be crated with a valid width (string)', () => {
		const ep = new EarthPixel('250');
		expect(ep).to.be.an.instanceof(EarthPixel);
	});
});

describe('Get', () => {
	testLocationErrors('get');

	it('returns a valid object when calling get', () => {
		const ep = new EarthPixel(0.1, 'degrees');
		const get = ep.get(locations.valid);
		expect(get).to.be.an.object();
		expect(get.center).to.be.an.object();
		expect(get.center.latitude).to.be.a.number();
		expect(get.center.longitude).to.be.a.number();
		expect(get.bounds).to.be.an.object();
		expect(get.bounds.north).to.be.a.number();
		expect(get.bounds.east).to.be.a.number();
		expect(get.bounds.south).to.be.a.number();
		expect(get.bounds.west).to.be.a.number();
		expect(get.widths).to.be.an.object();
		expect(get.widths.latitude).to.be.a.number();
		expect(get.widths.longitude).to.be.a.number();
		expect(get.key).to.be.a.string();
	});

	it('returns a valid value when calling get', () => {
		const ep = new EarthPixel(0.5, 'degrees');
		const location = {
			latitude: 0.3,
			longitude: 23
		};
		const result = ep.get(location);

		expect(result.key).to.equal(`${(360).toString(16)}-${(180).toString(16)}-${(406).toString(16)}`);

		expect(result.center).to.be.an.object();
		expect(result.center.latitude).to.equal(0.25);
		expect(result.center.longitude).to.equal(23.25);

		expect(result.widths).to.be.an.object();
		expect(result.widths.latitude).to.equal(0.5);
		expect(result.widths.longitude).to.equal(0.5);

		expect(result.bounds).to.be.an.object();
		expect(result.bounds.north).to.equal(0.5);
		expect(result.bounds.east).to.equal(23.5);
		expect(result.bounds.south).to.equal(0);
		expect(result.bounds.west).to.equal(23);
	});
});

describe('Config', () => {
	it('returns a valid object when calling debug', () => {
		const ep = new EarthPixel(0.1, 'degrees');
		const debug = ep.debug();
		expect(debug).to.be.an.object();
		expect(debug.width).to.be.a.number();
		expect(debug.divisions).to.be.a.number();
	});

	it('returns a valid value when calling debug', () => {
		const ep = new EarthPixel(0.5, 'degrees');
		expect(ep.debug()).to.equal({
			width: 0.5,
			divisions: 360
		});
	});

	it('returns a valid value when calling debug', () => {
		const ep = new EarthPixel(0.8047, 'degrees');
		expect(ep.debug()).to.equal({
			width: F(180 / 224), // 0.8035714286
			divisions: 224
		});
	});

	it('converts meters to degrees correctly', () => {
		const ep = new EarthPixel(560, 'meters');
		expect(ep.debug()).to.equal({
			width: F(0.0050360919926137),
			divisions: 35742
		});
	});
});

describe('Values', () => {
	it('increases longitude along latitude for first pixels', () => {
		const ep = new EarthPixel(5000, 'meters');
		const { width } = ep.debug();
		const longitude = 0;
		const startLatitude = -90;

		for (let offset = 0; offset <= 180 - width / 4; offset += width) {
			const latitude = startLatitude + width / 4 + offset;
			const prefix = `Current latitude = ${latitude}. Width: ${width}`;
			const expectedLatitude = startLatitude + offset + width / 2;
			const center = ep.get({
				latitude,
				longitude
			}).center;
			expect(center).to.be.an.object();
			expect(R(center.latitude, 1e7), prefix).to.equal(R(expectedLatitude, 1e7));
		}
	});

	it('ensure longitude width evolution along latitude for first pixels', () => {
		const ep = new EarthPixel(5000, 'meters');
		const { width } = ep.debug();
		let lastLongitudeWidth = null;
		const longitude = 0;
		const startLatitude = -90;
		let lastLatitudeWidth = startLatitude + width / 4;

		for (let offset = 0; offset <= 180 - width / 4; offset += width) {
			const latitude = startLatitude + width / 4 + offset;
			const prefix = `Current latitude = ${latitude}. Width: ${width}`;
			const widths = ep.get({
				latitude,
				longitude
			}).widths;
			expect(widths).to.be.an.object();
			expect(widths.latitude, prefix).to.equal(width);
			// Reset last value
			if (latitude >= 0 && lastLongitudeWidth < 0) {
				lastLongitudeWidth = null;
			}
			// Test value
			if (lastLongitudeWidth) {
				if (latitude >= 0) {
					expect(widths.longitude, prefix).to.least(lastLongitudeWidth);
				} else {
					expect(widths.longitude, prefix).to.most(lastLongitudeWidth);
				}
			}
			// Update last values
			lastLatitudeWidth = widths.latitude;
			lastLongitudeWidth = widths.longitude;
		}
	});

	it('ensure all point in a pixel ends to its center', () => {
		const ep = new EarthPixel(0.05, 'degrees');
		const { width } = ep.debug();
		const _cos = Math.cos(width * 200.5 * DEGREES_TO_RADIANS);

		const minLatitude = width * 200;
		const maxLatitude = width * 201;
		const minLongitude = -180;
		const maxLongitude = -180 + width / _cos;

		const step = 0.001;

		const expected = ep.get({
			latitude: width * 200.5,
			longitude: -180 + width / _cos / 2
		}).center;

		let _lat = minLatitude + step;
		while (_lat < maxLatitude) {
			let _lon = minLongitude + step;
			while (_lon < maxLongitude) {
				const result = ep.get({
					latitude: _lat,
					longitude: _lon
				}).center;
				const prefix = `Current position = ${_lat},${_lon}`;
				expect(result, prefix).to.be.an.object();
				expect(result.latitude, prefix).to.equal(expected.latitude);
				expect(result.longitude, prefix).to.equal(expected.longitude);
				expect(result.key, prefix).to.equal(expected.key);
				_lon = _lon + step;
			}
			_lat = _lat + step;
		}
	});

	it('ensure bounds contains center anf match the pixel widths', () => {
		const ep = new EarthPixel(500000);
		const { width } = ep.debug();

		const minLatitude = -89.9999;
		const maxLatitude = 89.9999;
		const minLongitude = -180;
		const maxLongitude = 180;

		const step = width;

		let _lat = minLatitude + step;
		while (_lat < maxLatitude) {
			let _lon = minLongitude + step;
			while (_lon < maxLongitude) {
				const result = ep.get({
					latitude: _lat,
					longitude: _lon
				});
				const prefix = `Current position = ${_lat},${_lon}`;
				expect(result, prefix).to.be.an.object();
				expect(result.center, prefix).to.be.an.object();
				expect(result.bounds, prefix).to.be.an.object();
				expect(result.widths, prefix).to.be.an.object();
				expect(result.center.latitude, prefix).to.be.between(result.bounds.south, result.bounds.north);
				expect(result.center.longitude, prefix).to.be.between(result.bounds.west, result.bounds.east);
				expect(R(result.widths.latitude), prefix).to.equal(R(result.bounds.north - result.bounds.south));
				expect(R(result.widths.longitude), prefix).to.equal(R(result.bounds.east - result.bounds.west));
				_lon = _lon + step;
			}
			_lat = _lat + step;
		}
	});
});

describe('Extract', () => {
	it('ensure calling extract with wrong parameters throws an error', () => {
		expect(() => EarthPixel.extract()).to.throw(Error);
		expect(() => EarthPixel.extract('')).to.throw(Error);
		expect(() => EarthPixel.extract(123486)).to.throw(Error);
		expect(() => EarthPixel.extract(null)).to.throw(Error);
		expect(() => EarthPixel.extract('123f-456a')).to.throw(Error);
		expect(() => EarthPixel.extract('123f-456z-456a')).to.throw(Error);
	});

	it('ensure all pixel keys can be reversed', () => {
		const ep = new EarthPixel(5, 'degrees');
		const { width } = ep.debug();

		const minLatitude = -90 + R(width / 4);
		const maxLatitude = 90;
		const minLongitude = -180 + R(width / 4);
		const maxLongitude = 180;

		const step = width;

		let _lat = minLatitude;
		while (_lat < maxLatitude) {
			let _lon = minLongitude;
			while (_lon < maxLongitude) {
				const result = ep.get({
					latitude: _lat,
					longitude: _lon
				});

				const extracted = EarthPixel.extract(result.key);

				const prefix = `Current position = ${_lat},${_lon}. Current key = ${result.key}`;

				expect(extracted, prefix).to.be.an.object();
				expect(extracted.key, prefix).to.equal(result.key);

				expect(extracted.center, prefix).to.be.an.object();
				expect(extracted.center.latitude, prefix).to.equal(result.center.latitude);
				expect(extracted.center.longitude, prefix).to.equal(result.center.longitude);

				expect(extracted.widths, prefix).to.be.an.object();
				expect(extracted.widths.latitude, prefix).to.equal(result.widths.latitude);
				expect(extracted.widths.longitude, prefix).to.equal(result.widths.longitude);

				expect(extracted.bounds, prefix).to.be.an.object();
				expect(extracted.bounds.north, prefix).to.equal(result.bounds.north);
				expect(extracted.bounds.east, prefix).to.equal(result.bounds.east);
				expect(extracted.bounds.south, prefix).to.equal(result.bounds.south);
				expect(extracted.bounds.west, prefix).to.equal(result.bounds.west);

				_lon = _lon + step;
			}
			_lat = _lat + step;
		}
	});
});
