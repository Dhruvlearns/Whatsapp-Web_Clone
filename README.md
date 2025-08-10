# WhatsApp Web Clone

A **full-stack real-time chat application** inspired by WhatsApp Web.  
Built with **React.js, Node.js, Express, MongoDB, and Socket.IO**, this project demonstrates real-time messaging, role-based data handling, and webhook event processing.

---

## 🚀 Features

- **Real-Time Messaging** — powered by Socket.IO for instant updates.
- **WhatsApp Webhook Integration** — processes incoming messages and status updates.
- **Role-Based Access** — sender & receiver chat separation.
- **Message Status Tracking** — sent, delivered, and read receipts.
- **MongoDB Data Persistence** — stores users, messages, and statuses.
- **Responsive UI** — designed to replicate WhatsApp Web’s layout.
- **Custom Payload Processing** — supports importing sample payloads for testing.

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Axios
- Socket.IO Client
- TailwindCSS / Custom CSS

### Backend
- Node.js
- Express.js
- Socket.IO
- Mongoose (MongoDB)
- dotenv

---

## 📂 Project Structure
***
whatsapp-web-clone/
│
├── client/               # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/               # Node.js backend
│   ├── models/           # Mongoose schemas (User, Message)
│   ├── routes/           # API routes
│   ├── sample_payloads/  # Test payloads for MongoDB import
│   ├── processPayloads.js
│   ├── server.js         # Main backend entry point
│   └── package.json
│
└── README.md


## ⚙️ Installation & Setup

###

1️⃣ Clone the Repository

git clone https://github.com/Dhruvlearns/whatsapp-web-clone.git
cd whatsapp-web-clone

2️⃣ Install Dependencies
Backend:
cd server
npm install


Frontend:
cd ../client
npm install

3️⃣ Configure Environment Variables
Create a .env file in the server/ directory:

PORT=5000
MONGODB_URI=your-mongodb-uri
CLIENT_URL=http://localhost:3000
NODE_ENV=development



4️⃣ Run the Application
Backend:
cd server
npm start

Frontend:

cd ../client
npm start

📦 Processing Sample Payloads
To test without an actual WhatsApp API connection, you can import mock payloads:

Place your .json files inside server/sample_payloads/.

Run:
npm run process-payloads

Refresh the frontend — you’ll see the imported messages.


💡 Learning Outcomes
Real-time communication with WebSockets.

Webhook-based event handling.

MongoDB schema design for chat systems.

Full-stack integration of React frontend with Node.js backend.

📜 License
This project is for educational and demonstration purposes.
