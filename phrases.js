// 여행 중 새 문장이 필요하면 여기에 추가하세요.
// 형식: { ko: "한국어", vi: "베트남어", ja: "일본어", zh: "중국어", en: "영어" }
// 카테고리 순서가 화면 순서입니다.

const phrases = {
  "인사/기본": [
    { ko: "안녕하세요", vi: "Xin chào", ja: "こんにちは", zh: "你好", en: "Hello" },
    { ko: "안녕히 가세요", vi: "Tạm biệt", ja: "さようなら", zh: "再见", en: "Goodbye" },
    { ko: "감사합니다", vi: "Cảm ơn", ja: "ありがとうございます", zh: "谢谢", en: "Thank you" },
    { ko: "정말 감사합니다", vi: "Cảm ơn rất nhiều", ja: "本当にありがとうございます", zh: "非常感谢", en: "Thank you very much" },
    { ko: "죄송합니다", vi: "Xin lỗi", ja: "すみません", zh: "对不起", en: "I'm sorry" },
    { ko: "괜찮습니다", vi: "Không sao", ja: "大丈夫です", zh: "没关系", en: "It's okay" },
    { ko: "네", vi: "Vâng", ja: "はい", zh: "是的", en: "Yes" },
    { ko: "아니요", vi: "Không", ja: "いいえ", zh: "不是", en: "No" },
    { ko: "이해 못했어요", vi: "Tôi không hiểu", ja: "わかりません", zh: "我不明白", en: "I don't understand" },
    { ko: "다시 말해주세요", vi: "Xin nói lại", ja: "もう一度言ってください", zh: "请再说一遍", en: "Could you say that again?" },
    { ko: "천천히 말해주세요", vi: "Xin nói chậm lại", ja: "ゆっくり話してください", zh: "请说慢一点", en: "Could you speak more slowly?" },
    { ko: "영어 할 줄 아세요?", vi: "Bạn có nói tiếng Anh không?", ja: "英語は話せますか？", zh: "你会说英语吗？", en: "Do you speak Korean?" },
    { ko: "저는 한국 사람이에요", vi: "Tôi là người Hàn Quốc", ja: "私は韓国人です", zh: "我是韩国人", en: "I'm from Korea" },
    { ko: "이름이 뭐예요?", vi: "Bạn tên là gì?", ja: "お名前は何ですか？", zh: "你叫什么名字？", en: "What's your name?" }
  ],

  "숫자/돈": [
    { ko: "1 (một / いち / 一 / one)", vi: "Một", ja: "いち", zh: "一", en: "One" },
    { ko: "2 (hai / に / 二 / two)", vi: "Hai", ja: "に", zh: "二", en: "Two" },
    { ko: "3 (ba / さん / 三 / three)", vi: "Ba", ja: "さん", zh: "三", en: "Three" },
    { ko: "4 (bốn / よん / 四 / four)", vi: "Bốn", ja: "よん", zh: "四", en: "Four" },
    { ko: "5 (năm / ご / 五 / five)", vi: "Năm", ja: "ご", zh: "五", en: "Five" },
    { ko: "6 (sáu / ろく / 六 / six)", vi: "Sáu", ja: "ろく", zh: "六", en: "Six" },
    { ko: "7 (bảy / なな / 七 / seven)", vi: "Bảy", ja: "なな", zh: "七", en: "Seven" },
    { ko: "8 (tám / はち / 八 / eight)", vi: "Tám", ja: "はち", zh: "八", en: "Eight" },
    { ko: "9 (chín / きゅう / 九 / nine)", vi: "Chín", ja: "きゅう", zh: "九", en: "Nine" },
    { ko: "10 (mười / じゅう / 十 / ten)", vi: "Mười", ja: "じゅう", zh: "十", en: "Ten" },
    { ko: "100", vi: "Một trăm", ja: "百", zh: "一百", en: "One hundred" },
    { ko: "1,000", vi: "Một nghìn", ja: "千", zh: "一千", en: "One thousand" },
    { ko: "10,000", vi: "Mười nghìn", ja: "一万", zh: "一万", en: "Ten thousand" },
    { ko: "100,000", vi: "Một trăm nghìn", ja: "十万", zh: "十万", en: "One hundred thousand" },
    { ko: "얼마예요?", vi: "Bao nhiêu tiền?", ja: "いくらですか？", zh: "多少钱？", en: "How much is it?" },
    { ko: "너무 비싸요", vi: "Đắt quá", ja: "高すぎます", zh: "太贵了", en: "It's too expensive" },
    { ko: "깎아주세요", vi: "Giảm giá đi", ja: "安くしてください", zh: "便宜点吧", en: "Can you give me a discount?" },
    { ko: "조금만 깎아주세요", vi: "Bớt một chút đi", ja: "少しだけ安くしてください", zh: "能不能再便宜一点", en: "Could you lower the price a bit?" },
    { ko: "현금으로 낼게요", vi: "Tôi trả tiền mặt", ja: "現金で払います", zh: "我付现金", en: "I'll pay in cash" },
    { ko: "카드 되나요?", vi: "Có nhận thẻ không?", ja: "カードは使えますか？", zh: "可以刷卡吗？", en: "Do you take cards?" }
  ],

  "택시/교통": [
    { ko: "여기로 가주세요", vi: "Làm ơn đi đến đây", ja: "ここまでお願いします", zh: "请到这里", en: "Please take me here" },
    { ko: "이 주소로 가주세요", vi: "Đi đến địa chỉ này", ja: "この住所までお願いします", zh: "请到这个地址", en: "Please take me to this address" },
    { ko: "미터기 켜주세요", vi: "Xin bật đồng hồ", ja: "メーターをつけてください", zh: "请打表", en: "Please turn on the meter" },
    { ko: "얼마나 걸려요?", vi: "Mất bao lâu?", ja: "どのくらいかかりますか？", zh: "要多长时间？", en: "How long will it take?" },
    { ko: "여기서 세워주세요", vi: "Dừng ở đây", ja: "ここで止めてください", zh: "请在这里停车", en: "Please stop here" },
    { ko: "공항까지 얼마예요?", vi: "Đến sân bay bao nhiêu tiền?", ja: "空港までいくらですか？", zh: "到机场多少钱？", en: "How much to the airport?" },
    { ko: "(그랩/택시) 불렀어요", vi: "Tôi đã gọi Grab", ja: "タクシーを呼びました", zh: "我叫了出租车", en: "I called a taxi" },
    { ko: "트렁크 열어주세요", vi: "Mở cốp xe giúp tôi", ja: "トランクを開けてください", zh: "请打开后备箱", en: "Please open the trunk" },
    { ko: "빨리 가주세요", vi: "Đi nhanh lên", ja: "急いでください", zh: "请开快一点", en: "Could you drive faster?" },
    { ko: "천천히 가주세요", vi: "Đi chậm lại", ja: "ゆっくり行ってください", zh: "请开慢一点", en: "Could you drive more slowly?" }
  ],

  "음식점": [
    { ko: "메뉴 주세요", vi: "Cho tôi xem thực đơn", ja: "メニューをください", zh: "请给我菜单", en: "Could I have the menu, please?" },
    { ko: "이거 주세요", vi: "Cho tôi cái này", ja: "これをください", zh: "我要这个", en: "I'll have this" },
    { ko: "(가리키며) 이걸로 할게요", vi: "Tôi lấy cái này", ja: "これにします", zh: "我就要这个", en: "I'll take this one" },
    { ko: "추천해 주세요", vi: "Bạn gợi ý món gì?", ja: "おすすめは何ですか？", zh: "有什么推荐的？", en: "What do you recommend?" },
    { ko: "맵지 않게 해주세요", vi: "Xin đừng cay", ja: "辛くしないでください", zh: "请不要辣", en: "Not spicy, please" },
    { ko: "고수/파쿠치 빼주세요", vi: "Không cho rau mùi", ja: "パクチー抜きでお願いします", zh: "不要放香菜", en: "No cilantro, please" },
    { ko: "얼음 빼주세요", vi: "Không đá", ja: "氷なしでお願いします", zh: "不要加冰", en: "No ice, please" },
    { ko: "포장해 주세요", vi: "Cho tôi mang về", ja: "持ち帰りでお願いします", zh: "请打包", en: "To go, please" },
    { ko: "물 한 병 주세요", vi: "Cho tôi một chai nước", ja: "水を一本ください", zh: "请给我一瓶水", en: "A bottle of water, please" },
    { ko: "맥주 한 병 주세요", vi: "Cho tôi một chai bia", ja: "ビールを一本ください", zh: "请给我一瓶啤酒", en: "A bottle of beer, please" },
    { ko: "계산해주세요", vi: "Tính tiền", ja: "お会計お願いします", zh: "买单", en: "Check, please" },
    { ko: "맛있어요", vi: "Ngon quá", ja: "おいしいです", zh: "很好吃", en: "It's delicious" },
    { ko: "배불러요", vi: "Tôi no rồi", ja: "お腹いっぱいです", zh: "我吃饱了", en: "I'm full" },
    { ko: "화장실 어디예요?", vi: "Nhà vệ sinh ở đâu?", ja: "トイレはどこですか？", zh: "洗手间在哪里？", en: "Where is the restroom?" }
  ],

  "쇼핑": [
    { ko: "이거 볼 수 있어요?", vi: "Tôi xem cái này được không?", ja: "これを見せてもらえますか？", zh: "可以看看这个吗？", en: "Can I see this?" },
    { ko: "입어봐도 돼요?", vi: "Tôi thử được không?", ja: "試着してもいいですか？", zh: "可以试穿吗？", en: "Can I try this on?" },
    { ko: "다른 색 있어요?", vi: "Có màu khác không?", ja: "他の色はありますか？", zh: "有别的颜色吗？", en: "Do you have other colors?" },
    { ko: "큰 사이즈 있어요?", vi: "Có cỡ lớn hơn không?", ja: "大きいサイズはありますか？", zh: "有大号的吗？", en: "Do you have a larger size?" },
    { ko: "작은 사이즈 있어요?", vi: "Có cỡ nhỏ hơn không?", ja: "小さいサイズはありますか？", zh: "有小号的吗？", en: "Do you have a smaller size?" },
    { ko: "이걸로 살게요", vi: "Tôi mua cái này", ja: "これを買います", zh: "我买这个", en: "I'll take this" },
    { ko: "봉투 주세요", vi: "Cho tôi cái túi", ja: "袋をください", zh: "请给我一个袋子", en: "Could I have a bag?" },
    { ko: "영수증 주세요", vi: "Cho tôi hóa đơn", ja: "領収書をください", zh: "请给我发票", en: "A receipt, please" }
  ],

  "호텔": [
    { ko: "체크인할게요", vi: "Tôi muốn nhận phòng", ja: "チェックインお願いします", zh: "我要办理入住", en: "I'd like to check in" },
    { ko: "체크아웃할게요", vi: "Tôi muốn trả phòng", ja: "チェックアウトお願いします", zh: "我要退房", en: "I'd like to check out" },
    { ko: "예약했어요", vi: "Tôi đã đặt phòng", ja: "予約しています", zh: "我已经预订了", en: "I have a reservation" },
    { ko: "와이파이 비밀번호?", vi: "Mật khẩu Wi-Fi là gì?", ja: "Wi-Fiのパスワードは何ですか？", zh: "Wi-Fi 密码是什么？", en: "What's the Wi-Fi password?" },
    { ko: "방이 추워요", vi: "Phòng lạnh quá", ja: "部屋が寒いです", zh: "房间太冷了", en: "The room is too cold" },
    { ko: "방이 더워요", vi: "Phòng nóng quá", ja: "部屋が暑いです", zh: "房间太热了", en: "The room is too hot" },
    { ko: "수건 더 주세요", vi: "Cho tôi thêm khăn", ja: "タオルをもう一枚ください", zh: "请再给我一条毛巾", en: "Could I have more towels?" },
    { ko: "짐을 맡길 수 있어요?", vi: "Tôi gửi hành lý được không?", ja: "荷物を預かってもらえますか？", zh: "可以寄存行李吗？", en: "Can I leave my luggage here?" },
    { ko: "아침 식사 몇 시예요?", vi: "Mấy giờ ăn sáng?", ja: "朝食は何時ですか？", zh: "早餐几点开始？", en: "What time is breakfast?" }
  ],

  "길찾기": [
    { ko: "어디예요?", vi: "Ở đâu?", ja: "どこですか？", zh: "在哪里？", en: "Where is it?" },
    { ko: "여기가 어디예요?", vi: "Đây là đâu?", ja: "ここはどこですか？", zh: "这里是哪里？", en: "Where am I?" },
    { ko: "얼마나 멀어요?", vi: "Bao xa?", ja: "どのくらい遠いですか？", zh: "有多远？", en: "How far is it?" },
    { ko: "걸어서 갈 수 있어요?", vi: "Có thể đi bộ được không?", ja: "歩いて行けますか？", zh: "可以走过去吗？", en: "Can I walk there?" },
    { ko: "지도에서 보여주세요", vi: "Chỉ trên bản đồ giúp tôi", ja: "地図で教えてください", zh: "请在地图上指给我看", en: "Could you show me on the map?" },
    { ko: "길을 잃었어요", vi: "Tôi bị lạc đường", ja: "道に迷いました", zh: "我迷路了", en: "I'm lost" }
  ],

  "긴급": [
    { ko: "도와주세요!", vi: "Giúp tôi với!", ja: "助けてください！", zh: "请帮帮我！", en: "Help!" },
    { ko: "경찰을 불러주세요", vi: "Gọi cảnh sát", ja: "警察を呼んでください", zh: "请叫警察", en: "Please call the police" },
    { ko: "구급차를 불러주세요", vi: "Gọi xe cấp cứu", ja: "救急車を呼んでください", zh: "请叫救护车", en: "Please call an ambulance" },
    { ko: "병원이 어디예요?", vi: "Bệnh viện ở đâu?", ja: "病院はどこですか？", zh: "医院在哪里？", en: "Where is the hospital?" },
    { ko: "약국이 어디예요?", vi: "Nhà thuốc ở đâu?", ja: "薬局はどこですか？", zh: "药店在哪里？", en: "Where is the pharmacy?" },
    { ko: "아파요", vi: "Tôi bị đau", ja: "痛いです", zh: "我很疼", en: "I'm in pain" },
    { ko: "배가 아파요", vi: "Tôi đau bụng", ja: "お腹が痛いです", zh: "我肚子疼", en: "My stomach hurts" },
    { ko: "머리가 아파요", vi: "Tôi đau đầu", ja: "頭が痛いです", zh: "我头疼", en: "I have a headache" },
    { ko: "알레르기가 있어요", vi: "Tôi bị dị ứng", ja: "アレルギーがあります", zh: "我有过敏", en: "I have allergies" },
    { ko: "여권을 잃어버렸어요", vi: "Tôi mất hộ chiếu", ja: "パスポートをなくしました", zh: "我的护照丢了", en: "I lost my passport" },
    { ko: "지갑을 도둑맞았어요", vi: "Tôi bị mất cắp ví", ja: "財布を盗まれました", zh: "我的钱包被偷了", en: "My wallet was stolen" },
    { ko: "한국 대사관에 연락해야 해요", vi: "Tôi cần liên hệ Đại sứ quán Hàn Quốc", ja: "韓国大使館に連絡したいです", zh: "我要联系韩国大使馆", en: "I need to contact the Korean embassy" }
  ]
};
