/* DevLab — dữ liệu mô phỏng CI/CD, dung lượng và SLO. Chạy cục bộ, tất định. */
window.DEV_SEED = {
  pipeline: {
    envs: {
      dev: { label: "Development", desc: "Môi trường thử cá nhân, tự động triển khai mỗi lần đẩy mã.", approval: false },
      staging: { label: "Staging", desc: "Bản sao gần production, dùng để kiểm thử tích hợp.", approval: false },
      prod: { label: "Production", desc: "Người dùng thật. Chỉ nhận bản đã qua kiểm thử, quét và phê duyệt.", approval: true }
    },
    strategies: {
      rolling: {
        label: "Rolling",
        desc: "Thay từng pod một, giữ cụm luôn có bản phục vụ.",
        downtime: "0 giây",
        risk: 0,
        seconds: 40,
        rollback: "giữ 2 bản cũ trong 10 phút"
      },
      bluegreen: {
        label: "Blue-green",
        desc: "Dựng môi trường mới rồi chuyển toàn bộ lưu lượng.",
        downtime: "0 giây",
        risk: 1,
        seconds: 55,
        rollback: "chuyển màu ngược trong 1 phút"
      },
      recreate: {
        label: "Recreate",
        desc: "Dừng bản cũ rồi mới dựng bản mới, có khoảng trống phục vụ.",
        downtime: "20 giây",
        risk: 2,
        seconds: 20,
        rollback: "phải triển khai lại từ đầu"
      }
    },
    tests: {
      pass: { label: "24/24 đạt", desc: "Unit và tích hợp đều xanh.", seconds: 24, ok: true },
      fail: { label: "2/24 lỗi", desc: "Hai test tích hợp đỏ ở luồng thanh toán.", seconds: 18, ok: false }
    },
    scan: {
      clean: { label: "0 lỗ hổng", desc: "Không có lỗ hổng mức high trở lên.", seconds: 18, ok: true },
      high: { label: "1 lỗ hổng high", desc: "Thư viện nén cũ có lỗ hổng mức high.", seconds: 14, ok: false }
    },
    artifact: "app-1.4.2.tar.gz",
    image: "registry.local/shop:1.4.2",
    sha: "9f3c2a1",
    buildSeconds: 12,
    smokeSeconds: 10,
    devSeconds: 22
  },
  capacity: {
    maxReplicas: 50,
    cpuPerReplica: "1 vCPU / 512 MB",
    targetNote: "Mục tiêu là phần trăm CPU trung bình mỗi replica được phép dùng."
  },
  slo: {
    options: [99, 99.5, 99.9, 99.95],
    windows: [30, 90]
  },
  defaults: {
    pipeline: { env: "staging", strategy: "rolling", tests: "pass", scan: "clean" },
    capacity: { rps: 120, latency: 200, target: 0.7 },
    slo: { slo: 99.9, window: 30, downtime: 20 }
  },
  presets: {
    pipeline: [
      { id: "p-prod-rolling", label: "Prod rolling", dataset: { env: "prod", strategy: "rolling", tests: "pass", scan: "clean" } },
      { id: "p-dev-test-fail", label: "Test đỏ", dataset: { env: "dev", strategy: "rolling", tests: "fail", scan: "clean" } },
      { id: "p-scan-high", label: "Có lỗ hổng", dataset: { env: "staging", strategy: "rolling", tests: "pass", scan: "high" } },
      { id: "p-prod-recreate", label: "Prod recreate", dataset: { env: "prod", strategy: "recreate", tests: "pass", scan: "clean" } },
      { id: "p-bluegreen", label: "Prod blue-green", dataset: { env: "prod", strategy: "bluegreen", tests: "pass", scan: "clean" } }
    ],
    capacity: [
      { id: "c-normal", label: "120 req/s", dataset: { rps: 120, latency: 200, target: 0.7 } },
      { id: "c-tight", label: "Sát tải", dataset: { rps: 160, latency: 200, target: 0.8 } },
      { id: "c-over", label: "Vượt trần", dataset: { rps: 900, latency: 200, target: 0.7 } },
      { id: "c-slow", label: "Latency cao", dataset: { rps: 120, latency: 500, target: 0.6 } }
    ],
    slo: [
      { id: "s-ok", label: "Trong ngân sách", dataset: { slo: 99.9, window: 30, downtime: 20 } },
      { id: "s-breach", label: "Vượt ngân sách", dataset: { slo: 99.9, window: 30, downtime: 60 } },
      { id: "s-loose", label: "SLO 99,5%", dataset: { slo: 99.5, window: 30, downtime: 60 } }
    ]
  },
  examples: [
    { id: "e-prod-rolling", kind: "pipeline", label: "Prod rolling", dataset: { env: "prod", strategy: "rolling", tests: "pass", scan: "clean" } },
    { id: "e-prod-recreate", kind: "pipeline", label: "Prod recreate bị chặn", dataset: { env: "prod", strategy: "recreate", tests: "pass", scan: "clean" } },
    { id: "e-cap-normal", kind: "capacity", label: "120 req/s", dataset: { rps: 120, latency: 200, target: 0.7 } },
    { id: "e-cap-over", kind: "capacity", label: "900 req/s vượt trần", dataset: { rps: 900, latency: 200, target: 0.7 } },
    { id: "e-slo-ok", kind: "slo", label: "20 phút downtime", dataset: { slo: 99.9, window: 30, downtime: 20 } },
    { id: "e-slo-breach", kind: "slo", label: "60 phút downtime", dataset: { slo: 99.9, window: 30, downtime: 60 } }
  ],
  missions: [
    {
      id: "m-pipe-deploy",
      kind: "pipeline",
      title: "Triển khai production an toàn",
      prompt: "Chọn cấu hình triển khai production không gián đoạn, với bộ test đạt và bản quét sạch. Mục tiêu là pipeline kết thúc ở trạng thái đã triển khai.",
      metric: "status",
      expect: 1,
      hint: "Production cần chiến lược không downtime: rolling hoặc blue-green. Recreate bị chính sách chặn.",
      dataset: { env: "prod", strategy: "rolling", tests: "pass", scan: "clean" }
    },
    {
      id: "m-pipe-test",
      kind: "pipeline",
      title: "Dừng đúng ở cổng test",
      prompt: "Nạp đề có test đỏ. Pipeline phải dừng ngay tại bước kiểm thử, không chạy tiếp quét hay triển khai.",
      metric: "stage",
      expect: 2,
      hint: "Bước test là stage số 2 sau build. Khi test lỗi, các bước sau bị bỏ qua.",
      dataset: { env: "dev", strategy: "rolling", tests: "fail", scan: "clean" }
    },
    {
      id: "m-pipe-policy",
      kind: "pipeline",
      title: "Chính sách chặn recreate",
      prompt: "Nạp đề production dùng recreate. Dù test và quét đều đạt, pipeline phải bị chặn ở bước triển khai vì gây downtime.",
      metric: "stage",
      expect: 4,
      hint: "Bước triển khai là stage 4. Production không chấp nhận recreate vì có khoảng trống 20 giây.",
      dataset: { env: "prod", strategy: "recreate", tests: "pass", scan: "clean" }
    },
    {
      id: "m-cap-replicas",
      kind: "capacity",
      title: "Tính đúng số replica",
      prompt: "Với 120 request/giây, độ trễ 200 ms và mục tiêu CPU 70%, hệ thống cần bao nhiêu replica? Chạy mô phỏng và kiểm tra con số.",
      metric: "replicas",
      expect: 35,
      hint: "Mỗi replica phục vụ được 1000 / 200 × 0,7 = 3,5 request/giây. Làm tròn lên khi chia 120.",
      dataset: { rps: 120, latency: 200, target: 0.7 }
    },
    {
      id: "m-cap-over",
      kind: "capacity",
      title: "Nhận ra vượt trần cụm",
      prompt: "Nạp đề 900 request/giây. Cụm chỉ cho tối đa 50 replica, nên mô phỏng phải báo trạng thái thiếu năng lực.",
      metric: "state",
      expect: 0,
      hint: "Cần 258 replica nhưng trần là 50. Kết quả state bằng 0 nghĩa là không đủ.",
      dataset: { rps: 900, latency: 200, target: 0.7 }
    },
    {
      id: "m-slo-budget",
      kind: "slo",
      title: "Ngân sách lỗi còn lại",
      prompt: "SLO 99,9% trong cửa sổ 30 ngày, đã có 20 phút downtime. Chạy mô phỏng và đọc số phút ngân sách còn lại.",
      metric: "budget",
      expect: 23.2,
      hint: "30 ngày có 43.200 phút. 0,1% của 43.200 là 43,2 phút cho phép; trừ 20 phút đã dùng.",
      dataset: { slo: 99.9, window: 30, downtime: 20 }
    }
  ]
};
