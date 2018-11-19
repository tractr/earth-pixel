# Earth-Pixel

Geo-location approximation algorithm.

The goal of this package is to provide a method to group geo-localized requests in order to share responses' cache.

As a requirement, your system must accept approximation of the position of a geo-localized request.
If not, there is no need to use this package.

To do so, we consider the geo-location as a discreet value and not a continuous value. It's like watching a pixelized map.

We split the earth into nearly-squares called pixels. Those pixels have a customizable width.
Each pixel is identified by a unique key.
Each location on earth is hosted by a pixel.
All the locations contained in a pixel share the same unique key. 
All the locations contained in a pixel can be approximated to the center of this pixel.

Therefore, each location can be converted into a unique key and shares this key with the neighbourhood.

## Installation

To install this package, run

```bash
npm install --save earth-pixel
```

## Usage

### Constructor

First of all, you must define the size of the pixel, in meters or in degrees (at latitude 0).

In meters
```javascript
const ep = new EarthPixel(500);
```

Equivalent to
```javascript
const ep = new EarthPixel(500, 'meters');
```

In degrees:
```javascript
const ep = new EarthPixel(0.05, 'degrees');
```

The size of the pixel cannot be greater than 45 degrees.

### Methods

This package exposes three methods

- `get(position)`: Returns the position of the center of the pixel and its unique key.
- `center(position)`: Returns only the position of the center of the pixel.
- `key(position)`: Returns only the unique key of the center of the pixel.

Examples:

```javascript
const ep = new EarthPixel(500);
 
// get method
ep.get({ latitude: 46.4567, longitude: 6.5461 });

// Will return
// {
//     latitude: 46.45579638,
//     longitude: 6.54325912,
//     key: '9c5f-768a-6fa4'
// }
 
// center method
ep.center({ latitude: 46.4567, longitude: 6.5461 });
 
// Will return
// {
//     latitude: 46.45579638,
//     longitude: 6.54325912
// }
 
// key method
ep.key({ latitude: 46.4567, longitude: 6.5461 });
 
// Will return '9c5f-768a-6fa4'
 
```
