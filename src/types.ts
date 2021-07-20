export interface TrackerDto {
  id: string
  issueKey: string
  isPlaying: boolean
  createdDate: string
  time: {
    trackerDuration: { start: string | null; end: string | null }[]
  }
  description: string
}

export interface IssueDto {
  id: string
  summaryText: string
  key: string
}

export interface JiraTokenDto {
  token: string
  client: { baseUrl: string }
}

export interface JiraAccountDto {
  accountId: string
}