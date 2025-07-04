export enum EInitEvents {
   client_connected = 'client_connected',
}

export enum EClientSocketEvents {
   send_message_direct = 'send_message:direct',
   send_friend_request = 'friend_request:send',
   error = 'error',
   recovered_connection = 'recovered_connection',
   message_seen_direct = 'message_seen:direct',
   typing_direct = 'typing:direct',
   friend_request_action = 'friend_request_action',
}
