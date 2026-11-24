/* DevLab — dữ liệu khóa DevOps, phần 3: vận hành và độ tin cậy */
window.DEVLAB = window.DEVLAB || { modules: [], lessons: {}, practice: [], cheatsheets: [] };

(function () {
  "use strict";
  window.DEVLAB.modules.push({
    id: "van-hanh-tin-cay",
    num: "03",
    title: "Vận hành & tin cậy",
    tone: "yellow",
    blurb: "Ba bài nối nhau: dựng ba trụ quan sát để thấy sự cố trước người dùng, đặt SLO và ngân sách lỗi để biết khi nào được đánh đổi, rồi xử lý sự cố bằng rollback kỷ luật và postmortem không đổ lỗi.",
    lessons: ["observability", "slo-budget", "incident-rollback"]
  });

  Object.assign(window.DEVLAB.lessons, {
    observability: {
      id: "observability",
      module: "van-hanh-tin-cay",
      title: "Ba trụ quan sát",
      shortTitle: "Observability",
      subtitle: "Log kể chuyện từng sự kiện, metric đếm và đo theo phút, trace nối một request qua nhiều dịch vụ. Thiếu trụ nào, bạn cũng chỉ đoán mò khi hệ thống chậm hoặc trả lỗi.",
      blurb: "Log, metric, trace: ba góc nhìn, một hệ thống.",
      duration: "14 phút",
      level: "Trung cấp",
      tags: ["log", "metric", "trace", "RED", "USE"],
      metrics: [
        { key: "log", label: "Log", tone: "blue" },
        { key: "metric", label: "Metric", tone: "green" },
        { key: "trace", label: "Trace", tone: "violet" },
        { key: "chi-phi", label: "Chi phí", tone: "yellow" }
      ],
      nodes: [
        { id: "user", type: "user", x: 55, y: 80, w: 200, h: 70, label: "Người dùng", sub: "thao tác trên ứng dụng" },
        { id: "log", type: "file", x: 340, y: 80, w: 200, h: 70, label: "Log có cấu trúc", sub: "sự kiện kèm ngữ cảnh" },
        { id: "dash", type: "grid", x: 625, y: 80, w: 200, h: 70, label: "Bảng điều khiển", sub: "RED và USE" },
        { id: "metric", type: "signal", x: 55, y: 310, w: 200, h: 70, label: "Metric", sub: "đếm, đo theo phút" },
        { id: "alert", type: "alert", x: 340, y: 310, w: 200, h: 70, label: "Cảnh báo", sub: "bám triệu chứng người dùng" },
        { id: "trace", type: "route", x: 625, y: 310, w: 200, h: 70, label: "Trace phân tán", sub: "một request, nhiều chặng" },
        { id: "api", type: "api", x: 340, y: 195, w: 200, h: 70, label: "API cổng vào", sub: "sinh mã truy vết" }
      ],
      edges: [
        { id: "user-api", from: "user", to: "api", kind: "request", label: "gửi thao tác", bow: -22 },
        { id: "api-user", from: "api", to: "user", kind: "response", label: "trả kết quả", bow: 22 },
        { id: "api-log", from: "api", to: "log", kind: "data", label: "sự kiện kèm ngữ cảnh" },
        { id: "api-metric", from: "api", to: "metric", kind: "data", label: "đếm theo phút" },
        { id: "api-trace", from: "api", to: "trace", kind: "data", label: "gắn mã truy vết" },
        { id: "metric-alert", from: "metric", to: "alert", kind: "control", label: "vượt ngưỡng" },
        { id: "trace-dash", from: "trace", to: "dash", kind: "data", label: "độ trễ từng chặng" }
      ],
      learn: [
        "Phân biệt log, metric và trace theo câu hỏi mà mỗi trụ trả lời.",
        "Viết log có cấu trúc kèm trace_id để nối ba màn hình với nhau.",
        "Chọn bộ chỉ số RED cho dịch vụ và USE cho tài nguyên.",
        "Đặt mức lấy mẫu trace theo đuôi để không bỏ lỡ sự cố hiếm."
      ],
      steps: [
        {
          short: "Ba trụ",
          type: "TỔNG QUAN",
          title: "Một sự cố, ba câu hỏi",
          body: "Một người dùng báo thanh toán chậm. Log cho biết lúc 14h02 dịch vụ trả lỗi gì, metric cho thấy độ trễ p95 tăng từ 180 lên 2.400 ms, trace chỉ ra 62% thời gian nằm ở một truy vấn cơ sở dữ liệu. Ba trụ không thay thế nhau: log giàu ngữ cảnh nhưng nặng và khó đếm, metric rẻ và hợp để cảnh báo nhưng mất chi tiết, trace nối các chặng nhưng thường chỉ lấy mẫu 5 đến 10%. Đội quan sát tốt bắt đầu từ triệu chứng người dùng, rồi lần theo <code>trace_id</code> để mở đúng dòng log và biểu đồ liên quan. Không có <code>trace_id</code> chung, ba màn hình rời nhau và thời gian tìm nguyên nhân thường vượt 30 phút.",
          focus: ["user", "api", "metric", "trace"],
          edges: ["user-api", "api-user", "api-metric", "api-trace"],
          metrics: { "log": "ba trụ", "metric": "p95 2.400 ms", "trace": "62% ở DB", "chi-phi": "30 phút đoán mò" },
          changes: ["Chốt ba trụ cần dựng", "Gắn trace_id từ cổng vào"],
          note: "Bắt đầu từ triệu chứng người dùng, không bắt đầu từ CPU. Chỉ số nội bộ chỉ có nghĩa khi nối được với một trải nghiệm cụ thể."
        },
        {
          short: "Log",
          type: "KỸ THUẬT",
          title: "Log có cấu trúc, có tương quan",
          body: "Log nên là JSON một dòng với các trường cố định: <code>ts</code>, <code>level</code>, <code>service</code>, <code>trace_id</code>, <code>message</code>. Một hệ 40 dịch vụ, mỗi dịch vụ 500 dòng mỗi giây, sinh 20.000 dòng mỗi giây; ở mức 300 byte mỗi dòng là 6 MB mỗi giây, tức 518 GB mỗi ngày nếu giữ tất cả. Vì vậy phải chọn mức: giữ 7 ngày toàn bộ, 30 ngày cho mức warn trở lên, và đẩy lỗi sang kho lạnh. Đừng log dữ liệu nhạy cảm như mật khẩu, số thẻ hay token; một dòng log lọt ra ngoài còn tốn kém hơn một sự cố. Log không có <code>trace_id</code> gần như vô dụng khi điều tra.",
          focus: ["api", "log"],
          edges: ["api-log"],
          metrics: { "log": "518 GB/ngày", "metric": "—", "trace": "—", "chi-phi": "6 MB/giây" },
          changes: ["Chuẩn hóa trường log", "Đặt thời gian lưu theo mức"],
          note: "Một dòng log tốt trả lời được: chuyện gì, ở dịch vụ nào, cho request nào, lúc nào. Thiếu một trong bốn thứ đó là còn phải hỏi lại."
        },
        {
          short: "Metric",
          type: "KỸ THUẬT",
          title: "Metric, RED và USE",
          body: "Metric là chuỗi số theo thời gian, rẻ hơn log hàng trăm lần: một series 15 giây chỉ tốn vài chục byte mỗi điểm. Với dịch vụ hướng người dùng, dùng bộ <code>RED</code>: Rate, Errors, Duration. Với tài nguyên như máy chủ, dùng <code>USE</code>: Utilization, Saturation, Errors. Đừng đặt cảnh báo lên CPU 90% chỉ vì con số đó; hãy cảnh báo khi tỷ lệ lỗi vượt 1% trong 5 phút hoặc p95 vượt 800 ms. Một bảng 12 ô, mỗi ô một chỉ số kèm ngưỡng và chủ sở hữu, hữu ích hơn 80 biểu đồ không ai đọc. Nhãn càng nhiều thì số series càng nổ: thêm một nhãn 1.000 giá trị có thể nhân số liệu lên 1.000 lần.",
          focus: ["api", "metric", "alert"],
          edges: ["api-metric", "metric-alert"],
          metrics: { "log": "—", "metric": "12 ô", "trace": "—", "chi-phi": "vài chục byte/điểm" },
          changes: ["Chọn RED cho dịch vụ", "Gắn ngưỡng theo triệu chứng"],
          note: "Cảnh báo theo nguyên nhân sinh ra mệt mỏi vì báo giả. Cảnh báo theo triệu chứng người dùng cảm nhận được thì mới đáng gọi người."
        },
        {
          short: "Trace",
          type: "LỖI",
          tone: "warn",
          title: "Trace và cái bẫy lấy mẫu",
          body: "Trace gắn một <code>trace_id</code> cho toàn bộ hành trình và chia thành các span có thời lượng. Nếu chỉ lấy mẫu 1%, một sự cố ảnh hưởng 3% request có thể không xuất hiện trong mẫu nào; vì vậy cần lấy mẫu theo đuôi, giữ 100% span chậm hơn 1 giây và 100% span lỗi. Mỗi span thêm vài trăm byte và một lần ghi, nên lấy mẫu toàn bộ ở 20.000 request mỗi giây là không tưởng. Hãy đặt ngân sách: 5% lưu lượng thường, 100% lỗi, giữ 7 ngày. Nhớ truyền <code>trace_id</code> qua header giữa các dịch vụ; thiếu một chặng là trace đứt và câu chuyện không còn liền mạch.",
          focus: ["api", "trace", "dash", "log"],
          edges: ["api-trace", "trace-dash", "api-log"],
          metrics: { "log": "—", "metric": "—", "trace": "5% + 100% lỗi", "chi-phi": "vài trăm byte/span" },
          changes: ["Bật lấy mẫu theo đuôi", "Truyền trace_id qua header"],
          note: "Lấy mẫu đều tay là cách nhanh nhất để trace luôn đẹp trong báo cáo và luôn vắng mặt đúng lúc cần điều tra."
        },
        {
          short: "Tóm tắt",
          type: "TÓM TẮT",
          tone: "final",
          title: "Ba trụ, một câu chuyện",
          body: "Ba trụ quan sát trả lời ba câu hỏi khác nhau: chuyện gì đã xảy ra, hệ thống đang tệ đi bao nhiêu, và thời gian đi đâu. Log cho chi tiết, metric cho xu hướng và cảnh báo, trace cho đường đi. Một hệ đủ tốt thường có 12 chỉ số RED và USE trên bảng chính, log có cấu trúc kèm <code>trace_id</code>, trace lấy mẫu theo đuôi và giữ 7 ngày. Kiểm tra bằng một sự cố giả: từ một cảnh báo p95, bạn phải mở được trace chậm, thấy span chậm nhất và nhảy sang đúng dòng log trong dưới 5 phút. Nếu quá 5 phút, hãy sửa hệ quan sát trước khi sửa ứng dụng.",
          focus: "all",
          edges: "all",
          metrics: { "log": "7 ngày", "metric": "12 chỉ số", "trace": "lấy mẫu đuôi", "chi-phi": "dưới 5 phút" },
          changes: ["Chốt bộ chỉ số chính", "Đo thời gian điều tra thật"],
          note: "Bài tiếp theo biến các phép đo này thành cam kết: SLI, SLO và ngân sách lỗi."
        }
      ]
    },

    "slo-budget": {
      id: "slo-budget",
      module: "van-hanh-tin-cay",
      title: "SLO và ngân sách lỗi",
      shortTitle: "SLO & budget",
      subtitle: "SLI là phép đo, SLO là mục tiêu, SLA là cam kết có ràng buộc với khách. Ngân sách lỗi biến mục tiêu 99,9% thành 43,2 phút mỗi 30 ngày để đội biết khi nào được phép liều và khi nào phải dừng.",
      blurb: "99,9% không phải khẩu hiệu, mà là 43,2 phút.",
      duration: "14 phút",
      level: "Trung cấp",
      tags: ["SLI", "SLO", "SLA", "error budget", "burn rate"],
      metrics: [
        { key: "sli", label: "SLI", tone: "blue" },
        { key: "slo", label: "SLO", tone: "green" },
        { key: "sla", label: "SLA", tone: "coral" },
        { key: "budget", label: "Ngân sách lỗi", tone: "yellow" }
      ],
      nodes: [
        { id: "sli", type: "signal", x: 55, y: 80, w: 200, h: 70, label: "SLI", sub: "tỷ lệ thành công" },
        { id: "slo", type: "check", x: 340, y: 80, w: 200, h: 70, label: "SLO 99,9%", sub: "mục tiêu 30 ngày" },
        { id: "sla", type: "file", x: 625, y: 80, w: 200, h: 70, label: "SLA hợp đồng", sub: "99,5%, có đền bù" },
        { id: "budget", type: "layers", x: 55, y: 310, w: 200, h: 70, label: "Ngân sách lỗi", sub: "43,2 phút mỗi 30 ngày" },
        { id: "burn", type: "alert", x: 340, y: 310, w: 200, h: 70, label: "Tốc độ đốt", sub: "14,4x và 6x" },
        { id: "policy", type: "shield", x: 625, y: 310, w: 200, h: 70, label: "Chính sách", sub: "đóng băng khi cạn" },
        { id: "window", type: "clock", x: 340, y: 195, w: 200, h: 70, label: "Cửa sổ trượt", sub: "30 ngày, cuốn theo giờ" }
      ],
      edges: [
        { id: "sli-slo", from: "sli", to: "slo", kind: "data", label: "đo từ sự kiện" },
        { id: "slo-window", from: "slo", to: "window", kind: "control", label: "tính trên 30 ngày" },
        { id: "window-budget", from: "window", to: "budget", kind: "data", label: "phân bổ lỗi" },
        { id: "slo-sla", from: "slo", to: "sla", kind: "control", label: "SLA thấp hơn SLO" },
        { id: "budget-burn", from: "budget", to: "burn", kind: "control", label: "tốc độ đốt" },
        { id: "burn-policy", from: "burn", to: "policy", kind: "response", label: "vượt ngưỡng" },
        { id: "policy-window", from: "policy", to: "window", kind: "control", label: "đóng băng phát hành" }
      ],
      learn: [
        "Phân biệt SLI, SLO, SLA và thứ tự đặt ba con số đó.",
        "Viết SLI có tử số, mẫu số và nguồn đo rõ ràng.",
        "Tính ngân sách lỗi theo 30 ngày và đổi ra số phút.",
        "Cảnh báo theo tốc độ đốt với nhiều cửa sổ thời gian."
      ],
      steps: [
        {
          short: "Ba tầng",
          type: "TỔNG QUAN",
          title: "Ba tầng cam kết",
          body: "Ba tầng cam kết đừng lẫn nhau. <strong>SLI</strong> là phép đo cụ thể: tỷ lệ request trả trong 300 ms, tỷ lệ job thành công, độ tươi của dữ liệu. <strong>SLO</strong> là mục tiêu nội bộ cho SLI đó, ví dụ <code>99,9%</code> request thành công trong 30 ngày. <strong>SLA</strong> là hợp đồng với khách, thường thấp hơn SLO, kèm đền bù khi vi phạm. Đặt SLO 99,9% nhưng SLA 99,5% là chừa một vùng đệm 0,4 điểm để đội kịp xử lý trước khi phải bồi thường. Nếu SLO và SLA trùng nhau, mọi sự cố nhỏ đều thành vấn đề pháp lý. Hãy viết ba dòng cho mỗi dịch vụ: đo gì, mục tiêu bao nhiêu, và ai chịu trách nhiệm khi lệch.",
          focus: ["sli", "slo", "sla", "window"],
          edges: ["sli-slo", "slo-window", "slo-sla"],
          metrics: { "sli": "ba phép đo", "slo": "99,9%", "sla": "99,5%", "budget": "0,4 điểm đệm" },
          changes: ["Tách SLI khỏi SLO", "Chừa đệm giữa SLO và SLA"],
          note: "SLA là chuyện hợp đồng, SLO là chuyện vận hành. Đừng để khách hàng quyết định mục tiêu nội bộ của đội kỹ thuật."
        },
        {
          short: "SLI",
          type: "KỸ THUẬT",
          title: "Đo đúng chỗ người dùng thấy",
          body: "SLI phải đo từ nơi người dùng thấy, không phải từ log nội bộ. Với API, tỷ lệ thành công bằng số request trả dưới 500 ms chia tổng request, bỏ qua lưu lượng do kiểm thử tổng hợp. Với pipeline, là tỷ lệ job hoàn tất trong 10 phút. Đừng đo trung bình: p50 che mất đuôi, hãy dùng <code>p95</code> và p99. Một dịch vụ nhận 2 triệu request mỗi ngày, SLO 99,9% cho phép 2.000 request lỗi mỗi ngày, tức khoảng 83 request mỗi giờ. Con số đó đủ để đội biết ngưỡng nào là bình thường. SLI tốt phải có tử số và mẫu số rõ ràng, đo được trong 1 phút và không phụ thuộc vào cách triển khai.",
          focus: ["sli", "slo"],
          edges: ["sli-slo"],
          metrics: { "sli": "2.000 lỗi/ngày", "slo": "99,9%/30 ngày", "sla": "—", "budget": "83 lỗi/giờ" },
          changes: ["Chốt tử số và mẫu số", "Loại lưu lượng kiểm thử"],
          note: "SLI đo bằng log nội bộ thường đẹp hơn thực tế. Hãy đo ở biên, nơi request thật đi qua và người dùng thật chờ."
        },
        {
          short: "Ngân sách",
          type: "KỸ THUẬT",
          title: "Đổi phần trăm ra số phút",
          body: "30 ngày có 43.200 phút. SLO 99,9% cho ngân sách lỗi 0,1%, tức 43,2 phút mỗi cửa sổ. SLO 99,95% còn 21,6 phút; SLO 99,5% rộng tới 216 phút, hơn 3 giờ rưỡi. Ngân sách không phải để tiêu hết mà là để ra quyết định: còn nhiều thì ưu tiên phát hành tính năng, cạn dần thì giảm rủi ro, cạn hẳn thì đóng băng thay đổi. Công thức: <code>ngân sách = (1 - SLO) × tổng thời gian</code>. Hãy ghi nó lên bảng điều khiển cạnh tỷ lệ lỗi, vì đội chỉ hành động khi thấy số phút còn lại, không phải khi thấy 99,87%.",
          focus: ["slo", "window", "budget"],
          edges: ["slo-window", "window-budget"],
          metrics: { "sli": "—", "slo": "99,9%", "sla": "—", "budget": "43,2 phút" },
          changes: ["Đổi mục tiêu ra số phút", "Gắn ngân sách vào quyết định"],
          note: "99,87% nghe như đạt, nhưng nếu đó là tháng có 30 ngày thì đội đã tiêu hơn một nửa ngân sách. Số phút dễ hành động hơn phần trăm."
        },
        {
          short: "Cửa sổ",
          type: "LỖI",
          tone: "warn",
          title: "Cửa sổ trượt và tốc độ đốt",
          body: "Cửa sổ 30 ngày trượt khác cửa sổ lịch ở chỗ nó luôn nhìn lại 30 ngày gần nhất. Cửa sổ lịch reset đầu tháng, nên một sự cố ngày 1 bị lãng quên và cuối tháng đội lại tiêu tiếp. Tốc độ đốt là số lần ngân sách bị dùng nhanh hơn mức bền vững: đốt <code>14,4</code> lần thì cạn 30 ngày trong 2 ngày, đốt 6 lần thì cạn trong 5 ngày. Cảnh báo nên dùng nhiều cửa sổ: 14,4 lần trong 1 giờ báo trang, 6 lần trong 6 giờ báo nhóm. Một ngưỡng duy nhất trên 28 ngày quá chậm để cứu, còn ngưỡng 5 phút quá nhiễu. Ghép hai cửa sổ để vừa nhanh vừa ít báo giả.",
          focus: ["budget", "burn", "policy", "window"],
          edges: ["budget-burn", "burn-policy", "policy-window"],
          metrics: { "sli": "—", "slo": "—", "sla": "—", "budget": "14,4x / 6x" },
          changes: ["Chuyển sang cửa sổ trượt", "Bật cảnh báo hai cửa sổ"],
          note: "Cửa sổ lịch tạo cảm giác an toàn giả vào đầu tháng. Cửa sổ trượt luôn nhắc rằng độ tin cậy là thứ phải giữ liên tục."
        },
        {
          short: "Tóm tắt",
          type: "TÓM TẮT",
          tone: "final",
          title: "Ngân sách để ra quyết định",
          body: "SLO là công cụ ra quyết định, không phải bảng điểm. Ba tầng phải rõ: SLI đo được, SLO đặt mục tiêu, SLA chốt với khách. Ngân sách lỗi biến mục tiêu thành số phút: <code>99,9%</code> là 43,2 phút mỗi 30 ngày, 99,95% là 21,6 phút. Cửa sổ trượt 30 ngày phản ánh đúng trải nghiệm gần đây, còn tốc độ đốt nhiều cửa sổ giúp cảnh báo sớm mà không nhiễu. Khi ngân sách cạn, việc đúng là đóng băng tính năng và dồn người vào độ tin cậy. Khi còn nhiều, hãy phát hành nhanh hơn thay vì giữ mọi thứ quá an toàn. Đó là toàn bộ mục đích của ngân sách.",
          focus: "all",
          edges: "all",
          metrics: { "sli": "đo được", "slo": "43,2 phút", "sla": "hợp đồng", "budget": "quyết định" },
          changes: ["Chốt chính sách theo ngân sách", "Ghi lại quyết định đánh đổi"],
          note: "Bài tiếp theo đưa các cam kết này vào lúc xấu nhất: sự cố đang diễn ra và phải chọn rollback hay roll-forward."
        }
      ]
    },

    "incident-rollback": {
      id: "incident-rollback",
      module: "van-hanh-tin-cay",
      title: "Sự cố: rollback hay roll-forward",
      shortTitle: "Xử lý sự cố",
      subtitle: "Phát hiện sớm, phân loại đúng, rồi chọn lùi phiên bản hay vá nóng dựa trên bằng chứng. Sau khi dịch vụ hồi phục, postmortem không đổ lỗi biến sự cố thành thay đổi hệ thống.",
      blurb: "Bình tĩnh, phân loại, lùi đúng lúc.",
      duration: "14 phút",
      level: "Nâng cao",
      tags: ["incident", "rollback", "MTTD", "severity", "postmortem"],
      metrics: [
        { key: "phat-hien", label: "Phát hiện", tone: "blue" },
        { key: "phan-loai", label: "Phân loại", tone: "coral" },
        { key: "rollback", label: "Rollback", tone: "yellow" },
        { key: "hoc", label: "Học lại", tone: "green" }
      ],
      nodes: [
        { id: "detect", type: "alert", x: 55, y: 80, w: 200, h: 70, label: "Phát hiện", sub: "cảnh báo triệu chứng" },
        { id: "classify", type: "gateway", x: 340, y: 80, w: 200, h: 70, label: "Phân loại", sub: "SEV1 đến SEV3" },
        { id: "page", type: "bolt", x: 625, y: 80, w: 200, h: 70, label: "Gọi trực", sub: "một người chỉ huy" },
        { id: "rollback", type: "route", x: 55, y: 310, w: 200, h: 70, label: "Rollback", sub: "lùi phiên bản trước" },
        { id: "review", type: "audit", x: 340, y: 310, w: 200, h: 70, label: "Postmortem", sub: "không đổ lỗi" },
        { id: "forward", type: "server", x: 625, y: 310, w: 200, h: 70, label: "Roll-forward", sub: "vá nóng có kiểm soát" },
        { id: "command", type: "org", x: 340, y: 195, w: 200, h: 70, label: "Chỉ huy sự cố", sub: "quyết định trong 15 phút" }
      ],
      edges: [
        { id: "detect-classify", from: "detect", to: "classify", kind: "data", label: "tín hiệu triệu chứng" },
        { id: "classify-command", from: "classify", to: "command", kind: "control", label: "chọn mức ưu tiên" },
        { id: "command-page", from: "command", to: "page", kind: "control", label: "gọi đúng người" },
        { id: "command-rollback", from: "command", to: "rollback", kind: "control", label: "lùi khi nghi ngờ" },
        { id: "command-forward", from: "command", to: "forward", kind: "control", label: "vá khi đã rõ" },
        { id: "rollback-review", from: "rollback", to: "review", kind: "data", label: "mốc thời gian" },
        { id: "forward-review", from: "forward", to: "review", kind: "data", label: "bằng chứng" }
      ],
      learn: [
        "Chạy năm phút đầu của sự cố theo đúng thứ tự ưu tiên.",
        "Phân loại SEV1, SEV2, SEV3 theo tác động thay vì theo cảm xúc.",
        "Chọn rollback hay roll-forward dựa trên ba câu hỏi kiểm tra.",
        "Viết postmortem không đổ lỗi với hành động có hạn chót."
      ],
      steps: [
        {
          short: "Năm phút",
          type: "TỔNG QUAN",
          title: "Năm phút đầu quyết định",
          body: "Sự cố bắt đầu bằng một tín hiệu, không phải bằng một cuộc họp. Mục tiêu 5 phút đầu: xác nhận ảnh hưởng, gọi đúng người, mở kênh riêng và ghi mốc thời gian. <code>MTTD</code>, thời gian từ lúc lỗi xảy ra đến lúc có người biết, nên dưới 3 phút; MTTM, từ lúc biết đến lúc chỉ huy có mặt, dưới 5 phút. Nếu 60% sự cố đến từ thay đổi triển khai, hãy kiểm tra lịch phát hành trước khi đọc log. Trong 5 phút đó chưa cần nguyên nhân gốc, chỉ cần biết phạm vi: bao nhiêu người dùng, chức năng nào, bắt đầu từ mấy giờ. Ghi lại tất cả vào một dòng thời gian chung để postmortem sau này không phải dựng lại từ trí nhớ.",
          focus: ["detect", "classify", "page"],
          edges: ["detect-classify"],
          metrics: { "phat-hien": "MTTD 3 phút", "phan-loai": "chưa chốt", "rollback": "—", "hoc": "dòng thời gian" },
          changes: ["Mở kênh sự cố riêng", "Bắt đầu ghi dòng thời gian"],
          note: "Trong 5 phút đầu, câu hỏi đúng là phạm vi chứ không phải nguyên nhân. Trả lời sai câu hỏi sẽ đốt mất nửa giờ quý giá."
        },
        {
          short: "Phân loại",
          type: "KỸ THUẬT",
          title: "Phân loại và chia vai",
          body: "Phân loại sai làm đội gọi quá nhiều người cho một lỗi nhỏ, hoặc quá ít cho một sự cố lớn. <strong>SEV1</strong> là mất toàn bộ dịch vụ hoặc rò rỉ dữ liệu, gọi ngay, mục tiêu khắc phục 30 phút. <code>SEV2</code> là một phần chức năng hỏng, ảnh hưởng trên 10% người dùng, mục tiêu 2 giờ. <strong>SEV3</strong> là suy giảm nhẹ, có đường vòng, xử lý trong ngày. Mỗi mức cần một người chỉ huy, một người ghi chép và một người liên lạc, nhưng một người có thể kiêm hai vai ở SEV3. Đừng để người đang sửa lỗi vừa trả lời khách; tách vai để quyết định không bị nhiễu.",
          focus: ["classify", "command", "page"],
          edges: ["classify-command", "command-page"],
          metrics: { "phat-hien": "đã biết", "phan-loai": "SEV1 đến SEV3", "rollback": "—", "hoc": "ba vai" },
          changes: ["Chốt mức theo tác động", "Tách vai chỉ huy và sửa lỗi"],
          note: "Một người vừa sửa vừa quyết định vừa báo cáo là công thức của quyết định chậm và thông tin lệch."
        },
        {
          short: "Lùi hay vá",
          type: "KỸ THUẬT",
          title: "Rollback hay roll-forward",
          body: "<code>Rollback</code> đưa hệ thống về phiên bản trước, nhanh và dễ hiểu, nhưng chỉ an toàn khi thay đổi gần nhất là thủ phạm và không có migration dữ liệu một chiều. Roll-forward vá tiếp trên phiên bản hiện tại, hợp khi lỗi đã rõ, bản vá nhỏ và rollback sẽ mất dữ liệu. Quy tắc thực dụng: nếu nghi ngờ và có bản trước ổn định, rollback trong 15 phút; nếu đã khoanh vùng được một dòng cấu hình sai, roll-forward. Trước khi lùi, kiểm tra ba thứ: phiên bản trước có tương thích lược đồ không, có tắt được cờ tính năng không, và ai sẽ xác nhận hồi phục. Ghi lại mốc bắt đầu lùi và mốc dịch vụ trở lại bình thường.",
          focus: ["command", "rollback", "forward"],
          edges: ["command-rollback", "command-forward"],
          metrics: { "phat-hien": "—", "phan-loai": "đã chốt", "rollback": "15 phút", "hoc": "kiểm tra lược đồ" },
          changes: ["Kiểm tra tương thích lược đồ", "Ghi mốc bắt đầu và kết thúc"],
          note: "Rollback không miễn phí: nó có thể mất dữ liệu mới hoặc vướng migration. Kiểm tra ba câu hỏi trước khi bấm nút."
        },
        {
          short: "Học lại",
          type: "LỖI",
          tone: "warn",
          title: "Postmortem không đổ lỗi",
          body: "<code>Postmortem</code> không đổ lỗi tìm lỗ hổng trong hệ thống, không tìm người để kỷ luật. Một bản tốt có dòng thời gian đến từng phút, tác động đo được, nguyên nhân gốc và các yếu tố góp phần, cùng 3 đến 5 hành động có người phụ trách và hạn chót. Đừng viết \"nhân viên bấm nhầm\"; hãy viết \"lệnh xóa không có bước xác nhận thứ hai và không có sao lưu 24 giờ\". Sự cố lặp lại thường vì hành động khắc phục không có hạn chót. Đặt mục tiêu: 90% hành động hoàn tất trong 30 ngày, và mỗi hành động phải kiểm chứng được bằng một bài kiểm thử hoặc một cảnh báo mới.",
          focus: ["rollback", "forward", "review"],
          edges: ["rollback-review", "forward-review"],
          metrics: { "phat-hien": "—", "phan-loai": "—", "rollback": "đã hồi phục", "hoc": "90% trong 30 ngày" },
          changes: ["Viết dòng thời gian", "Giao hành động có hạn chót"],
          note: "Bản postmortem không có hành động và hạn chót chỉ là biên bản của một sự cố sẽ lặp lại."
        },
        {
          short: "Tóm tắt",
          type: "TÓM TẮT",
          tone: "final",
          title: "Quy trình thay cho anh hùng",
          body: "Xử lý sự cố là một quy trình, không phải anh hùng đơn độc. Phát hiện dưới 3 phút, phân loại theo tác động, một chỉ huy chịu trách nhiệm quyết định, và chọn <code>rollback</code> hay roll-forward dựa trên bằng chứng chứ không dựa trên cảm giác. Rollback nhanh khi nghi ngờ và bản trước ổn định; roll-forward khi đã khoanh vùng được lỗi nhỏ. Sau khi hồi phục, postmortem không đổ lỗi phải biến sự cố thành 3 đến 5 hành động có hạn chót. Ba câu hỏi kiểm tra: sự cố tương tự có phát hiện sớm hơn không, thời gian khắc phục có ngắn hơn không, và hành động khắc phục đã đóng chưa.",
          focus: "all",
          edges: "all",
          metrics: { "phat-hien": "dưới 3 phút", "phan-loai": "theo tác động", "rollback": "có bằng chứng", "hoc": "đóng hành động" },
          changes: ["Chốt quy trình sự cố", "Đo lại MTTD và MTTR"],
          note: "Hết module vận hành. Sang luyện tập để thử hai tình huống quan sát và SLO, rồi mở cheatsheet khi đang trực."
        }
      ]
    }
  });

  window.DEVLAB.practice.push(
    {
      tag: "OBSERVE",
      title: "Dashboard xanh, người dùng vẫn chậm",
      scenario: "Bảng điều khiển hạ tầng phủ kín 24 biểu đồ CPU, RAM và đĩa của 18 máy chủ, xanh suốt ba tuần. Nhưng từ 9h sáng, bộ phận hỗ trợ nhận 140 ticket: trang thanh toán quay vòng 8 đến 12 giây, đơn hàng rơi vào trạng thái treo. CPU toàn hệ thống chỉ 34%, RAM 61%, không máy chủ nào vượt ngưỡng. Đội trực kết luận hạ tầng khỏe và chuyển ticket sang nhóm ứng dụng. Log cho thấy hàng nghìn dòng timeout gọi dịch vụ tồn kho, trong khi bảng điều khiển dịch vụ đó vẫn báo tỷ lệ lỗi 0% vì chỉ đo mã 5xx.",
      metrics: [
        { label: "Ticket", value: "140 trong 2 giờ", danger: true },
        { label: "Độ trễ thanh toán", value: "8 đến 12 giây", danger: true },
        { label: "CPU toàn hệ thống", value: "34%" }
      ],
      options: [
        "Thêm biểu đồ CPU theo từng lõi và nâng ngưỡng cảnh báo lên 85%",
        "Dựng dashboard theo RED cho luồng thanh toán: tỷ lệ lỗi, độ trễ p95 và số request, bắt đầu từ triệu chứng rồi mở trace chậm",
        "Đặt cảnh báo CPU 90% cho cả 18 máy chủ để không bỏ sót tải",
        "Tăng số bản sao dịch vụ thanh toán vì độ trễ cao luôn do thiếu tài nguyên"
      ],
      correct: 1,
      explain: "CPU xanh không chứng minh người dùng ổn. Chỉ số tài nguyên là góc nhìn USE, còn người dùng cảm nhận qua RED: lưu lượng, lỗi và độ trễ. Ở đây độ trễ thanh toán tăng gấp hàng chục lần mà tỷ lệ lỗi dịch vụ tồn kho vẫn 0% vì dashboard chỉ đếm 5xx, bỏ qua timeout và lỗi 4xx do phụ thuộc. Dashboard đúng bắt đầu từ một biểu đồ triệu chứng, có p95 và p99, kèm liên kết sang trace và log theo trace_id. Thêm biểu đồ CPU hay nâng ngưỡng chỉ làm bức tranh nội bộ chi tiết hơn, không trả lời câu hỏi ai đang bị ảnh hưởng."
    },
    {
      tag: "SLO",
      title: "99,9% nhưng tháng nào cũng đạt",
      scenario: "Dịch vụ đặt hàng cam kết SLO 99,9% độ khả dụng. Bảng điều khiển tính trung bình theo từng giờ: một giờ có 3.600 giây, nếu 600 giây lỗi thì tỷ lệ trong giờ đó là 83,3%, nhưng hệ thống lấy trung bình 720 giờ của tháng và báo 99,91%. Tháng vừa rồi có ba sự cố, mỗi lần 8 đến 12 phút vào giờ cao điểm, tổng 31 phút lỗi hoàn toàn; báo cáo vẫn xanh vì các giờ còn lại bù lại. Khách hàng gửi 9 khiếu nại, đội SRE muốn biết vì sao ngân sách lỗi chưa bao giờ cạn.",
      metrics: [
        { label: "SLO cam kết", value: "99,9%" },
        { label: "Tổng thời gian lỗi", value: "31 phút", danger: true },
        { label: "Ngân sách 30 ngày", value: "43,2 phút" }
      ],
      options: [
        "Đổi sang cửa sổ trượt 30 ngày, tính tổng request lỗi chia tổng request, và cảnh báo theo tốc độ đốt nhiều cửa sổ",
        "Nâng SLO lên 99,99% để buộc đội chú ý hơn",
        "Giữ trung bình theo giờ nhưng thêm biểu đồ cột để dễ nhìn",
        "Bỏ SLO và chuyển sang theo dõi SLA với khách hàng"
      ],
      correct: 0,
      explain: "Trung bình theo giờ che mất sự cố ngắn: 10 phút lỗi trong một giờ chỉ kéo trung bình tháng xuống rất ít, nhất là khi chia đều 720 giờ. SLO 99,9% trên cửa sổ trượt 30 ngày cho ngân sách 43,2 phút; 31 phút lỗi đã dùng 72% ngân sách, đủ để kích hoạt đóng băng phát hành. Đo theo tổng request lỗi chia tổng request phản ánh đúng trải nghiệm và không bị các giờ vắng khách bù trừ. Cảnh báo tốc độ đốt 14,4 lần trong 1 giờ và 6 lần trong 6 giờ giúp phát hiện sự cố ngắn trước khi báo cáo tháng kịp đổi màu."
    }
  );

  window.DEVLAB.cheatsheets.push({
    id: "ops",
    num: "03",
    title: "Vận hành & tin cậy",
    intro: "Bảng RED và USE, công thức ngân sách lỗi, mẫu runbook sự cố, checklist rollback và cách chọn giữa ba trụ quan sát. Tra nhanh khi đang trực hoặc chuẩn bị postmortem.",
    cards: [
      {
        title: "Bảng RED và USE",
        wide: true,
        html: `<table class="cheat-table">
<thead><tr><th>Bộ</th><th>Dùng cho</th><th>Câu hỏi</th><th>Chỉ số</th></tr></thead>
<tbody>
<tr><td><b>RED</b></td><td>Dịch vụ hướng người dùng</td><td>Người dùng có ổn không?</td><td class="mono">Rate · Errors · Duration</td></tr>
<tr><td><b>USE</b></td><td>Tài nguyên: CPU, RAM, đĩa</td><td>Tài nguyên có bị nghẽn không?</td><td class="mono">Utilization · Saturation · Errors</td></tr>
<tr><td><b>Bốn tín hiệu vàng</b></td><td>Dịch vụ và hàng đợi</td><td>Độ trễ, lỗi, lưu lượng, bão hòa</td><td class="mono">p95, p99, queue depth</td></tr>
</tbody>
</table>
<p>Bảng chính nên có 12 ô RED và USE. Cảnh báo theo triệu chứng người dùng, không theo CPU đơn thuần.</p>`
      },
      {
        title: "Công thức ngân sách lỗi",
        wide: true,
        html: `<pre><code>30 ngày = 30 × 24 × 60 = 43.200 phút
ngân sách = (1 - SLO) × 43.200
SLO 99,9%   → 0,1%   → 43,2 phút
SLO 99,95%  → 0,05%  → 21,6 phút
SLO 99,5%   → 0,5%   → 216 phút
tốc độ đốt = lỗi thực tế / lỗi cho phép
14,4x → cạn 30 ngày trong 2 ngày
6x    → cạn 30 ngày trong 5 ngày
cửa sổ trượt 30 ngày, cập nhật mỗi phút</code></pre>
<p>Cảnh báo hai cửa sổ: 14,4 lần trong 1 giờ để gọi người, 6 lần trong 6 giờ để mở ticket. SLA luôn thấp hơn SLO.</p>`
      },
      {
        title: "Mẫu runbook sự cố",
        html: `<pre><code>00:00  nhận cảnh báo, mở kênh #incident
00:02  xác nhận phạm vi: ai, chức năng nào
00:05  chọn SEV và gọi chỉ huy
00:08  kiểm tra thay đổi 60 phút gần nhất
00:12  quyết định rollback hay roll-forward
00:20  cập nhật trạng thái cho hỗ trợ
00:30  xác nhận hồi phục bằng chỉ số
00:45  đóng sự cố, hẹn postmortem</code></pre>
<p>Một người chỉ huy, một người ghi chép, một người liên lạc. Người sửa lỗi không kiêm vai trả lời khách.</p>`
      },
      {
        title: "Checklist rollback",
        html: `<pre><code>kubectl rollout undo deploy/api
kubectl rollout status deploy/api
# xác nhận p95 và tỷ lệ lỗi trong 5 phút</code></pre>
<ul>
<li><b>Xác nhận thủ phạm:</b> thay đổi gần nhất nằm trong 60 phút và trùng mốc lỗi.</li>
<li><b>Lược đồ:</b> phiên bản trước đọc được dữ liệu hiện tại, không có migration một chiều.</li>
<li><b>Cờ tính năng:</b> tắt được thay đổi mà không cần triển khai lại.</li>
<li><b>Dữ liệu:</b> đã sao lưu phần sẽ bị ảnh hưởng, biết cách khôi phục.</li>
<li><b>Người xác nhận:</b> chỉ huy và người trực cùng nhìn một chỉ số hồi phục.</li>
<li><b>Mốc thời gian:</b> ghi lúc bắt đầu lùi, lúc xong và lúc chỉ số về bình thường.</li>
</ul>`
      },
      {
        title: "Chọn trụ quan sát",
        html: `<table class="cheat-table">
<thead><tr><th>Trụ</th><th>Trả lời</th><th>Chi phí</th><th>Lưu</th></tr></thead>
<tbody>
<tr><td><b>Log</b></td><td>Chuyện gì đã xảy ra?</td><td>Cao, 518 GB/ngày</td><td class="mono">7 ngày</td></tr>
<tr><td><b>Metric</b></td><td>Tệ đi bao nhiêu?</td><td>Thấp, vài chục byte/điểm</td><td class="mono">13 tháng</td></tr>
<tr><td><b>Trace</b></td><td>Thời gian đi đâu?</td><td>Trung bình, theo mẫu</td><td class="mono">7 ngày</td></tr>
</tbody>
</table>
<p>Luôn gắn <code>trace_id</code> vào log. Lấy mẫu trace theo đuôi: 100% span lỗi và span chậm hơn 1 giây.</p>`
      }
    ]
  });
})();
