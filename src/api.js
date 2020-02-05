import fetch from "node-fetch"

export async function toggleTracker(id, token) {
  return fetch(`https://api.tempo.io/trackers/v1/${id}/toggle`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`
    }
  }).then(a => a.json())
}

export async function getTrackers(token) {
  return fetch("https://api.tempo.io/trackers/v1/", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`
    }
  }).then(a => a.json())
}

export async function createTracker(token, payload = {}) {
  return fetch("https://api.tempo.io/trackers/v1/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      isPlaying: true,
      ...payload,
    })
  }).then(a => a.json())
}
export async function deleteTracker(id, token) {
  return fetch(`https://api.tempo.io/trackers/v1/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`
    }
  })
}

export async function updateTracker(id, payload, token) {
  return fetch(`https://api.tempo.io/trackers/v1/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload || {})
  })
}

const getJiraToken = (() => {
  let cache = null,
    obtained = 0
  return async token => {
    const now = Date.now()
    // TODO: move to redux state
    if (!cache || now - obtained > 1000 * 60) {
      cache = await fetch(
        `https://api.tempo.io/jira/v1/get-jira-oauth-token/`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`
          }
        }
      ).then(a => a.json())
      obtained = Date.now()
    }

    return cache
  }
})();

export async function getListIssues(search, token) {
  const jira = await getJiraToken(token)
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
        "Content-Type": "application/json",
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
