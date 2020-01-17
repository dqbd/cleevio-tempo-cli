import fetch from "node-fetch"

export async function toggleTracker(id, token) {
	return fetch(`https://api.tempo.io/trackers/v1/${id}/toggle`, {
		method: "PATCH",
		headers: {
			authorization: `Bearer ${token}`
		}
	}).then(a => a.json())
}

export async function getTrackers(token) {
	return fetch("https://api.tempo.io/trackers/v1/", {
		method: "GET",
		headers: {
			authorization: `Bearer ${token}`
		}
	}).then(a => a.json())
}

export async function createTracker(token) {
	return fetch("https://api.tempo.io/trackers/v1/", {
		method: "POST",
		headers: {
			authorization: `Bearer ${token}`
		},
		body: JSON.stringify({
			isPlaying: true
		})
	}).then(a => a.json())
}
export async function deleteTracker(id, token) {
	return fetch(`https://api.tempo.io/trackers/v1/${id}`, {
		method: "DELETE",
		headers: {
			authorization: `Bearer ${token}`
		}
	})
}

export async function updateTracker(id, payload, token) {
	return fetch(`https://api.tempo.io/trackers/v1/${id}`, {
		method: "PUT",
		headers: {
			authorization: `Bearer ${token}`
		},
		body: JSON.stringify(payload || {})
	})
}

export async function getListIssues(search, token) {
	const jira = await fetch(
		`https://api.tempo.io/jira/v1/get-jira-oauth-token/`,
		{
			method: "GET",
			headers: {
				authorization: `Bearer ${token}`
			}
		}
	).then(a => a.json())

	const query = new URLSearchParams()

	query.append(
		"currentJQL",
		`project in projectsWhereUserHasPermission("Work on issues")`
	)
	query.append("showSubTasks", true)
	query.append("showSubTaskParent", true)
	query.append("query", search)

	const payload = await fetch(
		`${jira.client.baseUrl}/rest/api/2/issue/picker?${query}`,
		{
			headers: {
				authorization: `Bearer ${jira.token}`
			}
		}
	).then(a => a.json())

	const issues = payload.sections.reduce((memo, section) => {
		for (const issue of section.issues) {
			memo[issue.id] = issue
		}
		return memo
	}, {})

	return Object.values(issues)
}
