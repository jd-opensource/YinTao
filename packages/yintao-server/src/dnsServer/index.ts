import {Server} from 'proxy-chain'

export function DnsAnalysisServer(port: number,hosts:Map<string,string>) {
  const server = new Server({
    port: port,
    prepareRequestFunction: ({ request, hostname, port }) => {
      const ip = hosts.get(hostname);
      if(ip == undefined) return
      return {
        upstreamProxyUrl: "http://" + ip,
      }
    }
  })

  server.listen(() => {
    console.log(`dns listening on *: ${port}`)
  });

  return server
}

export default DnsAnalysisServer