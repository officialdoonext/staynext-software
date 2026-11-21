/**
 * Resolves Supabase domains directly via IPv4 / public DNS.
 * Fixes "fetch failed" / ConnectTimeoutError on Windows when connected via mobile hotspots (Jio, Airtel, etc.)
 * where DNS64 synthesizes broken NAT64 IPv6 addresses (64:ff9b::) that fail to connect.
 */
import dns from 'node:dns'

let initialized = false

export function initDnsResolution() {
  if (initialized || typeof window !== 'undefined') return
  initialized = true

  try {
    const resolver = new dns.Resolver()
    resolver.setServers(['8.8.8.8', '1.1.1.1'])

    const originalLookup = dns.lookup

    // Custom lookup that resolves *.supabase.co to true IPv4
    dns.lookup = ((
      hostname: string,
      options: any,
      callback?: (err: NodeJS.ErrnoException | null, address: any, family?: number) => void
    ) => {
      let cb = callback
      let opts = options
      if (typeof opts === 'function') {
        cb = opts
        opts = {}
      }

      if (typeof hostname === 'string' && hostname.includes('supabase.co')) {
        resolver.resolve4(hostname, (err, addresses) => {
          if (!err && addresses && addresses.length > 0) {
            if (opts && opts.all) {
              const res = addresses.map((addr) => ({ address: addr, family: 4 }))
              return cb?.(null, res as any, 4)
            }
            return cb?.(null, addresses[0], 4)
          }
          // Fallback to original lookup if custom resolver failed
          return originalLookup(hostname, opts, cb!)
        })
        return
      }

      return originalLookup(hostname, opts, cb!)
    }) as typeof dns.lookup
  } catch (err) {
    console.warn('[DNS-Init] Warning setting up custom DNS resolver:', err)
  }
}

// Automatically invoke on module import on the server
initDnsResolution()
