// 여행 중 새 문장이 필요하면 여기에 추가하세요.
// 형식: { ko: "한국어", vi: "베트남어" }
// 카테고리 순서가 화면 순서입니다.

const phrases = {
  "인사/기본": [
    { ko: "안녕하세요", vi: "Xin chào" },
    { ko: "안녕히 가세요", vi: "Tạm biệt" },
    { ko: "감사합니다", vi: "Cảm ơn" },
    { ko: "정말 감사합니다", vi: "Cảm ơn rất nhiều" },
    { ko: "죄송합니다", vi: "Xin lỗi" },
    { ko: "괜찮습니다", vi: "Không sao" },
    { ko: "네", vi: "Vâng" },
    { ko: "아니요", vi: "Không" },
    { ko: "이해 못했어요", vi: "Tôi không hiểu" },
    { ko: "다시 말해주세요", vi: "Xin nói lại" },
    { ko: "천천히 말해주세요", vi: "Xin nói chậm lại" },
    { ko: "영어 할 줄 아세요?", vi: "Bạn có nói tiếng Anh không?" },
    { ko: "저는 한국 사람이에요", vi: "Tôi là người Hàn Quốc" },
    { ko: "이름이 뭐예요?", vi: "Bạn tên là gì?" }
  ],

  "숫자/돈": [
    { ko: "1 (một)", vi: "Một" },
    { ko: "2 (hai)", vi: "Hai" },
    { ko: "3 (ba)", vi: "Ba" },
    { ko: "4 (bốn)", vi: "Bốn" },
    { ko: "5 (năm)", vi: "Năm" },
    { ko: "6 (sáu)", vi: "Sáu" },
    { ko: "7 (bảy)", vi: "Bảy" },
    { ko: "8 (tám)", vi: "Tám" },
    { ko: "9 (chín)", vi: "Chín" },
    { ko: "10 (mười)", vi: "Mười" },
    { ko: "100 (một trăm)", vi: "Một trăm" },
    { ko: "1,000 (một nghìn)", vi: "Một nghìn" },
    { ko: "10,000 (mười nghìn)", vi: "Mười nghìn" },
    { ko: "100,000 (một trăm nghìn)", vi: "Một trăm nghìn" },
    { ko: "얼마예요?", vi: "Bao nhiêu tiền?" },
    { ko: "너무 비싸요", vi: "Đắt quá" },
    { ko: "깎아주세요", vi: "Giảm giá đi" },
    { ko: "조금만 깎아주세요", vi: "Bớt một chút đi" },
    { ko: "현금으로 낼게요", vi: "Tôi trả tiền mặt" },
    { ko: "카드 되나요?", vi: "Có nhận thẻ không?" }
  ],

  "택시/교통": [
    { ko: "여기로 가주세요", vi: "Làm ơn đi đến đây" },
    { ko: "이 주소로 가주세요", vi: "Đi đến địa chỉ này" },
    { ko: "미터기 켜주세요", vi: "Xin bật đồng hồ" },
    { ko: "얼마나 걸려요?", vi: "Mất bao lâu?" },
    { ko: "여기서 세워주세요", vi: "Dừng ở đây" },
    { ko: "공항까지 얼마예요?", vi: "Đến sân bay bao nhiêu tiền?" },
    { ko: "그랩을 불렀어요", vi: "Tôi đã gọi Grab" },
    { ko: "트렁크 열어주세요", vi: "Mở cốp xe giúp tôi" },
    { ko: "빨리 가주세요", vi: "Đi nhanh lên" },
    { ko: "천천히 가주세요", vi: "Đi chậm lại" }
  ],

  "음식점": [
    { ko: "메뉴 주세요", vi: "Cho tôi xem thực đơn" },
    { ko: "이거 주세요", vi: "Cho tôi cái này" },
    { ko: "(가리키며) 이걸로 할게요", vi: "Tôi lấy cái này" },
    { ko: "추천해 주세요", vi: "Bạn gợi ý món gì?" },
    { ko: "맵지 않게 해주세요", vi: "Xin đừng cay" },
    { ko: "고수 빼주세요", vi: "Không cho rau mùi" },
    { ko: "얼음 빼주세요", vi: "Không đá" },
    { ko: "포장해 주세요", vi: "Cho tôi mang về" },
    { ko: "물 한 병 주세요", vi: "Cho tôi một chai nước" },
    { ko: "맥주 한 병 주세요", vi: "Cho tôi một chai bia" },
    { ko: "계산해주세요", vi: "Tính tiền" },
    { ko: "맛있어요", vi: "Ngon quá" },
    { ko: "배불러요", vi: "Tôi no rồi" },
    { ko: "화장실 어디예요?", vi: "Nhà vệ sinh ở đâu?" }
  ],

  "쇼핑": [
    { ko: "이거 볼 수 있어요?", vi: "Tôi xem cái này được không?" },
    { ko: "입어봐도 돼요?", vi: "Tôi thử được không?" },
    { ko: "다른 색 있어요?", vi: "Có màu khác không?" },
    { ko: "큰 사이즈 있어요?", vi: "Có cỡ lớn hơn không?" },
    { ko: "작은 사이즈 있어요?", vi: "Có cỡ nhỏ hơn không?" },
    { ko: "이걸로 살게요", vi: "Tôi mua cái này" },
    { ko: "봉투 주세요", vi: "Cho tôi cái túi" },
    { ko: "영수증 주세요", vi: "Cho tôi hóa đơn" }
  ],

  "호텔": [
    { ko: "체크인할게요", vi: "Tôi muốn nhận phòng" },
    { ko: "체크아웃할게요", vi: "Tôi muốn trả phòng" },
    { ko: "예약했어요", vi: "Tôi đã đặt phòng" },
    { ko: "와이파이 비밀번호?", vi: "Mật khẩu Wi-Fi là gì?" },
    { ko: "방이 추워요", vi: "Phòng lạnh quá" },
    { ko: "방이 더워요", vi: "Phòng nóng quá" },
    { ko: "수건 더 주세요", vi: "Cho tôi thêm khăn" },
    { ko: "짐을 맡길 수 있어요?", vi: "Tôi gửi hành lý được không?" },
    { ko: "아침 식사 몇 시예요?", vi: "Mấy giờ ăn sáng?" }
  ],

  "길찾기": [
    { ko: "어디예요?", vi: "Ở đâu?" },
    { ko: "여기가 어디예요?", vi: "Đây là đâu?" },
    { ko: "얼마나 멀어요?", vi: "Bao xa?" },
    { ko: "걸어서 갈 수 있어요?", vi: "Có thể đi bộ được không?" },
    { ko: "지도에서 보여주세요", vi: "Chỉ trên bản đồ giúp tôi" },
    { ko: "길을 잃었어요", vi: "Tôi bị lạc đường" }
  ],

  "긴급": [
    { ko: "도와주세요!", vi: "Giúp tôi với!" },
    { ko: "경찰을 불러주세요", vi: "Gọi cảnh sát" },
    { ko: "구급차를 불러주세요", vi: "Gọi xe cấp cứu" },
    { ko: "병원이 어디예요?", vi: "Bệnh viện ở đâu?" },
    { ko: "약국이 어디예요?", vi: "Nhà thuốc ở đâu?" },
    { ko: "아파요", vi: "Tôi bị đau" },
    { ko: "배가 아파요", vi: "Tôi đau bụng" },
    { ko: "머리가 아파요", vi: "Tôi đau đầu" },
    { ko: "알레르기가 있어요", vi: "Tôi bị dị ứng" },
    { ko: "여권을 잃어버렸어요", vi: "Tôi mất hộ chiếu" },
    { ko: "지갑을 도둑맞았어요", vi: "Tôi bị mất cắp ví" },
    { ko: "한국 대사관에 연락해야 해요", vi: "Tôi cần liên hệ Đại sứ quán Hàn Quốc" }
  ]
};
