import { nanoid } from "@reduxjs/toolkit"
import { beforeEach, expect, test } from "vitest"
import {
  changeTodolistFilterAC,
  changeTodolistTitleTC,
  createTodolistTC,
  deleteTodolistTC,
  type DomainTodolist,
  todolistsReducer,
} from "../todolists-slice"

let todolistId1: string
let todolistId2: string
let startState: DomainTodolist[] = []

beforeEach(() => {
  todolistId1 = nanoid()
  todolistId2 = nanoid()

  startState = [
    { id: todolistId1, title: "What to learn", filter: "all", addedAt: "", order: 0 },
    { id: todolistId2, title: "What to buy", filter: "all", addedAt: "", order: 0 },
  ]
})

test("correct todolist should be deleted", () => {
  const endState = todolistsReducer(
    startState,
    deleteTodolistTC.fulfilled({ id: todolistId1 }, "requestId", todolistId1),
  )

  expect(endState.length).toBe(1)
  expect(endState[0].id).toBe(todolistId2)
})

test("correct todolist should be created", () => {
  const title = "New todolist"
  const newTodolist = { id: "todolistId3", title, addedAt: "", order: 0 }
  const endState = todolistsReducer(
    startState,
    createTodolistTC.fulfilled({ todolist: newTodolist }, "requestId", title),
  )

  expect(endState.length).toBe(3)
  expect(endState[0].title).toBe(title)
})

test("correct todolist should change its title", () => {
  const title = "New title"
  const args = { id: todolistId2, title }
  const endState = todolistsReducer(startState, changeTodolistTitleTC.fulfilled(args, "requestId", args))

  expect(endState[0].title).toBe("What to learn")
  expect(endState[1].title).toBe(title)
})

test("correct todolist should change its filter", () => {
  const filter = "completed"
  const endState = todolistsReducer(startState, changeTodolistFilterAC({ id: todolistId2, filter }))

  expect(endState[0].filter).toBe("all")
  expect(endState[1].filter).toBe(filter)
})
