import fetch from "node-fetch"
import { Config, IssueDto, JiraAccountDto, TrackerDto } from "types"
import { URLSearchParams } from "url"
import { getStartDate } from "./utils"

const JIRA_BASE_URL = "https://cleevio.atlassian.net"

function getJiraBasicToken(token: Pick<Config, "username" | "password">) {
  return Buffer.from([token.username, token.password].join(":")).toString(
    "base64"
  )
}

function fetchTempo(token: Pick<Config, "token">) {
  return (...parameters: Parameters<typeof fetch>) => {
    const [path, args] = parameters
    return fetch(`https://api.tempo.io${path}`, {
      ...args,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.token}`,
        ...args?.headers,
      },
    })
  }
}

function fetchJira(token: Pick<Config, "username" | "password">) {
  return (...parameters: Parameters<typeof fetch>) => {
    const [path, args] = parameters
    return fetch(`${JIRA_BASE_URL}${path}`, {
      ...args,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${getJiraBasicToken(token)}`,
        ...args?.headers,
      },
    })
  }
}

export async function getJiraMyself(token: Config) {
  const res = await fetchJira(token)(`/rest/api/3/myself`, {
    method: "GET",
  })

  if (!res.ok) throw new Error("Response is not OK")
  return res.json()
}

const getCachedJiraAccountId = (() => {
  let result: string | null = null
  return async (token: Config) => {
    if (!result) {
      const res = await getJiraMyself(token)
      const data: JiraAccountDto = await res.json()
      result = data.accountId
    }
    return result
  }
})()

export async function toggleTracker(
  id: string,
  token: Config
): Promise<TrackerDto> {
  const res = await fetchTempo(token)(`/trackers/v1/${id}/toggle`, {
    method: "PATCH",
  })
  return res.json()
}

export async function getTrackers(token: Config): Promise<TrackerDto[]> {
  const res = await fetchTempo(token)("/trackers/v1/")
  return res.json()
}

export async function createTracker(
  token: Config,
  payload: { issueId?: string; issueKey?: string } = {}
): Promise<TrackerDto> {
  const res = await fetchTempo(token)("/trackers/v1/", {
    method: "POST",
    body: JSON.stringify({
      isPlaying: true,
      ...payload,
    }),
  })

  return res.json()
}
export async function deleteTracker(id: string, token: Config) {
  return fetchTempo(token)(`/trackers/v1/${id}`, { method: "DELETE" })
}

export async function updateTracker(
  id: string,
  payload: {
    issueId?: string
    issueKey?: string
    description?: string | null
  },
  token: Config
): Promise<TrackerDto> {
  const res = await fetchTempo(token)(`/trackers/v1/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })

  return res.json()
}

export async function createWorklog(
  payload: {
    issueKey: string
    timeSpentSeconds: number
  },
  token: Config
) {
  const authorAccountId = await getCachedJiraAccountId(token)
  const res = await fetchTempo(token)(`/core/3/worklogs`, {
    method: "POST",
    body: JSON.stringify({
      authorAccountId,
      startDate: getStartDate(),
      ...payload,
    }),
  })

  return res.json()
}

export async function getListIssues(search: string, token: Config) {
  const query = new URLSearchParams()

  query.append(
    "currentJQL",
    `project in projectsWhereUserHasPermission("Work on issues")`
  )
  query.append("showSubTasks", "true")
  query.append("showSubTaskParent", "true")
  query.append("query", search)

  const res = await fetchJira(token)(`/rest/api/2/issue/picker?${query}`)
  const payload: {
    sections: { issues: IssueDto[] }[]
  } = await res.json()

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
