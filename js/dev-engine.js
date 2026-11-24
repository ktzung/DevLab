/* DevLab — engine mô phỏng pipeline, dung lượng và SLO. Chạy hoàn toàn cục bộ. */
(function () {
  "use strict";

  const SEED = window.DEV_SEED;
  if (!SEED) return;

  const fmt = new Intl.NumberFormat("vi-VN");

  function clampInt(value, min, max, fallback) {
    const n = parseInt(value, 10);
    if (Number.isNaN(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  function clampFloat(value, min, max, fallback) {
    const n = parseFloat(value);
    if (Number.isNaN(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  function round1(n) {
    return Math.round(n * 10) / 10;
  }

  function runPipeline(input) {
    const box = input || {};
    const P = SEED.pipeline;
    const env = P.envs[box.env] ? box.env : "staging";
    const strategy = P.strategies[box.strategy] ? box.strategy : "rolling";
    const tests = P.tests[box.tests] ? box.tests : "pass";
    const scan = P.scan[box.scan] ? box.scan : "clean";
    const envInfo = P.envs[env];
    const strategyInfo = P.strategies[strategy];
    const testsInfo = P.tests[tests];
    const scanInfo = P.scan[scan];
    const trace = [];
    let stage = 1;
    let stopped = false;

    trace.push({
      step: "build",
      label: "Build",
      result: "ok",
      note: `Đóng gói ${P.artifact} · commit ${P.sha}`
    });

    stage = 2;
    if (!testsInfo.ok) {
      stopped = true;
      trace.push({ step: "test", label: "Kiểm thử", result: "fail", note: `${testsInfo.label} · dừng pipeline` });
    } else {
      trace.push({ step: "test", label: "Kiểm thử", result: "ok", note: `${testsInfo.label} trong ${testsInfo.seconds} giây` });
    }

    stage = 3;
    if (stopped) {
      trace.push({ step: "scan", label: "Quét bảo mật", result: "skip", note: "Pipeline đã dừng trước bước này" });
    } else if (!scanInfo.ok) {
      stopped = true;
      trace.push({ step: "scan", label: "Quét bảo mật", result: "fail", note: `${scanInfo.label} · chặn phát hành` });
    } else {
      trace.push({ step: "scan", label: "Quét bảo mật", result: "ok", note: "0 lỗ hổng mức high trở lên" });
    }

    stage = 4;
    if (stopped) {
      trace.push({ step: "deploy", label: "Triển khai", result: "skip", note: "Pipeline đã dừng trước bước này" });
    } else if (env === "prod" && strategy === "recreate") {
      stopped = true;
      trace.push({ step: "deploy", label: "Triển khai", result: "fail", note: "Chính sách: production cấm recreate gây downtime" });
    } else {
      const approval = envInfo.approval ? " · có phê duyệt" : "";
      trace.push({ step: "deploy", label: "Triển khai", result: "ok", note: `${strategyInfo.label} lên ${envInfo.label}${approval}` });
    }

    stage = 5;
    if (stopped) {
      trace.push({ step: "smoke", label: "Kiểm tra sau deploy", result: "skip", note: "Chưa có bản nào được triển khai" });
    } else {
      trace.push({ step: "smoke", label: "Kiểm tra sau deploy", result: "ok", note: "Health check 200 · p95 180 ms" });
    }

    const status = stopped ? "blocked" : "deployed";
    const failedAt = trace.findIndex((t) => t.result === "fail");
    const reportedStage = failedAt >= 0 ? failedAt + 1 : 5;

    let duration = P.buildSeconds;
    if (trace[1].result !== "skip") duration += testsInfo.seconds;
    if (trace[2].result === "ok" || trace[2].result === "fail") duration += scanInfo.seconds;
    if (trace[3].result === "ok") duration += env === "prod" ? strategyInfo.seconds : P.devSeconds;
    if (trace[4].result === "ok") duration += P.smokeSeconds;

    const risk = strategyInfo.risk;
    const payload = {
      status,
      artifact: P.artifact,
      image: P.image,
      environment: envInfo.label,
      strategy: strategyInfo.label,
      downtime: strategyInfo.downtime,
      rollback: strategyInfo.rollback
    };

    return {
      kind: "pipeline",
      env,
      strategy,
      tests,
      scan,
      status,
      duration,
      risk,
      payload,
      trace,
      metrics: {
        status: status === "deployed" ? 1 : 0,
        stage: reportedStage,
        duration,
        risk
      }
    };
  }

  function runCapacity(input) {
    const box = input || {};
    const C = SEED.capacity;
    const rps = clampInt(box.rps, 10, 5000, 120);
    const latency = clampInt(box.latency, 50, 800, 200);
    const target = clampFloat(box.target, 0.4, 0.95, 0.7);
    const perReplica = round1((1000 / latency) * target);
    const needed = Math.ceil(rps / perReplica);
    const replicas = Math.min(needed, C.maxReplicas);
    const utilization = round1((rps / (replicas * (1000 / latency))) * 100);
    const headroom = round1(replicas * perReplica - rps);
    const over = needed > C.maxReplicas;
    const tight = !over && needed > Math.ceil(C.maxReplicas * 0.7);
    const state = over ? "over" : tight ? "tight" : "safe";
    const trace = [
      {
        step: "demand",
        label: "Đo tải",
        result: "ok",
        note: `${rps} request/giây · p95 ${latency} ms`
      },
      {
        step: "per-replica",
        label: "Sức chứa mỗi replica",
        result: "ok",
        note: `${perReplica} request/giây ở mục tiêu ${Math.round(target * 100)}%`
      },
      {
        step: "provision",
        label: "Cấp phát replica",
        result: over ? "fail" : "ok",
        note: over
          ? `Cần ${needed}, trần cụm chỉ ${C.maxReplicas}`
          : `${replicas} replica × ${C.cpuPerReplica}`
      },
      {
        step: "headroom",
        label: "Dự phòng",
        result: over ? "warn" : tight ? "warn" : "ok",
        note: over
          ? "Thiếu năng lực, cần giảm tải hoặc tăng trần cụm"
          : tight
            ? `Chỉ còn ${headroom} request/giây trước khi quá tải`
            : `Còn ${headroom} request/giây dự phòng`
      }
    ];
    const verdict = state === "over" ? "Thiếu" : state === "tight" ? "Sát tải" : "An toàn";

    return {
      kind: "capacity",
      rps,
      latency,
      target,
      perReplica,
      needed,
      replicas,
      utilization,
      headroom,
      state,
      verdict,
      trace,
      payload: {
        replicas,
        perReplica,
        needed,
        trần: C.maxReplicas,
        "CPU/replica": C.cpuPerReplica
      },
      metrics: {
        replicas,
        utilization,
        headroom,
        state: over ? 0 : 1
      }
    };
  }

  function runSlo(input) {
    const box = input || {};
    const S = SEED.slo;
    const slo = S.options.indexOf(Number(box.slo)) >= 0 ? Number(box.slo) : 99.9;
    const windowDays = S.windows.indexOf(Number(box.window)) >= 0 ? Number(box.window) : 30;
    const downtime = clampFloat(box.downtime, 0, 10000, 20);
    const allowed = round1(windowDays * 1440 * (1 - slo / 100));
    const budget = round1(allowed - downtime);
    const consumed = round1((downtime / allowed) * 100);
    const ok = budget >= 0;
    const trace = [
      {
        step: "target",
        label: "Mục tiêu SLO",
        result: "ok",
        note: `${slo}% trong ${windowDays} ngày`
      },
      {
        step: "allowed",
        label: "Thời gian lỗi cho phép",
        result: "ok",
        note: `${allowed} phút cho cửa sổ ${windowDays} ngày`
      },
      {
        step: "spent",
        label: "Đã dùng",
        result: "ok",
        note: `${downtime} phút · ${consumed}% ngân sách`
      },
      {
        step: "verdict",
        label: "Kết luận",
        result: ok ? "ok" : "fail",
        note: ok ? `Còn ${budget} phút ngân sách` : `Vượt ${Math.abs(budget)} phút, cần hành động`
      }
    ];
    const verdict = ok ? (consumed >= 80 ? "Sắp cạn" : "Trong ngân sách") : "Vượt ngân sách";

    return {
      kind: "slo",
      slo,
      window: windowDays,
      downtime,
      allowed,
      budget,
      consumed,
      ok,
      verdict,
      trace,
      payload: {
        slo: `${slo}%`,
        "cửa sổ": `${windowDays} ngày`,
        downtime: `${downtime} phút`,
        "cho phép": `${allowed} phút`,
        "còn lại": `${budget} phút`
      },
      metrics: {
        budget,
        allowed,
        consumed,
        state: ok ? 1 : 0
      }
    };
  }

  window.DEVEngine = {
    runPipeline,
    runCapacity,
    runSlo,
    formatNumber: (n) => fmt.format(n),
    clampInt,
    round1
  };
})();
