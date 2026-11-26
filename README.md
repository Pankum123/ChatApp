# 💬 ChatApp – Real-Time Chat & Video Calling Application

ChatApp is a full-stack real-time messaging application built using the MERN stack. It enables users to communicate through private conversations and group chats, share media and files, make audio/video calls, and manage their profiles.

The application uses **Socket.IO** for real-time communication and **WebRTC** for peer-to-peer audio and video calling.

---

## 🚀 Features

### 🔐 Authentication & Security
- User registration and login using email and password.
- Google Authentication using Firebase.
- Secure password hashing with bcrypt.
- JWT-based authentication.
- HTTP-only authentication cookies.
- Protected API routes.
- Automatic login session management.

### 💬 Private Chat
- Real-time one-to-one messaging.
- Online and offline user status.
- Live typing indicators.
- Message history.
- Message delivery status (Sent, Delivered, Read).
- Read receipts with timestamps.
- Reply to messages.
- Edit sent messages.
- Delete messages for yourself.
- Delete messages for everyone.
- Forward messages to other conversations.
- Real-time message notifications with sound.

### 👥 Group Chat
- Create group conversations.
- Add and remove group members.
- Group administration.
- Edit group name.
- Update group profile picture.
- Leave a group.
- Delete a group.
- Real-time group messaging.
- Group typing indicators.
- Group message delivery and read status.
- Reply, edit, and delete group messages.
- Forward messages to private chats and groups.
- Unread message counts.
- Group member management.

### 📞 Audio & Video Calling
- One-to-one audio calling.
- One-to-one video calling.
- Group audio calling.
- Group video calling.
- Real-time incoming call notifications.
- Accept and reject incoming calls.
- Mute and unmute microphone.
- Enable and disable camera.
- End calls.
- Group call participant management.
- Group call host management.
- Real-time WebRTC offer, answer, and ICE candidate signaling.
- Call history with call duration and status.

### 📎 Media & File Sharing
- Share images.
- Share videos.
- Share audio files.
- Share PDF documents.
- Multiple attachments in a message.
- Cloudinary-based media storage.
- Reply to messages containing attachments.

### 👤 User Profile
- View user profiles.
- Update profile picture.
- Update full name.
- Update about/bio information.
- Search and find users.
- View online users.

---

## 🛠️ Tech Stack

### Frontend
- React.js 19
- Vite
- Tailwind CSS 4
- DaisyUI
- JavaScript
- React Router DOM
- Zustand
- Axios
- Socket.IO Client
- Firebase Authentication
- React Icons
- React Hot Toast
- React Hook Form
- WebRTC APIs

### Backend
- Node.js
- Express.js 5
- MongoDB
- Mongoose
- Socket.IO
- JWT (JSON Web Token)
- bcryptjs
- Cloudinary
- Firebase Admin SDK
- Express File Upload
- Cookie Parser
- CORS

### Real-Time Communication
- Socket.IO for real-time messaging and signaling.
- WebRTC for audio and video communication.
- STUN servers for peer connection establishment.

### Cloud Services
- MongoDB Atlas – Database hosting.
- Cloudinary – Media and file storage.
- Firebase – Google Authentication.
- AWS EC2 – Application deployment (when using AWS hosting).

---

## 📂 Project Structure

```text
ChatApp/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── firebaseAdmin.js
│   │   │
│   │   ├── jwt/
│   │   │   └── generateToken.js
│   │   │
│   │   ├── middleware/
│   │   │   └── secureRoute.js
│   │   │
│   │   ├── modules/
│   │   │   ├── conversation/
│   │   │   │   └── conversation.model.js
│   │   │   │
│   │   │   ├── googleAuth/
│   │   │   │   ├── googleAuth.controller.js
│   │   │   │   └── googleAuth.route.js
│   │   │   │
│   │   │   ├── group/
│   │   │   │   ├── group.controller.js
│   │   │   │   ├── group.model.js
│   │   │   │   ├── group.route.js
│   │   │   │   └── groupMessage.model.js
│   │   │   │
│   │   │   ├── message/
│   │   │   │   ├── message.controller.js
│   │   │   │   ├── message.model.js
│   │   │   │   └── message.route.js
│   │   │   │
│   │   │   └── user/
│   │   │       ├── user.controller.js
│   │   │       ├── user.model.js
│   │   │       └── user.route.js
│   │   │
│   │   ├── sockets/
│   │   │   ├── callSocket.js
│   │   │   ├── groupCallSocket.js
│   │   │   ├── groupSocket.js
│   │   │   ├── oneToOneSocket.js
│   │   │   └── server.js
│   │   │
│   │   └── index.js
│   │
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── calls/
│   │   │   │   ├── group/
│   │   │   │   └── private/
│   │   │   └── chat/
│   │   │       ├── group/
│   │   │       ├── private/
│   │   │       └── components/
│   │   │
│   │   ├── shared/
│   │   │   ├── api.js
│   │   │   ├── realtime/
│   │   │   └── zustand/
│   │   │
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## ⚙️ Installation & Setup

Follow these steps to run ChatApp locally.

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL

cd ChatApp
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside the backend directory.

**Backend Environment Variables:**

```env
PORT=4002

