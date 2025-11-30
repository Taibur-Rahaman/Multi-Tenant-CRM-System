// Minimal PKCE helper (generate code_verifier and code_challenge)
export function base64urlencode(str: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(str)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function sha256(plain: string) {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return hash
}

export async function generatePKCE() {
  const verifier = crypto.getRandomValues(new Uint8Array(64)).reduce((s, v) => s + ('0' + v.toString(16)).slice(-2), '')
  const hashed = await sha256(verifier)
  const challenge = base64urlencode(hashed)
  return { verifier, challenge }
}
