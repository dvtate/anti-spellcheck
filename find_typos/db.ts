// Import mysql
import * as mysql from 'mysql';

// Load dotenv
import { config } from 'dotenv';
config();

// Debugger
import Debugger from 'debug';
const debug = Debugger("typo:db");

// Get config
const rw_cred = JSON.parse(process.env.RW_DB);
const rr_cred = JSON.parse(process.env.RO_DB);
const sameCredentials = process.env.RO_DB === process.env.RW_DB;

// Declare pools
let pool_rw: mysql.Pool;
let pool_rr: mysql.Pool;

/**
 * Connect to database
 */
export function begin() {
    if (sameCredentials || !rr_cred) {
        debug("Connecting to '%s'", rw_cred.host);
    } else {
        debug("Connecting to '%s' and '%s'", rw_cred.host, rr_cred.host);
    }
    if (!module.exports.connected) {
        pool_rw = mysql.createPool({
            host: rw_cred.host,
            user: rw_cred.user,
            password: rw_cred.password,
            database: rw_cred.database,
            multipleStatements: true,
        });

        // read replica
        pool_rr = sameCredentials || !rr_cred
            ? pool_rw
            : mysql.createPool({
                host: rr_cred.host,
                user: rr_cred.user,
                password: rr_cred.password,
                database: rr_cred.database,
            });

        module.exports.connected = true;
    }
}

/**
 * Send a database query
 * @param query - database query format template
 * @param params - things to fill into template
 * @param ro - can we use read-only database?
 */
export async function queryProm(query: string, params: string[] = [], ro: boolean = false, debugError = true): Promise<Error | any[]> {
    // Select database
    let d = ro ? pool_rr : pool_rw;
    return new Promise(resolve => {
        try {
            // Perform query
            d.query(query, params, (error, result) => {
                if (error) {
                    if (debugError) {
                        debug(error);
                        debug("Query: %s", query);
                        debug("Params: %o", params);
                    }
                    resolve(new Error(error.sqlMessage));
                } else {
                    resolve(result);
                }
            })
        } catch (error) {
            debug(error);
            if (error instanceof Error)
                return resolve(error);
            debug('wtf error not instanceof error');
            resolve(new Error(error.toString()));
        }
    });
}

/**
 * Disconnect from database
 */
export async function close() {
    new Promise(resolve =>
        pool_rw.end(() =>
            pool_rr.end(() => {
                module.exports.connected = false;
                resolve(undefined);
            }))
    );
}

export const db = pool_rw;
export const rr = pool_rr;