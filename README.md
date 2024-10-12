# Chat Application (Phase 2) - Assignment 3813ICT

## Git Repository Organization and Usage

The Git repository for this project is set up to keep things organized. It’s structured like this:

### Branches:
- **`master`**: The stable branch that contains the most recent, tested version of the application. All final code is updated here after testing.


### Commit Frequency fix this:
- Frequent commits after completing a small piece of functionality or bug fix.
- Clear and descriptive commit messages such as "Added socket functionality" or "Fixed messages showing twice bug"

### Repository Structure:
- **Frontend (Angular)**: Stored in `src/app/`. Each Angular component and service is in its own folder to maintain modularity.
- **Backend (Node.js/Express)**: Stored in the `server/` directory. Key files include:
  - `server.js`: Initializes the server and sets up the main routes.
  - `sockets.js`: Manages real-time communication via Socket.io.
  - Multer setup is integrated directly in `server.js` for handling image uploads. (I was not successful it getting this to work)