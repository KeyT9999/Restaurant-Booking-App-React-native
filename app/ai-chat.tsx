import React from 'react';
import AIChatView from '@/src/components/ai/AIChatView';

const CUSTOMER_SUGGESTIONS = [
  'Tim nha hang hai san Quan 1',
  'Dat ban 4 nguoi toi nay luc 19h',
  'Nha hang nao dang co khuyen mai?',
  'Mon nuong nao ngon gan day?',
];

export default function AIChatScreen() {
  return (
    <AIChatView
      surface="customer"
      title="Tro ly BookEat AI"
      subtitle="Tim nha hang va ho tro dat ban"
      greeting="Xin chao! Toi la Tro ly AI cua BookEat. Toi co the giup ban tim nha hang, kiem tra ban trong, ap dung uu dai va ho tro dat ban truc tiep. Ban muon an gi hom nay?"
      suggestions={CUSTOMER_SUGGESTIONS}
      placeholder="Nhap tin nhan gui toi AI..."
    />
  );
}
