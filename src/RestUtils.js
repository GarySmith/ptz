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
        return response.json()
        .then(obj => {
          // Reject the promise, which triggers the caller's catch block to be invoked
          return Promise.reject(new RestError(obj.description, obj.code));
        })
        .catch(e => {
          // It would be preferable to test for instanceof RestError, but that does not seem to work
          if (e.status) {
            // Returning RestError unchanged from above
            return Promise.reject(e);
          } else {
            // Wrapping previously uncaught error into a RestError
            return Promise.reject(new RestError(response.statusText, response.status));
          }
        })
      }
    });
}

class RestError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}
