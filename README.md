# Xây dựng BE v3 cho dự án Quản lý yêu cầu khách hàng

# Đã xây xong lại phần logic authentication , accessToken , refreshToken , cookies

# Đã hoàn thiện xong chức năng quản lý người dùng .

# Chúng ta hoàn toàn có thể gộp chức năng quản lý người dùng + quản lý khách hàng , không nhất thiết triển khai thành 2 màn hình

# Nhúng profile vào user vì 2 collection quan hệ 1 - 1 ,

# Loại bỏ tách customer và pm để tránh phức tạp trong truy vấn về sau với modules khác như dự án và tài liệu

# Tiếp theo là phần tối ưu quản lý dự án

Dự án bao gồm mục thông tin cơ bản liên quan đến dự án
Dự án được chia theo nhiều giai đoạn.
Dự án chi tiết sẽ có thể hiển thị thông tin các mục tài liêu chung do 2 bên gửi
Dự án chi tiết sẽ có thể hiển thị các thông tin liên quan để báo cáu từ 2 bên
Dự án chi tiết cần quản lý được các yêu cầu từ khách hàng phản hồi đến với công ty
===> Cần nghiên cứu thêm về nghiệp vụ trao đổi thông tin cho đúng đắn nhất.
===> Cân nhắc đến việc gộp tài liệu , báo cáo , yêu cầu thành một collection chung và ta sẽ chia theo type(thể loại)

#14/07/2025

Xong api tạo phase + dự án , chưa có thống ke
Làm tiếp api document --> dự kiến xong

sắp tới làm api mail + cron-job , làm appCofig ==> config các thông tin đang hardcord be (các enum)
