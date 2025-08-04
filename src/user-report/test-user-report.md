# User Report API Documentation

## Endpoint: POST /user-report/create-violation-report

### Description

Creates a violation report for a user with optional report images and reported messages.

### Authentication

- Requires `AuthGuard` - User must be authenticated
- User ID is extracted from JWT token

### Request Format

**Content-Type:** `multipart/form-data`

#### Form Data Fields:

- `reportedUserId` (number, required): ID of the user being reported
- `reportCategory` (enum, required): Category of the violation
  - Values: `SPAM`, `HARASSMENT`, `INAPPROPRIATE_CONTENT`, `VIOLENCE`, `OTHER`
- `reasonText` (string, optional): Additional reason text (max 1000 characters)
- `reportedMessages` (array, optional): Array of reported messages (max 10 items)
  - `messageId` (number): ID of the message
  - `messageType` (enum): Type of message (`TEXT`, `IMAGE`, `VIDEO`, `AUDIO`, `DOCUMENT`)
  - `messageContent` (string): Content or file path for media messages
- `reportImages` (files, optional): Up to 5 image files
  - Allowed types: JPEG, PNG, GIF, WebP
  - Max size: 10MB per image

### Response Format

#### Success Response (200):

```json
{
  "success": true,
  "reportId": 123,
  "message": "Violation report created successfully"
}
```

#### Error Response (200):

```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE",
  "details": {
    // Additional error details
  }
}
```

### Error Codes:

- `USER_NOT_FOUND`: Reported user does not exist
- `SELF_REPORT_NOT_ALLOWED`: Cannot report yourself
- `DUPLICATE_REPORT`: Already reported this user within 24 hours
- `MAX_MESSAGES_EXCEEDED`: More than 10 reported messages
- `MAX_IMAGES_EXCEEDED`: More than 5 report images
- `INVALID_FILE_TYPE`: Invalid file type for report images
- `FILE_TOO_LARGE`: File size exceeds 10MB limit
- `MESSAGE_NOT_FOUND`: Message not found or doesn't belong to reported user
- `INVALID_FILE_PATH`: Media message requires valid file path
- `FILE_NOT_FOUND`: File path does not exist
- `UPLOAD_FAILED`: Failed to upload file to AWS S3
- `TRANSACTION_FAILED`: Database transaction failed

## 📋 **VÍ DỤ ĐẦU VÀO API**

### 1. **Báo cáo cơ bản (chỉ có text)**

#### cURL Command:

```bash
curl -X POST http://localhost:3000/user-report/create-violation-report \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "reportedUserId=456" \
  -F "reportCategory=HARASSMENT" \
  -F "reasonText=User sent inappropriate messages and threats"
```

#### Form Data:

```
reportedUserId: 456
reportCategory: HARASSMENT
reasonText: User sent inappropriate messages and threats
```

### 2. **Báo cáo với hình ảnh**

#### cURL Command:

```bash
curl -X POST http://localhost:3000/user-report/create-violation-report \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "reportedUserId=789" \
  -F "reportCategory=INAPPROPRIATE_CONTENT" \
  -F "reasonText=User posted inappropriate images" \
  -F "reportImages=@/path/to/evidence1.jpg" \
  -F "reportImages=@/path/to/evidence2.png"
```

#### Form Data:

```
reportedUserId: 789
reportCategory: INAPPROPRIATE_CONTENT
reasonText: User posted inappropriate images
reportImages: [file1.jpg, file2.png]
```

### 3. **Báo cáo với tin nhắn text**

#### cURL Command:

```bash
curl -X POST http://localhost:3000/user-report/create-violation-report \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "reportedUserId=123" \
  -F "reportCategory=SPAM" \
  -F "reportedMessages=[{\"messageId\":1001,\"messageType\":\"TEXT\",\"messageContent\":\"Buy this product now! Limited time offer!\"}]"
```

#### Form Data:

```
reportedUserId: 123
reportCategory: SPAM
reportedMessages: [
  {
    "messageId": 1001,
    "messageType": "TEXT",
    "messageContent": "Buy this product now! Limited time offer!"
  }
]
```

### 4. **Báo cáo với tin nhắn media (file path)**

#### cURL Command:

```bash
curl -X POST http://localhost:3000/user-report/create-violation-report \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "reportedUserId=456" \
  -F "reportCategory=INAPPROPRIATE_CONTENT" \
  -F "reportedMessages=[{\"messageId\":1002,\"messageType\":\"IMAGE\",\"messageContent\":\"/path/to/violation-image.jpg\"}]"
```

#### Form Data:

```
reportedUserId: 456
reportCategory: INAPPROPRIATE_CONTENT
reportedMessages: [
  {
    "messageId": 1002,
    "messageType": "IMAGE",
    "messageContent": "/path/to/violation-image.jpg"
  }
]
```

### 4b. **Báo cáo với tin nhắn media (URL)**

#### cURL Command:

```bash
curl -X POST http://localhost:3000/user-report/create-violation-report \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "reportedUserId=456" \
  -F "reportCategory=INAPPROPRIATE_CONTENT" \
  -F "reportedMessages=[{\"messageId\":1002,\"messageType\":\"IMAGE\",\"messageContent\":\"https://thunder-chat.s3.ap-southeast-1.amazonaws.com/violation-image.jpg\"}]"
```

#### Form Data:

```
reportedUserId: 456
reportCategory: INAPPROPRIATE_CONTENT
reportedMessages: [
  {
    "messageId": 1002,
    "messageType": "IMAGE",
    "messageContent": "https://thunder-chat.s3.ap-southeast-1.amazonaws.com/violation-image.jpg"
  }
]
```

### 5. **Báo cáo phức tạp (đầy đủ)**

