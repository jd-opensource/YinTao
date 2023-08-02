import endpointUtils from 'endpoint-utils'

export function getValidPort() {
    return endpointUtils.getFreePort()
  }

export function getValidHostname() {
  return endpointUtils.getIPAddress();
}