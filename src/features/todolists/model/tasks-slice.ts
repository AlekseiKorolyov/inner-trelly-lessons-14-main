import { createTodolistTC, deleteTodolistTC } from "./todolists-slice"
import { createAppSlice } from "@/common/utils"
import { tasksApi } from "@/features/todolists/api/tasksApi.ts"
import { DomainTask, UpdateTaskModel } from "@/features/todolists/api/tasksApi.types.ts"
import { TaskStatus } from "@/common/enums"
import { RootState } from "@/app/store.ts"

export const tasksSlice = createAppSlice({
  name: "tasks",
  initialState: {} as TasksState,
  selectors: {
    selectTasks: (state) => state,
  },
  extraReducers: (builder) => {
    builder
      .addCase(createTodolistTC.fulfilled, (state, action) => {
        state[action.payload.todolist.id] = []
      })
      .addCase(deleteTodolistTC.fulfilled, (state, action) => {
        delete state[action.payload.id]
      })
  },
  reducers: (create) => ({
    fetchTasksTC: create.asyncThunk(
      async (todolistId: string, thunkAPI) => {
        try {
          const tasks = await tasksApi.getTasks(todolistId)
          return { todolistId, tasks }
        } catch (e) {
          return thunkAPI.rejectWithValue(null)
        }
      },
      {
        fulfilled: (state, action) => {
          state[action.payload.todolistId] = action.payload.tasks
        },
      },
    ),
    createTaskTC: create.asyncThunk(
      async (args: { todolistId: string; title: string }, thunkAPI) => {
        try {
          const task = await tasksApi.createTask(args)
          return { task }
        } catch (e) {
          return thunkAPI.rejectWithValue(null)
        }
      },
      {
        fulfilled: (state, action) => {
          const task = action.payload.task
          state[task.todolistId].unshift(task)
        },
      },
    ),
    deleteTaskTC: create.asyncThunk(
      async (args: { todolistId: string; taskId: string }, thunkAPI) => {
        try {
          await tasksApi.deleteTask(args)
          return args
        } catch (e) {
          return thunkAPI.rejectWithValue(null)
        }
      },
      {
        fulfilled: (state, action) => {
          const tasks = state[action.payload.todolistId]
          const index = tasks.findIndex((task) => task.id === action.payload.taskId)
          if (index !== -1) {
            tasks.splice(index, 1)
          }
        },
      },
    ),
    changeTaskStatusTC: create.asyncThunk(
      async (args: { todolistId: string; taskId: string; status: TaskStatus }, { rejectWithValue, getState }) => {
        try {
          const state = getState() as RootState
          const allTasks = state.tasks
          const tasksForTodolist = allTasks[args.todolistId]
          const updatedTask = tasksForTodolist.find((task) => {
            return task.id === args.taskId
          })

          if (updatedTask) {
            const model: UpdateTaskModel = {
              status: args.status,
              description: updatedTask.description,
              title: updatedTask.title,
              priority: updatedTask.priority,
              startDate: updatedTask.startDate,
              deadline: updatedTask.deadline,
            }

            const task = await tasksApi.updateTask({ todolistId: args.todolistId, taskId: args.taskId, model })
            return task
          } else {
            return rejectWithValue(null)
          }
        } catch (e) {
          return rejectWithValue(null)
        }
      },
      {
        fulfilled: (state, action) => {
          const task = state[action.payload.todolistId].find((task) => task.id === action.payload.id)
          if (task) {
            task.status = action.payload.status
          }
        },
      },
    ),
    changeTaskTitleAC: create.reducer<{ todolistId: string; taskId: string; title: string }>((state, action) => {
      const task = state[action.payload.todolistId].find((task) => task.id === action.payload.taskId)
      if (task) {
        task.title = action.payload.title
      }
    }),
  }),
})

export const { selectTasks } = tasksSlice.selectors
export const { deleteTaskTC, changeTaskStatusTC, changeTaskTitleAC, fetchTasksTC, createTaskTC } = tasksSlice.actions
export const tasksReducer = tasksSlice.reducer

export type TasksState = Record<string, DomainTask[]>
