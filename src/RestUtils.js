export function doFetch(url, method, body) {

  let init = {
    method: method,
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    },
    credentials: "same-origin",
  };

  if (typeof body !== "undefined") {
    init.body = body;
  }

  return fetch(url, init)
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        // Reject the promise, which triggers the caller's catch block to be invoked
        return Promise.reject(new RestError(response.statusText, response.status));
      }
    });
}

class RestError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}
