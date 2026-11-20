import { createTodolistTC, deleteTodolistTC } from "./todolists-slice"
import { createAppSlice } from "@/common/utils"
import { tasksApi } from "@/features/todolists/api/tasksApi.ts"
import { DomainTask, UpdateTaskModel } from "@/features/todolists/api/tasksApi.types.ts"

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
      async (task: DomainTask, { rejectWithValue }) => {
        try {
          const model: UpdateTaskModel = {
            status: task.status,
            title: task.title,
            priority: task.priority,
            startDate: task.startDate,
            deadline: task.deadline,
          }
          const res = await tasksApi.updateTask({ todolistId: task.todolistId, taskId: task.id, model })
          return { task: res }
        } catch (e) {
          return rejectWithValue(null)
        }
      },
      {
        fulfilled: (state, action) => {
          const newTask = action.payload.task
          const task = state[newTask.todolistId].find((task) => task.id === newTask.id)
          if (task) {
            task.status = newTask.status
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
