async function request(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const err = new Error((data && data.error) || res.statusText || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  health: () => request('/api/health'),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
  listCapsules: () => request('/api/capsules'),
  createCapsule: (body) =>
    request('/api/capsules', { method: 'POST', body: JSON.stringify(body) }),
  updateCapsule: (id, body) =>
    request(`/api/capsules/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCapsule: (id) =>
    request(`/api/capsules/${id}`, { method: 'DELETE' }),
  devLogin: () => request('/auth/dev-login', { method: 'POST' }),
};
