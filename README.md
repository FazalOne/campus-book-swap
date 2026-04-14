

## Run Locally

**Prerequisites:**  Node.js, PostgreSQL

1. Create and configure the PostgreSQL database

Make sure PostgreSQL is installed and running on your machine.

Create the following database in PostgreSQL:

`CREATE DATABASE campusbookswap;`


Verify that the DB_CONFIG values in server.ts match your local PostgreSQL credentials:

 const DB_CONFIG = {
  user: 'postgres',
  host: 'localhost',
  database: 'campusbookswap',
  password: 'campus1234',
  port: 5432,
};


 Note: The database must be created manually.
All required tables (users, books, chats, messages, swaps) and the default super_admin user are automatically created when the server starts for the first time.

2. Open two separate CMD / Terminal windows.

In both terminals, navigate to the project root folder:
`cd path/to/your/project`

3. Install dependencies(You only need to run it once on one of the two terminals.):
   `npm install`

4. Run the server(run in first terminal):
   `npx tsx server.ts`

5. Run the app(run in second terminal):
   `npm run dev`

6. Once both servers are running, open your browser and go to:
   `http://localhost:3000/`



