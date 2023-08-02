declare module 'endpoint-utils' {
    export function getFreePort(): Promise<number>;
    export function getIPAddress(): Promise<string>;
}
