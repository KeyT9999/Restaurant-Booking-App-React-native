import React from 'react';
import AIChatView from '@/src/components/ai/AIChatView';

const CUSTOMER_SUGGESTIONS = [
  'Tìm nhà hàng hải sản Quận 1',
  'Đặt bàn 4 người tối nay lúc 19h',
  'Nhà hàng nào đang có khuyến mãi?',
  'Món nướng nào ngon gần đây?',
];

export default function AIChatScreen() {
  return (
    <AIChatView
      surface="customer"
      title="Trợ lý BookEat AI"
      subtitle="Tìm nhà hàng và hỗ trợ đặt bàn"
      greeting="Xin chào! Tôi là Trợ lý AI của BookEat. Tôi có thể giúp bạn tìm nhà hàng, kiểm tra bàn trống, áp dụng ưu đãi và hỗ trợ đặt bàn trực tiếp. Bạn muốn ăn gì hôm nay?"
      suggestions={CUSTOMER_SUGGESTIONS}
      placeholder="Nhập tin nhắn gửi tới AI..."
    />
  );
}