MONGODB_URI=your_mongodb_connection_string

JWT_TOKEN=your_jwt_secret_key

DEVELOPMENT_FRONTEND_URL=http://localhost:3001

PRODUCTION_FRONTEND_URL=your_production_frontend_url

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_service_account_email
FIREBASE_PRIVATE_KEY="your_firebase_private_key"
```

Start the backend server:

```bash
npm run dev
```

Backend will run at:

```text
http://localhost:4002
```

### 3. Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

#### Environment Configuration

ChatApp uses separate environment files for development and production.

**`.env.development`**

```env
VITE_API_URL=http://localhost:4002

VITE_FIREBASE_APIKEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

**`.env.production`**

```env
VITE_API_URL=https://your-production-backend-domain.com

VITE_FIREBASE_APIKEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

#### Run Development Server

```bash
npm run dev
```

#### Create Production Build

```bash
npm run build
```

Vite automatically loads `.env.development` during development and `.env.production` during production builds.

To preview the production build locally:

```bash
npm run preview
```

## 🔌 API Routes

All backend API routes are prefixed with:

```text
/api
```

### Authentication & User APIs

| Method | Endpoint | Description |
|---|---|---|
| POST | `/user/signup` | Register a new user |
| POST | `/user/login` | Login user |
| POST | `/user/logout` | Logout user |
| GET | `/user/allusers` | Get all users |
| PUT | `/user/set-password` | Set account password |
| PUT | `/user/update-profile-pic` | Update profile picture |
| PUT | `/user/update-fullname` | Update full name |
| PUT | `/user/update-about` | Update about information |
| POST | `/google-auth/login` | Google authentication |

### Private Messaging APIs

| Method | Endpoint | Description |
|---|---|---|
| POST | `/message/send/:id` | Send a message |
| GET | `/message/get/:id` | Get conversation messages |
| PUT | `/message/edit/:id` | Edit a message |
| DELETE | `/message/delete-for-me/:id` | Delete message for me |
| DELETE | `/message/delete-for-everyone/:id` | Delete message for everyone |
| POST | `/message/forward/:id` | Forward a message |

### Group APIs

| Method | Endpoint | Description |
|---|---|---|
| POST | `/group/create` | Create a group |
| GET | `/group/get` | Get user groups |
| POST | `/group/send/:id` | Send group message |
| GET | `/group/messages/:id` | Get group messages |
| POST | `/group/add-member/:id` | Add group member |
| POST | `/group/remove-member/:id` | Remove group member |
| DELETE | `/group/delete/:id` | Delete group |
| POST | `/group/leave/:id` | Leave group |
| PUT | `/group/edit/:id` | Edit group name |
| PUT | `/group/update-image/:id` | Update group image |
| DELETE | `/group/delete-message-for-me/:id/:messageId` | Delete group message for me |
| DELETE | `/group/delete-message-for-everyone/:id/:messageId` | Delete group message for everyone |
| PUT | `/group/edit-message/:id/:messageId` | Edit group message |
| POST | `/group/forward/:id` | Forward group message |

---

## ⚡ Real-Time Socket Events

ChatApp uses Socket.IO to provide instant communication.

### Private Chat Events

| Event | Description |
|---|---|
| `getOnlineUsers` | Get online users |
| `newMessage` | Receive new message |
| `messageDelivered` | Mark message as delivered |
| `messageStatusUpdated` | Update message status |
| `messagesRead` | Mark messages as read |
| `userTyping` | User typing notification |
| `userStopTyping` | Stop typing notification |
| `messageEdited` | Receive edited message |
| `messageDeletedForEveryone` | Receive message deletion |

### Group Chat Events

| Event | Description |
|---|---|
| `joinGroup` | Join a group room |
| `newGroupCreated` | Notify members about new group |
| `newGroupMessage` | Receive group message |
| `groupMessageDelivered` | Mark group message as delivered |
| `groupMessageStatusUpdated` | Update group message status |
| `groupMessagesRead` | Mark group messages as read |
| `groupUserTyping` | Group typing notification |
| `groupUserStopTyping` | Stop group typing notification |

### Private Audio/Video Calling

The application uses Socket.IO signaling events for private calls, including incoming call notifications, call acceptance, rejection, cancellation, WebRTC offers, answers, ICE candidates, and call termination.

### Group Audio/Video Calling

Group calling uses dedicated events:

- `group-call:invite`
- `group-call:incoming`
- `group-call:accept`
- `group-call:reject`
- `group-call:join`
- `group-call:joined`
- `group-call:offer`
- `group-call:answer`
- `group-call:ice-candidate`
- `group-call:participant-left`
- `group-call:leave`
- `group-call:end`
- `group-call:ended`
- `group-call:error`

---

## 🗄️ Database

ChatApp uses MongoDB with Mongoose for database management.

Main database models:

| Model | Description |
|---|---|
| User | Stores user account and profile information |
| Conversation | Stores private conversation details |
| Message | Stores private messages, attachments and call history |
| Group | Stores group details, members and admin |
| GroupMessage | Stores group messages, attachments and group call history |

---

## ☁️ Cloudinary Integration

Cloudinary is used to upload and store media files.

Supported uploads include:

- Images
- Videos
- Audio files
- PDF documents

Uploaded media URLs and metadata are stored in MongoDB.

---

## 📞 WebRTC Architecture

ChatApp uses WebRTC for real-time audio and video communication.

**Private Calling Flow:**

1. Caller initiates an audio or video call.
2. Socket.IO sends an incoming call notification.
3. Receiver accepts or rejects the call.
4. WebRTC creates an offer and answer.
5. ICE candidates are exchanged through Socket.IO.
6. Peer-to-peer media communication begins.
7. Call termination is synchronized between users.
8. Call history is stored in MongoDB.

**Group Calling Flow:**

1. A group member initiates a call.
2. Other group members receive call invitations.
3. Participants join the active group call.
4. WebRTC peer connections are established between participants.
5. Audio/video streams are exchanged.
6. Participants can leave or the host can end the call.
7. Group call history is saved.

The current backend implementation supports up to **6 participants** in a group call.

---

## 🔒 Security

- Password hashing using bcryptjs.
- JWT-based authentication.
- HTTP-only JWT cookies.
- Protected routes using authentication middleware.
- Firebase ID token verification for Google login.
- CORS configuration for allowed frontend origins.
- Group membership validation for group operations.
- Attachment count and file-size validation.

---

## 🧪 Available Scripts

### Backend

```bash
npm run dev
```

Runs the backend using Nodemon.

```bash
npm start
```

Starts the backend server.

### Frontend

```bash
npm run dev
```

Starts the Vite development server.

```bash
npm run build
```

Creates the production build.

```bash
npm run preview
```

Previews the production build.

```bash
npm run lint
```

Runs ESLint.

---

## 🌐 Deployment

The application can be deployed using:

- **Frontend:** Vite production build hosted on a web server.
- **Backend:** Node.js server hosted on AWS EC2.
- **Reverse Proxy:** Nginx.
- **Database:** MongoDB Atlas.
- **Media Storage:** Cloudinary.

For production deployment:

1. Configure production environment variables.
2. Set the production frontend URL in backend CORS configuration.
3. Set `VITE_API_URL` to the deployed backend URL.
4. Configure Firebase authentication settings.
5. Configure MongoDB Atlas and Cloudinary credentials.
6. Enable HTTPS for secure authentication cookies and WebRTC access.
7. Configure Nginx to support HTTP requests and WebSocket upgrades.

For reliable WebRTC connections across restrictive networks, a TURN server may also be required.

---

## 👨‍💻 Developer

**ChatApp – Real-Time Communication Platform**

Built with the MERN Stack, Socket.IO, WebRTC, Firebase and Cloudinary.

---

## ⭐ Support

If you find this project useful, consider giving it a star on GitHub!

**Thank you for checking out ChatApp! ❤️**
