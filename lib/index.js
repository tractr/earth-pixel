'use strict';

module.exports = (server) => {

    const WIDTH = server.configs.App.ads.search.cache.pixel_width;

    /**
     * Returns the name of the earth pixel
     *
     * @param {{longitude: number, latitude: number}} location
     * @returns {string|null}
     */
    const name = (location) => {

        // If width === 0 return null
        if (WIDTH === 0) return null;

        // Use the same centering function
        const centered = center(location);

        // Get translated coordinates
        let longitude = centered.longitude + 180;
        let latitude = centered.latitude + 90;

        // Just in case, bound the coordinates
        longitude = Math.max(Math.min(longitude, 360), 0);
        latitude = Math.max(Math.min(latitude, 180), 0);

        // Floor the coordinates
        longitude = Math.floor(longitude / WIDTH);
        latitude = Math.floor(latitude / WIDTH);

        // Get pixel name
        return `${longitude.toString(16)}-${latitude.toString(16)}`;
    };

    /**
     * Centers a position to it's container pixels
     * It returns the center position of the pixel
     *
     * @param {{longitude: number, latitude: number}} location
     * @return {{longitude: number, latitude: number}}
     */
    const center = (location) => {

        // If width === 0 return the location
        if (WIDTH === 0) return location;

        // Just in case, bound the coordinates
        let longitude = Math.max(Math.min(location.longitude, 180), -180);
        let latitude = Math.max(Math.min(location.latitude, 90), -90);

        // Round the coordinates
        longitude = Math.floor(longitude / WIDTH) * WIDTH;
        latitude = Math.floor(latitude / WIDTH) * WIDTH;

        longitude = longitude + (WIDTH / 2);
        latitude = latitude + (WIDTH / 2);

        return {
            longitude,
            latitude
        };

    };

    return {
        name,
        center
    };

};
