import webPush from 'web-push'

// VAPID keys của bạn
const VAPID_PUBLIC_KEY =
  'BOIk3REKbDtTPYm8RfdlUyutZgNBPSr10cfTWe6gmdr2zYK8u6aA-Kx3h6WFEmTB6udeAvFWngZc7npCinCkWcE'
const VAPID_PRIVATE_KEY = '4ownc9XECQDFHejRJ6xn-1lsvS-BKDrcN5zWUvFZLF0'

// Thiết lập VAPID
webPush.setVapidDetails(
  'mailto:codevoicainay@gmail.com', // bạn có thể thay bằng email của mình
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
)

// Đây là 1 subscription giả định (thay bằng subscription thực tế bạn lấy từ client)
const subscription = {
  endpoint:
    'https://fcm.googleapis.com/fcm/send/f0Z_MrIgmJA:APA91bG3Nct3Yx7FvSCdnGMdGPrO_SocHGmLGmk5gXMVBNV2tTTBHFcwGAeshIX-idHW4mq8CRiVm_vZ8ur3hpalIiN7WCyvsIxwsgvomOgpDa26ftGe4deD1PFQ_Fl2kbBTflgLVS_d',
  expirationTime: null,
  keys: {
    p256dh:
      'BNEvWY4EJqhclCqHOlk6Kw8gEW05RNxH_YeOfmmFQnSfRjLpS1jeCgQ4El6_Ug4ajJV-tlOMz2IhrOi-q4zOd48',
    auth: 'aoF8PacMzimGmLGd2Su9Jg',
  },
}

// Payload đơn giản
const payload = JSON.stringify({ title: 'Hello', body: 'Test VAPID OK' })

// Gửi thử
webPush
  .sendNotification(subscription, payload, {
    TTL: 60,
    urgency: 'normal',
    topic: 'test',
  })
  .then((res) => {
    console.log('✅ Push thành công:', res.statusCode || res)
  })
  .catch((err) => {
    console.error('❌ Push lỗi:', err)
  })
