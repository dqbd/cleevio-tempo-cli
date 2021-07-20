export const SELECT_ROW = Symbol("SELECT_ROW")
export const SELECT_TIME = Symbol("SELECT_TIME")
export const DESCRIPTION = Symbol("DESCRIPTION")
export const LOG = Symbol("LOG")
export const DELETE = Symbol("DELETE")
export const CHANGE_ISSUE = Symbol("CHANGE_ISSUE")

export enum State {
  SELECT_ROW,
  SELECT_TIME,
  DESCRIPTION,
  LOG,
  DELETE,
  CHANGE_ISSUE,
}

export const stateOrder = [State.SELECT_TIME, State.SELECT_ROW, State.LOG, State.DELETE, State.CHANGE_ISSUE]
