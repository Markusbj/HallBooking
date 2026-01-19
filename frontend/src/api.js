let accessToken = "";

export function setAccessToken(token) {
  accessToken = token || "";
}

export function clearAccessToken() {
  accessToken = "";
}

export function getAccessToken() {
  return accessToken;
}

export async function apiFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });
}
