# ArtArtist Admin Dashboard

A separate admin application for managing the ArtArtist marketplace platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ 
- MongoDB database
- Backend server running on port 5000

### Installation

1. **Navigate to admin directory**
```bash
cd admin
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
# Copy and edit the .env file
cp .env.example .env
```

4. **Start the admin app**
```bash
npm start
```

The admin dashboard will be available at `http://localhost:3001`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the admin directory:

```env
# API Configuration
REACT_APP_API_URL=https://sverxiioo.nanoprofiles.com/api
REACT_APP_NAME=ArtArtist Admin
REACT_APP_VERSION=1.0.0

# Firebase Configuration (for admin authentication)
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

## 🎯 Features

### **Dashboard Overview**
- Real-time platform statistics
- Recent activity monitoring
- Quick action buttons
- Performance metrics

### **User Management**
- View all users with pagination
- Search and filter by role
- Edit user information
- Delete users (except admins)
- Role-based access control

### **Product Management**
- Complete product catalog
- Image gallery support
- Status management (available, sold, draft)
- Category filtering
- Pricing and inventory control

### **Event Management**
- Create and manage events
- Registration tracking
- Venue and scheduling
- Category-based organization
- Status monitoring

### **System Settings**
- General platform configuration
- Security settings
- Upload preferences
- Notification controls
- Maintenance mode

## 🔐 Authentication

The admin app uses Firebase authentication with role-based access control:

1. **Admin Login**: Google Sign-In with admin role verification
2. **Role Validation**: Only users with `role: 'admin'` can access the dashboard
3. **Session Management**: JWT tokens with automatic refresh
4. **Security**: Protected routes and API endpoints

## 📱 Responsive Design

- **Mobile**: Optimized for tablets and phones
- **Tablet**: Enhanced layout for larger screens
- **Desktop**: Full-featured dashboard experience
- **Sidebar**: Collapsible navigation on mobile

## 🛠 Tech Stack

- **Frontend**: React 18 with Hooks
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Authentication**: Firebase SDK

## 📊 API Integration

The admin app connects to the backend API:

- **Base URL**: `https://sverxiioo.nanoprofiles.com/api`
- **Authentication**: Bearer token in headers
- **Error Handling**: Automatic token refresh
- **Rate Limiting**: Respects backend limits

## 🎨 UI Components

### **Layout Components**
- **Layout**: Main dashboard layout with sidebar
- **Login**: Authentication page
- **Navigation**: Responsive sidebar menu

### **Page Components**
- **Dashboard**: Overview with statistics
- **Users**: User management interface
- **Products**: Product catalog management
- **Events**: Event administration
- **Settings**: System configuration

### **Common Components**
- **Cards**: Consistent card layouts
- **Tables**: Data tables with pagination
- **Forms**: Styled form inputs
- **Buttons**: Consistent button styles
- **Modals**: Dialog components

## 🔧 Development

### **Available Scripts**

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Eject (one-way operation)
npm run eject
```

### **Project Structure**

```
admin/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx
│   │   ├── Users.jsx
│   │   ├── Products.jsx
│   │   ├── Events.jsx
│   │   ├── Settings.jsx
│   │   ├── Login.jsx
│   │   └── Layout.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── services/
│   │   └── api.js
│   ├── firebase.js
│   ├── App.jsx
│   ├── index.js
│   └── index.css
├── package.json
├── tailwind.config.js
└── .env
```

## 🚀 Deployment

### **Development**
```bash
# Start backend server
cd server && npm run dev

# Start admin app
cd admin && npm start
```

### **Production**
```bash
# Build admin app
npm run build

# Deploy build/ folder to hosting service
```

## 🔒 Security Considerations

- **Admin Only**: Only admin role users can access
- **Token Validation**: Automatic token verification
- **Route Protection**: Protected routes and components
- **API Security**: Backend role validation
- **Input Validation**: Form validation and sanitization

## 🐛 Troubleshooting

### **Common Issues**

1. **Authentication Errors**
   - Check Firebase configuration
   - Verify user has admin role
   - Clear browser storage

2. **API Connection Issues**
   - Ensure backend server is running
   - Check API URL in .env
   - Verify CORS settings

3. **Styling Issues**
   - Install Tailwind CSS dependencies
   - Check tailwind.config.js
   - Verify CSS imports

### **Debug Mode**

Enable debug logging in browser console:
```javascript
localStorage.setItem('debug', 'true');
```

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Verify backend server status
3. Review Firebase configuration
4. Check environment variables

---

**Note**: This admin app is designed to work with the ArtArtist backend API. Ensure the backend server is properly configured and running before using the admin dashboard.
# admin-

# artadartistmin

