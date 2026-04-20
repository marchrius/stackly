export const OIDC_LINK_COOKIE_NAME = "koillection_oidc_link";

interface OidcLinkPayload {
  userId: string;
  exp: number;
}

function encodeBase64Url(input: ArrayBuffer | Uint8Array): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(input: string): Uint8Array {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function textEncode(value: string): ArrayBuffer {
  const encoded = new TextEncoder().encode(value);
  return encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength);
}

function textDecode(value: Uint8Array): string {
  return new TextDecoder().decode(value);
}

async function signPayload(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, textEncode(payload));
  return encodeBase64Url(new Uint8Array(signature));
}

async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const expectedSignature = await signPayload(payload, secret);
  if (expectedSignature.length !== signature.length) return false;
  return expectedSignature === signature;
}

export async function createOidcLinkCookieValue(userId: string, secret: string, ttlSeconds = 300): Promise<string> {
  const payload: OidcLinkPayload = {
    userId,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const payloadEncoded = encodeBase64Url(textEncode(JSON.stringify(payload)));
  const signature = await signPayload(payloadEncoded, secret);
  return `${payloadEncoded}.${signature}`;
}

export async function readOidcLinkCookieValue(cookieValue: string, secret: string): Promise<OidcLinkPayload | null> {
  const [payloadEncoded, signature] = cookieValue.split(".");
  if (!payloadEncoded || !signature) return null;

  if (!(await verifySignature(payloadEncoded, signature, secret))) return null;

  try {
    const parsed = JSON.parse(textDecode(decodeBase64Url(payloadEncoded))) as OidcLinkPayload;
    if (!parsed.userId || typeof parsed.exp !== "number") return null;
    if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}
