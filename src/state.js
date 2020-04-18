import { createSlice, combineReducers, configureStore } from "@reduxjs/toolkit"
import { parseDate } from "./utils"

export const timers = createSlice({
  name: "timers",
  initialState: {
		list: [],
		loading: false,
  },
  reducers: {
    setTimers: {
      reducer(_, { payload }) {
        state.list = payload
      },
      prepare: value => ({
        payload: (value || []).sort(
          ({ createdDate: a }, { createdDate: b }) =>
            parseDate(a) - parseDate(b)
        )
      })
    },
  }
})

export const store = configureStore({
  reducer: combineReducers({
    timers: timers.reducer
  })
})
