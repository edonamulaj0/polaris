/** Proxy /api/* from Pages to the polaris-worker service binding. */
export async function onRequest(context) {
  return context.env.API.fetch(context.request)
}
