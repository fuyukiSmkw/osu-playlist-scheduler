import { error } from "itty-router";

/**
 * 500 internal error
 * @param {Error} err 
 * @returns response for AutoRouter
 */
export function errorReturn(err, status) {
    console.error(err);
    status = status ?? err.status ?? 500;
    return error(status, err.message);
}