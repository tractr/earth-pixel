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
 * Pixel's bounds type definition
 */
declare interface Bounds {
    north: number;
    east: number;
    south: number;
    west: number;
}

/**
 * Widths type definition
 */
declare interface Widths {
    latitude: number;
    longitude: number;
}

/**
 * Pixel info type definition
 */
declare interface PixelInfo {
    center: Location;
    bounds: Bounds;
    widths: Widths;
    key: string;
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
     * Get all info for a pixel corresponding to a location
     * @param location
     * @returns
     * @throws If the location object is malformed or has invalid coordinates
     */
    get(location: Location): PixelInfo;

    /**
     * Extract pixel info from key: center latitude, center longitude and pixel width (in degrees)
     * @param key
     * @returns
     * @throws If the key is malformed
     */
    static extract(key: string): PixelInfo;

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

