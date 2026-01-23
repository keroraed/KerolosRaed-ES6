let currentSlide = 0;
let slideTimer;

function buildSlides() {
  const track = document.getElementById("slider-track");
  if (!track) return [];
  const slides = getProducts()
    .slice(0, 3)
    .map(
      (item) => `
        <div class="slide">
          <div class="slide-copy">
            <div class="tag">${item.category}</div>
            <h1>${item.name}</h1>
            <p>Handpicked picks with breathable fabrics and clean silhouettes for your everyday rotations.</p>
            <a class="cta" href="product.html?id=${item.id}">See product →</a>
          </div>
          <img src="${item.image}" alt="${item.name}" />
        </div>
      `
    )
    .join("");
  track.innerHTML = slides;
  return Array.from(track.querySelectorAll(".slide"));
}

function setActive(slides, index) {
  slides.forEach((slide, idx) => {
    slide.classList.toggle("active", idx === index);
  });
}

function nextSlide(slides) {
  currentSlide = (currentSlide + 1) % slides.length;
  setActive(slides, currentSlide);
}

function prevSlide(slides) {
  currentSlide = (currentSlide - 1 + slides.length) % slides.length;
  setActive(slides, currentSlide);
}

function startAuto(slides) {
  clearInterval(slideTimer);
  slideTimer = setInterval(() => nextSlide(slides), 4000);
}

document.addEventListener("DOMContentLoaded", function () {
  const track = document.getElementById("slider-track");
  if (!track) return;
  const slides = buildSlides();
  if (!slides.length) return;
  setActive(slides, 0);

  const nextBtn = document.getElementById("next-slide");
  const prevBtn = document.getElementById("prev-slide");

  nextBtn.addEventListener("click", () => {
    nextSlide(slides);
    startAuto(slides);
  });

  prevBtn.addEventListener("click", () => {
    prevSlide(slides);
    startAuto(slides);
  });

  startAuto(slides);
});
