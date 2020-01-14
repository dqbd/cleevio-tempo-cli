const fetch = require("node-fetch")

async function toggleTracker(id, token) {
	return fetch(`https://api.tempo.io/trackers/v1/${id}/toggle`, {
		method: "PATCH",
		headers: {
			authorization: `Bearer ${token}`
		}
	}).then(a => a.json())
}

async function getTrackers(token) {
  return fetch("https://api.tempo.io/trackers/v1/", {
    method: "GET",
		headers: {
      authorization: `Bearer ${token}`
		}
	}).then(a => a.json())
}

async function createTracker(token) {
	return fetch("https://api.tempo.io/trackers/v1/", {
		method: "POST",
		headers: {
			authorization: `Bearer ${token}`
		},
		body: JSON.stringify({
			// issueKey: "",
			isPlaying: true
		})
	}).then(a => a.json())
}
async function deleteTracker(id, token) {
	return fetch(`https://api.tempo.io/trackers/v1/${id}`, {
		method: "DELETE",
		headers: {
			authorization: `Bearer ${token}`
		}
	})
}

exports.toggleTracker = toggleTracker 
exports.getTrackers = getTrackers
exports.createTracker = createTracker
exports.deleteTracker = deleteTracker
