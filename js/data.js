/* DevLab — dữ liệu khóa DevOps, phần 1: module CI/CD, luyện tập và cheatsheet */
window.DEVLAB = window.DEVLAB || { modules: [], lessons: {}, practice: [], cheatsheets: [] };

(function () {
  "use strict";

  window.DEVLAB.modules.push({
    id: "nen-tang-cicd",
    num: "01",
    title: "Nền tảng CI/CD",
    tone: "blue",
    blurb: "CI/CD biến mỗi commit thành dây chuyền tự động: dựng, kiểm thử, đóng gói rồi phát hành trong vài phút. Module đi từ vòng đời DevOps, cấu trúc pipeline, bản dựng bất biến đến cổng kiểm thử, kèm số liệu cụ thể.",
    lessons: ["vong-doi-devops", "pipeline-ci", "artifact-build", "test-gate"]
  });

  Object.assign(window.DEVLAB.lessons, {
    "vong-doi-devops": {
      id: "vong-doi-devops",
      module: "nen-tang-cicd",
      title: "Vòng đời DevOps",
      shortTitle: "Vòng đời DevOps",
      subtitle: "Một commit chỉ có giá trị khi đi hết đường tới người dùng, và mọi chặng trên đường đều để lại số liệu. Vòng phản hồi ngắn là thứ biến phát hành từ sự kiện đáng sợ thành việc thường ngày.",
      blurb: "Từ commit đến production, mỗi chặng có một đồng hồ riêng.",
      duration: "12 phút",
      level: "Cơ bản",
      tags: ["commit", "CI/CD", "deploy", "phản hồi", "giám sát"],
      metrics: [
        { key: "commit", label: "Commit", tone: "blue" },
        { key: "build", label: "Bản dựng", tone: "violet" },
        { key: "deploy", label: "Phát hành", tone: "green" },
        { key: "giam-sat", label: "Giám sát", tone: "coral" }
      ],
      nodes: [
        { id: "dev", type: "user", x: 55, y: 80, w: 200, h: 70, label: "Lập trình viên", sub: "commit vào main" },
        { id: "repo", type: "layers", x: 340, y: 80, w: 200, h: 70, label: "Kho mã nguồn", sub: "1.240 commit, 18 nhánh" },
        { id: "ci", type: "bolt", x: 625, y: 80, w: 200, h: 70, label: "Máy chủ CI", sub: "6 phút mỗi lần chạy" },
        { id: "artifacts", type: "disk", x: 55, y: 310, w: 200, h: 70, label: "Bản dựng", sub: "image 148 MB đã ký" },
        { id: "staging", type: "server", x: 340, y: 310, w: 200, h: 70, label: "Môi trường staging", sub: "dữ liệu giả 40.000 dòng" },
        { id: "prod", type: "grid", x: 625, y: 310, w: 200, h: 70, label: "Production", sub: "12.000 người dùng" },
        { id: "gate", type: "shield", x: 340, y: 195, w: 200, h: 70, label: "Cổng kiểm tra", sub: "214 test, quét lỗi" }
      ],
      edges: [
        { id: "dev-repo", from: "dev", to: "repo", kind: "request", label: "git push" },
        { id: "repo-ci", from: "repo", to: "ci", kind: "control", label: "webhook kích hoạt" },
        { id: "ci-gate", from: "ci", to: "gate", kind: "control", label: "chạy 5 bước" },
        { id: "gate-artifacts", from: "gate", to: "artifacts", kind: "data", label: "image đã ký" },
        { id: "artifacts-staging", from: "artifacts", to: "staging", kind: "data", label: "triển khai staging" },
        { id: "staging-prod", from: "staging", to: "prod", kind: "control", label: "phát hành 5%" },
        { id: "prod-dev", from: "prod", to: "dev", kind: "response", label: "cảnh báo quay về" }
      ],
      learn: [
        "Kể lại đường đi của một commit từ nhánh main tới production.",
        "Đo thời gian từng chặng và chỉ ra chặng giữ commit lâu nhất.",
        "Phân biệt vòng phản hồi của máy với vòng phản hồi của người.",
        "Nhận ra dấu hiệu pipeline đang dài hơn mức cần thiết."
      ],
      steps: [
        {
          short: "Commit",
          type: "TỔNG QUAN",
          title: "Một dòng lệnh bắt đầu tất cả",
          body: "Mọi thứ bắt đầu bằng <code>git push origin main</code>, một thao tác mất chưa tới <code>2 giây</code>. Trước đó, lập trình viên đã chạy <code>12</code> test ở máy và tự tin mã đúng. Nhưng máy cá nhân chỉ là một môi trường trong hàng chục môi trường; thư viện có thể khác phiên bản, biến môi trường có thể thiếu. Vì vậy commit không phải điểm kết thúc mà là điểm bàn giao: từ máy cá nhân sang hệ thống chung. Nhánh <code>main</code> của dự án mẫu nhận <code>18</code> commit mỗi ngày, mỗi commit là một lời hứa rằng mã đã sẵn sàng cho người khác đọc, chạy và triển khai.",
          focus: ["dev"],
          edges: ["dev-repo"],
          metrics: { "commit": "push lên main", "build": "—", "deploy": "—", "giam-sat": "—" },
          changes: ["Đẩy commit lên nhánh chung", "Ghi rõ mã thay đổi trong thông điệp"],
          note: "Commit là điểm bàn giao, không phải điểm kết thúc. Máy cá nhân không đại diện cho môi trường chung."
        },
        {
          short: "Tự động",
          type: "LUỒNG",
          title: "Từ webhook tới pipeline",
          body: "Sau khi nhận push, kho mã gửi webhook tới máy chủ CI trong khoảng <code>1,4 giây</code>. Máy chủ tạo một lượt chạy gắn với mã commit, chia thành <code>5</code> bước: cài phụ thuộc, lint, test, quét bảo mật và đóng gói. Mỗi bước là một tiến trình riêng trong container, nên kết quả không phụ thuộc máy của ai. Lượt chạy mẫu mất <code>6 phút 20 giây</code>, trong đó cài phụ thuộc chiếm <code>44 giây</code> nhờ cache. Nếu bước nào trả mã khác <code>0</code>, pipeline dừng và ghi log. Điều quan trọng là mọi thứ được ghi lại: ai push, chạy lúc nào, dừng ở đâu, để lần sau không phải đoán.",
          focus: ["repo", "ci"],
          edges: ["repo-ci", "ci-gate"],
          metrics: { "commit": "đã nhận", "build": "6 phút 20 giây", "deploy": "—", "giam-sat": "—" },
          changes: ["Bật webhook cho nhánh chính", "Ghi log theo mã commit"],
          note: "Một lượt chạy không có mã commit trong log là lượt chạy không thể tái hiện."
        },
        {
          short: "Kiểm tra",
          type: "CƠ CHẾ",
          title: "Cổng kiểm tra đứng giữa",
          body: "Cổng kiểm tra là chặng không được bỏ qua: nó chỉ cho bản dựng đi tiếp khi cả <code>214</code> test đơn vị và <code>42</code> test tích hợp đều đạt. Nếu độ phủ giảm quá <code>2</code> điểm phần trăm so với nhánh chính, cổng chặn luôn, kể cả khi test vẫn xanh. Cổng cũng kiểm tra <code>0</code> lỗi nghiêm trọng từ bước quét phụ thuộc, vì một thư viện lỗi thời có thể làm hỏng cả bản phát hành. Chỉ khi qua cổng, máy chủ mới ký và đẩy image lên registry. Cổng không phải thủ tục giấy tờ; nó là nơi duy nhất biến một tập kết quả rời rạc thành một quyết định: đi tiếp hay dừng.",
          focus: ["gate"],
          edges: ["ci-gate", "gate-artifacts"],
          metrics: { "commit": "đã nhận", "build": "đạt 214 test", "deploy": "image 148 MB", "giam-sat": "—" },
          changes: ["Chặn khi độ phủ tụt", "Ký image trước khi đẩy"],
          note: "Cổng phải trả lời được vì sao chặn, nếu không người viết sẽ tìm cách đi vòng."
        },
        {
          short: "Phản hồi",
          type: "SO SÁNH",
          title: "Vòng phản hồi ngắn và dài",
          body: "Đội phát hành thủ công mỗi tháng một lần: từ lúc commit tới production mất <code>14</code> ngày, và khi lỗi xuất hiện phải chờ <code>6</code> tuần mới có bản sửa. Với pipeline tự động, cùng thay đổi đó đi hết đường trong <code>40 phút</code>, phát hành dần <code>5%</code> lưu lượng rồi tăng lên <code>100%</code> sau <code>10 phút</code> nếu chỉ số tốt. Khi có sự cố, cảnh báo về kênh trực trong <code>3 phút</code> kèm mã commit và biểu đồ lỗi. Khác biệt không nằm ở tốc độ gõ lệnh mà ở số vòng học được mỗi tháng: đội thủ công có <code>1</code> vòng, đội tự động có <code>60</code> vòng, và mỗi vòng đều dạy điều gì đó về hệ thống.",
          focus: ["staging", "prod"],
          edges: ["staging-prod", "prod-dev"],
          metrics: { "commit": "đã nhận", "build": "image đã ký", "deploy": "5% rồi 100%", "giam-sat": "báo trong 3 phút" },
          changes: ["Phát hành dần theo phần trăm", "Nối cảnh báo về mã commit"],
          note: "Một vòng phản hồi chỉ có giá trị khi người viết nhìn thấy kết quả trước khi chuyển sang việc khác."
        },
        {
          short: "Tóm tắt",
          type: "CHỐT",
          tone: "final",
          title: "Bốn chặng, một vòng lặp",
          body: "Vòng đời DevOps gói trong bốn chặng: commit, dựng, phát hành, giám sát, rồi quay lại commit bằng dữ liệu thật. Bốn chặng này tạo thành một vòng lặp, không phải đường thẳng, vì mỗi sự cố ở production phải trở thành một test hoặc một cảnh báo mới. Khi vòng lặp ngắn, thay đổi nhỏ đi qua nhanh và lỗi lộ ra sớm; khi vòng lặp dài, thay đổi lớn dồn lại và mỗi lần phát hành thành một canh bạc. Bài tiếp theo mổ xẻ chặng thứ hai: cấu trúc pipeline, cách chia stage và nguyên tắc fail fast để dừng ở lỗi đầu tiên thay vì chạy hết <code>11 phút</code>.",
          focus: "all",
          edges: "all",
          metrics: { "commit": "một nguồn", "build": "tái lập được", "deploy": "tự động", "giam-sat": "3 phút báo" },
          changes: ["Nắm bốn chặng của vòng lặp", "Chuẩn bị học cấu trúc pipeline"],
          note: "Bài tiếp theo: pipeline CI, nơi mỗi stage phải trả lời đúng một câu hỏi."
        }
      ]
    },

    "pipeline-ci": {
      id: "pipeline-ci",
      module: "nen-tang-cicd",
      title: "Pipeline CI",
      shortTitle: "Pipeline CI",
      subtitle: "Pipeline CI là chuỗi stage chạy tự động trên mỗi commit, mỗi stage trả lời một câu hỏi riêng. Chia stage đúng và dừng ở lỗi đầu tiên giúp phản hồi trong vài phút thay vì vài chục phút.",
      blurb: "Stage rõ, chạy song song, dừng ở lỗi đầu tiên.",
      duration: "12 phút",
      level: "Cơ bản",
      tags: ["stage", "cache", "lint", "test", "fail fast"],
      metrics: [
        { key: "stage", label: "Stage", tone: "blue" },
        { key: "test", label: "Kiểm thử", tone: "green" },
        { key: "scan", label: "Quét lỗi", tone: "coral" },
        { key: "thoi-gian", label: "Thời gian", tone: "violet" }
      ],
      nodes: [
        { id: "push", type: "event", x: 55, y: 80, w: 200, h: 70, label: "Commit mới", sub: "nhánh feature/login" },
        { id: "runner", type: "server", x: 340, y: 80, w: 200, h: 70, label: "Runner", sub: "4 vCPU, 8 GB RAM" },
        { id: "install", type: "layers", x: 625, y: 80, w: 200, h: 70, label: "Cài phụ thuộc", sub: "cache npm 1,2 GB" },
        { id: "lint", type: "check", x: 625, y: 310, w: 200, h: 70, label: "Lint", sub: "0 lỗi, 12 cảnh báo" },
        { id: "test", type: "check", x: 340, y: 310, w: 200, h: 70, label: "Kiểm thử", sub: "214 test, 3 phút" },
        { id: "scan", type: "shield", x: 55, y: 310, w: 200, h: 70, label: "Quét bảo mật", sub: "0 lỗi nghiêm trọng" },
        { id: "gate", type: "alert", x: 340, y: 195, w: 200, h: 70, label: "Fail fast", sub: "dừng ở lỗi đầu tiên" }
      ],
      edges: [
        { id: "push-runner", from: "push", to: "runner", kind: "request", label: "webhook kích hoạt" },
        { id: "runner-install", from: "runner", to: "install", kind: "control", label: "chuẩn bị môi trường" },
        { id: "install-lint", from: "install", to: "lint", kind: "control", label: "cài xong" },
        { id: "lint-test", from: "lint", to: "test", kind: "control", label: "lint đạt" },
        { id: "test-scan", from: "test", to: "scan", kind: "control", label: "test đạt" },
        { id: "scan-gate", from: "scan", to: "gate", kind: "data", label: "báo cáo kết quả" },
        { id: "gate-push", from: "gate", to: "push", kind: "response", label: "báo đỏ cho commit" }
      ],
      learn: [
        "Chia pipeline thành stage theo câu hỏi mà stage trả lời.",
        "Đọc thời gian từng stage để tìm chỗ đáng tối ưu.",
        "Áp fail fast để dừng ở lỗi đầu tiên thay vì chạy hết.",
        "Dùng cache và chạy song song mà không hy sinh độ tin cậy."
      ],
      steps: [
        {
          short: "Kích hoạt",
          type: "TỔNG QUAN",
          title: "Commit nào cũng chạy pipeline",
          body: "Một commit trên nhánh <code>feature/login</code> đủ để pipeline chạy, không cần chờ merge. Dự án mẫu nhận <code>26</code> commit mỗi ngày, mỗi commit tạo một lượt chạy riêng, tốn tổng <code>2,7 giờ</code> máy. Nghe nhiều, nhưng đó là cách rẻ nhất để biết mã có chạy trên máy khác hay không. Pipeline không phán xét con người; nó chỉ trả lời một câu hỏi hẹp: commit này có vượt qua các kiểm tra đã thỏa thuận không. Câu trả lời phải có trong vài phút, trước khi người viết chuyển sang việc khác và quên mất ngữ cảnh.",
          focus: ["push"],
          edges: ["push-runner"],
          metrics: { "stage": "khởi tạo", "test": "—", "scan": "—", "thoi-gian": "0 giây" },
          changes: ["Bật pipeline cho mọi nhánh", "Gắn lượt chạy với mã commit"],
          note: "Pipeline chỉ chạy khi merge sẽ biến mọi lỗi thành phát hiện muộn, đúng lúc đắt nhất để sửa."
        },
        {
          short: "Runner",
          type: "LUỒNG",
          title: "Runner sạch và bộ nhớ đệm",
          body: "Runner là máy sạch, không có gì ngoài image nền và bộ nhớ đệm được gắn từ trước. Với dự án mẫu, cache <code>npm</code> nặng <code>1,2 GB</code> giúp bước cài phụ thuộc rút từ <code>2 phút 10 giây</code> xuống <code>44 giây</code>. Runner được cấu hình <code>4 vCPU</code> và <code>8 GB</code> RAM, đủ để chạy lint và test song song mà không tranh chấp. Mỗi lượt chạy dùng container mới, nên không có tệp lạ từ lượt trước. Đổi lại, mọi thứ cần cho build phải khai báo rõ trong mã hoặc trong cache; không thể dựa vào thứ ai đó cài tay trên máy.",
          focus: ["runner", "install"],
          edges: ["runner-install", "install-lint"],
          metrics: { "stage": "cài đặt", "test": "—", "scan": "—", "thoi-gian": "44 giây" },
          changes: ["Khai báo cache theo khóa", "Khóa phiên bản phụ thuộc"],
          note: "Cache hỏng còn tệ hơn không có cache: hãy đặt khóa theo tệp khóa phiên bản để tránh dùng lại gói cũ."
        },
        {
          short: "Ba stage",
          type: "CƠ CHẾ",
          title: "Lint, test và quét bảo mật",
          body: "Ba stage kiểm tra trả lời ba câu hỏi khác nhau. <code>Lint</code> hỏi mã có đúng quy ước không, chạy <code>38 giây</code>. <code>Test</code> hỏi hành vi còn đúng không, chạy <code>3 phút</code> với <code>214</code> test. <code>Quét bảo mật</code> hỏi có phụ thuộc đã biết lỗi không, chạy <code>1 phút 20 giây</code> và đối chiếu <code>1.480</code> gói. Chạy tuần tự, tổng là <code>4 phút 58 giây</code>; cho quét bảo mật chạy song song với test thì còn <code>3 phút 40 giây</code>. Thứ tự cũng quan trọng: lint đứng trước test vì lỗi cú pháp làm test đổ hàng loạt và che mất lỗi thật.",
          focus: ["lint", "test", "scan"],
          edges: ["lint-test", "test-scan", "scan-gate"],
          metrics: { "stage": "3 stage", "test": "214 test", "scan": "0 lỗi", "thoi-gian": "3 phút" },
          changes: ["Tách stage theo câu hỏi", "Cho phép chạy song song"],
          note: "Đừng gộp lint vào test. Khi hai thứ đỏ cùng lúc, người đọc log sẽ mất thời gian tách nguyên nhân."
        },
        {
          short: "Fail fast",
          type: "SO SÁNH",
          title: "Dừng sớm hay chạy hết",
          body: "Commit mẫu có một lỗi lint ở dòng <code>42</code>. Nếu pipeline chạy hết, nó tốn <code>11 phút</code> để cuối cùng báo đỏ, và người viết đã chuyển sang việc khác từ lâu. Với fail fast, lượt chạy dừng sau <code>1 phút 50 giây</code>, ngay tại stage lint, và thông báo chỉ đúng tệp, đúng dòng. Trong <code>26</code> commit mỗi ngày, có khoảng <code>3</code> commit lỗi lint; tiết kiệm gần <code>28 phút</code> máy mỗi ngày. Fail fast không có nghĩa là bỏ qua các stage sau, mà là không tiêu tài nguyên cho một commit đã biết sai.",
          focus: ["gate", "push"],
          edges: ["scan-gate", "gate-push"],
          metrics: { "stage": "dừng ở lint", "test": "chưa chạy", "scan": "chưa chạy", "thoi-gian": "1 phút 50 giây" },
          changes: ["Dừng ngay ở lỗi đầu", "Báo đúng tệp và dòng"],
          note: "Fail fast cần thông báo tốt. Dừng sớm mà không nói lý do thì chỉ tiết kiệm thời gian máy, không tiết kiệm thời gian người."
        },
        {
          short: "Tóm tắt",
          type: "CHỐT",
          tone: "final",
          title: "Ba tính chất của pipeline tốt",
          body: "Pipeline tốt có ba tính chất: stage rõ câu hỏi, thời gian đủ ngắn để người viết còn chờ, và lỗi chỉ đúng chỗ cần sửa. Chia stage theo câu hỏi giúp đọc kết quả trong vài giây; cache và chạy song song giữ tổng thời gian dưới <code>5 phút</code>; fail fast trả phản hồi sớm nhất có thể. Ba tính chất này quan trọng hơn số lượng công cụ. Bài tiếp theo đi vào sản phẩm của pipeline: artifact và image, nơi tag mơ hồ sẽ biến một pipeline xanh thành một lần phát hành sai.",
          focus: "all",
          edges: "all",
          metrics: { "stage": "rõ câu hỏi", "test": "dưới 3 phút", "scan": "chặn lỗi nặng", "thoi-gian": "dưới 5 phút" },
          changes: ["Chốt ba tính chất", "Chuẩn bị học artifact"],
          note: "Bài tiếp theo: image, tag bất biến và registry, nơi danh tính của bản dựng được quyết định."
        }
      ]
    },

    "artifact-build": {
      id: "artifact-build",
      module: "nen-tang-cicd",
      title: "Bản dựng & artifact",
      shortTitle: "Artifact & registry",
      subtitle: "Artifact là kết quả đã đóng gói của một commit, và nó phải tái lập được từ mã nguồn. Tag bất biến cùng digest giúp bạn biết chính xác thứ đang chạy trên production là gì.",
      blurb: "Một commit, một artifact, một digest.",
      duration: "12 phút",
      level: "Trung cấp",
      tags: ["artifact", "image", "tag", "registry", "digest"],
      metrics: [
        { key: "image", label: "Image", tone: "blue" },
        { key: "tag", label: "Tag", tone: "yellow" },
        { key: "registry", label: "Registry", tone: "violet" },
        { key: "kich-thuoc", label: "Dung lượng", tone: "green" }
      ],
      nodes: [
        { id: "source", type: "code", x: 55, y: 80, w: 200, h: 70, label: "Mã nguồn", sub: "commit a1b2c3d" },
        { id: "dockerfile", type: "file", x: 340, y: 80, w: 200, h: 70, label: "Dockerfile", sub: "3 stage, base slim" },
        { id: "builder", type: "bolt", x: 625, y: 80, w: 200, h: 70, label: "Bước build", sub: "2 phút 40 giây" },
        { id: "image", type: "layers", x: 55, y: 310, w: 200, h: 70, label: "Image", sub: "148 MB, 6 lớp" },
        { id: "registry", type: "disk", x: 340, y: 310, w: 200, h: 70, label: "Registry", sub: "40 phiên bản" },
        { id: "deploy", type: "server", x: 625, y: 310, w: 200, h: 70, label: "Triển khai", sub: "kéo theo digest" }
      ],
      edges: [
        { id: "source-dockerfile", from: "source", to: "dockerfile", kind: "data", label: "COPY toàn bộ mã" },
        { id: "dockerfile-builder", from: "dockerfile", to: "builder", kind: "control", label: "docker build" },
        { id: "builder-image", from: "builder", to: "image", kind: "data", label: "image cuối cùng" },
        { id: "image-registry", from: "image", to: "registry", kind: "data", label: "push tag và digest", bow: 22 },
        { id: "registry-image", from: "registry", to: "image", kind: "data", label: "pull theo digest", bow: -22 },
        { id: "registry-deploy", from: "registry", to: "deploy", kind: "data", label: "digest sha256:9f2c" }
      ],
      learn: [
        "Phân biệt artifact với mã nguồn và với môi trường chạy.",
        "Viết Dockerfile nhiều stage để image cuối gọn.",
        "Đặt tag bất biến gắn với commit hoặc phiên bản.",
        "Dùng digest để triển khai đúng thứ đã kiểm thử."
      ],
      steps: [
        {
          short: "Artifact",
          type: "TỔNG QUAN",
          title: "Thứ chạy không phải mã nguồn",
          body: "Artifact là kết quả đã đóng gói của một commit: với dịch vụ Node, đó là image <code>148 MB</code> chứa mã đã biên dịch và thư viện đã khóa phiên bản. Mã nguồn ở commit <code>a1b2c3d</code> chỉ là nguyên liệu; thứ chạy trên production là artifact. Vì vậy artifact phải tái lập được: cùng commit, cùng Dockerfile, cùng phiên bản nền phải cho cùng kết quả. Dự án mẫu build <code>14</code> lần mỗi ngày và giữ lại mọi artifact trong <code>90</code> ngày, đủ để rollback về bất kỳ bản nào từng chạy. Không có artifact rõ ràng, rollback chỉ là phỏng đoán.",
          focus: ["source", "dockerfile"],
          edges: ["source-dockerfile"],
          metrics: { "image": "148 MB", "tag": "—", "registry": "—", "kich-thuoc": "38 MB ngữ cảnh" },
          changes: ["Đóng gói từ commit", "Giữ artifact 90 ngày"],
          note: "Nếu không dựng lại được artifact từ commit cũ, bạn không thật sự có lịch sử phát hành."
        },
        {
          short: "Build",
          type: "LUỒNG",
          title: "Ba stage, một image gọn",
          body: "Dockerfile mẫu có ba stage: <code>deps</code> cài thư viện, <code>build</code> biên dịch, <code>runtime</code> chỉ chép kết quả. Stage trung gian nặng <code>820 MB</code> bị bỏ lại, image cuối còn <code>148 MB</code> với <code>6</code> lớp. Toàn bộ bước build mất <code>2 phút 40 giây</code>, trong đó <code>38 giây</code> dành cho việc kéo image nền. Nền dùng bản <code>slim</code> thay vì bản đầy đủ để giảm bề mặt tấn công. Một Dockerfile tốt đọc từ trên xuống là hiểu, và lớp nào ít thay đổi nằm trên để cache còn tác dụng.",
          focus: ["builder", "image"],
          edges: ["dockerfile-builder", "builder-image"],
          metrics: { "image": "148 MB", "tag": "chưa gắn", "registry": "—", "kich-thuoc": "820 MB tạm" },
          changes: ["Tách stage build và runtime", "Chép tệp theo thứ tự cache"],
          note: "Đừng chép toàn bộ thư mục vào image runtime. Mã nguồn, test và tệp cấu hình phát triển không cần có mặt ở đó."
        },
        {
          short: "Tag",
          type: "CƠ CHẾ",
          title: "Tag để đọc, digest để chạy",
          body: "Tag là nhãn con người đọc, digest là danh tính thật. Mỗi lần push, registry tính một digest dạng <code>sha256:9f2c</code>; cùng digest nghĩa là cùng byte. Dự án mẫu gắn ba tag cho một image: <code>a1b2c3d</code> theo commit, <code>v2.4.1</code> theo phiên bản, và <code>staging</code> theo môi trường. Registry giữ <code>40</code> phiên bản, khoảng <code>5,9 GB</code>; vượt ngưỡng thì bản cũ nhất bị xóa. Tag môi trường được phép đổi, tag commit và tag phiên bản thì không, nhờ vậy luôn truy được một lần chạy về đúng mã nguồn.",
          focus: ["image", "registry"],
          edges: ["image-registry", "registry-image"],
          metrics: { "image": "148 MB", "tag": "3 tag", "registry": "40 phiên bản", "kich-thuoc": "5,9 GB" },
          changes: ["Gắn tag theo commit", "Bật chế độ tag bất biến"],
          note: "Tag bất biến là cấu hình ở registry, không phải lời hứa của người build. Hãy bật nó ở nơi lưu trữ."
        },
        {
          short: "Rollback",
          type: "SO SÁNH",
          tone: "warn",
          title: "Latest và cái giá của mơ hồ",
          body: "Hai cách triển khai cho kết quả rất khác. Nếu deploy dùng <code>app:latest</code>, mỗi lần rollout có thể kéo một image mới hơn, không ai biết vì sao hành vi đổi. Đội mẫu từng gặp <code>11</code> sự cố trong <code>3</code> tháng chỉ vì tag này: rollback kéo lại latest, và latest đã bị đẩy bởi commit khác. Chuyển sang triển khai theo digest đã kiểm thử giúp rollback đúng trong <code>22 giây</code> thay vì <code>40</code> phút dò log. Tag theo commit để người đọc, digest để máy chạy; hai thứ này không thay thế nhau mà bổ sung cho nhau.",
          focus: ["registry", "deploy"],
          edges: ["registry-deploy", "image-registry"],
          metrics: { "image": "đúng bản", "tag": "latest mơ hồ", "registry": "giữ digest", "kich-thuoc": "không đổi" },
          changes: ["Bỏ tag latest khi deploy", "Rollback theo digest"],
          note: "Latest không phải phiên bản mới nhất theo thời gian thực; nó chỉ là tag cuối cùng ai đó đẩy lên."
        },
        {
          short: "Tóm tắt",
          type: "CHỐT",
          tone: "final",
          title: "Ba điều kiện của artifact tốt",
          body: "Artifact tốt hội đủ ba điều: tái lập được từ commit, nhỏ và sạch nhờ build nhiều stage, và có danh tính bất biến là digest. Tag chỉ là cách gọi tên; đừng để nó thành nguồn sự thật duy nhất. Khi triển khai, hãy kéo đúng digest đã qua cổng kiểm thử, và giữ artifact ít nhất <code>90</code> ngày để rollback. Bài tiếp theo nói về cổng kiểm thử: loại test nào chạy ở đâu, ngưỡng độ phủ ra sao, và cách xử lý những test chập chờn thay vì bỏ qua chúng.",
          focus: "all",
          edges: "all",
          metrics: { "image": "một commit", "tag": "bất biến", "registry": "có digest", "kich-thuoc": "148 MB" },
          changes: ["Chốt ba điều kiện", "Chuẩn bị học test gate"],
          note: "Bài tiếp theo: unit, tích hợp, E2E và những test chập chờn làm pipeline đỏ sai."
        }
      ]
    },

    "test-gate": {
      id: "test-gate",
      module: "nen-tang-cicd",
      title: "Cổng kiểm thử",
      shortTitle: "Test gate",
      subtitle: "Test gate là tập kiểm thử tối thiểu mà một commit phải vượt qua trước khi được merge hoặc phát hành. Đặt ngưỡng đúng quan trọng hơn đặt ngưỡng cao, vì cổng quá chặt sẽ bị vô hiệu hóa.",
      blurb: "Kim tự tháp test, ngưỡng phủ và cách xử lý test chập chờn.",
      duration: "12 phút",
      level: "Trung cấp",
      tags: ["unit", "tích hợp", "e2e", "coverage", "flaky"],
      metrics: [
        { key: "unit", label: "Unit", tone: "green" },
        { key: "tich-hop", label: "Tích hợp", tone: "blue" },
        { key: "e2e", label: "E2E", tone: "violet" },
        { key: "do-phu", label: "Độ phủ", tone: "yellow" }
      ],
      nodes: [
        { id: "commit", type: "event", x: 55, y: 80, w: 200, h: 70, label: "Commit", sub: "nhánh fix/cart" },
        { id: "unit", type: "check", x: 340, y: 80, w: 200, h: 70, label: "Unit test", sub: "1.860 test, 48 giây" },
        { id: "integration", type: "check", x: 625, y: 80, w: 200, h: 70, label: "Tích hợp", sub: "42 test, 2 phút" },
        { id: "e2e", type: "page", x: 625, y: 310, w: 200, h: 70, label: "E2E", sub: "18 kịch bản, 6 phút" },
        { id: "coverage", type: "grid", x: 340, y: 310, w: 200, h: 70, label: "Độ phủ", sub: "87% dòng, 74% nhánh" },
        { id: "flaky", type: "alert", x: 55, y: 310, w: 200, h: 70, label: "Test chập chờn", sub: "11 test, 4% lượt" },
        { id: "gate", type: "shield", x: 340, y: 195, w: 200, h: 70, label: "Cổng chất lượng", sub: "chặn nếu tụt 2%" }
      ],
      edges: [
        { id: "commit-unit", from: "commit", to: "unit", kind: "control", label: "chạy song song" },
        { id: "unit-integration", from: "unit", to: "integration", kind: "data", label: "báo kết quả" },
        { id: "integration-e2e", from: "integration", to: "e2e", kind: "control", label: "đạt mới chạy" },
        { id: "e2e-gate", from: "e2e", to: "gate", kind: "data", label: "kịch bản đạt" },
        { id: "coverage-gate", from: "coverage", to: "gate", kind: "data", label: "so nhánh chính" },
        { id: "flaky-gate", from: "flaky", to: "gate", kind: "data", label: "đánh dấu cách ly" },
        { id: "gate-commit", from: "gate", to: "commit", kind: "response", label: "chặn merge" }
      ],
      learn: [
        "Chọn loại test nào cho câu hỏi nào trong kim tự tháp.",
        "Đặt ngưỡng độ phủ theo nhánh thay vì chỉ theo dòng.",
        "Phát hiện test chập chờn và xử lý thay vì bỏ qua.",
        "Giữ cổng đủ nhanh để người viết không muốn lách."
      ],
      steps: [
        {
          short: "Unit",
          type: "TỔNG QUAN",
          title: "Lớp chạy nhiều nhất",
          body: "Unit test là lớp chạy nhiều nhất và rẻ nhất: <code>1.860</code> test chạy trong <code>48 giây</code>, không cần mạng, không cần cơ sở dữ liệu. Mỗi commit trong <code>26</code> lượt mỗi ngày đều chạy toàn bộ nhóm này, tốn khoảng <code>21 phút</code> máy. Vì nhanh, unit test là nơi đặt những kiểm tra chi tiết: tính đúng của hàm tính thuế, xử lý giá trị biên, định dạng tiền tệ. Unit test không chứng minh hệ thống chạy được, nhưng chỉ đúng dòng nào vừa hỏng. Khi một unit test đỏ, phạm vi tìm lỗi thường nằm trong một tệp.",
          focus: ["commit", "unit"],
          edges: ["commit-unit"],
          metrics: { "unit": "1.860 test", "tich-hop": "—", "e2e": "—", "do-phu": "—" },
          changes: ["Chạy unit mỗi commit", "Giữ test dưới 60 giây"],
          note: "Unit test cần chạy được trên máy cá nhân mà không cần dịch vụ ngoài, nếu không người viết sẽ bỏ qua."
        },
        {
          short: "Kim tự tháp",
          type: "LUỒNG",
          title: "Ba tầng, ba chi phí",
          body: "Kim tự tháp test phân tầng theo chi phí. <code>1.860</code> unit test giữ tốc độ; <code>42</code> test tích hợp kiểm tra ranh giới thật như cơ sở dữ liệu và hàng đợi, mất <code>2 phút</code>; <code>18</code> kịch bản E2E đi qua giao diện, mất <code>6 phút</code>. E2E chỉ dành cho luồng sống còn như đăng nhập, thanh toán, hoàn tiền, vì mỗi kịch bản thêm vào là thêm <code>20 giây</code> và thêm một nguồn chập chờn. Tỷ lệ hợp lý ở dự án mẫu là <code>70/25/5</code>; đảo ngược tỷ lệ này, pipeline sẽ chậm và khó chỉ ra lỗi.",
          focus: ["unit", "integration", "e2e"],
          edges: ["unit-integration", "integration-e2e"],
          metrics: { "unit": "1.860 test", "tich-hop": "42 test", "e2e": "18 kịch bản", "do-phu": "—" },
          changes: ["Đặt E2E sau tích hợp", "Giới hạn số kịch bản E2E"],
          note: "Một kịch bản E2E đắt gấp hàng chục lần unit test. Chỉ giữ những luồng mà nếu hỏng thì mất khách."
        },
        {
          short: "Độ phủ",
          type: "CƠ CHẾ",
          title: "Ngưỡng phủ đặt theo nhánh",
          body: "Độ phủ là thước đo thô nhưng hữu ích khi đọc đúng chiều. Dự án mẫu đạt <code>87%</code> dòng và <code>74%</code> nhánh; phần thiếu chủ yếu là nhánh xử lý lỗi. Cổng đặt ngưỡng: độ phủ dòng không được giảm quá <code>2</code> điểm phần trăm, và mọi nhánh mới trong tệp thanh toán phải có test. Một commit thêm <code>1.400</code> dòng mà không thêm test sẽ kéo độ phủ xuống và bị chặn. Ngưỡng đặt theo nhánh, không theo số test, vì <code>3</code> test giả có thể phủ <code>300</code> dòng mà không kiểm tra gì.",
          focus: ["coverage", "gate"],
          edges: ["coverage-gate"],
          metrics: { "unit": "1.860 test", "tich-hop": "42 test", "e2e": "18 kịch bản", "do-phu": "87% dòng, 74% nhánh" },
          changes: ["So độ phủ với nhánh chính", "Chặn khi tụt quá 2 điểm"],
          note: "Độ phủ đo dòng đã chạy, không đo điều đã kiểm tra. Một test không có assertion vẫn làm tăng độ phủ."
        },
        {
          short: "Chập chờn",
          type: "SO SÁNH",
          tone: "warn",
          title: "Cách ly thay vì bỏ qua",
          body: "Trong <code>11</code> test chập chờn, một test thanh toán hỏng <code>4%</code> số lượt vì phụ thuộc thời gian hệ thống. Cách xử lý tệ nhất là đánh dấu bỏ qua: pipeline xanh, nhưng lỗi thật có thể đi qua. Đội mẫu chuyển sang cách ly: test vào nhóm riêng, chạy lại tối đa <code>2</code> lần, gắn tên chủ sở hữu và hạn sửa <code>7</code> ngày. Sau <code>3</code> tuần, <code>9</code> test được sửa, <code>2</code> test bị xóa vì kiểm tra thứ không còn tồn tại. Tỷ lệ hỏng giảm từ <code>4%</code> xuống <code>0,3%</code>, và niềm tin vào màu đỏ quay lại.",
          focus: ["flaky", "gate"],
          edges: ["flaky-gate", "gate-commit"],
          metrics: { "unit": "1.860 test", "tich-hop": "42 test", "e2e": "18 kịch bản", "do-phu": "không đổi" },
          changes: ["Cách ly test chập chờn", "Gắn chủ và hạn sửa 7 ngày"],
          note: "Bỏ qua test chập chờn là vay nợ: lãi suất trả bằng những sự cố không ai lần ra nguyên nhân."
        },
        {
          short: "Tóm tắt",
          type: "CHỐT",
          tone: "final",
          title: "Ba câu hỏi của một cổng",
          body: "Cổng kiểm thử tốt trả lời được ba câu: kiểm tra gì, ở tầng nào, và ngưỡng bao nhiêu. Unit test giữ tốc độ, tích hợp kiểm ranh giới, E2E bảo vệ luồng sống còn; độ phủ đặt theo nhánh; test chập chờn phải có chủ và hạn. Khi cổng chạy quá <code>5 phút</code> hoặc quá ồn, người viết sẽ tìm cách lách, và mọi con số đẹp trên dashboard trở nên vô nghĩa. Hết module nền tảng CI/CD; phần luyện tập bên dưới đưa ra ba tình huống để bạn thử quyết định.",
          focus: "all",
          edges: "all",
          metrics: { "unit": "dưới 60 giây", "tich-hop": "2 phút", "e2e": "6 phút", "do-phu": "theo nhánh" },
          changes: ["Chốt ba câu hỏi", "Chuẩn bị làm bài luyện tập"],
          note: "Hết module 01. Sang phần luyện tập để thử ba tình huống, rồi mở cheatsheet khi cần tra nhanh."
        }
      ]
    }
  });

  window.DEVLAB.practice.push(
    {
      tag: "CI/CD",
      title: "Pipeline đỏ vì test flaky bị bỏ qua",
      scenario: "Dịch vụ thanh toán chạy pipeline 26 lần mỗi ngày. Ba test kiểm tra luồng retry thanh toán thỉnh thoảng đỏ do dữ liệu thử chưa được dọn, chiếm 4% số lượt chạy. Để pipeline xanh, một kỹ sư thêm skip cho cả ba test và ghi chú sẽ sửa sau. Hai tháng sau, một lỗi retry thật lọt ra production: khách bị trừ tiền hai lần trong 18 sự cố, thiệt hại 62 triệu đồng. Nhóm vẫn giữ thói quen bỏ qua test đỏ vì tin rằng pipeline phải xanh trước khi họp. Số test bị skip tăng từ 3 lên 11.",
      metrics: [
        { label: "Test bị skip", value: "3 lên 11", danger: true },
        { label: "Lượt chạy đỏ", value: "4%" },
        { label: "Thiệt hại", value: "62 triệu đồng" }
      ],
      options: [
        "Giữ skip để pipeline xanh, chỉ chạy lại ba test khi có sự cố",
        "Xóa ba test chập chờn và thêm cảnh báo khi pipeline đỏ",
        "Cách ly ba test, chạy lại tối đa hai lần, gắn chủ sở hữu và hạn sửa 7 ngày, đồng thời cấm skip im lặng",
        "Tăng timeout pipeline lên 30 phút để test có thời gian chạy xong"
      ],
      correct: 2,
      explain: "Skip là cách xóa tín hiệu chứ không sửa nguyên nhân. Ba test đỏ 4% số lượt là dấu hiệu dữ liệu thử hoặc thời gian chờ chưa được kiểm soát, và chính vùng retry thanh toán là nơi lỗi thật dễ xuất hiện. Cách ly giữ test trong tầm nhìn: vẫn chạy trong nhóm riêng, chạy lại có giới hạn, có chủ và hạn sửa, nên không ai quên. Xóa test thì mất luôn kiểm tra; tăng timeout không làm test ổn định; giữ skip là tiếp tục che lỗi. Điều cần cấm là skip im lặng, vì nó biến pipeline xanh thành lời nói dối."
    },
    {
      tag: "ARTIFACT",
      title: "Build không tái lập vì tag latest",
      scenario: "Image của dịch vụ đơn hàng được đẩy lên registry với tag app:latest. Mỗi lần triển khai, hệ thống kéo latest nên ba lần rollout trong tuần có thể chạy ba digest khác nhau, dù cùng một quy trình phát hành. Đội triển khai 14 lần mỗi tuần và lần nào cũng kéo latest. Tuần trước, một rollback kéo latest và nhận bản mới hơn đang lỗi: 2 giờ gián đoạn, 640 đơn không tạo được. Đội phát hiện registry giữ 6 phiên bản nhưng không bản nào gắn với commit, và không ai biết bản đang chạy production được build từ đâu.",
      metrics: [
        { label: "Tag đang dùng", value: "app:latest", danger: true },
        { label: "Thời gian gián đoạn", value: "2 giờ" },
        { label: "Đơn bị ảnh hưởng", value: "640" }
      ],
      options: [
        "Gắn tag theo commit và giữ digest, triển khai đúng digest đã qua kiểm thử",
        "Đổi sang tag app:stable để ổn định hơn latest",
        "Bật cache build để mọi lần build cho cùng kết quả",
        "Build lại từ nhánh main mỗi khi cần rollback"
      ],
      correct: 0,
      explain: "Tag latest không định danh một artifact; nó chỉ là nhãn cuối cùng được đẩy lên. Rollback theo latest vì thế có thể kéo một bản chưa từng kiểm thử. Tag theo commit như a1b2c3d cho người đọc biết nguồn gốc, còn digest sha256 cho máy biết chính xác byte cần chạy. Đổi sang stable chỉ dời sự mơ hồ sang nhãn khác. Cache không bảo đảm tái lập nếu nền hoặc phụ thuộc đổi. Build lại từ main còn tệ hơn: mỗi lần rollback tạo ra một artifact mới, không phải bản đang chạy trước đó. Triển khai theo digest là cách duy nhất để rollback đúng thứ đã kiểm thử."
    },
    {
      tag: "TEST",
      title: "Coverage 90% nhưng toàn test giả",
      scenario: "Bộ test của dịch vụ giỏ hàng đạt coverage 90% trên 2.400 dòng mã. Tuy vậy, trong 6 tuần có 14 lỗi lọt production, gồm tính sai giảm giá và mất mã giảm giá khi cập nhật số lượng. Cả 14 lỗi đều lẽ ra bị test chặn. Khi mở 180 test mới, phần lớn chỉ gọi hàm rồi kiểm tra kết quả khác null, một số so sánh ảnh chụp giao diện đã lỗi thời. Nhóm tin rằng coverage cao nghĩa là an toàn nên tiếp tục nâng ngưỡng lên 95% thay vì viết lại test.",
      metrics: [
        { label: "Coverage", value: "90%", danger: true },
        { label: "Lỗi lọt", value: "14 trong 6 tuần" },
        { label: "Test mới", value: "180" }
      ],
      options: [
        "Nâng ngưỡng coverage lên 95% và thêm test cho mọi tệp",
        "Đếm assertion, thay test rỗng bằng test theo hành vi, kiểm giá trị biên và nhánh tính giảm giá",
        "Bỏ hoàn toàn coverage, chỉ đo số lượng test",
        "Chuyển toàn bộ test sang E2E để kiểm tra giao diện thật"
      ],
      correct: 1,
      explain: "Coverage đo dòng đã chạy, không đo điều đã được kiểm chứng. Một test gọi hàm rồi kiểm tra khác null vẫn phủ dòng nhưng không bảo vệ hành vi, nên 90% có thể đi kèm 14 lỗi thật. Nâng ngưỡng chỉ khuyến khích thêm test rỗng. Bỏ coverage thì mất một tín hiệu hữu ích. Chuyển hết sang E2E làm pipeline chậm và tăng test chập chờn. Cách đúng là đo chất lượng assertion, viết test theo hành vi cho tính giảm giá và cập nhật số lượng, và kiểm các giá trị biên như 0, 1 và số lượng âm."
    }
  );

  window.DEVLAB.cheatsheets.push({
    id: "pipeline",
    num: "01",
    title: "Pipeline & CI",
    intro: "Năm bảng tra nhanh cho CI/CD: YAML pipeline tối thiểu, ngân sách thời gian từng stage, lệnh docker build và push, checklist trước khi merge, cùng cách dùng tag và digest.",
    cards: [
      {
        title: "YAML pipeline tối thiểu",
        wide: true,
        html: `<pre><code>stages: [lint, test, build]

lint:
  stage: lint
  script:
    - npm ci --cache .npm
    - npm run lint
  cache:
    key: npm-$CI_COMMIT_REF_SLUG
    paths: [.npm]

test:
  stage: test
  script:
    - npm test -- --coverage
  artifacts:
    reports:
      junit: reports/junit.xml

build:
  stage: build
  script:
    - docker build -t registry.local/app:$CI_COMMIT_SHORT_SHA .
    - docker push registry.local/app:$CI_COMMIT_SHORT_SHA
  rules:
    - if: $CI_COMMIT_BRANCH == "main"</code></pre>
<p>Ba stage trả lời ba câu hỏi: mã sạch chưa, hành vi còn đúng không, đóng gói được không. Cache đặt khóa theo nhánh để không dùng lại gói của nhánh khác; build chỉ chạy trên nhánh chính.</p>`
      },
      {
        title: "Ngân sách thời gian từng stage",
        html: `<table>
<thead><tr><th>Stage</th><th>Câu hỏi</th><th>Ngân sách</th><th>Ghi chú</th></tr></thead>
<tbody>
<tr><td>Lint</td><td>Mã đúng quy ước?</td><td>38 giây</td><td>Chạy trước test</td></tr>
<tr><td>Test</td><td>Hành vi còn đúng?</td><td>3 phút</td><td>214 test</td></tr>
<tr><td>Quét bảo mật</td><td>Phụ thuộc có lỗi?</td><td>1 phút 20</td><td>1.480 gói</td></tr>
<tr><td>Build</td><td>Đóng gói được?</td><td>2 phút 40</td><td>Ba stage</td></tr>
<tr><td>Deploy</td><td>Chạy được thật?</td><td>4 phút</td><td>5% rồi 100%</td></tr>
</tbody>
</table>
<p>Tổng ngân sách nên dưới 10 phút. Stage nào vượt gấp đôi ngân sách thì tách, cache hoặc chuyển sang chạy song song. Đừng tối ưu stage 38 giây khi stage 6 phút đang giữ cả pipeline.</p>`
      },
      {
        title: "Docker build và push",
        wide: true,
        html: `<pre><code>docker build \\
  --target runtime \\
  --build-arg NODE_VERSION=20.11 \\
  -t registry.local/app:a1b2c3d \\
  -t registry.local/app:v2.4.1 .

docker push registry.local/app:a1b2c3d
docker push registry.local/app:v2.4.1

docker inspect --format '{{index .RepoDigests 0}}' \\
  registry.local/app:v2.4.1

docker pull registry.local/app@sha256:9f2c...</code></pre>
<p>Build theo stage <code>runtime</code> để bỏ stage trung gian. Gắn tag commit và tag phiên bản, đọc digest sau khi push, rồi triển khai bằng digest. Không dùng <code>latest</code> cho môi trường thật.</p>`
      },
      {
        title: "Checklist trước khi merge",
        html: `<table>
<thead><tr><th>Hạng mục</th><th>Ngưỡng</th><th>Cách kiểm</th></tr></thead>
<tbody>
<tr><td>Pipeline</td><td>Xanh trên commit mới nhất</td><td>Trạng thái lượt chạy</td></tr>
<tr><td>Độ phủ</td><td>Không giảm quá 2 điểm</td><td>So nhánh chính</td></tr>
<tr><td>Bảo mật</td><td>0 lỗi nghiêm trọng</td><td>Báo cáo quét</td></tr>
<tr><td>Artifact</td><td>Có tag commit và digest</td><td>Registry</td></tr>
<tr><td>Test bị skip</td><td>0 test không có hạn</td><td>Danh sách cách ly</td></tr>
<tr><td>Review</td><td>Ít nhất 1 người duyệt</td><td>Pull request</td></tr>
</tbody>
</table>
<p>Checklist chỉ có giá trị khi máy kiểm tra được. Hạng mục nào còn phải nhắc bằng lời thì nên chuyển thành một bước trong pipeline.</p>`
      },
      {
        title: "Tag, digest và rollback",
        html: `<pre><code>a1b2c3d        theo commit, bất biến
v2.4.1         theo phiên bản, bất biến
staging        theo môi trường, được đổi
latest         tránh dùng khi triển khai
sha256:9f2c    danh tính thật, luôn đúng</code></pre>
<p>Tag để người đọc, digest để máy chạy. Rollback đúng là kéo lại digest đã từng qua cổng kiểm thử, không phải build lại từ nhánh. Giữ artifact ít nhất 90 ngày để còn đường lùi.</p>`
      }
    ]
  });
})();
