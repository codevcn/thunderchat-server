# Admin API Documentation

## Tổng quan

Admin API cung cấp các endpoint để quản lý hệ thống, xem thống kê và quản lý user.

## Authentication

Tất cả endpoints đều yêu cầu:
1. Đăng nhập admin: `POST /api/auth/admin/login`
2. JWT token trong cookie
3. Role ADMIN

## Endpoints

### 1. Dashboard

#### GET `/api/admin/dashboard`
Lấy thống kê tổng quan cho admin dashboard.

**Response:**
```json
{
  "overall": {
    "totalUsers": 100,
    "totalMessages": 500,
    "totalGroups": 20
  },
  "monthly": [
    {
      "month": "2024-01",
      "newUsers": 10,
      "newMessages": 50
    }
  ],
  "topUsers": [
    {
      "id": 1,
      "email": "user@example.com",
      "messageCount": 100
    }
  ],
  "summary": {
    "totalUsers": 100,
    "totalMessages": 500,
    "activeUsers": 5
  }
}
```

### 2. System Statistics

#### GET `/api/admin/system-stats`
Lấy thống kê chi tiết hệ thống.

**Response:**
```json
{
  "users": {
    "total": 100,
    "active": 95,
    "inactive": 5
  },
  "messages": {
    "direct": 300,
    "group": 200,
    "total": 500
  },
  "groups": 20,
  "friendRequests": 50
}
```

### 3. User Management

#### GET `/api/admin/users?page=1&limit=10`
Lấy danh sách user với phân trang.

**Query Parameters:**
- `page`: Số trang (default: 1)
- `limit`: Số item mỗi trang (default: 10, max: 100)

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "email": "user@example.com",
      "role": "USER",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "Profile": {
        "fullName": "John Doe",
        "avatar": "https://..."
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

#### PUT `/api/admin/users/:id/ban`
Ban user.

**Request Body:**
```json
{
  "reason": "Violation of community guidelines"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User banned successfully"
}
```

#### PUT `/api/admin/users/:id/unban`
Unban user.

**Response:**
```json
{
  "success": true,
  "message": "User unbanned successfully"
}
```

#### DELETE `/api/admin/users/:id`
Xóa user (soft delete).

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

## Error Responses

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Admin access required"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Cannot ban admin user"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "User not found"
}
```

## Testing

### 1. Login as Admin
```bash
curl -X POST http://localhost:8080/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "adminpassword"
  }' \
  -c cookies.txt
```

### 2. Get Dashboard
```bash
curl -X GET http://localhost:8080/api/admin/dashboard \
  -b cookies.txt
```

### 3. Ban User
```bash
curl -X PUT http://localhost:8080/api/admin/users/123/ban \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Spam messages"
  }' \
  -b cookies.txt
```

## Security Notes

- Tất cả endpoints đều được bảo vệ bởi `AuthGuard` và `AdminGuard`
- Chỉ user có role `ADMIN` mới có thể truy cập
- Không thể ban/xóa admin user khác
- Soft delete được sử dụng thay vì hard delete 