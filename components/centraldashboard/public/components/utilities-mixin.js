/**
 * @fileoverview Mixin with utility functions applicable across components.
 */

const VALID_QUERY_PARAMS = ['ns'];
/**
 * Mixin class is the default export
 * @param {class} superClass - Class being extended
 * @return {Function}
 */
export default (superClass) => class extends superClass {
    /**
     * Provide a logical OR functionality for the Polymer DOM
     * @param {...boolean} e
     * @return {boolean}
     */
    or(...e) {
        return e.some((i) => Boolean(i));
    }

    /**
     * Provide a logical equals functionality for the Polymer DOM
     * @param {...any} e
     * @return {boolean}
     */
    equals(...e) {
        const crit = e.shift();
        if (!e.length) return true;
        return e.every((e) => e === crit);
    }

    /**
     * Return if the object passed is empty or undefined
     * @param {any} o
     * @return {boolean}
     */
    empty(o) {
        if (!o) return;
        if (o instanceof Array) return !o.length;
        if (typeof o === 'object') return !Object.keys(o).length;
        return !!1;
    }

    /**
     * Allows an async block to sleep for a specified amount of time.
     * @param {number} time
     * @return {Promise}
     */
    sleep(time) {
        return new Promise((res) => setTimeout(res, time));
    }

    /**
     * Builds and returns an href value preserving the current query string.
     * @param {string} href
     * @param {Object} queryParams
     * @return {string}
     */
    buildHref(href, queryParams) {
        const url = new URL(href, window.location.origin);
        if (queryParams) {
            VALID_QUERY_PARAMS.forEach((qp) => {
                if (queryParams[qp]) {
                    url.searchParams.set(qp, queryParams[qp]);
                }
            });
        }
        return url.href.slice(url.origin.length);
    }
};
