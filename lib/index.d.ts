// Type definitions for EarthPixel

export = EarthPixel;

/**
 * Location type definition
 */
declare interface Location {
    latitude: number;
    longitude: number;
}

/**
 * Location with key type definition
 */
declare interface LocationWithKey {
    latitude: number;
    longitude: number;
    key: string;
}

/**
 * Location with width type definition
 */
declare interface LocationWithWidth {
    latitude: number;
    longitude: number;
    width: number;
}

/**
 * Debug output
 */
declare interface Debug {
    width: number;
    divisions: number;
}

declare class EarthPixel {
    /**
     * Constructor
     * @param width The width of a pixel, in degrees
     * @param type 'meters' or 'degrees'
     *        Denotes if the width is given in degrees or meters
     *        If given in meter, it will be converted in degrees at latitude 0.
     *        Default: 'meters'
     */
    constructor(width: number | string, type?: string);

    /**
     * Returns the name of the earth pixel
     * The key is computed from the pixel's location and the width.
     * @param location
     * @returns
     * @throws If the location object is malformed or has invalid coordinates
     */
    key(location: Location): string;

    /**
     * Transform a position to it's containing pixel center
     * @param location
     * @returns
     * @throws If the location object is malformed or has invalid coordinates
     */
    center(location: Location): Location;

    /**
     * Get info for a pixel corresponding to a location
     * @param location
     * @returns
     * @throws If the location object is malformed or has invalid coordinates
     */
    get(location: Location): LocationWithKey;

    /**
     * Extract pixel info from key: center latitude, center longitude and pixel width (in degrees)
     * @param key
     * @returns
     * @throws If the key is malformed
     */
    static extract(key: string): LocationWithWidth;

    /**
     * For debugging and testing purpose
     * Get info about current object
     * @returns
     */
    debug(): Debug;

    /**
     * Expose the float precision used by the algorithm
     * @returns
     */
    precision(): Number;

}

