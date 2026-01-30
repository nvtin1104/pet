# Hướng dẫn chạy dự án PetFocus

## Yêu cầu hệ thống
- Node.js (khuyên dùng bản mới nhất)
- npm (đi kèm Node.js)
- Windows 10/11 (ưu tiên, có thể chạy trên hệ điều hành khác với Electron)

## Cài đặt và chạy

1. **Cài đặt các thư viện cần thiết:**
   Mở terminal tại thư mục dự án và chạy:
   ```sh
   npm install
   ```

2. **Chạy ứng dụng:**
   Sau khi cài đặt xong, chạy lệnh:
   ```sh
   npm start
   ```
   hoặc
   ```sh
   npx electron .
   ```

3. **Mô tả hoạt động:**
   - Ứng dụng sẽ khởi động một cửa sổ overlay trong suốt với pet pixel art.
   - Các tính năng chính: pet di chuyển, quản lý todo, Pomodoro, quản lý subscription.

## Thư mục chính
- `main.js`: Điểm khởi động Electron.
- `renderer.js`, `preload.js`: Xử lý UI và giao tiếp giữa main/renderer.
- `database/`: Quản lý dữ liệu todo, subscription, settings.
- `assets/`: Chứa sprite pet.
- `styles.css`, `index.html`: Giao diện.

## Lưu ý
- Nếu gặp lỗi về Electron, hãy đảm bảo đã cài đúng phiên bản (xem package.json).
- Để đóng ứng dụng, click chuột phải vào icon tray và chọn "Thoát".

---

Nếu cần hướng dẫn chi tiết hơn hoặc gặp lỗi, hãy liên hệ hoặc xem file requirements.md để biết thêm chi tiết về chức năng.