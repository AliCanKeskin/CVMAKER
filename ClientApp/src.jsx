import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Download, Eye, FileText, Plus, Trash2, ChevronDown, X } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
const E = (title = "", organization = "", startDate = "", endDate = "", description = "") => ({ title, organization, startDate, endDate, description });
const sortSkills = (items) => items.map((item, index) => ({ ...item, _sortIndex: index })).sort((a, b) => b.level - a.level || a._sortIndex - b._sortIndex).map(({ _sortIndex, ...item }) => item);
const skillLevel = (name) => {
  const normalized = name.trim().toLocaleLowerCase("tr-TR");
  if (["flutter", "balsamiq", "microsoft office", "microsoft ofis programları", "docker"].includes(normalized)) return 4;
  if (normalized === "react") return 3;
  return 5;
};
const upgradeSkills = (items) => sortSkills(items.map((item) => ({ ...item, level: skillLevel(item.name || "") })));
const ensureRequestedSkills = (items) => {
  const skills = upgradeSkills(items);
  for (const name of ["Postman", "Swagger"]) {
    if (!skills.some((item) => item.name.trim().toLocaleLowerCase("tr-TR") === name.toLocaleLowerCase("tr-TR"))) skills.push({ name, level: 5 });
  }
  return sortSkills(skills);
};
const initial = { fullName: "", jobTitle: "", email: "", phone: "", location: "", website: "", linkedIn: "", summary: "", experiences: [], educations: [], projects: [], certifications: [], skills: [], languages: [] };
const sections = [["Ki\u015Fisel Bilgiler", "personal"], ["Profesyonel \xD6zet", "summary"], ["\u0130\u015F Deneyimi", "experiences"], ["E\u011Fitim", "educations"], ["Beceriler", "skills"], ["Diller", "languages"], ["Projeler", "projects"], ["Sertifikalar", "certifications"]];
function Field({ label, value = "", onChange, full, area, placeholder = "", hint = "" }) {
  return <div className={"field " + (full ? "full" : "")}><label>{label}</label>{area ? <><textarea value={value} maxLength={2e3} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /><div className="counter">{value.length}/2000</div></> : <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />} {hint && <span className="hint">{hint}</span>}</div>;
}
function Repeats({ items, onChange, type }) {
  const labels = type === "educations" ? ["B\xF6l\xFCm / Derece", "Okul"] : type === "projects" ? ["Proje ad\u0131", "Kurum / Ba\u011Flant\u0131"] : type === "certifications" ? ["Sertifika", "Veren kurum"] : ["Pozisyon", "\u015Eirket"];
  const update = (i, k, v) => onChange(items.map((x, n) => n === i ? { ...x, [k]: v } : x));
  return <>{items.map((x, i) => <div className="repeat-card" key={i}><div className="repeat-head"><span>{x.title || `${labels[0]} ${i + 1}`}</span><button className="icon-btn" aria-label="Sil" onClick={() => onChange(items.filter((_, n) => n !== i))}><Trash2 size={15} /></button></div><div className="field-grid"><Field label={labels[0]} value={x.title} onChange={(v) => update(i, "title", v)} /><Field label={labels[1]} value={x.organization} onChange={(v) => update(i, "organization", v)} /><Field label="Başlangıç" value={x.startDate} onChange={(v) => update(i, "startDate", v)} placeholder="2023" /><Field label="Bitiş" value={x.endDate} onChange={(v) => update(i, "endDate", v)} placeholder="Günümüz" /><Field label="Açıklama" value={x.description} onChange={(v) => update(i, "description", v)} area full placeholder="Başarılarınızı sonuç ve ölçülerle anlatın…" /></div></div>)}<button className="add-btn" onClick={() => onChange([...items, E()])}><Plus size={15} /> Yeni ekle</button></>;
}
function SkillList({ items, onChange, language }) {
  return <><div className="field-grid">{items.map((x, i) => <React.Fragment key={i}><Field label={language ? "Dil" : "Beceri"} value={x.name} onChange={(v) => onChange(items.map((a, n) => n === i ? { ...a, name: v } : a))} /><div className="field"><label>Seviye</label><select value={x.level} onChange={(e) => onChange(items.map((a, n) => n === i ? { ...a, level: +e.target.value } : a))}>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{(language ? ["Ba\u015Flang\u0131\xE7", "Temel", "Orta", "\u0130leri", "Ana dil"] : ["Ba\u015Flang\u0131\xE7", "Temel", "\u0130yi", "\u0130leri", "Uzman"])[n - 1]}</option>)}</select><button className="icon-btn" onClick={() => onChange(items.filter((_, n) => n !== i))}>Kaldır</button></div></React.Fragment>)}</div><button className="add-btn" onClick={() => onChange([...items, { name: "", level: 3 }])}><Plus size={15} /> Yeni ekle</button></>;
}
function PhotoField({ value, onChange }) {
  const selectPhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const size = Math.min(image.width, image.height);
        const canvas = document.createElement("canvas");
        canvas.width = 600;
        canvas.height = 600;
        canvas.getContext("2d").drawImage(image, (image.width - size) / 2, (image.height - size) / 2, size, size, 0, 0, 600, 600);
        onChange(canvas.toDataURL("image/jpeg", 0.86));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };
  return <div className="photo-field field full">
    <label>Profil fotoğrafı</label>
    <div className="photo-control">
      <div className="photo-thumb">{value ? <img src={value} alt="Seçilen profil fotoğrafı" /> : <span>Fotoğraf</span>}</div>
      <div className="photo-actions">
        <label className="btn small photo-upload">Fotoğraf seç<input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPhoto} /></label>
        {value && <button type="button" className="btn small" onClick={() => onChange("")}>Kaldır</button>}
        <span className="hint">JPG, PNG veya WebP · Fotoğraf otomatik kırpılır.</span>
      </div>
    </div>
  </div>;
}
function StandalonePhotoField() {
  const [photo, setPhoto] = useState(() => {
    try { return localStorage.getItem("ack-saved-photo") || ""; } catch { return ""; }
  });
  useEffect(() => {
    const save = () => localStorage.setItem("ack-saved-photo", photo);
    const load = () => setPhoto(localStorage.getItem("ack-saved-photo") || "");
    window.addEventListener("ack-save-cv", save);
    window.addEventListener("ack-load-cv", load);
    return () => {
      window.removeEventListener("ack-save-cv", save);
      window.removeEventListener("ack-load-cv", load);
    };
  }, [photo]);
  useEffect(() => {
    const host = document.getElementById("photo-root");
    const attach = () => {
      const personalSection = document.querySelectorAll(".editor .section")[0];
      const personalGrid = personalSection?.classList.contains("open") ? personalSection.querySelector(".section-body .field-grid") : null;
      if (host && personalGrid && host.parentElement !== personalGrid) personalGrid.prepend(host);
    };
    attach();
    const observer = new MutationObserver(attach);
    observer.observe(document.querySelector(".editor"), { childList: true, subtree: true });
    if (photo) {
      localStorage.setItem("vita-photo", photo);
      document.documentElement.style.setProperty("--cv-photo", `url("${photo}")`);
      document.documentElement.classList.add("has-photo");
    } else {
      localStorage.removeItem("vita-photo");
      document.documentElement.style.removeProperty("--cv-photo");
      document.documentElement.classList.remove("has-photo");
    }
    return () => observer.disconnect();
  }, [photo]);
  return <PhotoField value={photo} onChange={setPhoto} />;
}
function ThemePicker() {
  const themes = {
    navy: { color: "#183f70", tint: "#dce7f3", label: "Lacivert" },
    blue: { color: "#1769aa", tint: "#dcecf7", label: "Mavi" },
    black: { color: "#17191b", tint: "#e4e5e6", label: "Siyah" },
    burgundy: { color: "#7a263a", tint: "#f0dfe3", label: "Bordo" },
    purple: { color: "#5b3f8c", tint: "#e8e1f2", label: "Mor" },
    teal: { color: "#087f75", tint: "#d9efec", label: "Turkuaz" }
  };
  const [theme, setTheme] = useState(() => localStorage.getItem("vita-theme") || "blue");
  useEffect(() => {
    const host = document.getElementById("theme-root");
    const actions = document.querySelector(".top-actions");
    if (host && actions && host.parentElement !== actions) actions.prepend(host);
    const selected = themes[theme] || themes.blue;
    document.documentElement.style.setProperty("--green", selected.color);
    document.documentElement.style.setProperty("--mint", selected.tint);
    localStorage.setItem("vita-theme", theme);
  }, [theme]);
  return <div className="theme-picker" aria-label="Şablon rengi">
    <span>Renk</span>
    {Object.entries(themes).map(([key, item]) => <button type="button" key={key} title={item.label} className={theme === key ? "active" : ""} onClick={() => setTheme(key)} aria-label={`${item.label} şablon`}><i style={{ background: item.color }} /></button>)}
  </div>;
}
function TemplatePicker({ value, onChange }) {
  return <select className="template-picker" aria-label="CV tasarımı" value={value} onChange={(event) => onChange(event.target.value)}><option value="modern">Modern</option><option value="minimal">Minimal Tek Sütun</option><option value="header">Üst Bantlı</option></select>;
}
function InstallAppButton() {
  const [installPrompt, setInstallPrompt] = useState(null);
  useEffect(() => {
    const host = document.getElementById("install-root");
    const actions = document.querySelector(".top-actions");
    if (host && actions && host.parentElement !== actions) actions.prepend(host);
    const ready = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener("beforeinstallprompt", ready);
    return () => window.removeEventListener("beforeinstallprompt", ready);
  }, []);
  if (!installPrompt || window.matchMedia("(display-mode: standalone)").matches) return null;
  const install = async () => {
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };
  return <button type="button" className="btn install-app" onClick={install}><Download size={16} /> Telefona Kur</button>;
}
function MobileStorageControls() {
  const [message, setMessage] = useState("");
  useEffect(() => {
    const host = document.getElementById("mobile-storage-root");
    const workspace = document.querySelector(".workspace");
    if (host && workspace && host.nextElementSibling !== workspace) workspace.parentElement.insertBefore(host, workspace);
    const showMessage = (event) => {
      setMessage(event.detail);
      setTimeout(() => setMessage(""), 2200);
    };
    window.addEventListener("ack-storage-message", showMessage);
    return () => window.removeEventListener("ack-storage-message", showMessage);
  }, []);
  return <div className="mobile-storage">
    <button type="button" className="btn primary" onClick={() => window.dispatchEvent(new Event("ack-save-cv"))}>CV’yi Kaydet</button>
    <button type="button" className="btn" onClick={() => window.dispatchEvent(new Event("ack-load-cv"))}>Kayıtlı CV’yi Aç</button>
    {message && <span>{message}</span>}
  </div>;
}
function Editor({ cv, setCv }) {
  const [open, setOpen] = useState("personal");
  const set = (k, v) => setCv({ ...cv, [k]: k === "skills" ? sortSkills(v) : v });
  const body = (id) => id === "personal" ? <div className="field-grid"><Field label="Ad Soyad" value={cv.fullName} onChange={(v) => set("fullName", v)} /><Field label="Meslek / Unvan" value={cv.jobTitle} onChange={(v) => set("jobTitle", v)} /><Field label="E-posta" value={cv.email} onChange={(v) => set("email", v)} /><Field label="Telefon" value={cv.phone} onChange={(v) => set("phone", v)} /><Field label="Konum" value={cv.location} onChange={(v) => set("location", v)} /><Field label="Web sitesi" value={cv.website} onChange={(v) => set("website", v)} /><Field label="LinkedIn" value={cv.linkedIn} onChange={(v) => set("linkedIn", v)} full /></div> : id === "summary" ? <Field label="Kısa ve etkili özet" value={cv.summary} onChange={(v) => set("summary", v)} area hint="Deneyiminiz, uzmanlığınız ve kattığınız değeri 3–4 cümlede anlatın." /> : id === "skills" || id === "languages" ? <SkillList items={cv[id]} language={id === "languages"} onChange={(v) => set(id, v)} /> : <Repeats items={cv[id]} type={id} onChange={(v) => set(id, v)} />;
  return <aside className="editor"><span className="eyebrow">CV Stüdyosu</span><h1>Hikâyeni özenle anlat.</h1><p className="lead">Bilgilerini ekle; CV’n sağ tarafta anında şekillensin.</p><div className="progress"><span /></div>{sections.map(([title, id], i) => <div className={"section " + (open === id ? "open" : "")} key={id}><button className="section-head" onClick={() => setOpen(open === id ? "" : id)}><span className="section-title"><span className="section-num">{String(i + 1).padStart(2, "0")}</span>{title}</span><ChevronDown className="chev" size={18} /></button>{open === id && <div className="section-body">{body(id)}</div>}</div>)}</aside>;
}
const date = (x) => [x.startDate, x.endDate].filter(Boolean).join(" \u2014 ");
function Entries({ title, items }) {
  return !items?.length ? null : <section><div className="main-title">{title}</div>{items.map((x, i) => <div className="entry" key={i}><div className="entry-date">{date(x)}</div><div><h3>{x.title || "Ba\u015Fl\u0131k"}</h3><h4>{x.organization}</h4><p>{x.description}</p></div></div>)}</section>;
}
function ContactItems({ cv }) {
  return <>{[["E-posta", cv.email], ["Telefon", cv.phone], ["Konum", cv.location], ["Web", cv.website], ["LinkedIn", cv.linkedIn]].map(([a, b]) => b && <p className="contact-row" key={a}><strong>{a}</strong>{b}</p>)}</>;
}
function SkillItems({ cv }) {
  return <>
    {!!cv.skills.length && <><div className="side-title">Beceriler</div>{cv.skills.map((x, i) => <div className="skill" key={i}>{x.name || "Yeni beceri"}<div className="skill-line"><span style={{ width: `${x.level * 20}%` }} /></div></div>)}</>}
    {!!cv.languages.length && <><div className="side-title">Diller</div>{cv.languages.map((x, i) => <div className="lang" key={i}><span>{x.name || "Dil"}</span><em>{["A1", "A2", "B1", "C1", "C2"][x.level - 1]}</em></div>)}</>}
  </>;
}
function Preview({ cv, show, onClose, layout }) {
  const initials = cv.fullName.split(" ").filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase() || "CV";
  const contact = <ContactItems cv={cv} />;
  const skills = <SkillItems cv={cv} />;
  const heading = <><h1 className="cv-name">{cv.fullName || "Ad Soyad"}</h1><div className="cv-role">{cv.jobTitle || "Meslek / Unvan"}</div></>;
  const summary = <p className="summary">{cv.summary || "Profesyonel özetiniz burada görünecek."}</p>;
  const title = layout === "header" ? "Üst Bantlı" : layout === "minimal" ? "Minimal Tek Sütun" : "Modern";
  return <main className={"preview-zone " + (show ? "show" : "")}><div className="preview-toolbar"><span>A4 · {title} Şablon</span><span className="dots"><i /><i /><i /></span>{show && <button className="icon-btn" onClick={onClose}><X /></button>}</div><article className={`cv-page layout-${layout}`}>
    {layout === "header" ? <>
      <header className="cv-header"><div className="avatar">{initials}</div><div>{heading}</div></header>
      <div className="contact-strip">{contact}</div>
      <aside className="cv-side"><Entries title="Eğitim" items={cv.educations} />{skills}</aside>
      <div className="cv-main">{summary}<Entries title="Deneyim" items={cv.experiences} /><Entries title="Projeler" items={cv.projects} /><Entries title="Sertifikalar" items={cv.certifications} /></div>
    </> : layout === "minimal" ? <>
      <header className="minimal-header"><div>{heading}</div><div className="avatar">{initials}</div></header>
      <div className="minimal-contact">{contact}</div>
      <div className="minimal-main">{summary}<Entries title="Deneyim" items={cv.experiences} /><Entries title="Eğitim" items={cv.educations} /><Entries title="Projeler" items={cv.projects} /><Entries title="Sertifikalar" items={cv.certifications} />
        <section className="minimal-skills"><div className="main-title">Beceriler</div><div className="skill-chips">{cv.skills.map((skill, i) => <span key={i}>{skill.name}</span>)}</div>{!!cv.languages.length && <><div className="main-title">Diller</div><div className="language-chips">{cv.languages.map((language, i) => <span key={i}>{language.name} · {["A1", "A2", "B1", "C1", "C2"][language.level - 1]}</span>)}</div></>}</section>
      </div>
    </> : <>
      <aside className="cv-side"><div className="avatar">{initials}</div><div className="side-title">İletişim</div>{contact}{skills}</aside>
      <div className="cv-main">{heading}{summary}<Entries title="Deneyim" items={cv.experiences} /><Entries title="Eğitim" items={cv.educations} /><Entries title="Projeler" items={cv.projects} /><Entries title="Sertifikalar" items={cv.certifications} /></div>
    </>}
  </article></main>;
}
function App() {
  const [cv, setCv] = useState(() => {
    try {
      const source = localStorage.getItem("ack-cv-source");
      const saved = JSON.parse(localStorage.getItem("ack-saved-cv"));
      localStorage.setItem("ack-cv-source", "ack-cv-v8");
      return saved ? { ...initial, ...saved, skills: sortSkills(saved.skills || []), experiences: saved.experiences || [], educations: saved.educations || [], projects: saved.projects || [], certifications: saved.certifications || [], languages: saved.languages || [] } : initial;
    } catch {
      return initial;
    }
  });
  const [preview, setPreview] = useState(false), [toast, setToast] = useState("");
  const [layout, setLayout] = useState(() => {
    const savedLayout = localStorage.getItem("vita-layout") || "modern";
    return savedLayout === "blue" ? "minimal" : savedLayout;
  });
  useEffect(() => localStorage.setItem("vita-layout", layout), [layout]);
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        localStorage.setItem("ack-saved-cv", JSON.stringify(cv));
      } catch {
        window.dispatchEvent(new CustomEvent("ack-storage-message", { detail: "CV otomatik kaydedilemedi. Cihaz hafızası dolu olabilir." }));
      }
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [cv]);
  useEffect(() => {
    const save = () => {
      localStorage.setItem("ack-saved-cv", JSON.stringify(cv));
      window.dispatchEvent(new CustomEvent("ack-storage-message", { detail: "CV cihaz hafızasına kaydedildi." }));
    };
    const load = () => {
      try {
        const saved = JSON.parse(localStorage.getItem("ack-saved-cv"));
        if (!saved) throw new Error();
        setCv({ ...initial, ...saved, experiences: saved.experiences || [], educations: saved.educations || [], projects: saved.projects || [], certifications: saved.certifications || [], skills: saved.skills || [], languages: saved.languages || [] });
        window.dispatchEvent(new CustomEvent("ack-storage-message", { detail: "Kayıtlı CV açıldı." }));
      } catch {
        window.dispatchEvent(new CustomEvent("ack-storage-message", { detail: "Henüz kayıtlı bir CV yok." }));
      }
    };
    window.addEventListener("ack-save-cv", save);
    window.addEventListener("ack-load-cv", load);
    return () => {
      window.removeEventListener("ack-save-cv", save);
      window.removeEventListener("ack-load-cv", load);
    };
  }, [cv]);
  const download = async (type) => {
    try {
      localStorage.setItem("ack-saved-cv", JSON.stringify(cv));
    } catch {
      setToast("CV kaydedilemedi; cihaz hafızasında yer açıp tekrar deneyin.");
      setTimeout(() => setToast(""), 2600);
      return;
    }
    window.dispatchEvent(new Event("ack-save-cv"));
    setToast(`${type === "pdf" ? "PDF" : "Word"} haz\u0131rlan\u0131yor\u2026`);
    let resetSkillSpacing = null;
    try {
      if (type === "pdf") {
        const page = document.querySelector(".cv-page");
        const skills = [...page.querySelectorAll(".cv-side .skill")];
        if (skills.length > 22) {
          const twentyThirdSkill = skills[22];
          const previousMarginTop = twentyThirdSkill.style.marginTop;
          twentyThirdSkill.style.marginTop = "2mm";
          resetSkillSpacing = () => { twentyThirdSkill.style.marginTop = previousMarginTop; };
        }
        const canvas = await html2canvas(page, { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false });
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
        const pageRect = page.getBoundingClientRect();
        const scale = canvas.width / pageRect.width;
        const pageHeightCss = pageRect.width * 297 / 210;
        const continuationTopMarginCss = 30;
        const protectedBlocks = [];
        const protectedSkills = [];
        page.querySelectorAll(".entry").forEach((element) => {
          const rect = element.getBoundingClientRect();
          protectedBlocks.push({ top: rect.top - pageRect.top, bottom: rect.bottom - pageRect.top });
        });
        page.querySelectorAll(".cv-main section").forEach((section) => {
          const title = section.querySelector(".main-title");
          const firstEntry = section.querySelector(".entry");
          if (!title || !firstEntry) return;
          const titleRect = title.getBoundingClientRect();
          const entryRect = firstEntry.getBoundingClientRect();
          protectedBlocks.push({ top: titleRect.top - pageRect.top, bottom: entryRect.bottom - pageRect.top });
        });
        page.querySelectorAll(".cv-side .skill").forEach((element) => {
          const rect = element.getBoundingClientRect();
          const block = { top: rect.top - pageRect.top, bottom: rect.bottom - pageRect.top };
          protectedBlocks.push(block);
          protectedSkills.push(block);
        });
        page.querySelectorAll(".cv-side .lang, .cv-side .contact-row").forEach((element) => {
          const rect = element.getBoundingClientRect();
          protectedBlocks.push({ top: rect.top - pageRect.top, bottom: rect.bottom - pageRect.top });
        });
        page.querySelectorAll(".cv-side .side-title").forEach((title) => {
          const firstItem = title.nextElementSibling;
          if (!firstItem || firstItem.classList.contains("side-title")) return;
          const titleRect = title.getBoundingClientRect();
          const itemRect = firstItem.getBoundingClientRect();
          protectedBlocks.push({ top: titleRect.top - pageRect.top, bottom: itemRect.bottom - pageRect.top });
        });
        protectedBlocks.sort((a, b) => a.top - b.top);
        const side = page.querySelector(".cv-side");
        const sideWidthPx = side ? Math.round(side.getBoundingClientRect().width * scale) : 0;
        const sideColor = side ? getComputedStyle(side).backgroundColor : "#ffffff";
        const breaks = [0];
        while (breaks[breaks.length - 1] < pageRect.height - 1) {
          const start = breaks[breaks.length - 1];
          const topMargin = breaks.length > 1 ? continuationTopMarginCss : 0;
          const ideal = Math.min(start + pageHeightCss - topMargin, pageRect.height);
          if (ideal >= pageRect.height) {
            breaks.push(pageRect.height);
            break;
          }
          let nextBreak = ideal;
          const crossingSkill = protectedSkills
            .filter((block) => block.top > start && block.top < ideal && block.bottom > ideal)
            .sort((a, b) => b.top - a.top)[0];
          const crossing = crossingSkill || protectedBlocks
            .filter((block) => block.top > start + 32 && block.top < ideal && block.bottom > ideal)
            .sort((a, b) => b.top - a.top)[0];
          if (crossing) {
            const safeBreak = crossing.top - 14;
            if (crossing === crossingSkill) nextBreak = Math.max(start + 1, safeBreak);
            else if (safeBreak > start + 32) nextBreak = safeBreak;
          }
          breaks.push(nextBreak);
        }
        const totalPages = breaks.length - 1;
        for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
          if (pageIndex > 0) pdf.addPage("a4", "portrait");
          const sourceY = Math.round(breaks[pageIndex] * scale);
          const sliceHeight = Math.min(Math.round((breaks[pageIndex + 1] - breaks[pageIndex]) * scale), canvas.height - sourceY);
          const pageHeightPx = Math.floor(canvas.width * 297 / 210);
          const topOffsetPx = pageIndex > 0 ? Math.round(continuationTopMarginCss * scale) : 0;
          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = canvas.width;
          pageCanvas.height = pageHeightPx;
          const context = pageCanvas.getContext("2d");
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          context.fillStyle = sideColor;
          context.fillRect(0, 0, sideWidthPx, pageCanvas.height);
          context.drawImage(canvas, 0, sourceY, canvas.width, sliceHeight, 0, topOffsetPx, canvas.width, sliceHeight);
          pdf.addImage(pageCanvas.toDataURL("image/jpeg", 0.94), "JPEG", 0, 0, 210, 297, undefined, "FAST");
        }
        pdf.save((cv.fullName || "CV").replaceAll(" ", "-") + "-CV.pdf");
        resetSkillSpacing?.();
        resetSkillSpacing = null;
        setToast("Şablon PDF olarak indirildi.");
        setTimeout(() => setToast(""), 2600);
        return;
      }
      const r = await fetch(`/api/export/${type}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cv) });
      if (!r.ok) throw 0;
      const blob = await r.blob(), url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url;
      a.download = (cv.fullName || "CV").replaceAll(" ", "-") + `-CV.${type === "word" ? "docx" : "pdf"}`;
      a.click();
      URL.revokeObjectURL(url);
      setToast("Dosyan\u0131z indirildi.");
    } catch {
      resetSkillSpacing?.();
      setToast("Dosya haz\u0131rlanamad\u0131. L\xFCtfen tekrar deneyin.");
    }
    setTimeout(() => setToast(""), 2600);
  };
  return <><header className="topbar"><div className="brand"><span className="brand-mark">V</span> vita</div><div className="top-actions"><TemplatePicker value={layout} onChange={setLayout} /><button className="btn mobile-preview" onClick={() => setPreview(!preview)}><Eye size={17} /><span className="label">Önizle</span></button><button className="btn" onClick={() => download("word")}><FileText size={17} /> Word</button><button className="btn primary" onClick={() => download("pdf")}><Download size={17} /><span className="label">PDF İndir</span></button></div></header><div className="workspace"><Editor cv={cv} setCv={setCv} /><Preview cv={cv} show={preview} onClose={() => setPreview(false)} layout={layout} /></div>{toast && <div className="toast">{toast}</div>}</>;
}
class AppErrorBoundary extends React.Component {
  constructor(p) {
    super(p);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    return this.state.error ? <div className="app-loading">Uygulama başlatılamadı. Sayfayı yenileyin.</div> : this.props.children;
  }
}
createRoot(document.getElementById("root")).render(<AppErrorBoundary><App /></AppErrorBoundary>);
createRoot(document.getElementById("photo-root")).render(<StandalonePhotoField />);
createRoot(document.getElementById("theme-root")).render(<ThemePicker />);
createRoot(document.getElementById("install-root")).render(<InstallAppButton />);
createRoot(document.getElementById("mobile-storage-root")).render(<MobileStorageControls />);