#### cURL Command:

```bash
curl -X POST http://localhost:3000/user-report/create-violation-report \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "reportedUserId=789" \
  -F "reportCategory=HARASSMENT" \
  -F "reasonText=User has been harassing me for weeks with inappropriate messages and images" \
  -F "reportedMessages=[{\"messageId\":1003,\"messageType\":\"TEXT\",\"messageContent\":\"You are so beautiful, I want to meet you\"},{\"messageId\":1004,\"messageType\":\"IMAGE\",\"messageContent\":\"/path/to/inappropriate-image.jpg\"},{\"messageId\":1005,\"messageType\":\"VIDEO\",\"messageContent\":\"/path/to/violation-video.mp4\"}]" \
  -F "reportImages=@/path/to/screenshot1.jpg" \
  -F "reportImages=@/path/to/screenshot2.png"
```

#### Form Data:

```
reportedUserId: 789
reportCategory: HARASSMENT
reasonText: User has been harassing me for weeks with inappropriate messages and images
reportedMessages: [
  {
    "messageId": 1003,
    "messageType": "TEXT",
    "messageContent": "You are so beautiful, I want to meet you"
  },
  {
    "messageId": 1004,
    "messageType": "IMAGE",
    "messageContent": "/path/to/inappropriate-image.jpg"
  },
  {
    "messageId": 1005,
    "messageType": "VIDEO",
    "messageContent": "/path/to/violation-video.mp4"
  }
]
reportImages: [screenshot1.jpg, screenshot2.png]
```

### 6. **Báo cáo với tin nhắn audio**

#### cURL Command:

```bash
curl -X POST http://localhost:3000/user-report/create-violation-report \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "reportedUserId=321" \
  -F "reportCategory=HARASSMENT" \
  -F "reportedMessages=[{\"messageId\":1006,\"messageType\":\"AUDIO\",\"messageContent\":\"/path/to/threatening-voice.mp3\"}]"
```

#### Form Data:

```
reportedUserId: 321
reportCategory: HARASSMENT
reportedMessages: [
  {
    "messageId": 1006,
    "messageType": "AUDIO",
    "messageContent": "/path/to/threatening-voice.mp3"
  }
]
```

### 7. **Báo cáo với tin nhắn document**

#### cURL Command:

```bash
curl -X POST http://localhost:3000/user-report/create-violation-report \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "reportedUserId: 654" \
  -F "reportCategory: FRAUD" \
  -F "reportedMessages=[{\"messageId\":1007,\"messageType\":\"DOCUMENT\",\"messageContent\":\"/path/to/fake-document.pdf\"}]"
```

#### Form Data:

```
reportedUserId: 654
reportCategory: FRAUD
reportedMessages: [
  {
    "messageId": 1007,
    "messageType": "DOCUMENT",
    "messageContent": "/path/to/fake-document.pdf"
  }
]
```

## 📝 **LƯU Ý QUAN TRỌNG**

### **Về Message Types:**

- **TEXT**: `messageContent` chứa nội dung text trực tiếp
- **IMAGE/VIDEO/AUDIO/DOCUMENT**: `messageContent` có thể là:
  - **URL** (http/https): Download file từ URL → Upload lên AWS S3 với folder `/report-message`
  - **File path** (bắt đầu bằng `/` hoặc chứa `\`): Upload trực tiếp lên AWS S3 với folder `/report-message`

### **Về File Paths và URLs:**

- **File path**: Đường dẫn file phải bắt đầu bằng `/` hoặc chứa `\`
- **File path**: File phải tồn tại trên server trước khi upload
- **URL**: Hỗ trợ http/https URLs (AWS S3, CDN, etc.) - File sẽ được download và upload lại lên AWS S3
- Ví dụ file path: `/uploads/violation.jpg`, `C:\temp\evidence.png`
- Ví dụ URL: `https://thunder-chat.s3.ap-southeast-1.amazonaws.com/image.jpg`

### **Về Report Categories:**

- `SPAM`: Tin nhắn spam, quảng cáo không mong muốn
- `HARASSMENT`: Quấy rối, đe dọa
- `INAPPROPRIATE_CONTENT`: Nội dung không phù hợp
- `VIOLENCE`: Bạo lực, đe dọa bạo lực
- `OTHER`: Các vi phạm khác

### **Về Validation:**

- Tối đa 5 hình ảnh báo cáo
- Tối đa 10 tin nhắn báo cáo
- Mỗi hình ảnh tối đa 10MB
- Chỉ chấp nhận JPEG, PNG, GIF, WebP cho hình ảnh
- Không thể báo cáo chính mình
- Không thể báo cáo cùng người 2 lần trong 24h

### Transaction Behavior:

- All operations (ViolationReport, ReportImage, ReportedMessage) are wrapped in a database transaction
- If any operation fails, the entire transaction is rolled back
- AWS S3 uploads are also rolled back if database operations fail
- Success is only returned when all operations complete successfully

### File Upload Behavior:

- **Report Images**: Uploaded to AWS S3 with `/report-image` prefix
- **Media Messages**: Uploaded to AWS S3 with `/report-message` prefix
  - **File path**: Upload trực tiếp từ local file
  - **URL**: Download file từ URL → Upload lên AWS S3
- **Text Messages**: Stored directly in database without AWS upload
- All uploaded files are tracked for rollback in case of failure

### Validation Rules:

- Maximum 5 report images
- Maximum 10 reported messages
- File size limit: 10MB per image
- Allowed image types: JPEG, PNG, GIF, WebP
- Reason text: Maximum 1000 characters
- Message content: Maximum 10000 characters
- Cannot report yourself
- Cannot report the same user twice within 24 hours
- Messages must belong to the reported user
- Media message content must be a valid file path
