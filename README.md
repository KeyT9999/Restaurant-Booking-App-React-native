# 🍽️ BookEat - Restaurant Booking App (React Native)

Ứng dụng đặt bàn nhà hàng được xây dựng bằng **React Native** với **Expo SDK 54** và **Expo Router**.

## 📋 Yêu cầu hệ thống

- **Node.js** >= 18.x ([Tải tại đây](https://nodejs.org/))
- **npm** >= 9.x (đi kèm Node.js)
- **Expo Go** app trên điện thoại ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) | [iOS](https://apps.apple.com/app/expo-go/id982107779))

## 🚀 Cách cài đặt & chạy project

### 1. Clone repository

```bash
git clone https://github.com/KeyT9999/Restaurant-Booking-App-React-native.git
cd Restaurant-Booking-App-React-native
```

### 2. Cài đặt thư viện

```bash
npm install
```

### 3. Cấu hình biến môi trường

Copy file `.env.example` thành `.env` rồi chỉnh sửa:

```bash
cp .env.example .env
```

Mở file `.env` và cập nhật `EXPO_PUBLIC_API_URL`:

```env
# Nếu chạy trên web hoặc iOS Simulator:
EXPO_PUBLIC_API_URL=http://localhost:3001/api/v1

# Nếu chạy trên thiết bị thật hoặc Android Emulator:
# Đổi thành IP máy tính của bạn (chạy `ipconfig` trên Windows hoặc `ifconfig` trên Mac/Linux)
EXPO_PUBLIC_API_URL=http://192.168.x.x:3001/api/v1
```

### 4. Chạy ứng dụng

```bash
npx expo start
```

Sau khi server khởi động:
- **Quét QR code** bằng app **Expo Go** trên điện thoại (cùng mạng WiFi)
- Nhấn `w` để mở trên **Web**
- Nhấn `a` để mở trên **Android Emulator**
- Nhấn `i` để mở trên **iOS Simulator** (chỉ macOS)

## 📁 Cấu trúc thư mục

```
BookEat_ReactNative/
├── app/                    # Expo Router - các màn hình (file-based routing)
│   ├── (auth)/             # Màn hình đăng nhập / đăng ký
│   ├── (tabs)/             # Tab navigation chính
│   ├── booking/            # Màn hình đặt bàn
│   ├── restaurants/        # Chi tiết nhà hàng
│   ├── chat/               # Chat với nhà hàng
│   ├── review/             # Đánh giá nhà hàng
│   ├── search.tsx          # Tìm kiếm
│   ├── notifications.tsx   # Thông báo
│   └── _layout.tsx         # Root layout
├── src/
│   ├── api/                # API services (gọi Backend)
│   ├── auth/               # Authentication context & logic
│   ├── components/         # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── theme/              # Theme (màu sắc, typography, spacing)
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── assets/                 # Hình ảnh, fonts, icons
├── app.json                # Cấu hình Expo
├── package.json            # Dependencies
└── tsconfig.json           # TypeScript config
```

## 🛠️ Công nghệ sử dụng

| Công nghệ | Phiên bản | Mô tả |
|---|---|---|
| React Native | 0.81.5 | Framework mobile cross-platform |
| Expo SDK | 54 | Toolchain & managed workflow |
| Expo Router | 6.x | File-based routing |
| TypeScript | 5.9 | Type-safe JavaScript |
| Axios | 1.18 | HTTP client |
| React Native Reanimated | 4.1 | Animations |
| Expo Secure Store | 15.x | Lưu trữ token bảo mật |
| Expo Linear Gradient | 15.x | Gradient UI |

## ⚠️ Lưu ý quan trọng

- Cần chạy **Backend (Node.js)** trước khi mở app. Xem repo Backend để biết cách setup.
- Khi chạy trên **thiết bị thật**, phải đổi `EXPO_PUBLIC_API_URL` thành **IP LAN** của máy tính (không dùng `localhost`).
- Đảm bảo điện thoại và máy tính cùng **một mạng WiFi**.

## 📞 Liên hệ

Nếu gặp lỗi khi cài đặt, liên hệ nhóm trưởng hoặc mở issue trên GitHub.
