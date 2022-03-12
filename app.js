const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const { format } = require("date-fns");

const dbPath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const priorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const categoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const categoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const priorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const statusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const categoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const dueDateProperty = (requestQuery) => {
  return requestQuery.dueDate !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";

  const { search_q = "", priority, status, category, dueDate } = request.query;
  try {
    switch (true) {
      case priorityAndStatus(request.query):
        getTodoQuery = `
            SELECT 
              id, todo, priority, category, status, due_date as dueDate
            FROM 
                todo
            WHERE
                todo LIKE '%${search_q}'
                AND status = '${status}'
                AND priority = '${priority}';`;
        break;

      case categoryAndStatus(request.query):
        getTodoQuery = `
            SELECT 
              id, todo, priority, category, status, due_date as dueDate 
            FROM 
              todo
            WHERE
              todo LIKE '%${search_q}'
              AND category = '${category}'
              AND status = '${status}';`;
        break;

      case categoryAndPriority(request.query):
        getTodoQuery = `
            SELECT 
              id, todo, priority, category, status, due_date as dueDate 
            FROM 
              todo
            WHERE
              todo LIKE '%${search_q}'
              AND category = '${category}'
              AND priority = '${priority}';`;
        break;

      case priorityProperty(request.query):
        try {
          getTodoQuery = `
        SELECT
          id, todo, priority, category, status, due_date as dueDate
        FROM
          todo 
        WHERE
          todo LIKE '%${search_q}%'
          AND priority = '${priority}';`;
        } catch {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
        break;

      case statusProperty(request.query):
        try {
          getTodoQuery = `
        SELECT
          id, todo, priority, category, status, due_date as dueDate
        FROM
          todo 
        WHERE
          todo LIKE '%${search_q}%'
          AND status = '${status}';`;
        } catch {
          response.status(400);
          response.send("Invalid Todo Status");
        }
        break;

      case categoryProperty(request.query):
        try {
          getTodoQuery = `
        SELECT
          id, todo, priority, category, status, due_date as dueDate
        FROM
          todo 
        WHERE
          todo LIKE '%${search_q}%'
          AND category = '${category}';`;
        } catch {
          response.status(400);
          response.send("Invalid Todo Category");
        }
        break;

      case dueDateProperty(request.query):
        try {
          getTodoQuery = `
        SELECT
          id, todo, priority, category, status, due_date as dueDate
        FROM
          todo 
        WHERE
          todo LIKE '%${search_q}%'
          AND due_date = '${dueDate}';`;
        } catch {
          response.status(400);
          response.send("Invalid Due Date");
        }
        break;

      default:
        getTodoQuery = `
      SELECT
        id, todo, priority, category, status, due_date as dueDate
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
    }

    data = await db.all(getTodoQuery);
    response.send(data);
  } catch {
    response.status(400);
    response.send(`Invalid Todo ${request.query}`);
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
    SELECT
      id, todo, priority, category, status, due_date as dueDate
    FROM
      todo
    WHERE
      id = ${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

app.post("/todos/", async (request, response) => {
  try {
    const { id, todo, priority, category, status, dueDate } = request.body;
    const postTodoQuery = `
    INSERT INTO
        todo (id, todo, priority, category, status, due_date)
    VALUES
        (${id}, '${todo}', '${priority}', '${category}', '${status}', '${dueDate}');`;
    await db.run(postTodoQuery);
    response.send("Todo Successfully Added");
  } catch {
    response.status(400);
    response.send("Adding Todo Failed");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  let updateColumn = "";
  const requestBody = request.body;

  try {
    switch (true) {
      case requestBody.status !== undefined:
        updateColumn = "Status";
        break;

      case requestBody.priority !== undefined:
        updateColumn = "Priority";
        break;

      case requestBody.todo !== undefined:
        updateColumn = "Todo";
        break;

      case requestBody.category !== undefined:
        updateColumn = "Category";
        break;

      case requestBody.dueDate !== undefined:
        updateColumn = "Due Date";
        break;
    }

    const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;

    const previousTodo = await db.get(previousTodoQuery);
    const {
      todo = previousTodo.todo,
      priority = previousTodo.priority,
      status = previousTodo.status,
      category = previousTodo.category,
      dueDate = previousTodo.dueDate,
    } = request.body;

    const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}',
      category='${category}',
      due_date='${dueDate}'
    WHERE
      id = ${todoId};`;

    await db.run(updateTodoQuery);
    response.send(`${updateColumn} Updated`);
  } catch {
    response.status(400);
    response.send(`Invalid Todo ${updateColumn}`);
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
