import * as Todo from "../models/todo.js";

export const getTodos = async (req, res) => {
  try {
    const userId = req.userContext.userId;
    const todos = await Todo.getAllTodos(userId);
    res.json({
      success: true,
      data: todos,
      count: todos.length,
    });
  } catch (error) {
    console.error("Error fetching todos:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching todos",
      message: error.message,
    });
  }
};

export const getTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userContext.userId;
    const todo = await Todo.getTodoById(id, userId);

    if (!todo) {
      return res.status(404).json({
        success: false,
        error: "Todo not found",
      });
    }

    res.json({
      success: true,
      data: todo,
    });
  } catch (error) {
    console.error("Error fetching todo:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching todo",
      message: error.message,
    });
  }
};

export const createTodo = async (req, res) => {
  try {
    const { name, status, date } = req.body;
    const userId = req.userContext.userId;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Name is required",
      });
    }

    const newTodo = await Todo.createTodo({ userId, name, status, date });

    res.status(201).json({
      success: true,
      data: newTodo,
      message: "Todo created successfully",
    });
  } catch (error) {
    console.error("Error creating todo:", error);
    res.status(500).json({
      success: false,
      error: "Error creating todo",
      message: error.message,
    });
  }
};

export const updateTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userContext.userId;
    const { name, status, date } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Name is required",
      });
    }

    const existingTodo = await Todo.getTodoById(id, userId);
    if (!existingTodo) {
      return res.status(404).json({
        success: false,
        error: "Todo not found",
      });
    }

    // Ownership validation
    if (existingTodo.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Forbidden",
      });
    }

    const updatedTodo = await Todo.updateTodo(id, {
      name,
      status: status || existingTodo.status,
      date: date || existingTodo.date,
    }, userId);

    res.json({
      success: true,
      data: updatedTodo,
      message: "Todo updated successfully",
    });
  } catch (error) {
    console.error("Error updating todo:", error);
    res.status(500).json({
      success: false,
      error: "Error updating todo",
      message: error.message,
    });
  }
};

export const patchTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userContext.userId;
    const partialData = req.body;

    const existingTodo = await Todo.getTodoById(id, userId);
    if (!existingTodo) {
      return res.status(404).json({
        success: false,
        error: "Todo not found",
      });
    }

    // Ownership validation
    if (existingTodo.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Forbidden",
      });
    }

    const updatedTodo = await Todo.patchTodo(id, partialData, userId);

    res.json({
      success: true,
      data: updatedTodo,
      message: "Todo partially updated successfully",
    });
  } catch (error) {
    console.error("Error patching todo:", error);
    res.status(500).json({
      success: false,
      error: "Error patching todo",
      message: error.message,
    });
  }
};

export const deleteTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userContext.userId;

    const todo = await Todo.getTodoById(id, userId);
    if (!todo) {
      return res.status(404).json({
        success: false,
        error: "Todo not found",
      });
    }

    // Ownership validation
    if (todo.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Forbidden",
      });
    }

    const result = await Todo.deleteTodo(id, userId);

    res.json({
      success: true,
      data: result,
      message: "Todo deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting todo:", error);
    res.status(500).json({
      success: false,
      error: "Error deleting todo",
      message: error.message,
    });
  }
};
