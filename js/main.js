// Shared utilities for PixVelo image tools

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Please select a valid image file (JPG, PNG, WebP, GIF)."));
      return;
    }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image."));
    img.src = URL.createObjectURL(file);
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast("Download started — check your downloads folder", "success");
}

function showToast(message, type = "success") {
  let wrap = document.querySelector(".toast-wrap");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.className = "toast-wrap";
    document.body.appendChild(wrap);
  }
  const el = document.createElement("div");
  el.className = "toast " + type;
  el.innerHTML = '<span class="toast-icon">' + (type === "success" ? "✓" : "!") + "</span><span>" + message + "</span>";
  wrap.appendChild(el);
  setTimeout(() => {
    el.classList.add("hide");
    setTimeout(() => el.remove(), 300);
  }, 2800);
}

function canvasToBlob(canvas, type = "image/jpeg", quality = 0.92) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

// Generate example images in-memory (works with file:// — no fetch needed)
function createSampleCanvas(key) {
  const presets = {
    photo: { w: 1200, h: 800, c1: [30, 60, 120], c2: [200, 80, 140], label: "PixVelo Sample", alpha: false },
    portrait: { w: 900, h: 1200, c1: [20, 100, 90], c2: [80, 40, 140], label: "Portrait", alpha: false },
    square: { w: 1000, h: 1000, c1: [240, 100, 50], c2: [50, 80, 200], label: "Square", alpha: false },
    landscape: { w: 1600, h: 900, c1: [15, 30, 60], c2: [100, 180, 220], label: "Landscape", alpha: false },
    transparent: { w: 800, h: 600, c1: [0, 0, 0], c2: [0, 0, 0], label: "PNG", alpha: true }
  };
  const p = presets[key] || presets.photo;
  const canvas = document.createElement("canvas");
  canvas.width = p.w;
  canvas.height = p.h;
  const ctx = canvas.getContext("2d");

  if (p.alpha) {
    // transparent PNG style sample
    for (let i = 0; i < 8; i++) {
      const x = 80 + i * 85;
      ctx.fillStyle = `rgba(${40 + i * 25}, 120, 220, 0.7)`;
      ctx.beginPath();
      ctx.ellipse(x + 60, 300, 60, 150, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(255, 80, 120, 0.8)";
    ctx.beginPath();
    ctx.ellipse(400, 300, 150, 200, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // gradient background
    const g = ctx.createLinearGradient(0, 0, p.w, p.h);
    g.addColorStop(0, `rgb(${p.c1.join(",")})`);
    g.addColorStop(1, `rgb(${p.c2.join(",")})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, p.w, p.h);

    // decorative shapes
    for (let i = 0; i < 14; i++) {
      const x = (i * 97 + 40) % p.w;
      const y = (i * 131 + 60) % p.h;
      const r = 30 + (i % 5) * 18;
      ctx.fillStyle = `rgba(${100 + i * 10}, ${80 + i * 8}, ${180 - i * 5}, 0.35)`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // label
  ctx.font = `bold ${Math.max(28, Math.floor(p.w / 18))}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillText(p.label, p.w / 2 + 3, p.h / 2 + 3);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(p.label, p.w / 2, p.h / 2);

  return { canvas, alpha: p.alpha, key };
}

async function loadSampleAsFile(key, filename) {
  const { canvas, alpha } = createSampleCanvas(key || "photo");
  const type = alpha ? "image/png" : "image/jpeg";
  const ext = alpha ? "png" : "jpg";
  const q = alpha ? undefined : 0.9;
  const blob = await canvasToBlob(canvas, type, q);
  const name = filename || `example-${key || "photo"}.${ext}`;
  return new File([blob], name, { type });
}

function setButtonLoading(btn, loading, defaultText) {
  if (!btn) return;
  if (loading) {
    btn.classList.add("loading");
    btn.dataset.prevText = btn.textContent;
    btn.innerHTML = '<span class="spinner"></span>Working…';
  } else {
    btn.classList.remove("loading");
    btn.textContent = defaultText || btn.dataset.prevText || btn.textContent;
  }
}

// Mobile menu + scroll reveal
document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.querySelector(".menu");
  const navlinks = document.querySelector(".navlinks");
  if (menuBtn && navlinks) {
    menuBtn.addEventListener("click", () => {
      navlinks.classList.toggle("open");
    });
  }

  // Scroll reveal
  const reveals = document.querySelectorAll(".reveal, .card, .step, .faq details, .cta");
  reveals.forEach((el) => el.classList.add("reveal"));
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  reveals.forEach((el) => io.observe(el));
});
