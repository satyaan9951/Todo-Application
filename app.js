/*
CREATE TABLE todo(id INTEGER,todo TEXT,priority TEXT,status TEXT);

INSERT INTO todo (id,todo,priority,status)
Values(1,"LearnHTML","MEDIUM","IN PROGRESS"),
(2,"LearnCSS","LOW","DONE"),
(3,"LearnJS","HIGH","TO DO");

SELECT * FROM todo;
*/

const express = require("express");
const app = express();
app.use(express.json());

const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status } = request.query;
  let getTodosQuery = "";
  let data = null;
  switch (true) {
    case hasStatusProperty(request.query):
      getTodosQuery = `
          SELECT 
            *
          FROM 
            todo
          WHERE 
            todo LIKE '%${search_q}%'
            AND status='${status}';
          `;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
          SELECT 
            *
          FROM 
            todo
          WHERE 
            todo LIKE '%${search_q}%'
            AND priority='${priority}';
        `;
      break;
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
          SELECT 
            *
          FROM 
            todo
          WHERE 
            todo LIKE '%${search_q}%'
            AND status='${status}'
            AND priority='${priority}';
            `;
      break;
    default:
      getTodosQuery = `
          SELECT 
            *
          FROM 
            todo
          WHERE 
            todo LIKE '%${search_q}%';
            `;
  }
  data = await db.all(getTodosQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
  SELECT *
  FROM todo
  WHERE id=${todoId};
  `;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const addTodoQuery = `
  INSERT INTO todo(id,todo,priority,status)
  VALUES(${id},'${todo}','${priority}','${status}');
  `;
  await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  let updateTodoQuery = "";
  const { todoId } = request.params;
  const { status } = request.query;
  switch (true) {
    case request.body.status !== undefined:
      const { status } = request.body;
      updateTodoQuery = `
          UPDATE todo
          SET status='${status}'
          WHERE id=${todoId};
          `;
      await db.run(updateTodoQuery);
      response.send("Status Updated");
      break;
    case request.body.priority !== undefined:
      const { priority } = request.body;
      updateTodoQuery = `
          UPDATE todo
          SET priority='${priority}'
          WHERE id=${todoId};
          `;
      await db.run(updateTodoQuery);
      response.send("Priority Updated");
      break;
    case request.body.todo !== undefined:
      const { todo } = request.body;
      updateTodoQuery = `
          UPDATE todo
          SET todo='${todo}'
          WHERE id=${todoId};
          `;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
      DELETE FROM 
      todo
      WHERE
      id=${todoId};
      `;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
module.exports = app;
