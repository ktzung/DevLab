/* DevLab — dữ liệu khóa DevOps, phần 2: hạ tầng và triển khai */
window.DEVLAB = window.DEVLAB || { modules: [], lessons: {}, practice: [], cheatsheets: [] };

(function () {
  "use strict";

  window.DEVLAB.modules.push({
    id: "ha-tang-trien-khai",
    num: "02",
    title: "Hạ tầng & triển khai",
    tone: "mint",
    blurb: "Module này đi từ câu hỏi cụ thể: vì sao image 1,2 GB làm deploy chậm 6 phút? Bạn sẽ so container với máy ảo, đọc một manifest Kubernetes và chọn đúng chiến lược triển khai cho 12.000 phiên truy cập mỗi giờ.",
    lessons: ["container-vm", "orchestration", "deploy-strategy"]
  });

  Object.assign(window.DEVLAB.lessons, {
    /* ------------------------------------------------------------------
       Bài 1: container và máy ảo
       ------------------------------------------------------------------ */
    "container-vm": {
      id: "container-vm",
      module: "ha-tang-trien-khai",
      title: "Container và máy ảo",
      shortTitle: "Container vs VM",
      subtitle: "Container không phải máy ảo thu nhỏ: nó là tiến trình được nhân Linux cô lập. Bài này bóc một image 1,2 GB thành sáu lớp và chỉ ra lúc nào vẫn nên dùng máy ảo.",
      blurb: "Từ Dockerfile đến container chạy trong 0,8 giây, kèm so sánh chi phí thật với máy ảo.",
      duration: "13 phút",
      level: "Cơ bản",
      tags: ["container", "image", "layer", "kernel", "docker"],
      metrics: [
        { key: "image", label: "Dung lượng image", tone: "coral" },
        { key: "boot", label: "Khởi động", tone: "green" },
        { key: "shared", label: "Nhân dùng chung", tone: "blue" },
        { key: "mem", label: "RAM mỗi instance", tone: "violet" }
      ],
      nodes: [
        { id: "src", type: "code", x: 55, y: 80, w: 200, h: 70, label: "Mã nguồn", sub: "12 tệp, 3 MB" },
        { id: "dockerfile", type: "file", x: 340, y: 80, w: 200, h: 70, label: "Dockerfile", sub: "FROM node:20-slim" },
        { id: "image", type: "layers", x: 625, y: 80, w: 200, h: 70, label: "Image 6 lớp", sub: "1,2 GB" },
        { id: "daemon", type: "server", x: 340, y: 195, w: 200, h: 70, label: "Docker daemon", sub: "nhận image, tạo tiến trình" },
        { id: "container", type: "task", x: 55, y: 310, w: 200, h: 70, label: "Container", sub: "0,8 giây, 40 MB" },
        { id: "host", type: "grid", x: 340, y: 310, w: 200, h: 70, label: "Nhân Linux chủ", sub: "một nhân cho mọi container" },
        { id: "vm", type: "grid", x: 625, y: 310, w: 200, h: 70, label: "Máy ảo", sub: "45 giây, 2 GB" }
      ],
      edges: [
        { id: "src-dockerfile", from: "src", to: "dockerfile", kind: "request", label: "docker build -t api:1.4" },
        { id: "dockerfile-image", from: "dockerfile", to: "image", kind: "data", label: "đóng gói 6 lớp" },
        { id: "image-daemon", from: "image", to: "daemon", kind: "control", label: "docker pull" },
        { id: "daemon-container", from: "daemon", to: "container", kind: "control", label: "docker run -p 3000" },
        { id: "image-vm", from: "image", to: "vm", kind: "data", label: "xuất đĩa qcow2" },
        { id: "container-host", from: "container", to: "host", kind: "data", label: "syscall tới nhân" },
        { id: "vm-host", from: "vm", to: "host", kind: "response", label: "nhân riêng 2 GB" }
      ],
      learn: [
        "Container chia sẻ nhân Linux với máy chủ nên khởi động dưới 1 giây và chỉ tốn vài chục MB RAM.",
        "Image là chồng lớp chỉ đọc, và thứ tự lệnh trong Dockerfile quyết định lớp nào được cache.",
        "Máy ảo mang theo cả hệ điều hành riêng nên nặng khoảng 2 GB và mất 45 giây để boot.",
        "Chỉ nên dùng máy ảo khi cần nhân khác hoặc cần ranh giới bảo mật dày hơn container."
      ],
      steps: [
        {
          short: "Đóng gói",
          type: "Đóng gói",
          title: "Dockerfile biến mã nguồn thành lớp",
          body: `Trước khi có container, mỗi lần đổi máy bạn phải cài lại Node đúng bản 20.11 rồi cài 480 gói trong <code>node_modules</code>. Dockerfile ghi lại toàn bộ việc đó thành lệnh: <code>FROM node:20-slim</code> lấy hệ điều hành tối giản, <code>COPY package.json</code> chép hai tệp khai báo, <code>RUN npm ci</code> cài đúng 480 gói theo lockfile, cuối cùng <code>CMD ["node","server.js"]</code> là lệnh chạy. Mỗi lệnh tạo một lớp chỉ đọc và Docker cache theo thứ tự, nên khi sửa một tệp trong thư mục <code>src</code>, chỉ các lớp sau <code>COPY src</code> phải chạy lại: khoảng 6 giây thay vì 3 phút. Đó là lý do thứ tự lệnh quan trọng hơn số lệnh.`,
          focus: ["src", "dockerfile"],
          edges: ["src-dockerfile"],
          metrics: { image: "0 MB, chỉ mã nguồn", boot: "chưa có", shared: "chưa xác định", mem: "chưa cấp" },
          changes: [
            "12 tệp rời rạc trở thành một quy trình lặp lại được",
            "Mỗi lệnh trong Dockerfile sinh một lớp có thể cache"
          ],
          note: "Chép <code>package.json</code> trước khi chép <code>src</code> để lớp cài gói không bị vô hiệu mỗi lần sửa code."
        },
        {
          short: "Sáu lớp",
          type: "Build",
          title: "Sáu lớp cộng lại thành 1,2 GB",
          body: `Một image Node thực tế thường có sáu lớp: <code>node:20-slim</code> chiếm 950 MB, <code>apt-get install</code> thêm 90 MB, <code>npm ci</code> 210 MB, mã nguồn 3 MB, tệp cấu hình 1 MB và metadata vài KB. Tổng cộng 1,2 GB, trong đó phần bạn thật sự viết chỉ 4 MB, tức 0,3%. Mỗi lần push lên registry nội bộ mất 6 phút với đường truyền 30 Mbps, và mỗi node phải kéo lại đủ 1,2 GB trước khi chạy. Vì lớp là chỉ đọc và dùng chung, hai image cùng base sẽ chia sẻ 950 MB đầu tiên, nên image thứ hai chỉ tốn thêm 214 MB. Hiểu cấu trúc lớp giúp bạn biết chỗ nào đáng cắt: base image luôn là ứng viên số một.`,
          focus: ["dockerfile", "image"],
          edges: ["dockerfile-image"],
          metrics: { image: "1,2 GB", boot: "chưa chạy", shared: "dùng chung base", mem: "chưa cấp" },
          changes: [
            "Image tăng từ 0 lên 1,2 GB sau khi build",
            "Thời gian push lên registry là 6 phút mỗi lần"
          ],
          note: "Dùng <code>docker history</code> để xem lớp nào nặng nhất trước khi tối ưu."
        },
        {
          short: "Chạy",
          type: "Chạy",
          title: "Container chỉ là tiến trình có ranh giới",
          body: `Khi bạn gõ <code>docker run -p 3000:3000 api:1.4</code>, Docker không bật một hệ điều hành mới. Nó tạo tiến trình <code>node server.js</code> bình thường trên máy chủ, rồi bọc tiến trình đó bằng hai cơ chế của nhân Linux: namespace che tầm nhìn về tiến trình, mạng và tệp; cgroup giới hạn tài nguyên. Vì không phải boot, container sẵn sàng sau 0,8 giây và chỉ chiếm 40 MB RAM cho một API Node nhỏ. Bạn đặt <code>--cpus=0.25</code> và <code>--memory=256m</code> để nó không ăn quá tài nguyên của máy. Đổi lại, mọi container dùng chung một nhân: một lỗ hổng nhân ảnh hưởng tất cả, và bạn không thể chạy nhân Windows trong container Linux.`,
          focus: ["image", "daemon", "container"],
          edges: ["image-daemon", "daemon-container"],
          metrics: { image: "1,2 GB", boot: "0,8 giây", shared: "1 nhân chủ", mem: "40 MB" },
          changes: [
            "Image chỉ đọc biến thành tiến trình đang chạy",
            "Tài nguyên bị chặn ở 0,25 CPU và 256 Mi RAM"
          ],
          note: "Container không có kernel riêng: <code>uname -r</code> trong container trả về đúng nhân của máy chủ."
        },
        {
          short: "So sánh",
          type: "So sánh",
          title: "Máy ảo mang theo cả hệ điều hành",
          body: `Máy ảo đi theo hướng ngược lại. Hypervisor chia phần cứng thành các máy độc lập, mỗi máy cài hệ điều hành đầy đủ, có nhân riêng, driver riêng và đĩa <code>qcow2</code> 2 GB. Vì phải boot cả hệ điều hành, một máy ảo mất khoảng 45 giây để sẵn sàng và ngốn 1,5 GB RAM khi rảnh. Đổi lại, bạn có ranh giới bảo mật dày hơn và chạy được bất kỳ nhân nào. Một máy chủ 16 vCPU, 64 GB RAM chỉ nuôi được 8 máy ảo 4 vCPU, trong khi cùng máy đó chạy được 120 container 0,25 vCPU. Bài toán không phải cái nào tốt hơn, mà là bạn cần cô lập ở mức tiến trình hay mức phần cứng.`,
          focus: ["image", "vm", "host"],
          edges: ["image-vm", "vm-host"],
          metrics: { image: "1,2 GB đĩa qcow2", boot: "45 giây", shared: "nhân riêng", mem: "1,5 GB khi rảnh" },
          changes: [
            "Cùng một image có thể chạy thành đĩa máy ảo",
            "Mật độ giảm từ 120 container xuống 8 máy ảo"
          ],
          note: "Máy ảo hợp với Windows, SQL Server hoặc yêu cầu tuân thủ cần cách ly phần cứng."
        },
        {
          short: "Tối ưu",
          type: "Tối ưu",
          title: "Chọn đúng ranh giới cho từng việc",
          tone: "final",
          body: `Bước cuối là cắt bớt. Multi-stage build dùng stage <code>build</code> để biên dịch rồi chỉ chép kết quả sang stage runtime, nhờ vậy image giảm từ 1,2 GB xuống 180 MB, thời gian kéo trên mỗi node từ 6 phút còn 50 giây. Thêm <code>.dockerignore</code> để loại <code>node_modules</code> và tệp log, đặt <code>USER node</code> để không chạy bằng root, ghim phiên bản base thay vì <code>latest</code>. Kết quả: container khởi động 0,6 giây và ăn 38 MB RAM. Vẫn giữ máy ảo cho những việc cần nhân khác hoặc cần cách ly mạnh. Chọn ranh giới theo nhu cầu, không theo thói quen.`,
          focus: "all",
          edges: "all",
          metrics: { image: "180 MB", boot: "0,6 giây", shared: "1 nhân chủ", mem: "38 MB" },
          changes: [
            "Image giảm 85%, thời gian kéo còn 50 giây",
            "Tiến trình chạy bằng user thường thay vì root",
            "Máy ảo chỉ còn dùng cho ca cần nhân riêng"
          ],
          note: "Mục tiêu không phải image nhỏ nhất mà là image đủ nhỏ để deploy nhanh và vá bảo mật kịp."
        }
      ]
    },

    /* ------------------------------------------------------------------
       Bài 2: Kubernetes
       ------------------------------------------------------------------ */
    orchestration: {
      id: "orchestration",
      module: "ha-tang-trien-khai",
      title: "Điều phối bằng Kubernetes",
      shortTitle: "Kubernetes",
      subtitle: "Kubernetes không chạy container, nó giữ trạng thái mong muốn. Bạn sẽ theo một manifest đi qua Deployment, ReplicaSet, scheduler và Service để thấy ai làm việc gì.",
      blurb: "Sáu pod, ba node và một vòng lặp điều hoà: cách Kubernetes tự sửa mình khi có sự cố.",
      duration: "13 phút",
      level: "Trung cấp",
      tags: ["kubernetes", "pod", "deployment", "service", "hpa"],
      metrics: [
        { key: "pod", label: "Số pod mong muốn", tone: "blue" },
        { key: "ready", label: "Pod sẵn sàng", tone: "green" },
        { key: "rollout", label: "Thời gian rollout", tone: "yellow" },
        { key: "error", label: "Tỉ lệ lỗi 5xx", tone: "coral" }
      ],
      nodes: [
        { id: "dev", type: "user", x: 55, y: 80, w: 200, h: 70, label: "Lập trình viên", sub: "kubectl apply" },
        { id: "deploy", type: "file", x: 340, y: 80, w: 200, h: 70, label: "Deployment", sub: "replicas: 6" },
        { id: "rs", type: "layers", x: 625, y: 80, w: 200, h: 70, label: "ReplicaSet", sub: "api-5f9c7" },
        { id: "hpa", type: "bolt", x: 340, y: 195, w: 200, h: 70, label: "HPA", sub: "CPU 70% lên 12 pod" },
        { id: "svc", type: "route", x: 55, y: 310, w: 200, h: 70, label: "Service", sub: "10.96.0.12:80" },
        { id: "pod", type: "task", x: 340, y: 310, w: 200, h: 70, label: "Pod", sub: "0,25 CPU, 256Mi" },
        { id: "node", type: "server", x: 625, y: 310, w: 200, h: 70, label: "Node", sub: "3 node, 4 vCPU" }
      ],
      edges: [
        { id: "dev-deploy", from: "dev", to: "deploy", kind: "request", label: "kubectl apply -f" },
        { id: "deploy-rs", from: "deploy", to: "rs", kind: "control", label: "tạo 6 pod" },
        { id: "rs-pod", from: "rs", to: "pod", kind: "control", label: "đặt pod lên node" },
        { id: "pod-node", from: "pod", to: "node", kind: "data", label: "0,25 CPU, 256Mi" },
        { id: "svc-pod", from: "svc", to: "pod", kind: "request", label: "800 req/s" },
        { id: "hpa-deploy", from: "hpa", to: "deploy", kind: "control", label: "scale 6 lên 12" },
        { id: "pod-hpa", from: "pod", to: "hpa", kind: "data", label: "CPU 78%" }
      ],
      learn: [
        "Bạn khai báo trạng thái mong muốn, còn vòng lặp điều hoà tự tạo hoặc xoá pod để đạt trạng thái đó.",
        "Deployment sinh ReplicaSet, ReplicaSet giữ số pod, còn scheduler quyết định pod chạy trên node nào.",
        "Service giữ một địa chỉ ổn định trong khi IP của pod đổi liên tục sau mỗi lần khởi động lại.",
        "HPA chỉ tính được phần trăm CPU khi mọi container khai báo resources.requests."
      ],
      steps: [
        {
          short: "Khai báo",
          type: "Khai báo",
          title: "kubectl apply ghi trạng thái mong muốn",
          body: `Bạn viết một tệp <code>deployment.yaml</code> khai báo 6 bản sao của image <code>api:1.4</code>, rồi gõ <code>kubectl apply -f deployment.yaml</code>. Lệnh này không tạo pod nào cả. Nó gửi manifest tới API server, server kiểm tra schema và ghi vào etcd trạng thái mong muốn: 6 pod, mỗi pod 0,25 CPU và 256 Mi RAM. Từ đây Kubernetes chạy vòng lặp điều hoà, so sánh trạng thái thực với trạng thái mong muốn rồi hành động. Nếu ai đó xoá một pod, vòng lặp tạo lại trong 2 giây. Nếu bạn sửa số bản sao thành 9, nó tạo thêm 3 pod. Bạn không ra lệnh từng bước, bạn khai báo kết quả cuối cùng và để hệ thống tự tìm đường.`,
          focus: ["dev", "deploy"],
          edges: ["dev-deploy"],
          metrics: { pod: "6", ready: "0/6", rollout: "chưa bắt đầu", error: "0%" },
          changes: [
            "Manifest được lưu vào etcd thay vì chỉ nằm trên máy bạn",
            "Cụm bắt đầu hướng tới 6 pod mong muốn"
          ],
          note: "Sửa manifest rồi apply lại là cách chuẩn; sửa trực tiếp bằng <code>kubectl edit</code> sẽ bị lần apply sau ghi đè."
        },
        {
          short: "ReplicaSet",
          type: "Điều hoà",
          title: "Deployment tạo ReplicaSet giữ đúng 6 pod",
          body: `Deployment không quản pod trực tiếp. Nó tạo một ReplicaSet, ở đây là <code>api-5f9c7</code>, và ReplicaSet giữ đúng 6 pod. Mỗi lần bạn đổi image, Deployment tạo ReplicaSet mới với hash khác, ví dụ <code>api-7d2b4</code>, rồi chuyển dần pod sang bản mới. Cách chia tầng này cho bạn lịch sử: <code>kubectl rollout history</code> liệt kê từng lần phát hành, và <code>kubectl rollout undo</code> quay lại ReplicaSet cũ trong khoảng 20 giây. Tên pod luôn kèm hash và số ngẫu nhiên, ví dụ <code>api-5f9c7-8kx2p</code>, vì pod là thứ dùng một lần: chết là bỏ, không sửa. Hiểu tầng này giúp bạn đọc đúng thứ tự khi debug.`,
          focus: ["deploy", "rs"],
          edges: ["deploy-rs"],
          metrics: { pod: "6", ready: "0/6", rollout: "0 giây", error: "0%" },
          changes: [
            "Một ReplicaSet mới xuất hiện với hash riêng",
            "Pod được đặt tên kèm hash để phân biệt phiên bản"
          ],
          note: "Đừng xoá ReplicaSet bằng tay: Deployment sẽ tạo lại ngay và bạn mất dấu vết lịch sử."
        },
        {
          short: "Xếp lịch",
          type: "Lập lịch",
          title: "Scheduler chọn node, kubelet kéo image",
          body: `Pod mới ở trạng thái Pending chờ scheduler. Scheduler nhìn 3 node, mỗi node còn 1,8 vCPU và 6 GB RAM, rồi đặt pod vào node ít tải nhất. Kubelet trên node đó kéo image 1,2 GB mất 25 giây, khởi động container, sau đó chạy <code>readinessProbe</code> gọi <code>/healthz</code> mỗi 5 giây. Chỉ khi probe trả 200, pod mới được tính là sẵn sàng và nhận lưu lượng. Nếu bạn quên khai báo <code>resources.requests</code>, scheduler không biết pod cần bao nhiêu, có thể nhồi 20 pod lên một node và tất cả cùng chậm. Đây là lỗi phổ biến nhất khi mới dùng Kubernetes, và cũng là lý do HPA về sau không hoạt động.`,
          focus: ["rs", "pod", "node"],
          edges: ["rs-pod", "pod-node"],
          metrics: { pod: "6", ready: "4/6", rollout: "đang chờ probe", error: "0%" },
          changes: [
            "Pod chuyển từ Pending sang Running trên 3 node",
            "Chỉ pod qua readinessProbe mới vào danh sách phục vụ"
          ],
          note: "Readiness probe sai đường dẫn khiến pod chạy nhưng không bao giờ nhận traffic: kiểm tra <code>kubectl describe pod</code>."
        },
        {
          short: "Service",
          type: "Định tuyến",
          title: "Service giữ địa chỉ khi pod đổi liên tục",
          body: `Service là địa chỉ ổn định cho một nhóm pod luôn đổi. Bạn khai báo kiểu <code>ClusterIP</code>, Kubernetes cấp cho nó IP 10.96.0.12 và tên <code>api.default.svc</code>. Khi pod chết và sinh pod mới với IP khác, Service vẫn giữ nguyên địa chỉ, chỉ cập nhật danh sách endpoint. Ở tầng dưới, kube-proxy viết luật iptables để chia gói tin tới 6 pod theo kiểu round robin. Với 800 request mỗi giây, mỗi pod nhận khoảng 133 request và độ trễ p95 khoảng 40 ms. Bạn không cần biết IP của pod, chỉ cần gọi tên Service. Đó là lý do service discovery là phần không thể thiếu của mọi cụm, và cũng là chỗ hay gặp lỗi khi selector không khớp nhãn.`,
          focus: ["svc", "pod"],
          edges: ["svc-pod"],
          metrics: { pod: "6", ready: "6/6", rollout: "hoàn tất", error: "0,02%" },
          changes: [
            "Lưu lượng 800 req/s được chia đều cho 6 pod",
            "Pod chết được thay thế mà địa chỉ Service không đổi"
          ],
          note: "Selector của Service phải khớp nhãn trong template của Deployment, nếu không endpoints sẽ rỗng."
        },
        {
          short: "Rollout",
          type: "Phát hành",
          title: "Rolling update không làm rơi request nào",
          tone: "final",
          body: `Phát hành bản mới là lúc Kubernetes thể hiện rõ nhất. Với <code>maxSurge: 1</code> và <code>maxUnavailable: 0</code>, nó tạo thêm một pod mới, chờ pod đó sẵn sàng rồi mới xoá một pod cũ; lặp lại 6 lần mất 42 giây và không có giây nào thiếu pod phục vụ. Nếu probe của bản mới fail, rollout dừng giữa đường và bạn có 5 phút để chạy <code>rollout undo</code>. Khi tải tăng, HPA đọc CPU trung bình 78% so với ngưỡng 70% và nâng từ 6 lên 12 pod trong 90 giây. Tất cả chỉ hoạt động nếu mỗi pod khai báo <code>resources.requests</code>, vì đó là mẫu số để tính phần trăm.`,
          focus: "all",
          edges: "all",
          metrics: { pod: "12 nhờ HPA", ready: "12/12", rollout: "42 giây", error: "0,02%" },
          changes: [
            "Số pod tăng từ 6 lên 12 khi CPU vượt 70%",
            "Rollout 42 giây với 0 giây thiếu pod phục vụ",
            "Bản cũ vẫn còn trong lịch sử để rollback"
          ],
          note: "Luôn đặt <code>maxUnavailable: 0</code> cho API quan trọng, và kiểm tra <code>kubectl rollout status</code> trong pipeline."
        }
      ]
    },

    /* ------------------------------------------------------------------
       Bài 3: chiến lược triển khai
       ------------------------------------------------------------------ */
    "deploy-strategy": {
      id: "deploy-strategy",
      module: "ha-tang-trien-khai",
      title: "Chiến lược triển khai",
      shortTitle: "Deploy strategy",
      subtitle: "Recreate rẻ nhưng mất 90 giây gián đoạn, canary an toàn nhưng cần metrics đủ nhanh. Bài này chọn chiến lược theo rủi ro và chuẩn bị đường rollback trước khi bấm deploy.",
      blurb: "Bốn chiến lược phát hành, một câu hỏi chung: ai chịu downtime và rollback mất bao lâu.",
      duration: "13 phút",
      level: "Trung cấp",
      tags: ["blue-green", "canary", "rollback", "rolling", "migration"],
      metrics: [
        { key: "canary", label: "Lưu lượng canary", tone: "yellow" },
        { key: "error", label: "Tỉ lệ lỗi", tone: "coral" },
        { key: "latency", label: "Độ trễ p95", tone: "violet" },
        { key: "back", label: "Thời gian rollback", tone: "green" }
      ],
      nodes: [
        { id: "user", type: "user", x: 55, y: 80, w: 200, h: 70, label: "Người dùng", sub: "12.000 phiên mỗi giờ" },
        { id: "lb", type: "gateway", x: 340, y: 80, w: 200, h: 70, label: "Load balancer", sub: "chia 90/10 rồi 50/50" },
        { id: "blue", type: "task", x: 625, y: 80, w: 200, h: 70, label: "Blue v1.3", sub: "6 pod, ổn định" },
        { id: "rollback", type: "alert", x: 340, y: 195, w: 200, h: 70, label: "Rollback", sub: "về blue sau 90 giây" },
        { id: "db", type: "disk", x: 55, y: 310, w: 200, h: 70, label: "Migration DB", sub: "thêm cột, 4 phút" },
        { id: "metrics", type: "signal", x: 340, y: 310, w: 200, h: 70, label: "Metrics", sub: "lỗi 2,4%, p95 340ms" },
        { id: "green", type: "task", x: 625, y: 310, w: 200, h: 70, label: "Green v1.4", sub: "6 pod, 2 phút" }
      ],
      edges: [
        { id: "user-lb", from: "user", to: "lb", kind: "request", label: "12.000 phiên mỗi giờ" },
        { id: "lb-blue", from: "lb", to: "blue", kind: "request", label: "giữ 90% lưu lượng" },
        { id: "lb-green", from: "lb", to: "green", kind: "request", label: "đẩy 10% canary" },
        { id: "green-metrics", from: "green", to: "metrics", kind: "data", label: "lỗi 2,4%, p95 340ms" },
        { id: "metrics-rollback", from: "metrics", to: "rollback", kind: "control", label: "lỗi vượt 2%" },
        { id: "rollback-lb", from: "rollback", to: "lb", kind: "control", label: "gạt 100% về blue" },
        { id: "db-rollback", from: "db", to: "rollback", kind: "control", label: "chạy trước 4 phút" }
      ],
      learn: [
        "Bốn chiến lược khác nhau ở ba điểm: có downtime hay không, tốn bao nhiêu tài nguyên dư và rollback mất bao lâu.",
        "Blue-green đổi màu bằng load balancer nên rollback tính bằng giây, nhưng phải trả gấp đôi hạ tầng trong lúc chuyển.",
        "Canary giới hạn thiệt hại ở tỉ lệ lưu lượng thử, đổi lại bạn cần metrics và điều kiện dừng viết sẵn.",
        "Migration phải tương thích ngược với cả hai phiên bản, nếu không rollback code vẫn để lại dữ liệu hỏng."
      ],
      steps: [
        {
          short: "Bốn lựa chọn",
          type: "So sánh",
          title: "Bốn chiến lược, một câu hỏi: ai chịu downtime",
          body: `Có bốn cách đưa phiên bản mới lên. Recreate tắt hết bản cũ rồi bật bản mới: đơn giản, rẻ, nhưng 12.000 phiên mất kết nối trong 90 giây. Rolling thay từng pod với <code>maxUnavailable: 1</code>: không downtime, nhưng hai phiên bản cùng chạy nên API và schema phải tương thích. Blue-green dựng cả môi trường mới song song rồi gạt công tắc: rollback trong 90 giây, nhưng tốn gấp đôi tài nguyên. Canary đẩy 5 đến 10% lưu lượng sang bản mới, quan sát lỗi rồi mới tăng dần. Không có lựa chọn đúng cho mọi nơi: hệ thống 200 người dùng nội bộ dùng recreate là đủ, hệ thống thanh toán cần canary.`,
          focus: ["user", "lb", "blue", "green"],
          edges: ["user-lb", "lb-blue", "lb-green"],
          metrics: { canary: "0%", error: "0,1%", latency: "180 ms", back: "chưa có" },
          changes: [
            "Chọn chiến lược theo mức chịu downtime của nghiệp vụ",
            "Xác định trước ngân sách tài nguyên dư cho lúc chuyển"
          ],
          note: "Ghi rõ trong runbook: downtime cho phép bao nhiêu giây, rollback phải xong trong bao lâu."
        },
        {
          short: "Blue-green",
          type: "Phát hành",
          title: "Dựng môi trường xanh song song",
          body: `Blue-green bắt đầu bằng việc dựng môi trường xanh bằng <code>kubectl apply</code> chạy song song với xanh dương, cùng cấu hình, cùng 6 pod, tốn thêm 1,8 GB RAM và 6 vCPU. Bản xanh dương v1.3 vẫn phục vụ 100% lưu lượng. Bạn chạy smoke test 40 ca trên bản xanh: đăng nhập, thanh toán, tìm kiếm. Khi mọi thứ đạt, load balancer chuyển 100% lưu lượng sang xanh trong 3 giây, vì chỉ cần đổi trọng số từ 0 sang 1. Người dùng không thấy gián đoạn. Nhưng nếu bản xanh lỗi, bạn phải có đường về: giữ xanh dương nguyên vẹn ít nhất 24 giờ thay vì tắt ngay để tiết kiệm chi phí.`,
          focus: ["lb", "blue", "green"],
          edges: ["lb-blue", "lb-green"],
          metrics: { canary: "100% sau 3 giây", error: "0,1%", latency: "180 ms", back: "3 giây" },
          changes: [
            "Cả hai môi trường cùng chạy, tốn thêm 6 vCPU",
            "Load balancer đổi trọng số thay vì khởi động lại"
          ],
          note: "Đừng tắt môi trường cũ ngay: chi phí 24 giờ rẻ hơn nhiều so với một lần rollback thất bại."
        },
        {
          short: "Canary",
          type: "Phát hành",
          title: "Cho 10% người dùng thử trước",
          body: `Canary chia lưu lượng theo tỉ lệ thay vì gạt công tắc. Bạn đưa 10% trong 12.000 phiên, tức 1.200 người dùng, sang bản v1.4 và giữ 90% ở bản cũ. Trong 30 phút đầu, theo dõi ba chỉ số: tỉ lệ lỗi 5xx, độ trễ p95 và tỉ lệ bỏ giỏ hàng. Nếu lỗi vượt 2% hoặc p95 vượt 300 ms, tự động hạ <code>weight</code> về 0%. Nếu ổn, tăng lên 25%, rồi 50%, rồi 100%, mỗi nấc cách nhau 30 phút. Cái hay là thiệt hại tối đa chỉ 10% người dùng, nhưng cái khó là bạn phải có metrics đủ nhanh và đủ tin để dám dừng.`,
          focus: ["lb", "green", "metrics"],
          edges: ["lb-green", "green-metrics"],
          metrics: { canary: "10%, 1.200 phiên", error: "2,4%", latency: "340 ms", back: "chưa kích hoạt" },
          changes: [
            "10% lưu lượng đi sang bản mới, 90% giữ nguyên",
            "Điều kiện dừng được viết thành luật tự động"
          ],
          note: "Canary không có ý nghĩa nếu dashboard trễ 15 phút: metrics phải tươi dưới 1 phút."
        },
        {
          short: "Migration",
          type: "Dữ liệu",
          title: "Migration phải chạy trước khi đổi màu",
          body: `Migration là chỗ blue-green và canary hay vỡ. Bản v1.4 cần cột <code>discount_code</code>, nhưng bản v1.3 đang chạy vẫn ghi vào bảng cũ. Nếu bạn thêm cột <code>NOT NULL</code> không có giá trị mặc định, mọi lệnh insert của v1.3 fail ngay và tỉ lệ lỗi nhảy từ 0,1% lên 34%. Cách an toàn là expand rồi contract: thêm cột cho phép null, deploy code đọc và ghi cả hai nơi, backfill 2,4 triệu dòng trong 4 phút, sau khi bản cũ biến mất mới thêm ràng buộc. Mỗi bước phải chạy được với cả hai phiên bản cùng lúc.`,
          focus: ["db", "green", "metrics"],
          edges: ["db-rollback", "green-metrics"],
          metrics: { canary: "10% đang chạy", error: "34%", latency: "340 ms", back: "90 giây nhưng vẫn lỗi" },
          changes: [
            "Schema đổi theo ba bước thay vì một lệnh alter",
            "Backfill 2,4 triệu dòng chạy trước khi chuyển màu"
          ],
          note: "Quy tắc expand-contract: mỗi thay đổi schema phải đọc được bởi cả bản cũ và bản mới."
        },
        {
          short: "Rollback",
          type: "Ứng cứu",
          title: "Rollback là tính năng, không phải may mắn",
          tone: "final",
          body: `Rollback phải là một nút bấm, không phải một cuộc họp. Trước khi phát hành, bạn ghi rõ điều kiện dừng: lỗi 5xx vượt 2% trong 5 phút, hoặc p95 vượt 300 ms, hoặc một alert thanh toán. Khi điều kiện đó bật, lệnh <code>rollback</code> trả 100% lưu lượng về bản xanh dương trong 90 giây và bạn giữ nguyên image cũ để chạy lại nếu cần. Nhưng rollback code không cứu được dữ liệu: nếu migration đã xoá cột, quay lại cũng hỏng, nên mọi thay đổi schema phải tương thích ngược. Ghi lại thời điểm, phiên bản và số liệu mỗi lần rollback để lần sau nhanh hơn.`,
          focus: "all",
          edges: "all",
          metrics: { canary: "0% sau rollback", error: "0,1%", latency: "185 ms", back: "90 giây" },
          changes: [
            "Toàn bộ lưu lượng quay về bản ổn định trong 90 giây",
            "Sự cố được ghi lại kèm số liệu để cải tiến lần sau"
          ],
          note: "Rollback không xoá dấu vết: giữ image cũ và ReplicaSet cũ ít nhất 7 ngày."
        }
      ]
    }
  });

  window.DEVLAB.practice.push(
    {
      tag: "CONTAINER",
      title: "Image 1,2 GB và 6 phút chờ mỗi lần phát hành",
      scenario: `Image API Node của bạn nặng 1,2 GB. Mỗi lần phát hành, CI mất 6 phút để push và mỗi node mất thêm 4 phút để kéo về. Chạy <code>docker history</code> cho thấy lớp <code>node:20</code> đầy đủ chiếm 950 MB, lớp <code>npm ci</code> 210 MB, còn mã nguồn chỉ 4 MB. Bạn cần đưa thời gian phát hành xuống dưới 2 phút, vẫn giữ Node 20 và các gói native đã biên dịch. Nhóm chưa được đổi registry nội bộ hay tăng băng thông. Chọn cách xử lý gốc rễ nhất.`,
      metrics: [
        { label: "Kích thước image", value: "1,2 GB", danger: true },
        { label: "Push và pull", value: "10 phút", danger: true },
        { label: "Lớp base image", value: "950 MB" }
      ],
      options: [
        "Bật cache ở registry và nén image, giữ nguyên Dockerfile hiện tại.",
        "Chuyển sang multi-stage, dùng base slim và chỉ chép dist cùng node_modules production.",
        "Thêm node vào cụm để nhiều node kéo image song song.",
        "Đổi sang base alpine nhưng vẫn cài đủ bộ công cụ build trong cùng stage."
      ],
      correct: 1,
      explain: `Base image đầy đủ chiếm 950 MB, tức 79% dung lượng, nên mọi cách chỉ nén hay tăng băng thông đều chữa triệu chứng. Multi-stage tách stage build có compiler khỏi stage runtime chỉ chứa <code>dist</code> và <code>node_modules</code> đã cài: image còn khoảng 180 MB, push dưới 1 phút và mỗi node kéo xong trong 40 giây. Chuyển sang alpine mà vẫn cài đủ toolchain thì image còn nặng hơn, vì bạn phải thêm <code>python</code>, <code>make</code>, <code>g++</code>. Chép <code>node_modules</code> từ stage build giữ được gói native đã biên dịch đúng kiến trúc.`
    },
    {
      tag: "K8S",
      title: "HPA báo unknown dù CPU đã 78%",
      scenario: `Cụm Kubernetes của bạn có 6 pod, mỗi pod chạy API Node và thường xuyên ở mức 78% CPU. Bạn tạo HorizontalPodAutoscaler với ngưỡng 70%, mong đợi 9 đến 12 pod vào giờ cao điểm. Nhưng sau ba ngày, HPA luôn hiển thị mục tiêu là unknown và không bao giờ scale. metrics-server vẫn chạy, <code>kubectl top pod</code> trả về số liệu bình thường. Manifest Deployment không khai báo <code>resources</code>. Giờ cao điểm có 2.400 request mỗi phút và p95 tăng từ 180 ms lên 620 ms trong 30 phút. Chọn việc sửa đúng nhất.`,
      metrics: [
        { label: "Pod đang chạy", value: "6/6" },
        { label: "CPU trung bình", value: "78%", danger: true },
        { label: "Mục tiêu HPA", value: "unknown", danger: true }
      ],
      options: [
        "Hạ ngưỡng HPA từ 70% xuống 50% để scale sớm hơn.",
        "Khai báo resources.requests cho container rồi tạo lại HPA.",
        "Nâng replicas tối thiểu lên 12 trong manifest Deployment.",
        "Cài thêm KEDA thay cho metrics-server để lấy số liệu."
      ],
      correct: 1,
      explain: `HPA tính phần trăm bằng CPU thực chia cho <code>requests.cpu</code>. Không có requests thì mẫu số trống, HPA báo unknown và không bao giờ ra quyết định, dù metrics-server vẫn trả số liệu cho <code>kubectl top</code>. Khai báo <code>requests.cpu: 250m</code> và <code>requests.memory: 256Mi</code> là đủ để HPA tính được 78% và nâng lên 12 pod trong khoảng 90 giây. Hạ ngưỡng chỉ làm sai công thức, nâng replicas tối thiểu là vá tạm rồi vẫn không co giãn theo tải. KEDA hữu ích cho hàng đợi, nhưng không thay đổi được lỗi thiếu requests.`
    },
    {
      tag: "DEPLOY",
      title: "Blue-green đổi màu nhưng quên migration",
      scenario: `Nhóm bạn phát hành v1.4 theo kiểu blue-green: dựng môi trường xanh với 6 pod, chạy smoke test 40 ca, rồi gạt 100% lưu lượng sau 3 giây. Bản mới cần cột <code>discount_code</code>. Lúc 10 giờ, lưu lượng chuyển màu, ba phút sau tỉ lệ lỗi 5xx nhảy từ 0,1% lên 34% vì mọi lệnh insert thiếu cột <code>NOT NULL</code>. Rollback về xanh dương trong 90 giây vẫn lỗi, vì migration đã thêm ràng buộc mà bản cũ không ghi được. Đội on-call mất 22 phút khôi phục bảng. Chọn cách phòng ngừa gốc rễ nhất.`,
      metrics: [
        { label: "Lỗi 5xx", value: "34%", danger: true },
        { label: "Thời gian sửa", value: "22 phút" },
        { label: "Môi trường", value: "blue-green" }
      ],
      options: [
        "Chạy migration theo expand-contract trước, thêm cột cho phép null rồi mới bật ràng buộc.",
        "Tắt kiểm tra ràng buộc trên database trong 24 giờ để bản cũ ghi được.",
        "Giữ thêm pod bản cũ để rollback nhanh hơn khi có sự cố.",
        "Chuyển sang canary 10% để ít người dùng gặp lỗi hơn."
      ],
      correct: 0,
      explain: `Lỗi nằm ở thứ tự: schema đổi cứng trước khi cả hai phiên bản cùng tương thích. Expand-contract chia làm ba bước: thêm cột cho phép null, deploy code ghi được cả hai dạng, backfill dữ liệu, rồi mới thêm <code>NOT NULL</code> khi bản cũ đã biến mất. Khi đó rollback code luôn an toàn vì schema vẫn chấp nhận bản cũ. Tắt ràng buộc là che lỗi và để dữ liệu bẩn tích tụ. Canary chỉ thu hẹp số người bị ảnh hưởng, không sửa được việc rollback hỏng. Giữ thêm pod cũng vô ích khi insert đã fail ở tầng dữ liệu.`
    }
  );

  window.DEVLAB.cheatsheets.push({
    id: "infra",
    num: "02",
    title: "Hạ tầng & triển khai",
    intro: "Tra nhanh khi dựng image, viết manifest và chọn cách phát hành: sáu lớp image, bảng so sánh container với máy ảo, mẫu Deployment có resource requests và bốn chiến lược triển khai kèm cách rollback.",
    cards: [
      {
        title: "Dockerfile nhiều stage: 1,2 GB còn 180 MB",
        wide: true,
        html: `<p>Stage build giữ compiler và toàn bộ devDependencies; stage runtime chỉ nhận kết quả. Image cuối không còn <code>npm</code> cache, <code>src</code> hay tài khoản root.</p>
<pre class="formula"><code>FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY src ./src
RUN npm run build

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
USER node
EXPOSE 3000
CMD ["node","dist/server.js"]</code></pre>
<p>Kết quả đo trên cùng một API: 180 MB, push 50 giây, container sẵn sàng sau 0,6 giây và ăn 38 MB RAM.</p>`
      },
      {
        title: "Container và máy ảo",
        html: `<table class="cheat-table">
<thead><tr><th>Tiêu chí</th><th>Container</th><th>Máy ảo</th></tr></thead>
<tbody>
<tr><td>Khởi động</td><td><b>0,8 giây</b></td><td>45 giây</td></tr>
<tr><td>Dung lượng</td><td>180 MB</td><td>2 GB</td></tr>
<tr><td>Nhân</td><td>Dùng chung</td><td>Riêng từng máy</td></tr>
<tr><td>Mật độ trên 16 vCPU</td><td><b>120 container</b></td><td>8 máy ảo</td></tr>
<tr><td>Cô lập</td><td>Mức tiến trình</td><td>Mức phần cứng</td></tr>
<tr><td>Hợp với</td><td>Microservice, CI</td><td>Nhân khác, tuân thủ</td></tr>
</tbody>
</table>`
      },
      {
        title: "Deployment 6 pod có probe và request",
        wide: true,
        html: `<p><code>maxUnavailable: 0</code> giữ đủ pod trong lúc rollout; thiếu <code>resources.requests</code> thì HPA luôn báo unknown.</p>
<pre class="formula"><code>apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 6
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: registry.local/api:1.4
          ports:
            - containerPort: 3000
          resources:
            requests:
              cpu: 250m
              memory: 256Mi
          readinessProbe:
            httpGet:
              path: /healthz
              port: 3000
            periodSeconds: 5</code></pre>`
      },
      {
        title: "Bốn chiến lược triển khai",
        html: `<table class="cheat-table">
<thead><tr><th>Chiến lược</th><th>Downtime</th><th>Chi phí</th><th>Rollback</th></tr></thead>
<tbody>
<tr><td><b>Recreate</b></td><td>90 giây</td><td>1x</td><td>90 giây</td></tr>
<tr><td><b>Rolling</b></td><td>0</td><td>1,1x</td><td>40 giây</td></tr>
<tr><td><b>Blue-green</b></td><td>0</td><td>2x</td><td>3 giây</td></tr>
<tr><td><b>Canary</b></td><td>0</td><td>1,1x</td><td>30 giây</td></tr>
</tbody>
</table>
<p>Canary chỉ an toàn khi metrics tươi dưới 1 phút và điều kiện dừng được viết sẵn, ví dụ lỗi 5xx vượt 2% trong 5 phút.</p>`
      },
      {
        title: "Lệnh kiểm tra trước khi bấm deploy",
        html: `<pre class="formula"><code>docker history registry.local/api:1.4
docker run --rm api:1.4 node -v
kubectl rollout status deploy/api --timeout=120s
kubectl rollout history deploy/api
kubectl rollout undo deploy/api
kubectl get hpa api -w
kubectl top pod -l app=api</code></pre>
<p>Ba lệnh đầu bắt lỗi image và rollout; ba lệnh sau dùng khi phải quay lại bản cũ giữa giờ cao điểm.</p>`
      }
    ]
  });
})();
