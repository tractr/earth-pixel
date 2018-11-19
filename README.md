# Earth-Pixel

Geo-location approximation algorithm.

The goal of this package is to provide a method to group geo-localized requests in order to share responses' cache.

As a requirement, your system must accept approximation of the position of a geo-localized request.
If not, there is no need to use this package.

To do so, we consider the geo-location as a discreet value and not a continuous value.
It's like seeing the earth as a disco ball.

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

#### Encode position

This package exposes three main instance methods

- `get(position)`: Returns the position of the center of the pixel and its unique key.
- `center(position)`: Returns only the position of the center of the pixel.
- `key(position)`: Returns only the unique key of the center of the pixel.

Example:

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

#### Decode position

You can reverse a generated key to its pixel's center location.
To do so, you can call the static method `extract`.
This will parse the key and extract the base pixel's width and the pixel's center location.

Example:

```javascript
// extract method
EarthPixel.extract('9c5f-6bb8-a2c5');

// Will return
// {
//     latitude: 33.99814865515,
//     longitude: 46.00066283345,
//     width: 0.0044965152
// }
```

With this method, a front-end can request items by passing the pixel key and the back-end will be able to decode the location and perform the request.
This is really useful to optimize CDN caching.

#### Debug

For debugging, you can call the `debug()` function to get the width of the base pixel and the amount of divisions used by the algorithm.

Example:

```javascript
const ep = new EarthPixel(500);
 
// debug method
ep.debug();

// Will return
// {
//     width: 0.0044965152,
//     divisions: 40031
// }
```

#### Precision

To avoid the javascript issue `0.2 + 0.4 = 0.6000000000000001`, all floating values are converted into integers before being manipulated.
The factor used to convert floats into integers is called precision.
To get this value, you can call the statc method `precision()`. 

Example:

```javascript
// precision method
EarthPixel.precision();

// Will return 1e10
```
