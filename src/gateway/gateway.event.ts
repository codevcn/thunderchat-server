export enum EInitEvents {
  client_connected = 'client_connected',
}

export enum EClientSocketEvents {
  send_message_direct = 'send_message:direct',
  send_message_group = 'send_message:group',
  join_group_chat_room = 'join_group_chat_room',
  send_friend_request = 'friend_request:send',
  error = 'error',
  recovered_connection = 'recovered_connection',
  message_seen_direct = 'message_seen:direct',
  typing_direct = 'typing:direct',
  friend_request_action = 'friend_request_action',
  pin_message = 'pin_message',
  pin_message_group = 'pin_message:group',
  pin_direct_chat = 'pin_direct_chat',
  new_conversation = 'new_conversation',
  broadcast_user_online_status = 'broadcast_user_online_status',
  check_user_online_status = 'check_user_online_status',
  join_direct_chat_room = 'join_direct_chat_room',
  remove_group_chat_members = 'remove_group_chat_members',
  add_group_chat_members = 'add_group_chat_members',
  update_group_chat_info = 'update_group_chat_info',
  update_user_info = 'update_user_info',
}
