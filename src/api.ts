import fetch from "node-fetch"
import { IssueDto, JiraAccountDto, JiraTokenDto, TrackerDto } from "types"
import { URLSearchParams } from "url"
import { getStartDate } from "./utils"

const getJiraToken = (() => {
  let cache: Promise<JiraTokenDto> | null = null
  let obtained = 0

  return async (token: string | null) => {
    const now = Date.now()
    // TODO: move to redux state
    if (!cache || now - obtained > 1000 * 60 * 10) {
      cache = fetch(`https://api.tempo.io/jira/v1/get-jira-oauth-token/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
      }).then((a) => a.json())
      obtained = Date.now()
    }

    return await cache
  }
})()

const getJiraAccountId = (() => {
  let result: string | null = null
  return async (token: string | null) => {
    if (!result) {
      const jira = await getJiraToken(token)
      const { accountId }: JiraAccountDto = await fetch(
        `${jira.client.baseUrl}/rest/api/3/myself`,
        {
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${jira.token}`,
          },
        }
      ).then((a) => a.json())
      result = accountId
    }
    return result
  }
})()

export async function toggleTracker(
  id: string,
  token: string | null
): Promise<TrackerDto> {
  return fetch(`https://api.tempo.io/trackers/v1/${id}/toggle`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`,
    },
  }).then((a) => a.json())
}

export async function getTrackers(token: string | null): Promise<TrackerDto[]> {
  return fetch("https://api.tempo.io/trackers/v1/", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`,
    },
  }).then((a) => a.json())
}

export async function createTracker(
  token: string | null,
  payload: { issueId?: string; issueKey?: string } = {}
): Promise<TrackerDto> {
  return fetch("https://api.tempo.io/trackers/v1/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      isPlaying: true,
      ...payload,
    }),
  }).then((a) => a.json())
}
export async function deleteTracker(id: string, token: string | null) {
  return fetch(`https://api.tempo.io/trackers/v1/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`,
    },
  })
}

export async function updateTracker(
  id: string,
  payload: {
    issueId?: string
    issueKey?: string
    description?: string | null
  },
  token: string | null
): Promise<TrackerDto> {
  return fetch(`https://api.tempo.io/trackers/v1/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload || {}),
  }).then((a) => a.json())
}

export async function createWorklog(
  payload: {
    issueKey: string
    timeSpentSeconds: number
  },
  token: string | null
) {
  const authorAccountId = await getJiraAccountId(token)
  const res = await fetch(`https://api.tempo.io/core/3/worklogs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      authorAccountId,
      startDate: getStartDate(),
      ...payload,
    }),
  }).then((a) => a.json())

  return res
}

export async function getListIssues(search: string, token: string | null) {
  const jira = await getJiraToken(token)
  const query = new URLSearchParams()

  query.append(
    "currentJQL",
    `project in projectsWhereUserHasPermission("Work on issues")`
  )
  query.append("showSubTasks", "true")
  query.append("showSubTaskParent", "true")
  query.append("query", search)

  const payload: {
    sections: { issues: IssueDto[] }[]
  } = await fetch(`${jira.client.baseUrl}/rest/api/2/issue/picker?${query}`, {
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${jira.token}`,
    },
  }).then((a) => a.json())

  const issues = payload.sections.reduce<Map<string, IssueDto>>(
    (memo, section) => {
      for (const issue of section.issues) {
        memo.set(issue.id, issue)
      }
      return memo
    },
    new Map()
  )

  return [...issues.values()]
}
