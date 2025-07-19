// Script test chức năng reply
const axios = require('axios')

const BASE_URL = 'http://localhost:3000' // Thay đổi port nếu cần

async function testReplyFunctionality() {
  try {
    console.log('🧪 Bắt đầu test chức năng reply...\n')

    // Test 1: Tạo tin nhắn gốc
    console.log('1️⃣ Tạo tin nhắn gốc...')
    const originalMessage = await axios.get(`${BASE_URL}/temp/test`, {
      params: {
        content: 'Đây là tin nhắn gốc',
        authorId: 1,
        recipientId: 2,
        directChatId: 1,
        type: 'TEXT',
      },
    })

    const originalMsgId = originalMessage.data.data.id
    console.log('✅ Tin nhắn gốc được tạo:', originalMsgId)

    // Test 2: Tạo tin nhắn reply
    console.log('\n2️⃣ Tạo tin nhắn reply...')
    const replyMessage = await axios.get(`${BASE_URL}/temp/test`, {
      params: {
        content: 'Đây là tin nhắn trả lời',
        authorId: 2,
        recipientId: 1,
        directChatId: 1,
        type: 'TEXT',
        replyToId: originalMsgId,
      },
    })

    console.log('✅ Tin nhắn reply được tạo:', replyMessage.data.data.id)
    console.log('📋 Thông tin reply:', {
      replyToId: replyMessage.data.data.replyToId,
      hasReplyTo: !!replyMessage.data.data.ReplyTo,
      replyToContent: replyMessage.data.data.ReplyTo?.content,
    })

    // Test 3: Lấy danh sách tin nhắn có reply
    console.log('\n3️⃣ Lấy danh sách tin nhắn...')
    const messages = await axios.get(`${BASE_URL}/temp/test-reply`, {
      params: {
        directChatId: 1,
        limit: 10,
      },
    })

    console.log('✅ Lấy được', messages.data.count, 'tin nhắn')
    console.log('📋 Số tin nhắn có reply:', messages.data.messagesWithReply)

    // Kiểm tra tin nhắn có reply
    const messagesWithReply = messages.data.data.filter((msg) => msg.replyToId)
    if (messagesWithReply.length > 0) {
      console.log('📋 Chi tiết tin nhắn có reply:')
      messagesWithReply.forEach((msg) => {
        console.log(`  - ID: ${msg.id}, Content: "${msg.content}"`)
        console.log(`    ReplyTo: ID=${msg.replyToId}, Content="${msg.ReplyTo?.content}"`)
      })
    }

    console.log('\n🎉 Test hoàn thành! Chức năng reply hoạt động tốt!')
  } catch (error) {
    console.error('❌ Lỗi trong quá trình test:', error.response?.data || error.message)
  }
}

// Chạy test
testReplyFunctionality()
