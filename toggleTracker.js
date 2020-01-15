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

async function updateTracker(id, issueId, issueKey, token) {
	return fetch(`https://api.tempo.io/trackers/v1/${id}`, {
		method: "PUT",
		headers: {
			authorization: `Bearer ${token}`
		},
		body: JSON.stringify({
			issueId,
			issueKey,
		})
	})
}

async function getListIssues(query, token) {
	const jira = await fetch(`https://api.tempo.io/jira/v1/get-jira-oauth-token/`, {
		method: 'GET',
		headers: {
			authorization: `Bearer ${token}`
		},
	}).then(a => a.json())

	const query = new URLSearchParams()
	
	query.append('currentJQL', encodeURIComponent(`project in projectsWhereUserHasPermission("Work on issues")`))
	query.append('showSubTasks', true)
	query.append('showSubTaskParent', true)
	query.append('query', query)

	const issues = await fetch(`${jira.client.baseUrl}/rest/api/2/issue/picker?${query}`, {
		headers: {
			authorization: `Bearer ${token}`
		},
	}).then(a => a.json())

	return issues.reduce((memo, section) => {
		return memo.concat(section.issues)
	}, [])
}


exports.toggleTracker = toggleTracker 
exports.getTrackers = getTrackers
exports.createTracker = createTracker
exports.deleteTracker = deleteTracker
exports.updateTracker = updateTracker
exports.getListIssues = getListIssues
